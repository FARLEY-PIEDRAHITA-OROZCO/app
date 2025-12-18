# ⚽ Sistema de Pronósticos Deportivos PLLA 3.0

## Descripción General

Sistema completo de análisis y pronósticos de fútbol basado en el modelo Excel PLLA 3.0.
Convierte la lógica compleja del Excel (526,550+ fórmulas) en una aplicación web moderna
con backend en Python/FastAPI y frontend en React.

## Características Principales

### Motor de Pronósticos
- ✅ **Estadísticas Acumuladas**: Calcula PJ, V, E, D, GF, GC, Pts por equipo
- ✅ **Tres Dimensiones Temporales**: Tiempo Completo (90min), Primer Tiempo (1MT), Segundo Tiempo (2MT)
- ✅ **Tres Contextos**: General, Como Local, Como Visitante
- ✅ **Algoritmo de Decisión**: Probabilidades L/E/V con umbrales configurables
- ✅ **Doble Oportunidad**: 1X, X2, 12
- ✅ **Ambos Marcan**: SI/NO
- ✅ **Validación**: Sistema GANA/PIERDE post-partido

### Interfaz Web
- ✅ **Dashboard**: Resumen general del sistema
- ✅ **Pronósticos**: Generación interactiva de pronósticos
- ✅ **Clasificación**: Tablas de posiciones con selector de tiempo
- ✅ **Equipos**: Estadísticas detalladas por equipo
- ✅ **Partidos**: Visualización de datos históricos
- ✅ **Extracción**: Scraping de datos desde API-Football

## Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                      ARQUITECTURA DEL SISTEMA                      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    FRONTEND     │     │     BACKEND     │     │    DATABASE     │
│    (React)      │ ←→←→ │    (FastAPI)    │ ←→←→ │    (MongoDB)    │
│    Port 3000    │     │    Port 8001    │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │
        │         ┌─────────────────────────┐
        └─────────┤  PREDICTION ENGINE    │
                  │  (Motor PLLA 3.0)    │
                  ├─────────────────────────┤
                  │ • stats_builder.py   │
                  │ • classification.py  │
                  │ • prediction_engine  │
                  │ • validation.py      │
                  └─────────────────────────┘
```

## Estructura del Proyecto

```
/app/
├── README.md                    # Este archivo
├── backend/
│   ├── server.py                # Servidor FastAPI principal
│   ├── requirements.txt         # Dependencias Python
│   ├── .env                     # Variables de entorno
│   ├── api_football/            # Módulo de extracción de datos
│   │   ├── api_client.py        # Cliente API-Football
│   │   ├── data_transformer.py  # Transformación de datos
│   │   ├── db_manager.py        # Gestor de base de datos
│   │   └── config.py            # Configuración
│   └── prediction_engine/       # Motor de pronósticos PLLA 3.0
│       ├── __init__.py          # Exportaciones
│       ├── README.md            # Documentación del motor
│       ├── PLAN_IMPLEMENTACION.md # Plan técnico detallado
│       ├── models.py            # Modelos Pydantic
│       ├── config.py            # Umbrales y configuración
│       ├── stats_builder.py     # Constructor de estadísticas
│       ├── classification.py    # Motor de clasificación
│       ├── prediction_engine.py # Motor de pronósticos
│       └── validation.py        # Validador GANA/PIERDE
└── frontend/
    ├── package.json             # Dependencias Node.js
    ├── .env                     # Variables de entorno
    └── src/
        ├── App.js               # Componente principal
        ├── App.css              # Estilos globales
        ├── components/
        │   └── Layout.jsx       # Layout con sidebar
        └── pages/
            ├── Dashboard.jsx    # Página principal
            ├── Predictions.jsx  # Generador de pronósticos
            ├── Classification.jsx # Tabla de posiciones
            ├── TeamStats.jsx    # Estadísticas por equipo
            ├── Matches.jsx      # Listado de partidos
            └── Scraping.jsx     # Extracción de datos
```

## Inicio Rápido

### Prerrequisitos
- Python 3.11+
- Node.js 18+
- MongoDB

### Instalación

```bash
# Backend
cd /app/backend
pip install -r requirements.txt

# Frontend
cd /app/frontend
yarn install
```

### Ejecución

```bash
# Backend (puerto 8001)
cd /app/backend
uvicorn server:app --host 0.0.0.0 --port 8001 --reload

