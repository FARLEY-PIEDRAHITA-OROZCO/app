# 🎯 Motor de Pronósticos Deportivos PLLA 3.0

## Descripción

Este módulo implementa el Motor de Pronósticos Deportivos basado en el sistema 
Excel PLLA 3.0. Convierte la lógica compleja del Excel (526,550+ fórmulas) 
en código Python modular, documentado y mantenible.

## Características

- ✅ **Estadísticas Acumuladas**: Calcula PJ, V, E, D, GF, GC, Pts por equipo
- ✅ **Tres Dimensiones Temporales**: Tiempo Completo, 1er Tiempo, 2do Tiempo
- ✅ **Contextos Separados**: General, Local, Visitante
- ✅ **Motor de Pronósticos**: Algoritmo de decisión basado en probabilidades
- ✅ **Doble Oportunidad**: 1X, X2, 12
- ✅ **Ambos Marcan**: SI/NO
- ✅ **Validación**: Compara pronósticos vs resultados reales

## Estructura del Módulo

```
prediction_engine/
├── __init__.py              # Exportaciones públicas
├── README.md                # Esta documentación
├── PLAN_IMPLEMENTACION.md   # Plan técnico detallado
├── config.py                # Configuración y umbrales
├── models.py                # Modelos Pydantic
├── stats_builder.py         # Constructor de estadísticas
├── classification.py        # Motor de clasificación
├── prediction_engine.py     # Motor de pronósticos
└── validation.py            # Validador de pronósticos
```

## Uso Rápido

### 1. Construir Estadísticas

```python
from prediction_engine import StatsBuilder

# Inicializar con conexión a MongoDB
stats_builder = StatsBuilder(db)

# Construir estadísticas para una liga
await stats_builder.construir_estadisticas(
    liga_id='SPAIN_LA_LIGA',
    temporada=2023
)
```

### 2. Generar Pronóstico

```python
from prediction_engine import PredictionEngine

engine = PredictionEngine(db)

# Generar pronóstico para un partido
pronostico = await engine.generar_pronostico(
    equipo_local='Barcelona',
    equipo_visitante='Real Madrid',
    liga_id='SPAIN_LA_LIGA'
)

print(pronostico.tiempo_completo.pronostico)  # "E"
print(pronostico.tiempo_completo.doble_oportunidad)  # "1X"
print(pronostico.tiempo_completo.ambos_marcan)  # "SI"
```

### 3. Obtener Clasificación

```python
from prediction_engine import ClassificationEngine, TipoTiempo

engine = ClassificationEngine(db)

# Clasificación de tiempo completo
tabla = await engine.generar_clasificacion(
    liga_id='SPAIN_LA_LIGA',
    temporada=2023,
    tipo_tiempo=TipoTiempo.COMPLETO
)

for fila in tabla.filas[:5]:
    print(f"{fila.posicion}. {fila.equipo}: {fila.pts} pts")
```

### 4. Validar Pronóstico

```python
from prediction_engine import ValidationEngine

validator = ValidationEngine(db)

# Validar después de que se jugó el partido
resultado = await validator.validar_pronostico(
    pronostico_id='abc123',
    gol_local_tc=2,
    gol_visita_tc=1,
    gol_local_1mt=1,
    gol_visita_1mt=0
)

print(resultado.validacion_tc.resultado_doble_oportunidad)  # "GANA"
```

## Configuración del Algoritmo

### Umbrales (config.py)

| Parámetro | Valor | Descripción |
|-----------|-------|-------------|
| `PROB_LOCAL_MIN` | 43% | Mínimo para pronosticar LOCAL |
| `PROB_LOCAL_MAX` | 69.5% | Máximo antes de "muy favorito" |
| `PROB_EMPATE_MAX` | 20% | Máximo de empate para decidir |
| `SUMA_PROB_MIN` | 116% | Mínimo para "12" (cualquiera gana) |
| `UMBRAL_AMBOS_MARCAN` | 45% | Umbral para SI/NO |

### Factores de Ajuste

