# Módulo de Integración con API-Futbol

## 📝 Descripción

Módulo completo en Python para consumir la API de API-Futbol, extraer datos de partidos de múltiples ligas, transformarlos a un formato específico y almacenarlos en MongoDB.

---

## 📁 Estructura del Proyecto

```
backend/
└── api_football/
    ├── __init__.py           # Inicialización del módulo
    ├── config.py             # Configuración y variables de entorno
    ├── api_client.py         # Cliente para consumir la API
    ├── data_transformer.py   # Transformación de datos
    ├── db_manager.py         # Gestión de MongoDB
    ├── utils.py              # Utilidades (logs, helpers)
    └── main.py               # Script principal
```

---

## 🔧 Módulos Explicados

### 1. **config.py**
Contiene todas las configuraciones del módulo:
- URL base de la API
- API Key (desde variables de entorno)
- Configuración de MongoDB
- Parámetros de reintentos y timeouts
- Configuración de logs

### 2. **utils.py**
Funciones auxiliares:
- `setup_logger()`: Configura logging en consola y archivo
- `normalize_string()`: Normaliza strings removiendo acentos y caracteres especiales

### 3. **api_client.py**
Clase `APIFootballClient` que maneja toda la comunicación con la API:
- Peticiones HTTP con reintentos automáticos
- Manejo de errores (timeout, rate limit, errores del servidor)
- Métodos:
  - `get_all_leagues()`: Obtiene todas las ligas disponibles
  - `get_fixtures_by_league()`: Obtiene partidos de una liga
  - `get_team_standings()`: Obtiene clasificación de equipos

### 4. **data_transformer.py**
Clase `DataTransformer` que transforma los datos de la API:
- `transform_league_id()`: Convierte liga_id al formato PAIS_NOMBRE-LIGA
- `extract_match_data()`: Extrae y transforma datos de un partido
- `batch_transform()`: Transforma múltiples partidos en lote

**Campos extraídos:**
- equipo_local
- equipo_visitante
- estado_del_partido
- fecha
- goles_local_1MT (medio tiempo)
- goles_local_TR (tiempo reglamentario)
- goles_visitante_1MT
- goles_visitante_TR
- hora
- id_equipo_local
- id_equipo_visitante
- id_partido
- liga_id (transformado a formato PAIS_LIGA)
- liga_nombre
- ronda
- pos_clasif_local (posición en clasificación)
- pos_clasif_visita

### 5. **db_manager.py**
Clase `DatabaseManager` que gestiona MongoDB:
- Conexión segura con manejo de errores
- Creación automática de índices:
  - Índice único en `id_partido` (evita duplicados)
  - Índice compuesto en `liga_id` y `fecha`
  - Índices en `id_equipo_local` e `id_equipo_visitante`
- Métodos CRUD:
  - `insert_match()`: Inserta un partido
  - `insert_many_matches()`: Inserta múltiples partidos
  - `update_match()`: Actualiza un partido
  - `get_match_by_id()`: Obtiene un partido por ID
  - `get_matches_by_league()`: Obtiene partidos de una liga
  - `get_statistics()`: Obtiene estadísticas de la BD

### 6. **main.py**
Script principal que orquesta todo el proceso:
- Inicializa cliente API y base de datos
- Obtiene todas las ligas (o una específica)
- Por cada liga:
  1. Obtiene clasificación de equipos
  2. Obtiene fixtures
  3. Transforma datos
  4. Guarda en MongoDB
- Genera resumen y estadísticas finales

---

## 📄 Modelo de Base de Datos

### Colección: `football_matches`