# Frontend (puerto 3000)
cd /app/frontend
yarn start
```

### Construir Estadísticas (Primer Paso)

Antes de generar pronósticos, ejecutar:

```bash
curl -X POST "http://localhost:8001/api/prediction/build-stats" \
  -H "Content-Type: application/json" \
  -d '{"liga_id": "SPAIN_LA_LIGA", "temporada": 2023}'
```

## API Endpoints

### Endpoints de Pronósticos

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/prediction/build-stats` | Construye estadísticas de equipos |
| GET | `/api/prediction/classification` | Tabla de clasificación |
| POST | `/api/prediction/generate` | **Genera pronóstico** |
| GET | `/api/prediction/team/{nombre}` | Stats de un equipo |
| POST | `/api/prediction/validate` | Valida pronóstico vs resultado |
| GET | `/api/prediction/effectiveness` | Métricas de efectividad |
| GET | `/api/prediction/config` | Configuración del algoritmo |
| GET | `/api/prediction/teams` | Lista de equipos |

### Endpoints de Datos

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/stats` | Estadísticas generales |
| GET | `/api/leagues` | Lista de ligas |
| GET | `/api/matches` | Lista de partidos |
| POST | `/api/scrape-league` | Extraer datos de una liga |

## Ejemplos de Uso

### Generar Pronóstico

```bash
curl -X POST "http://localhost:8001/api/prediction/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "equipo_local": "Barcelona",
    "equipo_visitante": "Real Madrid",
    "liga_id": "SPAIN_LA_LIGA",
    "temporada": 2023
  }'
```

**Respuesta:**
```json
{
  "success": true,
  "pronostico": {
    "id": "abc123",
    "equipo_local": "Barcelona",
    "equipo_visitante": "Real Madrid",
    "tiempo_completo": {
      "pronostico": "E",
      "doble_oportunidad": "1X",
      "ambos_marcan": "SI",
      "probabilidades": {
        "local": 36.9,
        "empate": 27.9,
        "visita": 35.2
      },
      "confianza": 42.5
    },
    "primer_tiempo": { ... },
    "segundo_tiempo": { ... }
  }
}
```

### Obtener Clasificación

```bash
curl "http://localhost:8001/api/prediction/classification?liga_id=SPAIN_LA_LIGA&temporada=2023&tipo_tiempo=completo"
```

## Configuración del Algoritmo

### Umbrales (config.py)

| Parámetro | Valor | Descripción |
|-----------|-------|-------------|
| `PROB_LOCAL_MIN` | 43% | Mínimo para pronosticar LOCAL |
| `PROB_LOCAL_MAX` | 69.5% | Máximo antes de "muy favorito" |
| `PROB_EMPATE_MAX` | 20% | Máximo de empate para decidir |
| `SUMA_PROB_MIN` | 116% | Mínimo para doble oportunidad "12" |
| `UMBRAL_AMBOS_MARCAN` | 45% | Umbral para SI/NO |

### Factores de Ajuste

| Factor | Rendimiento | Descripción |
|--------|-------------|-------------|
| 5 | > 80% | Equipo dominante |
| 4 | 60-80% | Equipo fuerte |
| 3 | 40-60% | Equipo promedio |
| 2 | 20-40% | Equipo débil |
| 1 | < 20% | Equipo muy débil |

## Base de Datos

### Colecciones MongoDB

| Colección | Descripción |
|-----------|-------------|
| `football_matches` | Partidos históricos |
| `team_statistics` | Estadísticas por equipo |
| `predictions` | Pronósticos generados |
| `validations` | Validaciones post-partido |

### Esquema de Partido

```json
{
  "liga_id": "SPAIN_LA_LIGA",
  "equipo_local": "Barcelona",
  "equipo_visitante": "Real Madrid",
  "fecha": "2023-10-28",
  "goles_local_TR": 2,
  "goles_visitante_TR": 1,
  "goles_local_1MT": 1,
  "goles_visitante_1MT": 0
}
```

## Documentación Adicional

- [Motor de Pronósticos](./backend/prediction_engine/README.md)
- [Plan de Implementación](./backend/prediction_engine/PLAN_IMPLEMENTACION.md)
- [API de Datos](./docs/API_REFERENCE.md)

## Versión

- **Motor PLLA**: 3.0
- **Algoritmo**: v1.0.0
- **API**: v1.0.0

## Licencia

Proyecto privado - PLLA 3.0

---

*Documentación actualizada: Diciembre 2024*
