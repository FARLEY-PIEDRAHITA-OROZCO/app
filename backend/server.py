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

# Create the main app
app = FastAPI(title="Football Data API")
api_router = APIRouter(prefix="/api")

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