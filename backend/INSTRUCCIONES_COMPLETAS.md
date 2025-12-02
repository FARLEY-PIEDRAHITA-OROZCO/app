# 📘 MÓDULO API-FUTBOL - INSTRUCCIONES COMPLETAS

## 🎯 Objetivo

Solución completa en Python para extraer datos de la API de API-Futbol, transformarlos y almacenarlos en MongoDB.

---

## 📦 Estructura Completa del Proyecto

```
/app/backend/
├── api_football/                   # Módulo principal
│   ├── __init__.py                 # Inicialización
│   ├── config.py                   # Configuración
│   ├── utils.py                    # Utilidades
│   ├── api_client.py               # Cliente API
│   ├── data_transformer.py         # Transformación de datos
│   ├── db_manager.py               # Gestor MongoDB
│   ├── main.py                     # Script principal
│   ├── query_examples.py           # Ejemplos de consultas
│   └── export_data.py              # Exportación de datos
├── test_api_football.py            # Suite de tests
├── run_api_football.sh             # Script interactivo
├── README_API_FUTBOL.md            # Documentación detallada
└── .env                            # Variables de entorno
```

---

## 🔧 1. INSTALACIÓN DE DEPENDENCIAS

```bash
cd /app/backend
pip install requests python-dotenv pymongo
pip freeze > requirements.txt
```

**Dependencias necesarias:**
- `requests`: Para hacer peticiones HTTP a la API
- `python-dotenv`: Para manejar variables de entorno
- `pymongo`: Driver de Python para MongoDB

---

## ⚙️ 2. CONFIGURACIÓN

### Archivo `.env`

El archivo `/app/backend/.env` ya contiene:

```env
MONGO_URL="mongodb://localhost:27017"
DB_NAME="test_database"
API_FOOTBALL_KEY="0a6cde0f396662525a6bce4e79082d17"
```

**Importante:** 
- La API key proporcionada es de plan gratuito
- Solo permite acceso a temporadas 2021-2023
- Tiene límites de peticiones por día

---

## 🗄️ 3. MODELO DE BASE DE DATOS

### Colección: `football_matches`

```javascript
{
  // ====== DATOS DEL PARTIDO ======
  "equipo_local": "Real Madrid",
  "equipo_visitante": "Barcelona",
  "estado_del_partido": "Match Finished",
  "fecha": "2023-10-28",
  "hora": "20:00",
  
  // ====== GOLES ======
  "goles_local_1MT": 1,        // Goles local en primer tiempo
  "goles_local_TR": 2,         // Goles local tiempo reglamentario
  "goles_visitante_1MT": 0,    // Goles visitante en primer tiempo
  "goles_visitante_TR": 1,     // Goles visitante tiempo reglamentario
  
  // ====== IDENTIFICADORES ======
  "id_partido": 1037952,
  "id_equipo_local": 541,
  "id_equipo_visitante": 529,
  
  // ====== LIGA (FORMATO TRANSFORMADO) ======
  "liga_id": "SPAIN_LA_LIGA",  // Formato: PAIS_NOMBRE-LIGA
  "liga_nombre": "La Liga",
  "ronda": "Regular Season - 10",
  
  // ====== CLASIFICACIÓN ======
  "pos_clasif_local": 1,       // Posición del equipo local
  "pos_clasif_visita": 2,      // Posición del equipo visitante
  
  // ====== METADATOS ======
  "created_at": "2025-12-02T04:33:18.863697",
  "api_league_id": 140,
  "season": 2023
}
```

### Índices Creados Automáticamente

```javascript
// 1. Índice único en id_partido (previene duplicados)
db.football_matches.createIndex({ "id_partido": 1 }, { unique: true })

// 2. Índice compuesto para consultas por liga y fecha
db.football_matches.createIndex({ "liga_id": 1, "fecha": 1 })

// 3. Índice para búsquedas por equipo local
db.football_matches.createIndex({ "id_equipo_local": 1 })

// 4. Índice para búsquedas por equipo visitante
db.football_matches.createIndex({ "id_equipo_visitante": 1 })
```

