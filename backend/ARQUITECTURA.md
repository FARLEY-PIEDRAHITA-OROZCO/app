# 🏗️ ARQUITECTURA DEL SISTEMA

## 📐 Diagrama de Flujo

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FLUJO PRINCIPAL                              │
└─────────────────────────────────────────────────────────────────────┘

1. INICIALIZACIÓN
   ├─ Cargar variables de entorno (.env)
   ├─ Inicializar APIFootballClient
   └─ Conectar a MongoDB

2. OBTENCIÓN DE LIGAS
   ├─ GET https://v3.football.api-sports.io/leagues
   └─ Filtrar liga específica (opcional)

3. PARA CADA LIGA:
   │
   ├─ 3.1 Obtener Clasificación
   │      ├─ GET /standings?league={id}&season={year}
   │      └─ Mapear: {team_id: posición}
   │
   ├─ 3.2 Obtener Fixtures
   │      ├─ GET /fixtures?league={id}&season={year}
   │      └─ Lista de partidos
   │
   ├─ 3.3 Transformar Datos
   │      ├─ Extraer campos requeridos
   │      ├─ Transformar liga_id → PAIS_NOMBRE-LIGA
   │      ├─ Agregar posiciones de clasificación
   │      └─ Normalizar fechas/horas
   │
   └─ 3.4 Guardar en MongoDB
          ├─ Insertar por lotes
          ├─ Detectar duplicados (id_partido único)
          └─ Registrar estadísticas

4. RESUMEN FINAL
   └─ Estadísticas totales y por liga
```

---

## 🧩 Arquitectura de Módulos

```
┌────────────────────────────────────────────────────────────────────┐
│                                                                     │
│                        api_football/                                │
│                                                                     │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐      │
│  │   config.py  │     │   utils.py   │     │ main.py      │      │
│  │              │     │              │     │              │      │
│  │ • Variables  │     │ • Logger     │     │ • Orquesta   │      │
│  │ • API keys   │     │ • Normalize  │     │   el proceso │      │
│  │ • URLs       │     │              │     │              │      │
│  └──────────────┘     └──────────────┘     └──────┬───────┘      │
│                                                     │              │
│                            ┌────────────────────────┼────────┐     │
│                            │                        │        │     │
│                    ┌───────▼────────┐    ┌─────────▼─────────┐   │
│                    │ api_client.py  │    │data_transformer.py│   │
│                    │                │    │                   │   │
│                    │ • get_leagues  │    │• extract_match    │   │
│                    │ • get_fixtures │    │• transform_id     │   │
│                    │ • get_standings│    │• batch_transform  │   │
│                    │ • HTTP retry   │    │                   │   │
│                    └────────┬───────┘    └─────────┬─────────┘   │
│                             │                      │              │
│                             │      ┌───────────────▼─────────┐    │
│                             │      │   db_manager.py         │    │
│                             │      │                         │    │
│                             │      │ • connect()             │    │
│                             │      │ • insert_match()        │    │
│                             │      │ • insert_many()         │    │
│                             │      │ • get_statistics()      │    │
│                             │      │ • create_indexes()      │    │
│                             │      └──────────┬──────────────┘    │
│                             │                 │                   │
└─────────────────────────────┼─────────────────┼───────────────────┘
                              │                 │
                              ▼                 ▼
                    ┌──────────────┐   ┌────────────────┐
                    │  API-Futbol  │   │    MongoDB     │
                    │              │   │                │
                    │v3.football.  │   │ test_database  │
                    │api-sports.io │   │  .football_    │
                    │              │   │   matches      │
                    └──────────────┘   └────────────────┘
