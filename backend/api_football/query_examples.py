#!/usr/bin/env python3
"""Ejemplos de consultas a la base de datos de partidos."""

from pymongo import MongoClient
from pprint import pprint
import os
from dotenv import load_dotenv
from pathlib import Path

# Cargar variables de entorno
ROOT_DIR = Path(__file__).parent.parent
load_dotenv(ROOT_DIR / '.env')

MONGO_URL = os.getenv('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.getenv('DB_NAME', 'test_database')

# Conectar a MongoDB
client = MongoClient(MONGO_URL)
db = client[DB_NAME]
collection = db['football_matches']

print("\n" + "="*80)
print("EJEMPLOS DE CONSULTAS - BASE DE DATOS FOOTBALL")
print("="*80)

# 1. Total de partidos
print("\n1. TOTAL DE PARTIDOS:")
total = collection.count_documents({})
print(f"   Total: {total} partidos\n")

# 2. Partidos por liga
print("2. PARTIDOS POR LIGA:")
ligas_pipeline = [
    {'$group': {
        '_id': '$liga_id',
        'total': {'$sum': 1},
        'liga_nombre': {'$first': '$liga_nombre'}
    }},
    {'$sort': {'total': -1}}
]
for liga in collection.aggregate(ligas_pipeline):
    print(f"   {liga['liga_nombre']:30} ({liga['_id']:30}): {liga['total']} partidos")

# 3. Buscar partidos de La Liga
print("\n3. ÚLTIMOS 5 PARTIDOS DE LA LIGA:")
for partido in collection.find(
    {'liga_id': 'SPAIN_LA_LIGA'},
    {'_id': 0, 'equipo_local': 1, 'equipo_visitante': 1, 'fecha': 1, 'goles_local_TR': 1, 'goles_visitante_TR': 1}
).sort('fecha', -1).limit(5):
    print(f"   {partido['fecha']} | {partido['equipo_local']:20} {partido['goles_local_TR']}-{partido['goles_visitante_TR']} {partido['equipo_visitante']:20}")

# 4. Partidos con más goles
print("\n4. TOP 5 PARTIDOS CON MÁS GOLES:")
for partido in collection.find(
    {},
    {'_id': 0, 'equipo_local': 1, 'equipo_visitante': 1, 'fecha': 1, 'goles_local_TR': 1, 'goles_visitante_TR': 1, 'liga_nombre': 1}
).sort([('goles_local_TR', -1), ('goles_visitante_TR', -1)]).limit(5):
    total_goles = partido['goles_local_TR'] + partido['goles_visitante_TR']
    print(f"   [{total_goles} goles] {partido['fecha']} | {partido['equipo_local']} {partido['goles_local_TR']}-{partido['goles_visitante_TR']} {partido['equipo_visitante']} | {partido['liga_nombre']}")

# 5. Buscar partidos de un equipo específico (por nombre)
print("\n5. PARTIDOS DEL REAL MADRID (LOCAL):")
for partido in collection.find(
    {'equipo_local': {'$regex': 'Real Madrid', '$options': 'i'}},
    {'_id': 0, 'equipo_local': 1, 'equipo_visitante': 1, 'fecha': 1, 'goles_local_TR': 1, 'goles_visitante_TR': 1}
).limit(5):
    print(f"   {partido['fecha']} | {partido['equipo_local']} {partido['goles_local_TR']}-{partido['goles_visitante_TR']} {partido['equipo_visitante']}")

# 6. Partidos de una fecha específica
print("\n6. PARTIDOS EN UNA FECHA ESPECÍFICA (2023-08-11):")
for partido in collection.find(
    {'fecha': '2023-08-11'},
    {'_id': 0, 'equipo_local': 1, 'equipo_visitante': 1, 'hora': 1, 'goles_local_TR': 1, 'goles_visitante_TR': 1, 'liga_nombre': 1}
):
    print(f"   {partido['hora']} | {partido['equipo_local']} {partido['goles_local_TR']}-{partido['goles_visitante_TR']} {partido['equipo_visitante']} | {partido['liga_nombre']}")

# 7. Estadísticas de goles por liga
print("\n7. PROMEDIO DE GOLES POR LIGA:")
promedio_goles_pipeline = [
    {'$group': {
        '_id': '$liga_id',
        'liga_nombre': {'$first': '$liga_nombre'},
        'total_partidos': {'$sum': 1},
        'total_goles': {'$sum': {'$add': ['$goles_local_TR', '$goles_visitante_TR']}},
        'promedio_goles': {'$avg': {'$add': ['$goles_local_TR', '$goles_visitante_TR']}}
    }},
    {'$sort': {'promedio_goles': -1}}
]
for stat in collection.aggregate(promedio_goles_pipeline):
    print(f"   {stat['liga_nombre']:30} | Partidos: {stat['total_partidos']:3} | Total goles: {stat['total_goles']:4} | Promedio: {stat['promedio_goles']:.2f}")

# 8. Partidos empatados
print("\n8. PRIMEROS 5 PARTIDOS EMPATADOS:")
for partido in collection.find(
    {'$expr': {'$eq': ['$goles_local_TR', '$goles_visitante_TR']}},
    {'_id': 0, 'equipo_local': 1, 'equipo_visitante': 1, 'fecha': 1, 'goles_local_TR': 1, 'goles_visitante_TR': 1}
).limit(5):
    print(f"   {partido['fecha']} | {partido['equipo_local']} {partido['goles_local_TR']}-{partido['goles_visitante_TR']} {partido['equipo_visitante']}")

# 9. Partidos por estado
print("\n9. PARTIDOS POR ESTADO:")
estados_pipeline = [
    {'$group': {
        '_id': '$estado_del_partido',
        'total': {'$sum': 1}
    }},
    {'$sort': {'total': -1}}
]
for estado in collection.aggregate(estados_pipeline):
    print(f"   {estado['_id']:30}: {estado['total']} partidos")

# 10. Formato de tabla solicitado
print("\n10. FORMATO DE TABLA REQUERIDO (5 ejemplos):")
print("\n" + "-"*150)
print(f"{'LIGA':<25} | {'POS.LOCAL':>9} | {'POS.VISITA':>10} | {'FECHA':>10} | {'HORA':>5} | {'LOCAL':<20} | {'GOL 1MT':>7} | {'GOL GEN':>7} | {'VISITANTE':<20} | {'GOL 1MT':>7} | {'GOL GEN':>7}")
print("-"*150)

for partido in collection.find({}, {'_id': 0}).limit(5):
    print(
        f"{partido['liga_id']:<25} | "
        f"{partido['pos_clasif_local']:>9} | "
        f"{partido['pos_clasif_visita']:>10} | "
        f"{partido['fecha']:>10} | "
        f"{partido['hora']:>5} | "
        f"{partido['equipo_local']:<20} | "
        f"{partido['goles_local_1MT']:>7} | "
        f"{partido['goles_local_TR']:>7} | "
        f"{partido['equipo_visitante']:<20} | "
        f"{partido['goles_visitante_1MT']:>7} | "
        f"{partido['goles_visitante_TR']:>7}"
    )

print("-"*150)

print("\n" + "="*80)
print("CONSULTAS COMPLETADAS")
print("="*80 + "\n")

client.close()