---

## 🚀 4. USO DEL SCRIPT PRINCIPAL

### Opción 1: Procesar TODAS las ligas

```bash
cd /app/backend
python -m api_football.main
```

⚠️ **ADVERTENCIA:** Esto puede tomar varias horas y consume muchas peticiones de API.

### Opción 2: Modo PRUEBA (5 ligas)

```bash
python -m api_football.main --limit 5
```

✅ **Recomendado para primeras pruebas**

### Opción 3: Procesar UNA liga específica

```bash
# La Liga (España)
python -m api_football.main --league-id 140

# Premier League (Inglaterra)
python -m api_football.main --league-id 39

# Serie A (Italia)
python -m api_football.main --league-id 135
```

### Opción 4: Especificar temporada

```bash
# Temporada 2023 (default)
python -m api_football.main --season 2023

# Temporada 2022
python -m api_football.main --season 2022

# Temporada 2021
python -m api_football.main --season 2021
```

### Opción 5: Combinaciones

```bash
# 10 ligas de la temporada 2022
python -m api_football.main --limit 10 --season 2022

# La Liga temporada 2021
python -m api_football.main --league-id 140 --season 2021
```

---

## 🧪 5. EJECUTAR TESTS

```bash
cd /app/backend
python test_api_football.py
```

**Tests incluidos:**
1. ✅ Conexión a API-Futbol
2. ✅ Conexión a MongoDB
3. ✅ Transformación de datos
4. ✅ Procesamiento de liga completa

---

## 📊 6. CONSULTAR DATOS

### Opción 1: Usar script de ejemplos

```bash
cd /app/backend
python api_football/query_examples.py
```

**Consultas incluidas:**
1. Total de partidos
2. Partidos por liga
3. Últimos partidos de La Liga
4. Partidos con más goles
5. Partidos de un equipo específico
6. Partidos por fecha
7. Promedio de goles por liga
8. Partidos empatados
9. Partidos por estado
10. Formato de tabla requerido

### Opción 2: Consultas directas en Python

```python
from api_football.db_manager import DatabaseManager

db = DatabaseManager()
db.connect()

# Obtener todos los partidos de La Liga
matches = db.get_matches_by_league('SPAIN_LA_LIGA')
print(f"Total partidos: {len(matches)}")

# Obtener un partido específico
match = db.get_match_by_id(1037952)
print(match)

# Obtener estadísticas
stats = db.get_statistics()
print(stats)

db.close()
```

### Opción 3: MongoDB Shell

```bash
# Conectar a MongoDB
mongo mongodb://localhost:27017/test_database

# Ver colecciones
show collections

# Contar partidos
db.football_matches.count()

# Buscar partidos de La Liga
db.football_matches.find({liga_id: "SPAIN_LA_LIGA"}).limit(5)

# Buscar por equipo
db.football_matches.find({equipo_local: "Real Madrid"}).limit(5)

# Agregar por liga
db.football_matches.aggregate([
  {$group: {_id: "$liga_id", total: {$sum: 1}}},
  {$sort: {total: -1}}
])
```

---

## 💾 7. EXPORTAR DATOS

### Exportar a CSV

```bash
# Todos los partidos
python api_football/export_data.py --format csv --output partidos.csv

# Solo La Liga
python api_football/export_data.py --format csv --output laliga.csv --liga SPAIN_LA_LIGA

# Primeros 100 registros
python api_football/export_data.py --format csv --output sample.csv --limit 100
```

### Exportar a JSON

```bash
# Todos los partidos
python api_football/export_data.py --format json --output partidos.json

# Solo La Liga
python api_football/export_data.py --format json --output laliga.json --liga SPAIN_LA_LIGA
```

### Exportar a Tabla Formateada

