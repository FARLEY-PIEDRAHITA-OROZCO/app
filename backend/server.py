from fastapi import FastAPI, APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone
import subprocess
import json
import io
import csv

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Importar el Motor de Pronósticos
from prediction_engine import (
    StatsBuilder,
    ClassificationEngine,
    PredictionEngine,
    ValidationEngine,
    TipoTiempo,
    Config as PredictionConfig
)

# Create the main app
app = FastAPI(
    title="Football Prediction API - PLLA 3.0",
    description="Sistema de Pronósticos Deportivos basado en PLLA 3.0",
    version="1.0.0"
)
api_router = APIRouter(prefix="/api")

# Inicializar motores de pronósticos
stats_builder = StatsBuilder(db)
classification_engine = ClassificationEngine(db)
prediction_engine = PredictionEngine(db)
validation_engine = ValidationEngine(db)

# Global variable to track scraping status
scraping_status = {
    "is_running": False,
    "progress": 0,
    "message": "Listo para iniciar",
    "logs": []
}

# Models
class MatchFilter(BaseModel):
    liga_id: Optional[str] = None
    fecha_inicio: Optional[str] = None
    fecha_fin: Optional[str] = None
    equipo: Optional[str] = None
    limit: int = 100
    skip: int = 0

class ScrapeRequest(BaseModel):
    league_ids: Optional[List[int]] = None
    season: int = 2023
    limit: Optional[int] = None

class ExportRequest(BaseModel):
    format: str = "csv"
    liga_id: Optional[str] = None
    limit: int = 1000

# Routes
@api_router.get("/")
async def root():
    return {"message": "Football Data API", "version": "1.0.0"}

@api_router.get("/stats")
async def get_stats():
    """Obtener estadísticas generales."""
    try:
        collection = db.football_matches
        
        # Total de partidos
        total_matches = await collection.count_documents({})
        
        # Partidos por liga
        pipeline_leagues = [
            {"$group": {
                "_id": "$liga_id",
                "total": {"$sum": 1},
                "liga_nombre": {"$first": "$liga_nombre"}
            }},
            {"$sort": {"total": -1}},
            {"$limit": 10}
        ]
        leagues_stats = await collection.aggregate(pipeline_leagues).to_list(10)
        
        # Promedio de goles
        pipeline_goals = [
            {"$group": {
                "_id": None,
                "avg_goals": {"$avg": {"$add": ["$goles_local_TR", "$goles_visitante_TR"]}},
                "total_goals": {"$sum": {"$add": ["$goles_local_TR", "$goles_visitante_TR"]}}
            }}
        ]
        goals_stats = await collection.aggregate(pipeline_goals).to_list(1)
        
        # Últimos partidos procesados
        recent_matches = await collection.find(
            {},
            {"_id": 0, "created_at": 1}
        ).sort("created_at", -1).limit(1).to_list(1)
        
        last_update = recent_matches[0]["created_at"] if recent_matches else None
        
        return {
            "total_matches": total_matches,
            "total_leagues": len(leagues_stats),
            "leagues": leagues_stats,
            "avg_goals_per_match": round(goals_stats[0]["avg_goals"], 2) if goals_stats else 0,
            "total_goals": goals_stats[0]["total_goals"] if goals_stats else 0,
            "last_update": last_update
        }
    except Exception as e:
        logging.error(f"Error getting stats: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/matches/search")
async def search_matches(filters: MatchFilter):
    """Buscar partidos con filtros."""
    try:
        collection = db.football_matches
        query = {}
        
        if filters.liga_id:
            query["liga_id"] = filters.liga_id
        
        if filters.fecha_inicio or filters.fecha_fin:
            query["fecha"] = {}
            if filters.fecha_inicio:
                query["fecha"]["$gte"] = filters.fecha_inicio
            if filters.fecha_fin:
                query["fecha"]["$lte"] = filters.fecha_fin
        
        if filters.equipo:
            query["$or"] = [
                {"equipo_local": {"$regex": filters.equipo, "$options": "i"}},
                {"equipo_visitante": {"$regex": filters.equipo, "$options": "i"}}
            ]
        
        total = await collection.count_documents(query)
        
        matches = await collection.find(
            query,
            {"_id": 0}
        ).sort("fecha", -1).skip(filters.skip).limit(filters.limit).to_list(filters.limit)
        
        return {
            "total": total,
            "matches": matches,
            "page": filters.skip // filters.limit + 1,
            "pages": (total + filters.limit - 1) // filters.limit
        }
    except Exception as e:
        logging.error(f"Error searching matches: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/leagues")
