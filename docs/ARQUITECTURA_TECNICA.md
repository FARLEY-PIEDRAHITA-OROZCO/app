# 🛠️ Arquitectura Técnica - Sistema PLLA 3.0

## Visión General

El sistema PLLA 3.0 es una aplicación full-stack que migra la lógica compleja
de un archivo Excel de análisis deportivo a una aplicación web moderna.

## Stack Tecnológico

### Backend
| Tecnología | Versión | Propósito |
|------------|---------|----------|
| Python | 3.11+ | Lenguaje principal |
| FastAPI | 0.100+ | Framework web |
| Pydantic | 2.x | Validación de datos |
| Motor | 3.x | Driver async MongoDB |
| uvicorn | 0.23+ | Servidor ASGI |

### Frontend
| Tecnología | Versión | Propósito |
|------------|---------|----------|
| React | 18.x | Framework UI |
| React Router | 6.x | Navegación |
| Axios | 1.x | Cliente HTTP |
| Lucide React | - | Iconos |

### Base de Datos
| Tecnología | Propósito |
|------------|----------|
| MongoDB | Base de datos principal |

---

## Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────────────┐
│                           CLIENTE (Browser)                              │
└─────────────────────────────────┬───────────────────────────────────┘
                                  │
                                  │ HTTP/HTTPS
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         KUBERNETES INGRESS                              │
│                                                                         │
│   /api/*  →  Backend (8001)     /*  →  Frontend (3000)                 │
└─────────────────┬─────────────────────────────┬───────────────────┘
                  │                             │
                  ▼                             ▼
┌───────────────────────┐           ┌───────────────────────┐
│   FRONTEND (React)    │           │   BACKEND (FastAPI)   │
│   Port: 3000          │           │   Port: 8001          │
├───────────────────────┤           ├───────────────────────┤
│ • Dashboard           │           │ • API Endpoints       │
│ • Predictions         │           │ • Prediction Engine   │
│ • Classification      │           │ • Data Extraction     │
│ • TeamStats           │           │ • Validation          │
│ • Matches             │           │                       │
│ • Scraping            │           │                       │
└───────────────────────┘           └───────────┬───────────┘
                                            │
                                            ▼
                              ┌───────────────────────┐
                              │   PREDICTION ENGINE   │
                              │   (Módulo Python)     │
                              ├───────────────────────┤
                              │ • StatsBuilder        │
                              │ • ClassificationEngine│
                              │ • PredictionEngine    │
                              │ • ValidationEngine    │
                              └───────────┬───────────┘
                                          │
                                          ▼
                              ┌───────────────────────┐
                              │      MongoDB          │
                              ├───────────────────────┤
                              │ • football_matches    │
                              │ • team_statistics     │
                              │ • predictions         │
                              │ • validations         │
                              └───────────────────────┘
```

---

## Motor de Pronósticos (Prediction Engine)

### Flujo de Datos

```
┌─────────────────────────────────────────────────────────────────────┐
│                    FLUJO DEL MOTOR PLLA 3.0                           │
└─────────────────────────────────────────────────────────────────────┘

    ┌──────────────┐
    │   PARTIDOS   │  Datos crudos de API-Football
    │   (MongoDB)  │
    └──────┬───────┘
           │
           ▼
    ┌────────────────────┐
    │   STATS BUILDER    │  Procesa partidos cronológicamente
    │                    │  Acumula: PJ, V, E, D, GF, GC, Pts
    │  stats_builder.py  │  Separa: General, Local, Visitante
    └──────────┬─────────┘  Tiempos: TC, 1MT, 2MT
               │
               ▼
    ┌────────────────────┐
    │   CLASSIFICATION   │  Ordena equipos por:
    │                    │  1. Puntos
    │ classification.py  │  2. Diferencia de goles
    └──────────┬─────────┘  3. Goles a favor
               │
               ▼
    ┌──────────────────────────────────────────────┐
    │           PREDICTION ENGINE                    │
    │                                                │
    │  1. Calcular Probabilidades Base               │
    │     prob_local = rend_local / total * 100      │
    │                                                │
    │  2. Calcular Factores de Ajuste (1-5)          │
    │     Basado en rendimiento porcentual           │
    │                                                │
    │  3. Aplicar Algoritmo de Decisión              │
    │     Reglas con umbrales configurables          │
    │                                                │
    │  4. Generar Doble Oportunidad                  │
    │     1X / X2 / 12                               │
    │                                                │
    │  5. Calcular Ambos Marcan                      │
    │     Basado en promedios de goles               │
    │                                                │
    │  prediction_engine.py                          │
    └───────────────────────┬──────────────────────┘
                            │
                            ▼
              ┌──────────────────────────┐
              │        PRONÓSTICO         │
              │                          │
              │  • Principal: L/E/V      │
              │  • Doble Op: 1X/X2/12    │
              │  • Ambos: SI/NO          │
              │  • Probabilidades %      │
              │  • Confianza %           │
              └────────────┬─────────────┘
                           │
                           ▼
              ┌──────────────────────────┐
              │       VALIDACIÓN          │  Post-partido
              │                          │
              │  Compara pronóstico      │
              │  vs resultado real       │
              │  → GANA / PIERDE         │
              │                          │
              │  validation.py           │
              └──────────────────────────┘
```

---

## Estructura de Módulos

### prediction_engine/

```
prediction_engine/
├── __init__.py              # Exportaciones públicas
├── config.py                # Configuración y umbrales
│   ├── TipoTiempo           # Enum: COMPLETO, PRIMER_TIEMPO, SEGUNDO_TIEMPO
│   ├── ResultadoEnum        # Enum: L, E, V
│   ├── DobleOportunidadEnum # Enum: 1X, X2, 12
│   ├── Umbrales             # Clase con constantes
│   └── Config               # Configuración general
│
├── models.py                # Modelos Pydantic
│   ├── EstadisticasEquipo   # Stats acumuladas
│   ├── Equipo               # Equipo con stats por tiempo
│   ├── Probabilidades       # L/E/V porcentajes
│   ├── PronosticoTiempo     # Pronóstico para un tiempo
│   ├── Pronostico           # Pronóstico completo
│   ├── Validacion           # Resultado post-partido
│   ├── FilaClasificacion    # Fila de tabla
│   └── TablaClasificacion   # Tabla completa
│
├── stats_builder.py         # Constructor de estadísticas
│   └── StatsBuilder
│       ├── construir_estadisticas()    # Procesa todos los partidos
│       ├── obtener_stats_equipo()      # Obtiene stats de un equipo
│       └── obtener_todos_equipos()     # Lista todos los equipos
│
├── classification.py        # Motor de clasificación
│   └── ClassificationEngine
│       ├── generar_clasificacion()     # Genera tabla ordenada
│       ├── obtener_posicion()          # Posición de un equipo
│       └── tabla_to_dict()             # Convierte a dict
│
├── prediction_engine.py     # Motor principal
│   └── PredictionEngine
│       ├── generar_pronostico()        # Genera pronóstico completo
│       ├── _calcular_probabilidades()  # Calcula L/E/V
│       ├── _calcular_factor_ajuste()   # Factor 1-5
│       ├── _aplicar_algoritmo_decision() # Decide L/E/V
│       ├── _generar_doble_oportunidad() # 1X/X2/12
│       ├── _calcular_ambos_marcan()    # SI/NO
│       └── _calcular_confianza()       # 0-100%
│
└── validation.py            # Validador
    └── ValidationEngine
        ├── validar_pronostico()        # Valida vs resultado
        └── calcular_efectividad()      # Métricas del sistema
```

---

## Esquemas de Base de Datos

### football_matches
```javascript
{
  "liga_id": "SPAIN_LA_LIGA",
  "liga_nombre": "La Liga",
  "equipo_local": "Barcelona",
  "equipo_visitante": "Real Madrid",
  "fecha": ISODate("2023-10-28T20:00:00Z"),
  "ronda": "Regular Season - 11",
  "season": 2023,
  "goles_local_TR": 2,
  "goles_visitante_TR": 1,
  "goles_local_1MT": 1,
  "goles_visitante_1MT": 0
}
```

### team_statistics
```javascript
{
  "id": "uuid",
  "nombre": "Barcelona",
  "liga_id": "SPAIN_LA_LIGA",
  "temporada": 2023,
  "stats_completo": {
    "partidos_jugados": 38,
    "victorias": 25,
    "empates": 7,
    "derrotas": 6,
    "goles_favor": 79,
    "goles_contra": 44,
    "puntos": 82,
    "pj_local": 19,
    "v_local": 15,
    // ... más campos
    "rendimiento_general": 71.93,
    "rendimiento_local": 84.21,
    "rendimiento_visita": 59.65
  },
  "stats_primer_tiempo": { ... },
  "stats_segundo_tiempo": { ... },
  "created_at": ISODate(),
  "updated_at": ISODate()
}
```

### predictions
```javascript
{
  "id": "uuid",
  "partido_id": null,
  "equipo_local": "Barcelona",
  "equipo_visitante": "Real Madrid",
  "liga_id": "SPAIN_LA_LIGA",
  "tiempo_completo": {
    "pronostico": "E",
    "doble_oportunidad": "1X",
    "ambos_marcan": "SI",
    "probabilidades": {
      "porcentaje_local": 36.88,
      "porcentaje_empate": 27.85,
      "porcentaje_visita": 35.27
    },
    "confianza": 42.54,
    "factor_local": 4,
    "factor_visita": 4
  },
  "primer_tiempo": { ... },
  "segundo_tiempo": { ... },
  "version_algoritmo": "1.0.0",
  "fecha_generacion": ISODate()
}
```

---

## Variables de Entorno

### Backend (.env)
```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=football_database
API_FOOTBALL_KEY=tu_api_key
```

### Frontend (.env)
```env
REACT_APP_BACKEND_URL=http://localhost:8001
```

---

## Consideraciones de Rendimiento

1. **Caché de Estadísticas**: Las estadísticas se calculan una vez y se guardan en `team_statistics`
2. **Índices MongoDB**: Recomendado crear índices en `liga_id`, `equipo_local`, `equipo_visitante`
3. **Procesamiento Async**: Todo el backend usa async/await para operaciones no bloqueantes

---

*Documentación Técnica v1.0 - Diciembre 2024*
