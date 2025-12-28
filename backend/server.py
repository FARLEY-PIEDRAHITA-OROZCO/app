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
    BacktestingEngine,
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
backtesting_engine = BacktestingEngine(db)

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
    temporada: Optional[int] = None
    season_id: Optional[str] = None
    limit: int = 1000
    include_fields: Optional[List[str]] = None  # Campos específicos a exportar

# Routes
@api_router.get("/")
async def root():
    return {"message": "Football Data API", "version": "1.0.0"}

@api_router.get("/stats")
async def get_stats(season_id: str = None):
    """Obtener estadísticas generales, opcionalmente filtradas por temporada."""
    try:
        collection = db.football_matches
        
        # Filtro base (vacío o por season_id)
        match_filter = {"season_id": season_id} if season_id else {}
        
        # Total de partidos
        total_matches = await collection.count_documents(match_filter)
        
        # Partidos por liga (o por temporada si hay filtro)
        if season_id:
            # Cuando hay filtro de temporada, mostrar estadísticas por jornada
            pipeline_leagues = [
                {"$match": match_filter},
                {"$group": {
                    "_id": "$ronda",
                    "total": {"$sum": 1},
                    "liga_nombre": {"$first": "$liga_nombre"}
                }},
                {"$sort": {"_id": 1}},
                {"$limit": 10}
            ]
        else:
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
            {"$match": match_filter} if season_id else {"$match": {}},
            {"$group": {
                "_id": None,
                "avg_goals": {"$avg": {"$add": ["$goles_local_TR", "$goles_visitante_TR"]}},
                "total_goals": {"$sum": {"$add": ["$goles_local_TR", "$goles_visitante_TR"]}}
            }}
        ]
        goals_stats = await collection.aggregate(pipeline_goals).to_list(1)
        
        # Últimos partidos procesados
        find_filter = match_filter if season_id else {}
        recent_matches = await collection.find(
            find_filter,
            {"_id": 0, "created_at": 1}
        ).sort("created_at", -1).limit(1).to_list(1)
        
        last_update = recent_matches[0]["created_at"] if recent_matches else None
        
        # Información adicional si hay season_id
        response = {
            "total_matches": total_matches,
            "total_leagues": len(leagues_stats),
            "leagues": leagues_stats,
            "avg_goals_per_match": round(goals_stats[0]["avg_goals"], 2) if goals_stats else 0,
            "total_goals": goals_stats[0]["total_goals"] if goals_stats else 0,
            "last_update": last_update
        }
        
        if season_id:
            response["season_id"] = season_id
            response["season_label"] = season_id.split("_")[-1] if "_" in season_id else season_id
        
        return response
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
    """Ejecutar scraping en background y construir estadísticas automáticamente."""
    global scraping_status
    
    try:
        scraping_status["is_running"] = True
        scraping_status["progress"] = 10
        scraping_status["message"] = "Iniciando extracción de datos..."
        scraping_status["logs"].append(f"{datetime.now()}: Proceso iniciado")
        
        # Construir comando
        cmd = ["python", "-m", "api_football.main", "--season", str(request.season)]
        
        if request.limit:
            cmd.extend(["--limit", str(request.limit)])
        
        league_id = None
        if request.league_ids and len(request.league_ids) > 0:
            league_id = request.league_ids[0]
            cmd.extend(["--league-id", str(league_id)])
        
        scraping_status["progress"] = 20
        scraping_status["message"] = "Extrayendo partidos de la API..."
        
        # Ejecutar proceso de scraping
        result = subprocess.run(
            cmd,
            cwd=ROOT_DIR,
            capture_output=True,
            text=True,
            timeout=600
        )
        
        if result.returncode != 0:
            scraping_status["progress"] = 100
            scraping_status["message"] = f"Error en extracción: {result.stderr[:200]}"
            scraping_status["logs"].append(f"{datetime.now()}: Error - {result.stderr[:100]}")
            return
        
        scraping_status["progress"] = 60
        scraping_status["message"] = "Extracción completada. Construyendo estadísticas..."
        scraping_status["logs"].append(f"{datetime.now()}: Extracción completada")
        
        # Construir season_id para las estadísticas
        if league_id:
            # Mapear league_id de API a liga_id interno
            liga_mapping = await _get_liga_id_from_api_id(league_id)
            if liga_mapping:
                season_id = f"{liga_mapping}_{request.season}-{(request.season + 1) % 100:02d}"
                
                scraping_status["progress"] = 70
                scraping_status["message"] = f"Construyendo estadísticas para {season_id}..."
                scraping_status["logs"].append(f"{datetime.now()}: Construyendo estadísticas para {season_id}")
                
                try:
                    equipos = await stats_builder.construir_estadisticas(
                        liga_id=liga_mapping,
                        temporada=request.season,
                        season_id=season_id
                    )
                    scraping_status["logs"].append(f"{datetime.now()}: Estadísticas construidas para {len(equipos)} equipos")
                except Exception as e:
                    scraping_status["logs"].append(f"{datetime.now()}: Advertencia construyendo stats: {str(e)[:100]}")
        
        scraping_status["progress"] = 100
        scraping_status["message"] = "✅ Proceso completado: datos extraídos y estadísticas construidas"
        scraping_status["logs"].append(f"{datetime.now()}: Proceso completado exitosamente")
        
    except subprocess.TimeoutExpired:
        scraping_status["message"] = "Timeout: Proceso tomó demasiado tiempo"
        scraping_status["logs"].append(f"{datetime.now()}: Timeout")
    except Exception as e:
        scraping_status["message"] = f"Error: {str(e)}"
        scraping_status["logs"].append(f"{datetime.now()}: Error - {str(e)}")
    finally:
        scraping_status["is_running"] = False