```

---

## 🔄 Flujo de Datos Detallado

### 1. API Response → Raw Data

```python
# Respuesta de la API (ejemplo)
{
  "fixture": {
    "id": 1037952,
    "date": "2023-08-11T17:30:00+00:00",
    "status": {"long": "Match Finished"}
  },
  "teams": {
    "home": {"id": 723, "name": "Almeria"},
    "away": {"id": 728, "name": "Rayo Vallecano"}
  },
  "goals": {"home": 0, "away": 2},
  "score": {
    "halftime": {"home": 0, "away": 2},
    "fulltime": {"home": 0, "away": 2}
  },
  "league": {
    "id": 140,
    "name": "La Liga",
    "round": "Regular Season - 1",
    "season": 2023
  }
}
```

### 2. Transformation → Normalized Data

```python
# Datos transformados
{
  "equipo_local": "Almeria",
  "equipo_visitante": "Rayo Vallecano",
  "estado_del_partido": "Match Finished",
  "fecha": "2023-08-11",
  "hora": "17:30",
  "goles_local_1MT": 0,
  "goles_local_TR": 0,
  "goles_visitante_1MT": 2,
  "goles_visitante_TR": 2,
  "id_equipo_local": 723,
  "id_equipo_visitante": 728,
  "id_partido": 1037952,
  "liga_id": "SPAIN_LA_LIGA",  # ← TRANSFORMADO
  "liga_nombre": "La Liga",
  "ronda": "Regular Season - 1",
  "pos_clasif_local": 19,  # ← AGREGADO
  "pos_clasif_visita": 17,  # ← AGREGADO
  "api_league_id": 140,
  "season": 2023,
  "created_at": "2025-12-02T04:33:18"
}
```

### 3. Storage → MongoDB Document

```javascript
// Documento final en MongoDB
db.football_matches.insert({
  _id: ObjectId("..."),  // Auto-generado
  equipo_local: "Almeria",
  equipo_visitante: "Rayo Vallecano",
  // ... resto de campos
})
```

---

## 🔐 Seguridad y Buenas Prácticas

### 1. Variables de Entorno

```
✅ API keys en .env (no en código)
✅ URLs configurables
✅ Separación de configuración
```

### 2. Manejo de Errores

```python
try:
    response = requests.get(url)
except requests.exceptions.Timeout:
    # Reintentar
except requests.exceptions.ConnectionError:
    # Log y continuar
except Exception as e:
    # Log completo
```

### 3. Validación de Datos

```python
if not fixture_data or not teams:
    logger.warning("Datos incompletos")
    return None
```

### 4. Prevención de Duplicados

```python
# Índice único en MongoDB
collection.create_index(
    [('id_partido', ASCENDING)],
    unique=True
)
```

---

## 📊 Modelo de Datos Relacional

```
┌─────────────────────────────────────────────────────────────┐
│                    football_matches                          │
├─────────────────────────────────────────────────────────────┤
│ PK: id_partido (UNIQUE)                                     │
│                                                              │
│ Equipos:                                                     │
│   - id_equipo_local    → Relación virtual con API          │
│   - id_equipo_visitante → Relación virtual con API          │
│   - equipo_local                                            │
│   - equipo_visitante                                        │
│   - pos_clasif_local                                        │
│   - pos_clasif_visita                                       │
│                                                              │
│ Partido:                                                     │
│   - fecha                                                    │
│   - hora                                                     │
│   - estado_del_partido                                      │
│   - goles_local_1MT                                         │
│   - goles_local_TR                                          │
│   - goles_visitante_1MT                                     │
│   - goles_visitante_TR                                      │
│                                                              │
│ Liga:                                                        │
│   - liga_id (TRANSFORMADO: PAIS_LIGA)                      │
│   - liga_nombre                                             │
│   - api_league_id → Relación virtual con API               │
│   - ronda                                                    │
│   - season                                                   │
│                                                              │
│ Metadatos:                                                   │
│   - created_at                                              │
│                                                              │
│ Índices:                                                     │
│   - idx_id_partido (UNIQUE)                                 │
│   - idx_liga_fecha (liga_id, fecha)                         │
│   - idx_equipo_local (id_equipo_local)                      │
│   - idx_equipo_visitante (id_equipo_visitante)              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔍 Patrones de Diseño Utilizados

### 1. **Singleton Pattern** (DatabaseManager)
```python
# Una única conexión compartida
db_manager = DatabaseManager()
db_manager.connect()
```

### 2. **Factory Pattern** (DataTransformer)
```python
# Crea objetos normalizados
transformed = DataTransformer.extract_match_data(fixture)
```

