# ⚡ QUICK START - API-FUTBOL

## 🚀 Inicio Rápido (5 minutos)

### 1️⃣ Ejecutar Tests

```bash
cd /app/backend
python test_api_football.py
```

### 2️⃣ Procesar Liga de Prueba

```bash
# Procesar solo La Liga como prueba (380 partidos)
python -m api_football.main --league-id 140 --season 2023
```

### 3️⃣ Ver Datos

```bash
# Ver consultas de ejemplo
python api_football/query_examples.py
```

### 4️⃣ Exportar Datos

```bash
# Exportar a tabla formateada
python api_football/export_data.py --format table --output partidos.txt --limit 20
cat partidos.txt
```

---

## 📋 Comandos Más Usados

```bash
# Procesar 5 ligas (modo prueba)
python -m api_football.main --limit 5

# Procesar todas las ligas (¡PUEDE TOMAR HORAS!)
python -m api_football.main

# Procesar liga específica
python -m api_football.main --league-id 140

# Ver estadísticas de la BD
python -c "
from api_football.db_manager import DatabaseManager
db = DatabaseManager()
db.connect()
stats = db.get_statistics()
print(f'Total: {stats[\"total_partidos\"]} partidos en {stats[\"total_ligas\"]} ligas')
db.close()
"

# Exportar a CSV
python api_football/export_data.py --format csv --output data.csv

# Ver logs
tail -f api_football.log
```

---

## 🎯 IDs de Ligas Principales

| Liga | ID | Comando |
|------|----|---------| 
| La Liga (España) | 140 | `python -m api_football.main --league-id 140` |
| Premier League (Inglaterra) | 39 | `python -m api_football.main --league-id 39` |
| Serie A (Italia) | 135 | `python -m api_football.main --league-id 135` |
| Bundesliga (Alemania) | 78 | `python -m api_football.main --league-id 78` |
| Ligue 1 (Francia) | 61 | `python -m api_football.main --league-id 61` |
| Champions League | 2 | `python -m api_football.main --league-id 2` |

---

## 🔍 Consultas MongoDB Rápidas

```bash
# Conectar a MongoDB
mongo mongodb://localhost:27017/test_database

# Ver todas las colecciones
show collections

# Contar partidos
db.football_matches.count()

# Ver un partido de ejemplo
db.football_matches.findOne()

# Buscar partidos de La Liga
db.football_matches.find({liga_id: "SPAIN_LA_LIGA"}).limit(5)

# Contar por liga
db.football_matches.aggregate([
  {$group: {_id: "$liga_id", total: {$sum: 1}}},
  {$sort: {total: -1}}
])
```

---

## 📊 Formato de Datos

Cada partido se guarda con este formato:

```json
{
  "liga_id": "SPAIN_LA_LIGA",
  "equipo_local": "Real Madrid",
  "equipo_visitante": "Barcelona",
  "pos_clasif_local": 1,
  "pos_clasif_visita": 2,
  "fecha": "2023-10-28",
  "hora": "20:00",
  "goles_local_1MT": 1,
  "goles_local_TR": 2,
  "goles_visitante_1MT": 0,
  "goles_visitante_TR": 1,
  "estado_del_partido": "Match Finished",
  "ronda": "Regular Season - 10"
}
```

---

## ⚠️ Importante

- **Plan Gratuito**: Solo temporadas 2021-2023
- **Rate Limits**: El script maneja automáticamente
- **Duplicados**: Se detectan y no se reinsertan
- **Logs**: Revisa `api_football.log` si hay problemas

---

## 📚 Documentación Completa

- `README_API_FUTBOL.md`: Documentación detallada del módulo
- `INSTRUCCIONES_COMPLETAS.md`: Guía completa paso a paso
- `QUICK_START.md`: Este archivo (referencia rápida)

---

## 💡 Ejemplo Completo

```bash
# 1. Tests
python test_api_football.py

# 2. Procesar una liga
python -m api_football.main --league-id 140 --season 2023

# 3. Ver resultados
python api_football/query_examples.py

# 4. Exportar
python api_football/export_data.py --format csv --output laliga.csv --liga SPAIN_LA_LIGA

# ¡Listo! 🎉
```
