# Motor de Pronósticos PLLA 3.0

## Descripción

Módulo Python que implementa el algoritmo de pronósticos deportivos PLLA 3.0.
Convierte la lógica del Excel (526,550+ fórmulas) en código modular.

## Estructura

```
prediction_engine/
├── __init__.py          # Exportaciones públicas
├── config.py            # Umbrales y configuración
├── models.py            # Modelos Pydantic
├── stats_builder.py     # Constructor de estadísticas
├── classification.py    # Motor de clasificación
├── prediction_engine.py # Motor de pronósticos
└── validation.py        # Validador GANA/PIERDE
```

## Funcionalidades

- ✅ Estadísticas por equipo (PJ, V, E, D, GF, GC, Pts)
- ✅ Tres tiempos: Completo, 1MT, 2MT
- ✅ Tres contextos: General, Local, Visitante
- ✅ Pronóstico principal: L/E/V
- ✅ Doble oportunidad: 1X/X2/12
- ✅ Ambos marcan: SI/NO
- ✅ Validación post-partido

## Uso

```python
from prediction_engine import PredictionEngine, StatsBuilder

# Construir estadísticas
stats = StatsBuilder(db)
await stats.construir_estadisticas('SPAIN_LA_LIGA', 2023)

# Generar pronóstico
engine = PredictionEngine(db)
resultado = await engine.generar_pronostico(
    equipo_local='Barcelona',
    equipo_visitante='Real Madrid',
    liga_id='SPAIN_LA_LIGA'
)

print(resultado.tiempo_completo.pronostico)  # "E"
```

## Configuración del Algoritmo

### Umbrales (config.py)

| Parámetro | Valor | Descripción |
|-----------|-------|-------------|
| `PROB_LOCAL_MIN` | 43% | Mínimo para LOCAL |
| `PROB_LOCAL_MAX` | 69.5% | Máximo antes de favorito |
| `PROB_EMPATE_MAX` | 20% | Máximo empate |
| `UMBRAL_AMBOS_MARCAN` | 45% | Umbral SI/NO |

### Factores de Rendimiento

| Factor | Rendimiento |
|--------|-------------|
| 5 | > 80% |
| 4 | 60-80% |
| 3 | 40-60% |
| 2 | 20-40% |
| 1 | < 20% |

## API Endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/prediction/build-stats` | Construir estadísticas |
| POST | `/api/prediction/generate` | Generar pronóstico |
| GET | `/api/prediction/classification` | Clasificación |
| GET | `/api/prediction/team/{nombre}` | Stats de equipo |
| GET | `/api/prediction/teams` | Lista equipos |

---

*Ver documentación completa en `/app/README.md`*
