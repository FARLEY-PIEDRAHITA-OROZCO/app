#!/usr/bin/env python3
"""
========================================
Script de Migración: Agregar season_id y match_id
========================================

Este script migra los datos existentes para agregar:
- season_id: Identificador estructurado de temporada
- match_id: Identificador único interno del partido

Uso:
    python migrate_season_id.py [--dry-run]

Opciones:
    --dry-run: Simula la migración sin hacer cambios
"""

import asyncio
import sys
import os
import re
from datetime import datetime
from pathlib import Path

# Añadir el directorio backend al path
sys.path.insert(0, str(Path(__file__).parent))

from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv(Path(__file__).parent / '.env')

MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'football_database')


def normalize_string(text: str) -> str:
    """Normaliza un string para usar en IDs."""
    if not text:
        return "UNKNOWN"
    # Convertir a mayúsculas, reemplazar espacios y caracteres especiales
    normalized = text.upper().strip()
    normalized = re.sub(r'[^A-Z0-9]', '_', normalized)
    normalized = re.sub(r'_+', '_', normalized)  # Eliminar underscores múltiples
    return normalized.strip('_')


def generate_season_id(liga_id: str, season_year: int) -> str:
    """Genera un ID de temporada estructurado."""
    next_year = (season_year + 1) % 100
    return f"{liga_id}_{season_year}-{next_year:02d}"


def generate_match_id(
    liga_id: str,
    season_year: int,
    ronda: str,
    equipo_local: str,
    equipo_visitante: str,
    fecha: str
) -> str:
    """Genera un ID único para el partido."""
    local_code = normalize_string(equipo_local)[:3].upper() if equipo_local else "UNK"
    visit_code = normalize_string(equipo_visitante)[:3].upper() if equipo_visitante else "UNK"
    
    jornada = ""
    if ronda:
        match = re.search(r'(\d+)', ronda)
        if match:
            jornada = f"J{match.group(1)}"
        else:
            jornada = normalize_string(ronda)[:10]
    
    season_id = generate_season_id(liga_id, season_year)
    fecha_short = fecha.replace("-", "") if fecha else ""
    
    return f"{season_id}_{jornada}_{local_code}-{visit_code}_{fecha_short}"


def infer_season_from_date(fecha: str, season_hint: int = None) -> int:
    """Infiere el año de inicio de temporada basándose en la fecha."""
    if not fecha:
        return season_hint or 2023
    
    try:
        fecha_dt = datetime.strptime(fecha, "%Y-%m-%d")
        if fecha_dt.month >= 8:
            return fecha_dt.year
        else:
            return fecha_dt.year - 1
    except:
        return season_hint or 2023


async def migrate_matches(db, dry_run: bool = False):
    """Migra los partidos existentes agregando season_id y match_id."""
    collection = db.football_matches
    
    # Contar partidos sin season_id
    total_sin_season = await collection.count_documents({"season_id": {"$exists": False}})
    total_con_season = await collection.count_documents({"season_id": {"$exists": True}})
    
    print(f"\n{'='*60}")
    print(f"MIGRACIÓN DE DATOS - season_id y match_id")
    print(f"{'='*60}")
    print(f"Partidos sin season_id: {total_sin_season}")
    print(f"Partidos con season_id: {total_con_season}")
    print(f"Modo: {'DRY RUN (sin cambios)' if dry_run else 'REAL'}")
    print(f"{'='*60}\n")
    
    if total_sin_season == 0:
        print("✅ Todos los partidos ya tienen season_id. Nada que migrar.")
        return
    
    # Procesar en lotes
    batch_size = 100
    processed = 0
    updated = 0
    errors = 0
    seasons_found = set()
    
    cursor = collection.find({"season_id": {"$exists": False}})
    
    async for match in cursor:
        try:
            liga_id = match.get('liga_id', 'UNKNOWN')
            fecha = match.get('fecha', '')
            season_hint = match.get('season', 2023)
            ronda = match.get('ronda', '')
            equipo_local = match.get('equipo_local', '')
            equipo_visitante = match.get('equipo_visitante', '')
            
            # Inferir temporada correcta
            season_year = infer_season_from_date(fecha, season_hint)
            
            # Generar IDs
            season_id = generate_season_id(liga_id, season_year)
            match_id = generate_match_id(
                liga_id, season_year, ronda,
                equipo_local, equipo_visitante, fecha
            )
            
            seasons_found.add((liga_id, season_id, season_year))
            
            if not dry_run:
                # Actualizar el documento
                await collection.update_one(
                    {'_id': match['_id']},
                    {'$set': {
                        'season_id': season_id,
                        'match_id': match_id,
                        'external_match_id': match.get('id_partido'),
                        'updated_at': datetime.utcnow().isoformat()
                    }}
                )
            
            updated += 1
            
        except Exception as e:
            errors += 1
            print(f"  ❌ Error procesando partido {match.get('_id')}: {str(e)}")
        
        processed += 1
        
        if processed % 100 == 0:
            print(f"  Procesados: {processed}/{total_sin_season} ({updated} actualizados)")
    
    print(f"\n{'='*60}")
    print(f"RESUMEN DE MIGRACIÓN")
    print(f"{'='*60}")
    print(f"Total procesados: {processed}")
    print(f"Actualizados: {updated}")
    print(f"Errores: {errors}")
    print(f"Temporadas encontradas: {len(seasons_found)}")
    
    return seasons_found


