# Motor de Pronósticos PLLA 3.0

## Descripción

Módulo Python que implementa el algoritmo de pronósticos deportivos PLLA 3.0.
Convierte la lógica del Excel (526,550+ fórmulas) en código modular y mantenible.

## Estructura

```
prediction_engine/
├── __init__.py           # Exportaciones públicas
├── config.py             # Umbrales y configuración
├── models.py             # Modelos Pydantic
├── stats_builder.py      # Constructor de estadísticas
├── classification.py     # Motor de clasificación
├── prediction_engine.py  # Motor de pronósticos
└── validation.py         # Validador GANA/PIERDE
```

## Funcionalidades

- ✅ Estadísticas por equipo (PJ, V, E, D, GF, GC, Pts)
- ✅ Tres tiempos: Completo (TC), 1er Tiempo (1MT), 2do Tiempo (2MT)
- ✅ Tres contextos: General, Local, Visitante
- ✅ Pronóstico principal: L/E/V
- ✅ Doble oportunidad: 1X/X2/12
- ✅ Ambos marcan: SI/NO
- ✅ Validación post-partido
- ✅ **Soporte completo de `season_id`**

## Uso

### Construcción de Estadísticas

```python
from prediction_engine import StatsBuilder

stats_builder = StatsBuilder(db)

# Con season_id (recomendado)
equipos = await stats_builder.construir_estadisticas(
    season_id='SPAIN_LA_LIGA_2023-24'
)

# Legacy (compatible)
equipos = await stats_builder.construir_estadisticas(
    liga_id='SPAIN_LA_LIGA',
    temporada=2023
)
```

### Generación de Pronósticos

```python
from prediction_engine import PredictionEngine

engine = PredictionEngine(db)

# Con season_id
resultado = await engine.generar_pronostico(
    equipo_local='Barcelona',
    equipo_visitante='Real Madrid',
    season_id='SPAIN_LA_LIGA_2023-24'
)

print(resultado.tiempo_completo.pronostico)  # "E"
print(resultado.tiempo_completo.doble_oportunidad)  # "1X"
print(resultado.tiempo_completo.ambos_marcan)  # "SI"
```

### Clasificación

```python
from prediction_engine import ClassificationEngine

classification = ClassificationEngine(db)

# Obtener tabla de posiciones
tabla = await classification.obtener_clasificacion(
    season_id='SPAIN_LA_LIGA_2023-24',
    tipo_tiempo='completo'  # 'completo' | 'primer_tiempo' | 'segundo_tiempo'
)

for equipo in tabla:
    print(f"{equipo.posicion}. {equipo.nombre} - {equipo.pts} pts")
```

## Modelos de Datos

### Equipo

```python
class Equipo(BaseModel):
    id: str
    nombre: str
    liga_id: str
    temporada: int
    season_id: Optional[str]  # ID de temporada estructurado
    stats_completo: EstadisticasEquipo
    stats_primer_tiempo: EstadisticasEquipo
    stats_segundo_tiempo: EstadisticasEquipo
```

### EstadisticasEquipo

```python
class EstadisticasEquipo(BaseModel):
    # General
    partidos_jugados: int
    victorias: int
    empates: int
    derrotas: int
    goles_favor: int
    goles_contra: int
    puntos: int
    rendimiento_general: float
    
    # Como Local
    pj_local: int
    v_local: int
    e_local: int
    d_local: int
    gf_local: int
    gc_local: int
    pts_local: int
    rendimiento_local: float
    
    # Como Visitante
    pj_visitante: int
    v_visitante: int
    e_visitante: int
    d_visitante: int
    gf_visitante: int
    gc_visitante: int
    pts_visitante: int
    rendimiento_visitante: float
```

### Pronostico

```python
class Pronostico(BaseModel):
    equipo_local: str
    equipo_visitante: str
    season_id: Optional[str]
    tiempo_completo: PronosticoTiempo
    primer_tiempo: PronosticoTiempo
    segundo_tiempo: PronosticoTiempo

class PronosticoTiempo(BaseModel):
    pronostico: str  # "L", "E", "V"
    doble_oportunidad: str  # "1X", "X2", "12"
    ambos_marcan: str  # "SI", "NO"
    probabilidades: Dict[str, float]  # {local, empate, visita}
    confianza: float  # 0-100
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

### Factores de Rendimiento

| Factor | Rendimiento | Descripción |
|--------|-------------|-------------|
| 5 | > 80% | Equipo dominante |
| 4 | 60-80% | Equipo fuerte |
| 3 | 40-60% | Equipo promedio |
| 2 | 20-40% | Equipo débil |
| 1 | < 20% | Equipo muy débil |

## API Endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/prediction/build-stats` | Construir estadísticas (acepta `season_id`) |
| POST | `/api/prediction/generate` | Generar pronóstico (acepta `season_id`) |
| GET | `/api/prediction/classification?season_id=X` | Clasificación por temporada |
| GET | `/api/prediction/team/{nombre}?season_id=X` | Stats de equipo |
| GET | `/api/prediction/teams?season_id=X` | Lista equipos |
| POST | `/api/prediction/validate` | Validar pronóstico |
| GET | `/api/prediction/effectiveness` | Métricas del sistema |
| GET | `/api/prediction/config` | Configuración actual |

## Flujo del Algoritmo

```
┌─────────────────────────────────────────────────────────────────┐
│                    FLUJO DEL PRONÓSTICO                          │
└─────────────────────────────────────────────────────────────────┘

     ┌──────────────┐
     │   PARTIDOS   │  ← Filtrados por season_id
     │  (MongoDB)   │
     └──────┬───────┘
            │
            ▼
┌───────────────────────┐
│   STATS BUILDER       │  ← Construye stats por equipo
│   (stats_builder.py)  │     PJ, V, E, D, GF, GC, Pts
└───────────┬───────────┘
            │
            ▼
┌───────────────────────┐
│   PREDICTION ENGINE   │  ← Genera pronósticos
│   (prediction_engine) │
│                       │
│   1. Probabilidad     │  ← Calcula L/E/V %
│   2. Factores (1-5)   │  ← Ajuste por rendimiento
│   3. Decisión         │  ← Aplica reglas
│   4. Doble Oport.     │  ← 1X/X2/12
│   5. Ambos Marcan     │  ← SI/NO
│   6. Confianza        │  ← 0-100%
│                       │
└───────────┬───────────┘
            │
            ▼
┌───────────────────────┐
│   VALIDATION ENGINE   │  ← Compara con resultados
│   (validation.py)     │     GANA/PIERDE
└───────────────────────┘
```

## Compatibilidad

El módulo mantiene compatibilidad hacia atrás:

```python
# Nuevo (recomendado)
await stats_builder.construir_estadisticas(season_id='SPAIN_LA_LIGA_2023-24')

# Legacy (sigue funcionando)
await stats_builder.construir_estadisticas(liga_id='SPAIN_LA_LIGA', temporada=2023)
```

Internamente, si se pasa `liga_id` y `temporada`, se construye el `season_id` automáticamente.

---

*Ver documentación técnica completa en `/docs/MOTOR_PRONOSTICOS.md`*