### 3. **Strategy Pattern** (Export)
```python
# Diferentes estrategias de exportación
export_to_csv()
export_to_json()
export_to_table()
```

### 4. **Retry Pattern** (API Client)
```python
for attempt in range(MAX_RETRIES):
    try:
        response = requests.get(url)
        if response.status_code == 200:
            return response.json()
    except Exception:
        time.sleep(RETRY_DELAY)
```

---

## 📈 Escalabilidad

### Mejoras Futuras Posibles

```
1. CACHE
   └─ Redis para clasificaciones
      (evita llamadas repetidas a la API)

2. QUEUE
   └─ Celery + RabbitMQ
      (procesamiento asíncrono de ligas)

3. API REST
   └─ FastAPI endpoint
      (consultar datos vía HTTP)

4. INCREMENTAL UPDATES
   └─ Solo nuevos partidos
      (no reprocesar todo)

5. MÚLTIPLES WORKERS
   └─ Procesamiento paralelo
      (varias ligas simultáneamente)

6. DASHBOARD
   └─ React + Charts
      (visualización de datos)
```

---

## 🛠️ Stack Tecnológico

```
┌──────────────────────────────────────┐
│        LENGUAJE                      │
│        Python 3.11+                  │
└──────────────────────────────────────┘
                 │
    ┌────────────┼────────────┐
    │            │            │
┌───▼────┐  ┌───▼────┐  ┌───▼────┐
│requests│  │pymongo │  │python- │
│        │  │        │  │dotenv  │
│HTTP    │  │MongoDB │  │Config  │
│client  │  │driver  │  │loader  │
└────────┘  └────────┘  └────────┘
                 │
    ┌────────────┼────────────┐
    │            │            │
┌───▼────────┐ ┌▼─────────┐ ┌▼────────┐
│ API-Futbol │ │ MongoDB  │ │  Logs   │
│            │ │          │ │         │
│  REST API  │ │ NoSQL DB │ │ Console │
│            │ │          │ │  +File  │
└────────────┘ └──────────┘ └─────────┘
```

---

## 🎯 Principios SOLID Aplicados

### 1. **Single Responsibility**
Cada módulo tiene una única responsabilidad:
- `api_client.py`: Solo comunicación con API
- `data_transformer.py`: Solo transformación
- `db_manager.py`: Solo base de datos

### 2. **Open/Closed**
Abierto a extensión, cerrado a modificación:
- Fácil agregar nuevas transformaciones
- Fácil agregar nuevos formatos de exportación

### 3. **Liskov Substitution**
Se pueden intercambiar implementaciones:
- Diferentes bases de datos
- Diferentes APIs de fútbol

### 4. **Interface Segregation**
Interfaces pequeñas y específicas:
- Métodos específicos por funcionalidad
- No fuerza a implementar métodos no usados

### 5. **Dependency Inversion**
Depende de abstracciones, no de implementaciones:
- Config centralizada
- Inyección de dependencias

---

## 📦 Deployment

### Estructura de Producción Recomendada

```
/opt/api_football/
├── app/
│   └── api_football/
│       ├── __init__.py
│       ├── config.py
│       ├── api_client.py
│       ├── data_transformer.py
│       ├── db_manager.py
│       ├── main.py
│       └── utils.py
│
├── logs/
│   └── api_football.log
│
├── exports/
│   ├── csv/
│   ├── json/
│   └── reports/
│
├── .env
├── requirements.txt
└── systemd/
    └── api-football.service
```

---

## 🔄 Ciclo de Vida de Datos

```
1. EXTRACCIÓN (API-Futbol)
   ↓
2. TRANSFORMACIÓN (Python)
   ↓
3. CARGA (MongoDB)
   ↓
4. CONSULTA (Queries)
   ↓
5. EXPORTACIÓN (CSV/JSON/TXT)
```

---

Esta arquitectura garantiza:
✅ **Modularidad** - Fácil mantener y extender
✅ **Escalabilidad** - Preparado para crecer
✅ **Robustez** - Manejo completo de errores
✅ **Performance** - Optimizado con índices
✅ **Claridad** - Código autodocumentado