```bash
# Primeros 50 partidos
python api_football/export_data.py --format table --output partidos.txt --limit 50

# Solo La Liga
python api_football/export_data.py --format table --output laliga.txt --liga SPAIN_LA_LIGA --limit 100
```

---

## 📋 8. FORMATO DE SALIDA REQUERIDO

Los datos se almacenan con el formato exacto solicitado:

| Campo | Origen | Descripción |
|-------|--------|-------------|
| LIGA | `liga_id` | Formato: PAIS_NOMBRE-LIGA |
| POS. CLASIF. LOCAL | `pos_clasif_local` | Posición en tabla |
| POS. CLASIF. VISITA | `pos_clasif_visita` | Posición en tabla |
| FECHA | `fecha` | Formato: YYYY-MM-DD |
| HORA | `hora` | Formato: HH:MM |
| LOCAL | `equipo_local` | Nombre del equipo |
| GOL LOCAL 1MT | `goles_local_1MT` | Goles en primer tiempo |
| GOL LOCAL GENERAL | `goles_local_TR` | Goles totales |
| VISITANTE | `equipo_visitante` | Nombre del equipo |
| GOL VISITA 1MT | `goles_visitante_1MT` | Goles en primer tiempo |
| GOL VISITA GENERAL | `goles_visitante_TR` | Goles totales |

**Ejemplo:**

```
LIGA              | POS.LOCAL | POS.VISITA | FECHA      | HORA  | LOCAL      | GOL 1MT | GOL GEN | VISITANTE  | GOL 1MT | GOL GEN
SPAIN_LA_LIGA     |     1     |     2      | 2023-10-28 | 20:00 | Real Madrid|    1    |    2    | Barcelona  |    0    |    1
```

---

## 🔍 9. TRANSFORMACIÓN DE liga_id

El campo `liga_id` se transforma del formato original de la API al formato requerido:

### Reglas de transformación:

1. Tomar país (`country.name`)
2. Tomar nombre de liga (`league.name`)
3. Normalizar (remover acentos, espacios → guión bajo, mayúsculas)
4. Formato final: `PAIS_NOMBRE-LIGA`

### Ejemplos:

| País | Liga Original | liga_id Transformado |
|------|---------------|---------------------|
| Spain | La Liga | `SPAIN_LA_LIGA` |
| England | Premier League | `ENGLAND_PREMIER_LEAGUE` |
| France | Ligue 1 | `FRANCE_LIGUE_1` |
| Germany | Bundesliga | `GERMANY_BUNDESLIGA` |
| Italy | Serie A | `ITALY_SERIE_A` |
| Brazil | Série A | `BRAZIL_SERIE_A` |
| Argentina | Primera División | `ARGENTINA_PRIMERA_DIVISION` |

---

## ⚡ 10. CARACTERÍSTICAS TÉCNICAS

### ✅ Manejo Robusto de Errores

- **Reintentos automáticos**: 3 intentos por petición
- **Rate limiting**: Detecta y espera automáticamente
- **Timeouts**: 30 segundos por petición
- **Logging completo**: Consola + archivo

### ✅ Prevención de Duplicados

- Índice único en `id_partido`
- Detección automática de duplicados
- Estadísticas de inserción

### ✅ Optimización de Base de Datos

- Índices optimizados para consultas frecuentes
- Conexión segura con cierre adecuado
- Operaciones por lote para mejor rendimiento

### ✅ Código Modular

- Separación clara de responsabilidades
- Fácil de mantener y extender
- Documentación inline completa
- Type hints en todas las funciones

---

## 📝 11. LOGS

Los logs se generan en dos lugares:

1. **Consola**: Nivel INFO
2. **Archivo**: `api_football.log` (nivel DEBUG)

```bash
# Ver logs en tiempo real
tail -f api_football.log

# Buscar errores
grep ERROR api_football.log

# Ver últimas 100 líneas
tail -n 100 api_football.log
```