```javascript
{
  // Datos del partido
  "equipo_local": "Real Madrid",
  "equipo_visitante": "Barcelona",
  "estado_del_partido": "Match Finished",
  "fecha": "2024-10-26",
  "hora": "20:00",
  
  // Goles
  "goles_local_1MT": 1,
  "goles_local_TR": 2,
  "goles_visitante_1MT": 0,
  "goles_visitante_TR": 1,
  
  // IDs
  "id_partido": 12345,
  "id_equipo_local": 541,
  "id_equipo_visitante": 529,
  
  // Liga
  "liga_id": "SPAIN_LALIGA",
  "liga_nombre": "La Liga",
  "ronda": "Regular Season - 10",
  
  // Clasificación
  "pos_clasif_local": 1,
  "pos_clasif_visita": 2,
  
  // Metadatos
  "created_at": "2024-10-27T10:30:00",
  "api_league_id": 140,
  "season": 2024
}
```

### Índices Creados

```sql
-- Índice único para evitar duplicados
CREATE UNIQUE INDEX idx_id_partido ON football_matches (id_partido)

-- Índice compuesto para consultas por liga y fecha
CREATE INDEX idx_liga_fecha ON football_matches (liga_id, fecha)

-- Índices para búsquedas por equipos
CREATE INDEX idx_equipo_local ON football_matches (id_equipo_local)
CREATE INDEX idx_equipo_visitante ON football_matches (id_equipo_visitante)
```

---

## 🚀 Instalación

### 1. Instalar dependencias

```bash
cd /app/backend
pip install requests python-dotenv pymongo
```

Las dependencias se agregarán automáticamente a `requirements.txt`.

### 2. Configurar variables de entorno

El archivo `.env` ya contiene la configuración necesaria:

```env
MONGO_URL="mongodb://localhost:27017"
DB_NAME="test_database"
API_FOOTBALL_KEY="0a6cde0f396662525a6bce4e79082d17"
```

### 3. Verificar MongoDB

```bash
# Verificar que MongoDB esté corriendo
sudo supervisorctl status
```

---

## 💻 Uso del Script

### Modo Básico (Todas las ligas)

```bash
cd /app/backend
python -m api_football.main
```

### Modo de Prueba (Limitar ligas)

```bash
# Procesar solo 5 ligas para pruebas
python -m api_football.main --limit 5
```

### Procesar una liga específica

```bash
# Procesar solo La Liga (ID: 140)
python -m api_football.main --league-id 140
```

### Especificar temporada

```bash
# Procesar temporada 2023
python -m api_football.main --season 2023
```

### Usar API key diferente

```bash
python -m api_football.main --api-key "tu_api_key_aqui"
```

### Combinación de opciones

```bash
# Procesar 3 ligas de la temporada 2023
python -m api_football.main --limit 3 --season 2023
```

---

## 🧪 Ejemplos de Uso

### Ejemplo 1: Extraer todas las ligas

```bash
cd /app/backend
python -m api_football.main
```

**Salida esperada:**
```
================================================================================
INICIO DE PROCESO - EXTRACCIÓN DE DATOS API-FUTBOL
================================================================================

Inicializando cliente API...
Conectando a MongoDB...
Obteniendo todas las ligas disponibles...

Total de ligas a procesar: 950

Procesando liga 1/950
============================================================
Procesando: Spain - La Liga (ID: 140)
============================================================
Obteniendo clasificación de equipos...
Obteniendo partidos...
Transformando datos...
Guardando en base de datos...
✓ Liga procesada: 380 nuevos, 0 duplicados

...

================================================================================
RESUMEN FINAL
================================================================================
Ligas procesadas: 950
Total fixtures obtenidos: 125430
Total insertados en BD: 125430
Total duplicados: 0
Total errores: 0

Estadísticas de la base de datos:
Total partidos en BD: 125430
Total ligas en BD: 950

Top 5 ligas con más partidos:
  1. La Liga (SPAIN_LALIGA): 380 partidos
  2. Premier League (ENGLAND_PREMIER_LEAGUE): 380 partidos
  3. Serie A (ITALY_SERIE_A): 380 partidos
  4. Bundesliga (GERMANY_BUNDESLIGA): 306 partidos
  5. Ligue 1 (FRANCE_LIGUE_1): 306 partidos

================================================================================
PROCESO COMPLETADO EXITOSAMENTE
================================================================================
```