async def _get_liga_id_from_api_id(api_league_id: int) -> str:
    """Obtiene el liga_id interno a partir del ID de la API."""
    # Buscar en los partidos existentes
    match = await db.football_matches.find_one(
        {"id_liga": api_league_id},
        {"liga_id": 1}
    )
    if match:
        return match.get("liga_id")
    
    # Mapeo manual de ligas comunes
    liga_map = {
        140: "SPAIN_LA_LIGA",
        39: "ENGLAND_PREMIER_LEAGUE",
        135: "ITALY_SERIE_A",
        78: "GERMANY_BUNDESLIGA",
        61: "FRANCE_LIGUE_1",
        262: "MEXICO_LIGA_MX",
        94: "PORTUGAL_PRIMEIRA_LIGA",
        88: "NETHERLANDS_EREDIVISIE",
        144: "BELGIUM_JUPILER_PRO_LEAGUE",
        203: "TURKEY_SUPER_LIG",
    }
    return liga_map.get(api_league_id)

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
    """
    Exportar datos de partidos.
    
    **Parámetros:**
    - `format`: "csv" o "json"
    - `liga_id`: Filtrar por liga
    - `temporada`: Filtrar por año (legacy)
    - `season_id`: Filtrar por temporada estructurada (preferido)
    - `limit`: Límite de registros
    - `include_fields`: Lista de campos a incluir (opcional)
    """
    try:
        collection = db.football_matches
        query = {}
        
        # Filtro por liga
        if request.liga_id:
            query["liga_id"] = request.liga_id
        
        # Filtro por temporada (preferir season_id)
        if request.season_id:
            query["$or"] = [
                {"season_id": request.season_id},
                {"season_id": {"$exists": False}, "season": int(request.season_id.split("_")[-1].split("-")[0])}
            ]
        elif request.temporada:
            # Fallback para compatibilidad
            if request.liga_id:
                effective_season_id = f"{request.liga_id}_{request.temporada}-{(request.temporada + 1) % 100:02d}"
                query["$or"] = [
                    {"season_id": effective_season_id},
                    {"season_id": {"$exists": False}, "season": request.temporada}
                ]
            else:
                query["season"] = request.temporada
        
        # Proyección de campos
        projection = {"_id": 0}
        if request.include_fields:
            projection = {"_id": 0}
            for field in request.include_fields:
                projection[field] = 1
        
        # Obtener datos
        cursor = collection.find(query, projection).sort("fecha", 1)
        if request.limit:
            cursor = cursor.limit(request.limit)
        
        matches = await cursor.to_list(request.limit or 10000)
        
        if not matches:
            raise HTTPException(status_code=404, detail="No hay datos para exportar con los filtros especificados")
        
        if request.format == "json":
            return {
                "total": len(matches),
                "filtros": {
                    "liga_id": request.liga_id,
                    "temporada": request.temporada,
                    "season_id": request.season_id
                },
                "datos": matches
            }
        
        elif request.format == "csv":
            # Crear CSV
            output = io.StringIO()
            
            # Usar campos específicos o todos los del primer registro
            fieldnames = request.include_fields if request.include_fields else list(matches[0].keys())
            
            writer = csv.DictWriter(output, fieldnames=fieldnames, extrasaction='ignore')
            writer.writeheader()
            writer.writerows(matches)
            
            output.seek(0)
            
            # Generar nombre de archivo descriptivo
            filename_parts = ["partidos"]
            if request.season_id:
                filename_parts.append(request.season_id.replace("/", "-"))
            elif request.liga_id:
                filename_parts.append(request.liga_id)
            filename_parts.append(datetime.now().strftime('%Y%m%d'))
            
            filename = "_".join(filename_parts) + ".csv"
            
            return StreamingResponse(
                iter([output.getvalue()]),
                media_type="text/csv",
                headers={"Content-Disposition": f"attachment; filename={filename}"}
            )
        
        else:
            raise HTTPException(status_code=400, detail=f"Formato '{request.format}' no soportado. Use 'csv' o 'json'")
            
    except HTTPException:
        raise
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
    liga_id: Optional[str] = Field(default=None, description="ID de la liga (se infiere de season_id si no se proporciona)")
    temporada: Optional[int] = Field(default=None, description="Temporada (legacy, se infiere de season_id)")
    season_id: Optional[str] = Field(default=None, description="ID de temporada estructurado (preferido, ej: SPAIN_LA_LIGA_2023-24)")