---

## 🐛 12. TROUBLESHOOTING

### Error: "API key no configurada"

```bash
# Verificar que existe en .env
cat /app/backend/.env | grep API_FOOTBALL_KEY
```

### Error: "No se pudo conectar a MongoDB"

```bash
# Verificar estado de MongoDB
sudo supervisorctl status

# Reiniciar si es necesario
sudo supervisorctl restart backend
```

### Error: "Rate limit alcanzado"

- El script espera automáticamente
- Usa `--limit` para procesar menos ligas
- Espera unas horas antes de volver a ejecutar

### Error: "Season not available" (Free plan)

```bash
# Usar solo temporadas 2021-2023
python -m api_football.main --season 2023
python -m api_football.main --season 2022
python -m api_football.main --season 2021
```

### No se insertan datos

```bash
# Revisar logs
cat api_football.log | tail -50

# Verificar MongoDB
python -c "from pymongo import MongoClient; print(MongoClient('mongodb://localhost:27017').server_info())"
```

---

## 📚 13. REFERENCIAS DE LA API

### Endpoints utilizados:

1. **GET /leagues**
   - Obtiene todas las ligas disponibles
   - Documentación: https://www.api-football.com/documentation-v3#tag/Leagues

2. **GET /fixtures**
   - Obtiene partidos de una liga/temporada
   - Parámetros: `league`, `season`
   - Documentación: https://www.api-football.com/documentation-v3#tag/Fixtures

3. **GET /standings**
   - Obtiene clasificación de equipos
   - Parámetros: `league`, `season`
   - Documentación: https://www.api-football.com/documentation-v3#tag/Standings

---

## 🎓 14. EJEMPLOS COMPLETOS

### Ejemplo 1: Primera ejecución (Prueba)

```bash
# 1. Ejecutar tests
cd /app/backend
python test_api_football.py

# 2. Procesar 3 ligas de prueba
python -m api_football.main --limit 3 --season 2023

# 3. Ver datos
python api_football/query_examples.py

# 4. Exportar a CSV
python api_football/export_data.py --format csv --output prueba.csv --limit 50
```

### Ejemplo 2: Procesar ligas específicas

```bash
# La Liga
python -m api_football.main --league-id 140 --season 2023

# Premier League
python -m api_football.main --league-id 39 --season 2023

# Champions League
python -m api_football.main --league-id 2 --season 2023
```

### Ejemplo 3: Uso desde Python (Custom)

```python
#!/usr/bin/env python3
from api_football.api_client import APIFootballClient
from api_football.db_manager import DatabaseManager
from api_football.data_transformer import DataTransformer

# Inicializar
api = APIFootballClient()
db = DatabaseManager()
db.connect()

# Obtener ligas de España
all_leagues = api.get_all_leagues()
spain_leagues = [l for l in all_leagues if l['country']['name'] == 'Spain']

print(f"Ligas de España: {len(spain_leagues)}")

# Procesar cada liga
for league_info in spain_leagues:
    league_id = league_info['league']['id']
    league_name = league_info['league']['name']
    
    print(f"Procesando: {league_name}")
    
    # Obtener datos
    fixtures = api.get_fixtures_by_league(league_id, 2023)
    standings = api.get_team_standings(league_id, 2023)
    
    # Transformar
    transformed = DataTransformer.batch_transform(
        fixtures, 
        league_info, 
        standings
    )
    
    # Guardar
    stats = db.insert_many_matches(transformed)
    print(f"  Insertados: {stats['insertados']}")

db.close()
print("Proceso completado!")
```

---

## 🎯 15. RESUMEN DE COMANDOS PRINCIPALES