### Ejemplo 2: Usar desde Python

```python
from api_football.api_client import APIFootballClient
from api_football.db_manager import DatabaseManager
from api_football.data_transformer import DataTransformer

# Inicializar cliente
api_client = APIFootballClient()

# Obtener partidos de La Liga
fixtures = api_client.get_fixtures_by_league(league_id=140, season=2024)

# Obtener clasificación
standings = api_client.get_team_standings(league_id=140, season=2024)

# Transformar datos
league_info = {
    'league': {'id': 140, 'name': 'La Liga'},
    'country': {'name': 'Spain'}
}

transformed = DataTransformer.batch_transform(fixtures, league_info, standings)

# Guardar en BD
db_manager = DatabaseManager()
db_manager.connect()
stats = db_manager.insert_many_matches(transformed)

print(f"Insertados: {stats['insertados']}")
print(f"Duplicados: {stats['duplicados']}")

db_manager.close()
```

---

## 🔍 Consultas a la Base de Datos

### Desde Python

```python
from api_football.db_manager import DatabaseManager

db = DatabaseManager()
db.connect()

# Obtener todos los partidos de La Liga
matches = db.get_matches_by_league('SPAIN_LALIGA')

# Obtener un partido específico
match = db.get_match_by_id(12345)

# Obtener estadísticas
stats = db.get_statistics()

db.close()
```

### Desde MongoDB Shell

```javascript
// Conectar a MongoDB
mongo mongodb://localhost:27017/test_database

// Ver todas las colecciones
show collections

// Contar partidos
db.football_matches.count()

// Buscar partidos de La Liga
db.football_matches.find({liga_id: "SPAIN_LALIGA"}).limit(5)

// Buscar partidos de un equipo específico
db.football_matches.find({id_equipo_local: 541})

// Agregar por liga
db.football_matches.aggregate([
  {$group: {_id: "$liga_id", total: {$sum: 1}}},
  {$sort: {total: -1}},
  {$limit: 10}
])

// Buscar partidos con más goles
db.football_matches.find().sort({goles_local_TR: -1, goles_visitante_TR: -1}).limit(10)
```

---

## ⚙️ Características Implementadas

✅ **Conexión a API con manejo robusto de errores**
- Reintentos automáticos
- Manejo de rate limits
- Timeouts configurables
- Logging detallado

✅ **Extracción completa de datos**
- Todos los campos requeridos
- Datos de clasificación de equipos
- Metadatos adicionales

✅ **Transformación de datos**
- Formato `liga_id` como PAIS_NOMBRE-LIGA
- Normalización de strings
- Validación de datos

✅ **Base de datos MongoDB**
- Índices optimizados
- Prevención de duplicados
- Conexión segura con cierre adecuado

✅ **Código modular y escalable**
- Separación de responsabilidades
- Fácil de mantener y extender
- Documentación inline

✅ **Logging completo**
- Consola y archivo
- Niveles de log configurables
- Trazabilidad completa

---

## 📊 Formato de Salida

El formato de salida coincide con lo solicitado:

| LIGA | POS. CLASIF. LOCAL | POS. CLASIF. VISITA | FECHA | HORA | LOCAL | GOL LOCAL 1MT | GOL LOCAL GENERAL | VISITANTE | GOL VISITA 1MT | GOL VISITA GENERAL |
|------|-------------------|--------------------|-----------|---------|--------------------|---------------|-------------------|-----------------------|----------------|--------------------|
| SPAIN_LALIGA | 1 | 2 | 2024-10-26 | 20:00 | Real Madrid | 1 | 2 | Barcelona | 0 | 1 |

