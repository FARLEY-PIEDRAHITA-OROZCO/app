#!/usr/bin/env python3
"""
Script para importar datos del Motor PLLA 3.0 a MongoDB local.

Uso:
    python import_data.py

Requisitos:
    - MongoDB corriendo localmente en localhost:27017
    - pip install pymongo
    
Los archivos JSON deben estar en la misma carpeta:
    - football_matches.json
    - team_statistics.json
    - seasons.json
"""

import json
import os
from pymongo import MongoClient
from datetime import datetime

# Configuración
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'test_database')

def parse_dates(obj):
    """Convierte strings ISO a datetime."""
    if isinstance(obj, dict):
        for key, value in obj.items():
            if isinstance(value, str) and 'T' in value and len(value) > 18:
                try:
                    obj[key] = datetime.fromisoformat(value.replace('Z', '+00:00'))
                except:
                    pass
            elif isinstance(value, (dict, list)):
                parse_dates(value)
    elif isinstance(obj, list):
        for item in obj:
            parse_dates(item)
    return obj

def import_collection(db, collection_name, filename):
    """Importa una colección desde archivo JSON."""
    if not os.path.exists(filename):
        print(f"  ⚠️  Archivo no encontrado: {filename}")
        return 0
    
    with open(filename, 'r') as f:
        data = json.load(f)
    
    # Parsear fechas
    data = parse_dates(data)
    
    # Limpiar colección existente
    db[collection_name].delete_many({})
    
    # Insertar datos
    if data:
        db[collection_name].insert_many(data)
    
    return len(data)

def main():
    print("=" * 50)
    print("  IMPORTADOR DE DATOS - Motor PLLA 3.0")
    print("=" * 50)
    print(f"\nConectando a: {MONGO_URL}")
    print(f"Base de datos: {DB_NAME}\n")
    
    try:
        client = MongoClient(MONGO_URL)
        db = client[DB_NAME]
        
        # Verificar conexión
        client.admin.command('ping')
        print("✅ Conexión exitosa a MongoDB\n")
        
    except Exception as e:
        print(f"❌ Error conectando a MongoDB: {e}")
        print("\nAsegúrate de que MongoDB esté corriendo:")
        print("  - Windows: Inicia el servicio MongoDB")
        print("  - Mac: brew services start mongodb-community")
        print("  - Linux: sudo systemctl start mongod")
        return
    
    # Importar colecciones
    print("Importando datos...")
    
    count = import_collection(db, 'football_matches', 'football_matches.json')
    print(f"  ✅ football_matches: {count} documentos")
    
    count = import_collection(db, 'team_statistics', 'team_statistics.json')
    print(f"  ✅ team_statistics: {count} documentos")
    
    count = import_collection(db, 'seasons', 'seasons.json')
    print(f"  ✅ seasons: {count} documentos")
    
    # Crear índices
    print("\nCreando índices...")
    db.football_matches.create_index([("liga_id", 1), ("season_id", 1)])
    db.football_matches.create_index([("equipo_local", 1)])
    db.football_matches.create_index([("equipo_visitante", 1)])
    db.team_statistics.create_index([("liga_id", 1), ("season_id", 1)])
    db.seasons.create_index([("season_id", 1)], unique=True)
    print("  ✅ Índices creados")
    
    print("\n" + "=" * 50)
    print("  ¡IMPORTACIÓN COMPLETADA!")
    print("=" * 50)
    print("\nDatos disponibles:")
    print(f"  - La Liga 2023-24: 380 partidos, 20 equipos")
    print(f"  - Premier League 2022-23: 380 partidos, 20 equipos")
    print("\nAhora puedes iniciar la aplicación:")
    print("  1. cd backend && python -m uvicorn server:app --port 8001")
    print("  2. cd frontend && yarn start")
    print("  3. Abre http://localhost:3000")

if __name__ == "__main__":
    main()