| Factor | Rendimiento | Descripción |
|--------|-------------|-------------|
| 5 | > 80% | Equipo dominante |
| 4 | 60-80% | Equipo fuerte |
| 3 | 40-60% | Equipo promedio |
| 2 | 20-40% | Equipo débil |
| 1 | < 20% | Equipo muy débil |

## Flujo del Algoritmo

```
1. OBTENER ESTADÍSTICAS
   └→ Stats del equipo local (como local)
   └→ Stats del equipo visitante (como visitante)

2. CALCULAR PROBABILIDADES BASE
   └→ prob_local = rend_local / (rend_local + rend_visita) * 100
   └→ prob_visita = rend_visita / (rend_local + rend_visita) * 100
   └→ factor_empate = max(0, 30 - diferencia)

3. CALCULAR FACTORES DE AJUSTE
   └→ factor_local = f(rendimiento_local)  # 1-5
   └→ factor_visita = f(rendimiento_visita)  # 1-5

4. APLICAR ALGORITMO DE DECISIÓN
   └→ IF 43 < prob_local < 69.5 AND prob_empate < 20 → LOCAL
   └→ ELIF prob_local >= 69.5 → LOCAL
   └→ ELIF prob_local < 43 AND prob_visita > prob_local → VISITA
   └→ ELIF prob_empate >= 20 AND equipos_parejos → EMPATE
   └→ ELSE → mayor probabilidad

5. GENERAR DOBLE OPORTUNIDAD
   └→ IF suma_sin_empate > 116 → "12"
   └→ ELIF pronostico == "L" → "1X"
   └→ ELIF pronostico == "V" → "X2"

6. CALCULAR AMBOS MARCAN
   └→ prob_ambos = (avg_gf_local + avg_gc_visita) * (avg_gf_visita + avg_gc_local) / 4
   └→ IF prob_ambos > 45% → "SI"

7. CALCULAR CONFIANZA
   └→ confianza = prob_resultado + ajuste_claridad + ajuste_factor
```

## Modelos de Datos

### Pronostico
```python
{
    "id": "uuid",
    "equipo_local": "Barcelona",
    "equipo_visitante": "Real Madrid",
    "liga_id": "SPAIN_LA_LIGA",
    "tiempo_completo": {
        "pronostico": "E",         # L/E/V
        "doble_oportunidad": "1X", # 1X/X2/12
        "ambos_marcan": "SI",      # SI/NO
        "probabilidades": {
            "local": 36.88,
            "empate": 27.85,
            "visita": 35.27
        },
        "confianza": 42.54,
        "factor_local": 4,
        "factor_visita": 4
    },
    "primer_tiempo": { ... },
    "segundo_tiempo": { ... }
}
```

### EstadisticasEquipo
```python
{
    "partidos_jugados": 38,
    "victorias": 25,
    "empates": 7,
    "derrotas": 6,
    "goles_favor": 79,
    "goles_contra": 44,
    "puntos": 82,
    "pj_local": 19,
    "v_local": 15,
    "pts_local": 48,
    "pj_visita": 19,
    "v_visita": 10,
    "pts_visita": 34,
    "rendimiento_general": 71.93,
    "rendimiento_local": 84.21,
    "rendimiento_visita": 59.65
}
```

## API Endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/prediction/build-stats` | Construir estadísticas |
| GET | `/api/prediction/classification` | Tabla de posiciones |
| POST | `/api/prediction/generate` | **Generar pronóstico** |
| GET | `/api/prediction/team/{nombre}` | Stats de equipo |
| POST | `/api/prediction/validate` | Validar pronóstico |
| GET | `/api/prediction/effectiveness` | Métricas |
| GET | `/api/prediction/config` | Configuración |
| GET | `/api/prediction/teams` | Lista equipos |

## Documentación Relacionada

- [Plan de Implementación](./PLAN_IMPLEMENTACION.md) - Diseño detallado
- [Referencia de API](../../docs/API_REFERENCE.md) - Documentación completa
- [Arquitectura Técnica](../../docs/ARQUITECTURA_TECNICA.md) - Diseño del sistema

## Versión

- **Motor PLLA**: 3.0
- **Algoritmo**: v1.0.0

---

*Documentación del Motor - Diciembre 2024*
