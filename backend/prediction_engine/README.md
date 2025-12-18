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

## Instalación

El módulo ya está integrado en el backend. No requiere instalación adicional.

```bash
# Dependencias ya incluidas en requirements.txt
pip install -r requirements.txt
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

print(pronostico)
# {
#   "tiempo_completo": {
#     "pronostico": "L",
#     "doble_oportunidad": "1X",
#     "ambos_marcan": "SI",
#     "probabilidades": {"local": 55.3, "empate": 23.1, "visita": 21.6}
#   },
#   "primer_tiempo": { ... },
#   "segundo_tiempo": { ... }
# }
```

### 3. Validar Pronóstico

```python
from prediction_engine import ValidationEngine

validator = ValidationEngine(db)

# Validar después de que se jugó el partido
resultado = await validator.validar_pronostico(
    pronostico_id='abc123',
    gol_local=2,
    gol_visita=1
)

print(resultado)
# {
#   "doble_oportunidad": "GANA",  # El pronóstico acertó
#   "ambos_marcan": "GANA"
# }
```

## API Endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/pronostico` | Genera pronóstico para un partido |
| GET | `/api/clasificacion?liga_id=X&tipo=completo` | Obtiene tabla de posiciones |
| GET | `/api/equipos/{nombre}/stats` | Estadísticas de un equipo |
| POST | `/api/validar` | Valida pronóstico tras resultado |
| GET | `/api/efectividad` | Métricas de efectividad del sistema |

## Estructura del Módulo

```
prediction_engine/
├── __init__.py          # Exportaciones principales
├── README.md            # Esta documentación
├── PLAN_IMPLEMENTACION.md # Plan técnico detallado
├── models.py            # Modelos Pydantic
├── config.py            # Configuración y umbrales
├── stats_builder.py     # Constructor de estadísticas
├── classification.py    # Motor de clasificación
├── prediction_engine.py # Motor de pronósticos
└── validation.py        # Validador de pronósticos
```

## Umbrales del Algoritmo

Estos valores fueron calibrados en el Excel original:

| Parámetro | Valor | Descripción |
|-----------|-------|-------------|
| PROB_LOCAL_MIN | 43% | Mínimo para pronosticar LOCAL |
| PROB_LOCAL_MAX | 69.5% | Máximo antes de "muy favorito" |
| PROB_EMPATE_MAX | 20% | Máximo de empate para decidir |
| SUMA_PROB_MIN | 116% | Mínimo para "12" (cualquiera gana) |
| UMBRAL_AMBOS_MARCAN | 45% | Probabilidad para SI/NO |

## Flujo de Datos

```
Partidos (MongoDB)
       │
       ▼
StatsBuilder → Estadísticas por equipo
       │
       ▼
ClassificationEngine → Tablas de posiciones
       │
       ▼
PredictionEngine → Pronósticos
       │
       ▼
ValidationEngine → GANA/PIERDE
```

## Comparación con Excel

Para validar que el código produce los mismos resultados que el Excel:

1. Exportar datos del Excel a CSV
2. Cargar en MongoDB
3. Ejecutar el motor
4. Comparar resultados

```python
# Script de comparación (ejemplo)
for partido in partidos_test:
    pronostico_python = engine.generar_pronostico(partido)
    pronostico_excel = obtener_de_excel(partido)
    
    assert pronostico_python == pronostico_excel, f"Diferencia en {partido}"
```

## Contribuir

Para modificar el algoritmo:

1. Revisar `PLAN_IMPLEMENTACION.md` para entender la lógica
2. Modificar el archivo correspondiente
3. Actualizar tests
4. Documentar cambios

## Licencia

Proyecto privado - PLLA 3.0

---

*Documentación generada: Diciembre 2024*