Campos en MongoDB:
- `liga_id`: SPAIN_LALIGA (transformado)
- `pos_clasif_local`: 1
- `pos_clasif_visita`: 2
- `fecha`: 2024-10-26
- `hora`: 20:00
- `equipo_local`: Real Madrid
- `goles_local_1MT`: 1
- `goles_local_TR`: 2
- `equipo_visitante`: Barcelona
- `goles_visitante_1MT`: 0
- `goles_visitante_TR`: 1

---

## 🐞 Manejo de Errores

El módulo maneja los siguientes escenarios:

1. **Errores de API:**
   - Timeout: Reintenta automáticamente
   - Rate limit (429): Espera y reintenta
   - Errores de servidor (5xx): Reintenta
   - Errores de cliente (4xx): Registra y continúa

2. **Errores de MongoDB:**
   - Duplicados: Los detecta y cuenta
   - Conexión fallida: Registra error y aborta
   - Errores de inserción: Registra y continúa

3. **Errores de datos:**
   - Datos faltantes: Omite el registro y continúa
   - Formatos inválidos: Registra warning y usa valores por defecto

---

## 📝 Logs

Los logs se guardan en dos lugares:
1. **Consola**: Nivel INFO
2. **Archivo**: `api_football.log` (nivel DEBUG)

Ejemplo de logs:
```
2024-10-27 10:30:15 - api_football.api_client - INFO - Cliente API-Futbol inicializado correctamente
2024-10-27 10:30:16 - api_football.db_manager - INFO - Conexión exitosa a MongoDB: test_database.football_matches
2024-10-27 10:30:17 - api_football.api_client - INFO - Obteniendo todas las ligas...
2024-10-27 10:30:19 - api_football.api_client - INFO - Se encontraron 950 ligas
```

---

## ⚠️ Consideraciones Importantes

1. **Rate Limits de la API:**
   - La API de API-Futbol tiene límites de peticiones
   - El script maneja automáticamente los rate limits
   - Para pruebas, usa `--limit` para procesar menos ligas

2. **Tiempo de Ejecución:**
   - Procesar todas las ligas puede tomar varias horas
   - Se recomienda ejecutar en modo de prueba primero

3. **Duplicados:**
   - Los partidos con el mismo `id_partido` no se duplican
   - Si ejecutas el script varias veces, solo se insertarán nuevos partidos

4. **Espacio en disco:**
   - 1000+ ligas pueden generar cientos de miles de documentos
   - Asegúrate de tener suficiente espacio en disco

---

## 🔧 Troubleshooting

### Error: "API key no configurada"
**Solución:** Verifica que `API_FOOTBALL_KEY` esté en `/app/backend/.env`

### Error: "No se pudo conectar a MongoDB"
**Solución:** 
```bash
sudo supervisorctl status
sudo supervisorctl restart backend
```

### Error: Rate limit alcanzado
**Solución:** El script espera automáticamente. Para reducir llamadas, usa `--limit`

### No se insertan datos
**Solución:** Verifica los logs en `api_football.log` para ver errores específicos

---

## 🚀 Extensiones Futuras

Posibles mejoras:
- [ ] Soporte para actualizaciones incrementales
- [ ] Sistema de cola para procesamiento asíncrono
- [ ] API REST para consultar datos
- [ ] Dashboard web para visualizar estadísticas
- [ ] Exportación a CSV/Excel
- [ ] Notificaciones por email en caso de errores
- [ ] Cache de clasificaciones para reducir llamadas a la API

---

## 💬 Soporte

Para dudas o problemas:
1. Revisa los logs en `api_football.log`
2. Verifica la configuración en `.env`
3. Asegúrate de que MongoDB esté corriendo
4. Verifica que la API key sea válida

---

## 📚 Referencias

- **API-Futbol Documentation:** https://www.api-football.com/documentation-v3
- **MongoDB Python Driver:** https://pymongo.readthedocs.io/
- **Requests Library:** https://requests.readthedocs.io/