async def get_leagues():
    """Obtener lista de ligas disponibles."""
    try:
        collection = db.football_matches
        pipeline = [
            {"$group": {
                "_id": "$liga_id",
                "liga_nombre": {"$first": "$liga_nombre"},
                "total_partidos": {"$sum": 1}
            }},
            {"$sort": {"liga_nombre": 1}}
        ]
        leagues = await collection.aggregate(pipeline).to_list(100)
        return leagues
    except Exception as e:
        logging.error(f"Error getting leagues: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

async def run_scraping_task(request: ScrapeRequest):
    """Ejecutar scraping en background."""
    global scraping_status
    
    try:
        scraping_status["is_running"] = True
        scraping_status["progress"] = 10
        scraping_status["message"] = "Iniciando proceso..."
        scraping_status["logs"].append(f"{datetime.now()}: Proceso iniciado")
        
        # Construir comando
        cmd = ["python", "-m", "api_football.main", "--season", str(request.season)]
        
        if request.limit:
            cmd.extend(["--limit", str(request.limit)])
        
        if request.league_ids and len(request.league_ids) > 0:
            cmd.extend(["--league-id", str(request.league_ids[0])])
        
        scraping_status["progress"] = 30
        scraping_status["message"] = "Ejecutando scraping..."
        
        # Ejecutar proceso
        result = subprocess.run(
            cmd,
            cwd=ROOT_DIR,
            capture_output=True,
            text=True,
            timeout=600
        )
        
        scraping_status["progress"] = 90
        
        if result.returncode == 0:
            scraping_status["message"] = "Proceso completado exitosamente"
            scraping_status["logs"].append(f"{datetime.now()}: Completado exitosamente")
        else:
            scraping_status["message"] = f"Error: {result.stderr[:200]}"
            scraping_status["logs"].append(f"{datetime.now()}: Error - {result.stderr[:100]}")
        
        scraping_status["progress"] = 100
        
    except subprocess.TimeoutExpired:
        scraping_status["message"] = "Timeout: Proceso tomó demasiado tiempo"
        scraping_status["logs"].append(f"{datetime.now()}: Timeout")
    except Exception as e:
        scraping_status["message"] = f"Error: {str(e)}"
        scraping_status["logs"].append(f"{datetime.now()}: Error - {str(e)}")
    finally:
        scraping_status["is_running"] = False

@api_router.post("/scrape/start")
async def start_scraping(request: ScrapeRequest, background_tasks: BackgroundTasks):
    """Iniciar proceso de scraping."""
    global scraping_status
    
    if scraping_status["is_running"]:
        raise HTTPException(status_code=400, detail="Ya hay un proceso en ejecución")
    
    scraping_status = {
        "is_running": True,
        "progress": 0,
        "message": "Iniciando...",
        "logs": []
    }
    
    background_tasks.add_task(run_scraping_task, request)
    
    return {"message": "Proceso iniciado", "status": scraping_status}

@api_router.get("/scrape/status")
async def get_scraping_status():
    """Obtener estado del scraping."""
    return scraping_status

@api_router.post("/export")
async def export_data(request: ExportRequest):
    """Exportar datos."""
    try:
        collection = db.football_matches
        query = {}
        
        if request.liga_id:
            query["liga_id"] = request.liga_id
        
        matches = await collection.find(query, {"_id": 0}).limit(request.limit).to_list(request.limit)
        
        if request.format == "json":
            return matches
        
        elif request.format == "csv":
            if not matches:
                raise HTTPException(status_code=404, detail="No hay datos para exportar")
            
            # Crear CSV
            output = io.StringIO()
            writer = csv.DictWriter(output, fieldnames=matches[0].keys())
            writer.writeheader()
            writer.writerows(matches)
            
            output.seek(0)
            
            return StreamingResponse(
                iter([output.getvalue()]),
                media_type="text/csv",
                headers={"Content-Disposition": f"attachment; filename=partidos_{datetime.now().strftime('%Y%m%d')}.csv"}
            )
    except Exception as e:
        logging.error(f"Error exporting data: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/logs")
async def get_logs():
    """Obtener últimos logs."""
    try:
        log_file = ROOT_DIR / "api_football.log"
        if log_file.exists():
            with open(log_file, "r") as f:
                lines = f.readlines()
                last_lines = lines[-50:] if len(lines) > 50 else lines
                return {"logs": last_lines}
        return {"logs": []}
    except Exception as e:
        return {"logs": [], "error": str(e)}


# ============================================
# ENDPOINTS DEL MOTOR DE PRONÓSTICOS PLLA 3.0
# ============================================

# Modelos Pydantic para los nuevos endpoints
class PronosticoRequest(BaseModel):
    """Request para generar un pronóstico."""
    equipo_local: str = Field(..., description="Nombre del equipo local")
    equipo_visitante: str = Field(..., description="Nombre del equipo visitante")
    liga_id: str = Field(default="SPAIN_LA_LIGA", description="ID de la liga")
    temporada: Optional[int] = Field(default=2023, description="Temporada")

class ValidacionRequest(BaseModel):
    """Request para validar un pronóstico."""
    pronostico_id: str = Field(..., description="ID del pronóstico a validar")
    gol_local_tc: int = Field(..., ge=0, description="Goles local tiempo completo")
    gol_visita_tc: int = Field(..., ge=0, description="Goles visita tiempo completo")
    gol_local_1mt: int = Field(default=0, ge=0, description="Goles local primer tiempo")
    gol_visita_1mt: int = Field(default=0, ge=0, description="Goles visita primer tiempo")

class ConstruirStatsRequest(BaseModel):
    """Request para construir estadísticas."""
    liga_id: str = Field(default="SPAIN_LA_LIGA", description="ID de la liga")
    temporada: Optional[int] = Field(default=2023, description="Temporada")


@api_router.post("/prediction/build-stats")
async def build_statistics(request: ConstruirStatsRequest):
    """
    Construye/actualiza las estadísticas de todos los equipos.
    
    Este endpoint debe ejecutarse antes de generar pronósticos
    para asegurar que las estadísticas estén actualizadas.
    
    **Proceso:**
    1. Lee todos los partidos de la liga
    2. Calcula estadísticas acumuladas por equipo
    3. Guarda en la colección `team_statistics`
    """
    try:
        equipos = await stats_builder.construir_estadisticas(
            liga_id=request.liga_id,
            temporada=request.temporada
        )
        
        return {
            "success": True,
            "message": f"Estadísticas construidas para {len(equipos)} equipos",
            "liga_id": request.liga_id,
            "temporada": request.temporada,
            "equipos": list(equipos.keys())
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logging.error(f"Error construyendo estadísticas: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/prediction/classification")
async def get_classification(
    liga_id: str = "SPAIN_LA_LIGA",
    temporada: int = 2023,
    tipo_tiempo: str = "completo"
):
    """
    Obtiene la tabla de clasificación.
    
    **Parámetros:**
    - `liga_id`: ID de la liga
    - `temporada`: Año de la temporada
    - `tipo_tiempo`: "completo", "primer_tiempo" o "segundo_tiempo"
    
    **Retorna:**
    - Tabla de posiciones ordenada por puntos
    """
    try:
        # Mapear tipo de tiempo
        tiempo_map = {
            "completo": TipoTiempo.COMPLETO,
            "primer_tiempo": TipoTiempo.PRIMER_TIEMPO,
            "segundo_tiempo": TipoTiempo.SEGUNDO_TIEMPO
        }
        tipo = tiempo_map.get(tipo_tiempo, TipoTiempo.COMPLETO)
        
        tabla = await classification_engine.generar_clasificacion(
            liga_id=liga_id,
            temporada=temporada,
            tipo_tiempo=tipo
        )
        
        return classification_engine.tabla_to_dict(tabla)
    
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logging.error(f"Error obteniendo clasificación: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/prediction/generate")
async def generate_prediction(request: PronosticoRequest):
    """
    Genera un pronóstico para un partido.
    
    **Proceso:**
    1. Obtiene estadísticas de ambos equipos
    2. Calcula probabilidades (L/E/V)
    3. Aplica algoritmo de decisión
    4. Genera doble oportunidad y ambos marcan
    
    **Retorna:**
    - Pronóstico para tiempo completo, primer tiempo y segundo tiempo
    """
    try:
        pronostico = await prediction_engine.generar_pronostico(
            equipo_local=request.equipo_local,
            equipo_visitante=request.equipo_visitante,
            liga_id=request.liga_id,
            temporada=request.temporada
        )
        
        return {
            "success": True,
            "pronostico": pronostico.to_response_dict()
        }
    
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logging.error(f"Error generando pronóstico: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/prediction/team/{nombre}")
async def get_team_stats(
    nombre: str,
    liga_id: str = "SPAIN_LA_LIGA",
    temporada: int = 2023
):
    """
    Obtiene las estadísticas de un equipo específico.
    
    **Retorna:**
    - Estadísticas generales, como local y como visitante
    - Para tiempo completo, primer tiempo y segundo tiempo
    """
    try:
        equipo = await stats_builder.obtener_stats_equipo(
            nombre=nombre,
            liga_id=liga_id,
            temporada=temporada
        )
        
        if not equipo:
            raise HTTPException(
                status_code=404, 
                detail=f"Equipo '{nombre}' no encontrado"
            )
        
        return {
            "nombre": equipo.nombre,
            "liga_id": equipo.liga_id,
            "temporada": equipo.temporada,
            "tiempo_completo": equipo.stats_completo.model_dump(),
            "primer_tiempo": equipo.stats_primer_tiempo.model_dump(),
            "segundo_tiempo": equipo.stats_segundo_tiempo.model_dump()
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error obteniendo estadísticas: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/prediction/validate")
async def validate_prediction(request: ValidacionRequest):
    """
    Valida un pronóstico contra el resultado real.
    
    **Proceso:**
    1. Obtiene el pronóstico guardado
    2. Compara con el resultado real
    3. Determina GANA/PIERDE para cada apuesta
    
    **Retorna:**
    - Resultado de validación (GANA/PIERDE) para:
      - Pronóstico principal
      - Doble oportunidad
      - Ambos marcan
    """
    try:
        validacion = await validation_engine.validar_pronostico(
            pronostico_id=request.pronostico_id,
            gol_local_tc=request.gol_local_tc,
            gol_visita_tc=request.gol_visita_tc,
            gol_local_1mt=request.gol_local_1mt,
            gol_visita_1mt=request.gol_visita_1mt
        )
        
        return {
            "success": True,
            "validacion": {
                "id": validacion.id,
                "pronostico_id": validacion.pronostico_id,
                "resultado_real": {
                    "gol_local_tc": validacion.gol_local_tc,
                    "gol_visita_tc": validacion.gol_visita_tc
                },
                "tiempo_completo": {
                    "doble_oportunidad": validacion.validacion_tc.resultado_doble_oportunidad,
                    "ambos_marcan": validacion.validacion_tc.resultado_ambos_marcan,
                    "acierto_principal": validacion.validacion_tc.acierto_principal
                }
            }
        }
    
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logging.error(f"Error validando pronóstico: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/prediction/effectiveness")
async def get_effectiveness():
    """
    Obtiene las estadísticas de efectividad del sistema.
    
    **Retorna:**
    - Porcentaje de aciertos para:
      - Pronóstico principal (L/E/V)
      - Doble oportunidad (1X/X2/12)
      - Ambos marcan (SI/NO)
    - Separado por tiempo (TC, 1MT, 2MT)
    """
    try:
        efectividad = await validation_engine.calcular_efectividad()
        return {
            "success": True,
            "efectividad": efectividad
        }
    
    except Exception as e:
        logging.error(f"Error calculando efectividad: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/prediction/config")
async def get_prediction_config():
    """
    Obtiene la configuración actual del motor de pronósticos.
    
    **Retorna:**
    - Versión del algoritmo
    - Umbrales utilizados
    - Configuración general
    """
    from prediction_engine import Umbrales, Config
    
    return {
        "version": Config.VERSION,
        "umbrales": Umbrales.to_dict(),
        "config": Config.to_dict()
    }


@api_router.get("/prediction/teams")
async def list_teams(
    liga_id: str = "SPAIN_LA_LIGA",
    temporada: int = 2023
):
    """
    Lista todos los equipos disponibles para pronósticos.
    """
    try:
        equipos = await stats_builder.obtener_todos_equipos(liga_id, temporada)
        
        return {
            "liga_id": liga_id,
            "temporada": temporada,
            "total": len(equipos),
            "equipos": [
                {
                    "nombre": e.nombre,
                    "puntos": e.stats_completo.puntos,
                    "partidos_jugados": e.stats_completo.partidos_jugados,
                    "rendimiento": e.stats_completo.rendimiento_general
                }
                for e in sorted(equipos, key=lambda x: -x.stats_completo.puntos)
            ]
        }
    
    except Exception as e:
        logging.error(f"Error listando equipos: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()