class ValidacionRequest(BaseModel):
    """Request para validar un pronóstico."""
    pronostico_id: str = Field(..., description="ID del pronóstico a validar")
    gol_local_tc: int = Field(..., ge=0, description="Goles local tiempo completo")
    gol_visita_tc: int = Field(..., ge=0, description="Goles visita tiempo completo")
    gol_local_1mt: int = Field(default=0, ge=0, description="Goles local primer tiempo")
    gol_visita_1mt: int = Field(default=0, ge=0, description="Goles visita primer tiempo")

class ConstruirStatsRequest(BaseModel):
    """Request para construir estadísticas."""
    liga_id: Optional[str] = Field(default=None, description="ID de la liga (se infiere de season_id si no se proporciona)")
    temporada: Optional[int] = Field(default=None, description="Temporada (legacy, se infiere de season_id)")
    season_id: Optional[str] = Field(default=None, description="ID de temporada estructurado (preferido, ej: SPAIN_LA_LIGA_2023-24)")


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
    
    **Parámetros:**
    - `liga_id`: ID de la liga (opcional, se infiere de season_id)
    - `temporada`: Año (legacy, se infiere de season_id)
    - `season_id`: ID estructurado de temporada (ej: SPAIN_LA_LIGA_2023-24) - PREFERIDO
    """
    try:
        # Inferir liga_id y temporada de season_id si no se proporcionan
        effective_liga_id = request.liga_id
        effective_temporada = request.temporada
        
        if request.season_id:
            # Formato: LIGA_ID_YYYY-YY (ej: ENGLAND_PREMIER_LEAGUE_2022-23)
            parts = request.season_id.rsplit('_', 1)
            if len(parts) == 2:
                if not effective_liga_id:
                    effective_liga_id = parts[0]  # ENGLAND_PREMIER_LEAGUE
                try:
                    if not effective_temporada:
                        effective_temporada = int(parts[1].split('-')[0])  # 2022
                except ValueError:
                    pass
        
        # Valores por defecto solo si no se puede inferir nada
        if not effective_liga_id:
            effective_liga_id = "SPAIN_LA_LIGA"
        if not effective_temporada:
            effective_temporada = 2023
        
        equipos = await stats_builder.construir_estadisticas(
            liga_id=effective_liga_id,
            temporada=effective_temporada,
            season_id=request.season_id
        )
        
        # Determinar season_id efectivo para respuesta
        effective_season_id = request.season_id
        if not effective_season_id and effective_temporada:
            effective_season_id = f"{effective_liga_id}_{effective_temporada}-{(effective_temporada + 1) % 100:02d}"
        
        return {
            "success": True,
            "message": f"Estadísticas construidas para {len(equipos)} equipos",
            "liga_id": effective_liga_id,
            "temporada": effective_temporada,
            "season_id": effective_season_id,
            "equipos": list(equipos.keys())
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logging.error(f"Error construyendo estadísticas: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/prediction/classification")
async def get_classification(
    liga_id: Optional[str] = None,
    temporada: Optional[int] = None,
    tipo_tiempo: str = "completo",
    season_id: Optional[str] = None
):
    """
    Obtiene la tabla de clasificación.
    
    **Parámetros:**
    - `liga_id`: ID de la liga (opcional, se infiere de season_id)
    - `temporada`: Año de la temporada (legacy, se infiere de season_id)
    - `tipo_tiempo`: "completo", "primer_tiempo" o "segundo_tiempo"
    - `season_id`: ID estructurado de temporada (preferido)
    
    **Retorna:**
    - Tabla de posiciones ordenada por puntos
    """
    try:
        # Inferir liga_id y temporada de season_id si no se proporcionan
        effective_liga_id = liga_id
        effective_temporada = temporada
        
        if season_id:
            parts = season_id.rsplit('_', 1)
            if len(parts) == 2:
                if not effective_liga_id:
                    effective_liga_id = parts[0]
                try:
                    if not effective_temporada:
                        effective_temporada = int(parts[1].split('-')[0])
                except ValueError:
                    pass
        
        # Valores por defecto solo si no se puede inferir nada
        if not effective_liga_id:
            effective_liga_id = "SPAIN_LA_LIGA"
        if not effective_temporada:
            effective_temporada = 2023
        # Mapear tipo de tiempo
        tiempo_map = {
            "completo": TipoTiempo.COMPLETO,
            "primer_tiempo": TipoTiempo.PRIMER_TIEMPO,
            "segundo_tiempo": TipoTiempo.SEGUNDO_TIEMPO
        }
        tipo = tiempo_map.get(tipo_tiempo, TipoTiempo.COMPLETO)
        
        tabla = await classification_engine.generar_clasificacion(
            liga_id=effective_liga_id,
            temporada=effective_temporada,
            tipo_tiempo=tipo,
            season_id=season_id
        )
        
        result = classification_engine.tabla_to_dict(tabla)
        
        # Agregar season_id a la respuesta
        if season_id:
            result['season_id'] = season_id
        elif effective_temporada:
            result['season_id'] = f"{effective_liga_id}_{effective_temporada}-{(effective_temporada + 1) % 100:02d}"
        
        return result
    
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logging.error(f"Error obteniendo clasificación: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/prediction/generate")
async def generate_prediction(request: PronosticoRequest):
    """
    Genera un pronóstico para un partido.
    
    Incluye:
    - Pronóstico principal (L/E/V) para TC, 1MT, 2MT
    - Doble oportunidad (1X, X2, 12)
    - Ambos marcan (SI/NO)
    - Over/Under goles (1.5, 2.5, 3.5)
    - Goles esperados
    - Forma reciente de los equipos
    
    Usa season_id para obtener estadísticas de la temporada correcta.
    """
    try:
        # Inferir liga_id y temporada de season_id si no se proporcionan
        effective_liga_id = request.liga_id
        effective_temporada = request.temporada
        
        if request.season_id:
            parts = request.season_id.rsplit('_', 1)
            if len(parts) == 2:
                if not effective_liga_id:
                    effective_liga_id = parts[0]
                try:
                    if not effective_temporada:
                        effective_temporada = int(parts[1].split('-')[0])
                except ValueError:
                    pass
        
        # Valores por defecto solo si no se puede inferir nada
        if not effective_liga_id:
            effective_liga_id = "SPAIN_LA_LIGA"
        if not effective_temporada:
            effective_temporada = 2023
        
        pronostico = await prediction_engine.generar_pronostico(
            equipo_local=request.equipo_local,
            equipo_visitante=request.equipo_visitante,
            liga_id=effective_liga_id,
            temporada=effective_temporada,
            season_id=request.season_id
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


@api_router.get("/prediction/jornada")
async def get_jornada_predictions(
    season_id: str,
    jornada: Optional[str] = None
):
    """
    Genera pronósticos para todos los partidos de una jornada.
    
    **Parámetros:**
    - `season_id`: ID de temporada (requerido)
    - `jornada`: Nombre de la jornada (ej: "Regular Season - 1"). Si no se especifica, lista jornadas disponibles.
    
    **Retorna:**
    - Lista de partidos con pronósticos completos
    """
    try:
        # Extraer liga_id del season_id
        parts = season_id.rsplit('_', 1)
        if len(parts) != 2:
            raise HTTPException(status_code=400, detail="season_id inválido")
        
        liga_id = parts[0]
        
        # Si no se especifica jornada, devolver lista de jornadas disponibles
        if not jornada:
            pipeline = [
                {"$match": {"season_id": season_id}},
                {"$group": {
                    "_id": "$ronda",
                    "partidos": {"$sum": 1},
                    "fecha_min": {"$min": "$fecha"}
                }},
                {"$sort": {"fecha_min": 1}}
            ]
            jornadas = await db.football_matches.aggregate(pipeline).to_list(100)
            return {
                "season_id": season_id,
                "jornadas": [{"nombre": j["_id"], "partidos": j["partidos"]} for j in jornadas]
            }
        
        # Obtener partidos de la jornada
        partidos = await db.football_matches.find(
            {"season_id": season_id, "ronda": jornada},
            {"_id": 0}
        ).sort("fecha", 1).to_list(20)
        
        if not partidos:
            raise HTTPException(status_code=404, detail=f"No se encontraron partidos para la jornada '{jornada}'")
        
        # Generar pronósticos para cada partido
        resultados = []
        for partido in partidos:
            try:
                pronostico = await prediction_engine.generar_pronostico(
                    equipo_local=partido["equipo_local"],
                    equipo_visitante=partido["equipo_visitante"],
                    liga_id=liga_id,
                    season_id=season_id
                )
                
                tc = pronostico.tiempo_completo
                
                # Obtener stats defensivas
                stats_local = await stats_builder.obtener_stats_equipo(
                    partido["equipo_local"], liga_id, season_id=season_id
                )
                stats_visita = await stats_builder.obtener_stats_equipo(
                    partido["equipo_visitante"], liga_id, season_id=season_id
                )
                
                resultados.append({
                    "equipo_local": partido["equipo_local"],
                    "equipo_visitante": partido["equipo_visitante"],
                    "fecha": partido.get("fecha"),
                    "resultado_real": {
                        "local": partido.get("goles_local_TR"),
                        "visitante": partido.get("goles_visitante_TR")
                    } if partido.get("estado_del_partido") == "Match Finished" else None,
                    "pronostico": tc.pronostico,
                    "doble_oportunidad": tc.doble_oportunidad,
                    "ambos_marcan": tc.ambos_marcan,
                    "over_under": tc.over_under,
                    "probabilidades": {
                        "local": tc.probabilidades.porcentaje_local,
                        "empate": tc.probabilidades.porcentaje_empate,
                        "visita": tc.probabilidades.porcentaje_visita
                    },
                    "confianza": tc.confianza,
                    "goles_esperados": tc.goles_esperados,
                    "defensa_local": {
                        "gc_total": stats_local.stats_completo.goles_contra if stats_local else 0,
                        "promedio_gc": stats_local.stats_completo.promedio_gc if stats_local else 0
                    },
                    "defensa_visitante": {
                        "gc_total": stats_visita.stats_completo.goles_contra if stats_visita else 0,
                        "promedio_gc": stats_visita.stats_completo.promedio_gc if stats_visita else 0
                    },
                    "forma_reciente": pronostico.forma_reciente
                })
            except Exception as e:
                logging.warning(f"Error generando pronóstico para {partido['equipo_local']} vs {partido['equipo_visitante']}: {e}")
                resultados.append({
                    "equipo_local": partido["equipo_local"],
                    "equipo_visitante": partido["equipo_visitante"],
                    "fecha": partido.get("fecha"),
                    "error": str(e)
                })
        
        return {
            "success": True,
            "season_id": season_id,
            "jornada": jornada,
            "total_partidos": len(resultados),
            "partidos": resultados
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error generando pronósticos de jornada: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/prediction/team/{nombre}")
async def get_team_stats(
    nombre: str,
    liga_id: Optional[str] = None,
    temporada: Optional[int] = None,
    season_id: Optional[str] = None
):
    """
    Obtiene las estadísticas de un equipo específico.
    
    **Parámetros:**
    - `nombre`: Nombre del equipo
    - `liga_id`: ID de la liga (opcional, se infiere de season_id)
    - `temporada`: Año (legacy, se infiere de season_id)
    - `season_id`: ID de temporada estructurado (preferido)
    
    **Retorna:**
    - Estadísticas generales, como local y como visitante
    - Para tiempo completo, primer tiempo y segundo tiempo
    """
    try:
        # Inferir liga_id y temporada de season_id si no se proporcionan
        effective_liga_id = liga_id
        effective_temporada = temporada
        
        if season_id:
            parts = season_id.rsplit('_', 1)
            if len(parts) == 2:
                if not effective_liga_id:
                    effective_liga_id = parts[0]
                try:
                    if not effective_temporada:
                        effective_temporada = int(parts[1].split('-')[0])
                except ValueError:
                    pass
        
        # Valores por defecto solo si no se puede inferir nada
        if not effective_liga_id:
            effective_liga_id = "SPAIN_LA_LIGA"
        if not effective_temporada:
            effective_temporada = 2023
        
        equipo = await stats_builder.obtener_stats_equipo(
            nombre=nombre,
            liga_id=effective_liga_id,
            temporada=effective_temporada,
            season_id=season_id
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
            "season_id": equipo.season_id or f"{effective_liga_id}_{effective_temporada}-{(effective_temporada + 1) % 100:02d}",
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


@api_router.get("/prediction/backtesting")
async def run_backtesting(
    season_id: Optional[str] = None,
    liga_id: Optional[str] = None,
    limite: Optional[int] = 100
):
    """
    Ejecuta backtesting del sistema de pronósticos.
    
    Compara pronósticos contra resultados históricos reales.
    
    **Parámetros:**
    - `season_id`: Filtrar por temporada (opcional)
    - `liga_id`: Filtrar por liga (opcional)
    - `limite`: Máximo de partidos a evaluar (default: 100)
    
    **Retorna:**
    - Porcentaje de aciertos por tipo de apuesta
    - ROI simulado
    """
    try:
        resultados = await backtesting_engine.ejecutar_backtesting(
            season_id=season_id,
            liga_id=liga_id,
            limite=limite
        )
        return {
            "success": True,
            "backtesting": resultados
        }
    except Exception as e:
        logging.error(f"Error en backtesting: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/prediction/teams")
async def list_teams(
    liga_id: Optional[str] = None,
    temporada: Optional[int] = None,
    season_id: Optional[str] = None
):
    """
    Lista todos los equipos disponibles para pronósticos.
    
    **Parámetros:**
    - `liga_id`: ID de la liga (opcional, se infiere de season_id)
    - `temporada`: Año (legacy, se infiere de season_id)
    - `season_id`: ID de temporada estructurado (preferido)
    """
    try:
        # Inferir liga_id y temporada de season_id si no se proporcionan
        effective_liga_id = liga_id
        effective_temporada = temporada
        
        if season_id:
            parts = season_id.rsplit('_', 1)
            if len(parts) == 2:
                if not effective_liga_id:
                    effective_liga_id = parts[0]
                try:
                    if not effective_temporada:
                        effective_temporada = int(parts[1].split('-')[0])
                except ValueError:
                    pass
        
        # Valores por defecto solo si no se puede inferir nada
        if not effective_liga_id:
            effective_liga_id = "SPAIN_LA_LIGA"
        if not effective_temporada:
            effective_temporada = 2023
        
        equipos = await stats_builder.obtener_todos_equipos(
            effective_liga_id, 
            effective_temporada,
            season_id=season_id
        )
        
        # Determinar season_id efectivo para respuesta
        effective_season_id = season_id
        if not effective_season_id:
            effective_season_id = f"{effective_liga_id}_{effective_temporada}-{(effective_temporada + 1) % 100:02d}"
        
        return {
            "liga_id": effective_liga_id,
            "temporada": effective_temporada,
            "season_id": effective_season_id,
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


# ============================================
# ENDPOINTS DE TEMPORADAS (SEASONS)
# ============================================

@api_router.get("/seasons")
async def list_seasons(liga_id: Optional[str] = None):
    """
    Lista todas las temporadas disponibles.
    
    **Parámetros:**
    - `liga_id`: Filtrar por liga específica (opcional)
    
    **Retorna:**
    - Lista de temporadas con información básica
    """
    try:
        # Siempre inferir de partidos reales para obtener datos actualizados
        pipeline = [
            {"$match": {"season_id": {"$exists": True, "$ne": None}}},
            {"$group": {
                "_id": "$season_id",
                "liga_id": {"$first": "$liga_id"},
                "total_partidos": {"$sum": 1},
                "fecha_min": {"$min": "$fecha_partido"},
                "fecha_max": {"$max": "$fecha_partido"}
            }},
            {"$sort": {"liga_id": 1, "_id": -1}}
        ]
        
        # Aplicar filtro de liga si se proporciona
        if liga_id:
            pipeline[0]["$match"]["liga_id"] = liga_id
        
        agg_result = await db.football_matches.aggregate(pipeline).to_list(100)
        
        seasons = []
        for r in agg_result:
            season_id = r["_id"]
            liga = r["liga_id"]
            # Extraer año del season_id (formato: LIGA_YYYY-YY)
            try:
                year_part = season_id.split("_")[-1]  # "2022-23"
                year = int(year_part.split("-")[0])
                label = year_part
            except:
                year = 2023
                label = "2023-24"
            
            seasons.append({
                "season_id": season_id,
                "liga_id": liga,
                "year": year,
                "label": label,
                "total_partidos": r["total_partidos"],
                "fecha_inicio": r.get("fecha_min"),
                "fecha_fin": r.get("fecha_max")
            })
        
        return {
            "total": len(seasons),
            "seasons": seasons
        }
    
    except Exception as e:
        logging.error(f"Error listando temporadas: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/seasons/{season_id}")
async def get_season(season_id: str):
    """
    Obtiene información detallada de una temporada.
    
    **Parámetros:**
    - `season_id`: ID de la temporada (ej: SPAIN_LA_LIGA_2023-24)
    
    **Retorna:**
    - Información completa de la temporada
    - Estadísticas de partidos
    - Lista de equipos
    """
    try:
        # Buscar en colección seasons
        season = await db.seasons.find_one(
            {"season_id": season_id},
            {"_id": 0}
        )
        
        # Si no existe, intentar inferir de partidos
        if not season:
            # Parsear season_id para extraer liga y año
            parts = season_id.rsplit("_", 1)
            if len(parts) != 2:
                raise HTTPException(status_code=404, detail=f"Temporada '{season_id}' no encontrada")
            
            liga_id = parts[0]
            year_part = parts[1].split("-")[0]
            
            try:
                year = int(year_part)
            except:
                raise HTTPException(status_code=404, detail=f"Temporada '{season_id}' no encontrada")
            
            # Buscar partidos
            query = {"liga_id": liga_id, "season": year}
            total_partidos = await db.football_matches.count_documents(query)
            
            if total_partidos == 0:
                raise HTTPException(status_code=404, detail=f"Temporada '{season_id}' no encontrada")
            
            # Obtener equipos
            equipos = await db.football_matches.distinct("equipo_local", query)
            
            # Obtener rango de fechas
            partidos = await db.football_matches.find(
                query,
                {"fecha": 1}
            ).sort("fecha", 1).to_list(None)
            
            season = {
                "season_id": season_id,
                "liga_id": liga_id,
                "year": year,
                "label": f"{year}-{(year + 1) % 100:02d}",
                "total_partidos": total_partidos,
                "equipos_count": len(equipos),
                "equipos": equipos,
                "fecha_inicio": partidos[0]["fecha"] if partidos else None,
                "fecha_fin": partidos[-1]["fecha"] if partidos else None,
                "estado": "inferida"
            }
        else:
            # Agregar lista de equipos si no está
            if "equipos" not in season:
                equipos = await db.football_matches.distinct(
                    "equipo_local", 
                    {"season_id": season_id}
                )
                season["equipos"] = equipos
        
        return season
    
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error obteniendo temporada: {str(e)}")
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