async def create_seasons_collection(db, seasons_found: set, dry_run: bool = False):
    """Crea registros en la colección de temporadas."""
    if not seasons_found:
        print("\nNo hay temporadas para crear.")
        return
    
    seasons_collection = db.seasons
    
    print(f"\n{'='*60}")
    print(f"CREANDO COLECCIÓN DE TEMPORADAS")
    print(f"{'='*60}")
    
    created = 0
    
    for liga_id, season_id, year in seasons_found:
        # Obtener rango de fechas de la temporada
        matches = await db.football_matches.find(
            {'season_id': season_id},
            {'fecha': 1}
        ).sort('fecha', 1).to_list(None)
        
        fecha_inicio = matches[0]['fecha'] if matches else f"{year}-08-01"
        fecha_fin = matches[-1]['fecha'] if matches else f"{year+1}-05-31"
        
        # Contar partidos y equipos
        total_partidos = len(matches)
        equipos = await db.football_matches.distinct('equipo_local', {'season_id': season_id})
        
        season_data = {
            'season_id': season_id,
            'liga_id': liga_id,
            'year': year,
            'label': f"{year}-{(year+1) % 100:02d}",
            'fecha_inicio': fecha_inicio,
            'fecha_fin': fecha_fin,
            'total_partidos': total_partidos,
            'equipos_count': len(equipos),
            'estado': 'completada' if datetime.now().year > year + 1 else 'activa',
            'created_at': datetime.utcnow().isoformat(),
            'updated_at': datetime.utcnow().isoformat()
        }
        
        print(f"  {season_id}: {total_partidos} partidos, {len(equipos)} equipos")
        
        if not dry_run:
            await seasons_collection.update_one(
                {'season_id': season_id},
                {'$set': season_data},
                upsert=True
            )
        
        created += 1
    
    print(f"\n✅ Temporadas {'que se crearían' if dry_run else 'creadas'}: {created}")


async def update_team_statistics(db, dry_run: bool = False):
    """Actualiza la colección de estadísticas de equipos con season_id."""
    collection = db.team_statistics
    
    total_sin_season = await collection.count_documents({"season_id": {"$exists": False}})
    
    print(f"\n{'='*60}")
    print(f"ACTUALIZANDO ESTADÍSTICAS DE EQUIPOS")
    print(f"{'='*60}")
    print(f"Registros sin season_id: {total_sin_season}")
    
    if total_sin_season == 0:
        print("✅ Todas las estadísticas ya tienen season_id.")
        return
    
    cursor = collection.find({"season_id": {"$exists": False}})
    updated = 0
    
    async for stat in cursor:
        liga_id = stat.get('liga_id', 'UNKNOWN')
        temporada = stat.get('temporada', 2023)
        
        season_id = generate_season_id(liga_id, temporada)
        
        if not dry_run:
            await collection.update_one(
                {'_id': stat['_id']},
                {'$set': {
                    'season_id': season_id,
                    'updated_at': datetime.utcnow().isoformat()
                }}
            )
        
        updated += 1
    
    print(f"✅ Estadísticas {'que se actualizarían' if dry_run else 'actualizadas'}: {updated}")


async def validate_migration(db):
    """Valida la integridad de la migración."""
    print(f"\n{'='*60}")
    print(f"VALIDACIÓN DE MIGRACIÓN")
    print(f"{'='*60}")
    
    # Verificar partidos
    matches_sin_season = await db.football_matches.count_documents({"season_id": {"$exists": False}})
    matches_con_season = await db.football_matches.count_documents({"season_id": {"$exists": True}})
    
    print(f"\nPartidos:")
    print(f"  - Con season_id: {matches_con_season}")
    print(f"  - Sin season_id: {matches_sin_season}")
    
    if matches_sin_season == 0:
        print("  ✅ Todos los partidos tienen season_id")
    else:
        print(f"  ⚠️ Hay {matches_sin_season} partidos sin season_id")
    
    # Verificar temporadas
    total_seasons = await db.seasons.count_documents({})
    print(f"\nTemporadas: {total_seasons}")
    
    # Verificar estadísticas
    stats_sin_season = await db.team_statistics.count_documents({"season_id": {"$exists": False}})
    stats_con_season = await db.team_statistics.count_documents({"season_id": {"$exists": True}})
    
    print(f"\nEstadísticas de equipos:")
    print(f"  - Con season_id: {stats_con_season}")
    print(f"  - Sin season_id: {stats_sin_season}")
    
    # Mostrar temporadas encontradas
    seasons = await db.seasons.find({}, {'_id': 0, 'season_id': 1, 'total_partidos': 1}).to_list(20)
    if seasons:
        print(f"\nTemporadas registradas:")
        for s in seasons:
            print(f"  - {s['season_id']}: {s.get('total_partidos', 0)} partidos")


async def main():
    """Función principal."""
    dry_run = '--dry-run' in sys.argv
    
    print(f"\n{'#'*60}")
    print(f"# SCRIPT DE MIGRACIÓN - SEASON_ID")
    print(f"# Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"# Base de datos: {DB_NAME}")
    print(f"# Modo: {'DRY RUN' if dry_run else 'REAL'}")
    print(f"{'#'*60}")
    
    # Conectar a MongoDB
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    try:
        # Paso 1: Migrar partidos
        seasons_found = await migrate_matches(db, dry_run)
        
        # Paso 2: Crear colección de temporadas
        if seasons_found:
            await create_seasons_collection(db, seasons_found, dry_run)
        
        # Paso 3: Actualizar estadísticas de equipos
        await update_team_statistics(db, dry_run)
        
        # Paso 4: Validar
        if not dry_run:
            await validate_migration(db)
        
        print(f"\n{'#'*60}")
        print(f"# MIGRACIÓN {'SIMULADA' if dry_run else 'COMPLETADA'}")
        print(f"{'#'*60}\n")
        
    finally:
        client.close()


if __name__ == '__main__':
    asyncio.run(main())