```bash
# Tests
python test_api_football.py

# Procesar todas las ligas
python -m api_football.main

# Procesar 5 ligas (prueba)
python -m api_football.main --limit 5

# Procesar una liga específica
python -m api_football.main --league-id 140

# Ver consultas de ejemplo
python api_football/query_examples.py

# Exportar a CSV
python api_football/export_data.py --format csv --output data.csv

# Exportar a JSON
python api_football/export_data.py --format json --output data.json

# Exportar tabla formateada
python api_football/export_data.py --format table --output data.txt --limit 50

# Ver logs
tail -f api_football.log
```

---

## 📄 16. SCRIPT SQL EQUIVALENTE (Para referencia)

Aunque usamos MongoDB (NoSQL), aquí está el esquema SQL equivalente:

```sql
-- Tabla principal de partidos
CREATE TABLE football_matches (
    id_partido INT PRIMARY KEY,
    
    -- Equipos
    equipo_local VARCHAR(100) NOT NULL,
    equipo_visitante VARCHAR(100) NOT NULL,
    id_equipo_local INT NOT NULL,
    id_equipo_visitante INT NOT NULL,
    
    -- Clasificación
    pos_clasif_local INT DEFAULT 0,
    pos_clasif_visita INT DEFAULT 0,
    
    -- Fecha y hora
    fecha DATE NOT NULL,
    hora TIME NOT NULL,
    
    -- Goles
    goles_local_1MT INT DEFAULT 0,
    goles_local_TR INT DEFAULT 0,
    goles_visitante_1MT INT DEFAULT 0,
    goles_visitante_TR INT DEFAULT 0,
    
    -- Liga
    liga_id VARCHAR(100) NOT NULL,
    liga_nombre VARCHAR(100) NOT NULL,
    api_league_id INT NOT NULL,
    ronda VARCHAR(100),
    
    -- Estado
    estado_del_partido VARCHAR(50),
    
    -- Metadatos
    season INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Índices
    INDEX idx_liga_fecha (liga_id, fecha),
    INDEX idx_equipo_local (id_equipo_local),
    INDEX idx_equipo_visitante (id_equipo_visitante)
);

-- Consultas de ejemplo
SELECT * FROM football_matches WHERE liga_id = 'SPAIN_LA_LIGA';
SELECT * FROM football_matches WHERE fecha = '2023-10-28';
SELECT * FROM football_matches WHERE equipo_local = 'Real Madrid';
SELECT liga_id, COUNT(*) as total FROM football_matches GROUP BY liga_id;
```

---

## ✅ 17. VERIFICACIÓN FINAL

Para verificar que todo está funcionando:

```bash
# 1. Ejecutar tests
python test_api_football.py

# 2. Procesar una liga
python -m api_football.main --league-id 140 --season 2023

# 3. Verificar datos en MongoDB
python -c "
from api_football.db_manager import DatabaseManager
db = DatabaseManager()
db.connect()
stats = db.get_statistics()
print(f'Total partidos: {stats[\"total_partidos\"]}')
print(f'Total ligas: {stats[\"total_ligas\"]}')
db.close()
"

# 4. Ver ejemplos
python api_football/query_examples.py

# 5. Exportar muestra
python api_football/export_data.py --format table --output test.txt --limit 10
cat test.txt
```

**Resultado esperado:**
- ✅ Todos los tests pasan
- ✅ Datos insertados en MongoDB
- ✅ Consultas funcionando
- ✅ Exportación exitosa

---

## 🎉 ¡PROCESO COMPLETADO!

Has creado exitosamente un módulo profesional para:
- ✅ Conectar a API-Futbol con manejo robusto de errores
- ✅ Extraer datos de múltiples ligas
- ✅ Transformar liga_id al formato PAIS_NOMBRE-LIGA
- ✅ Almacenar en MongoDB con índices optimizados
- ✅ Consultar y exportar datos fácilmente

**Documentación completa disponible en:**
- `README_API_FUTBOL.md`: Guía detallada
- `INSTRUCCIONES_COMPLETAS.md`: Este archivo (instrucciones completas)
- Código fuente: Comentarios inline en cada módulo
