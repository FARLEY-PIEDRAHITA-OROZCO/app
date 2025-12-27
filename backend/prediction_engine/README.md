# Motor de Pronósticos PLLA 3.0

## Descripción

Módulo Python que implementa el algoritmo de pronósticos deportivos PLLA 3.0.
Convierte la lógica del Excel (526,550+ fórmulas) en código modular y mantenible.

## Versión 3.1.0 - Novedades

- ✅ **Over/Under Goles:** Predicciones para 1.5, 2.5 y 3.5 goles
- ✅ **Goles Esperados:** Cálculo usando distribución de Poisson
- ✅ **Forma Reciente:** Análisis de últimos 5 partidos
- ✅ **Ajuste por Forma:** Probabilidades ajustadas (peso 30%)
- ✅ **Soporte season_id:** Filtrado correcto por temporada

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

## Uso Básico

### Generar Pronóstico

```python
from prediction_engine import PredictionEngine

engine = PredictionEngine(db)

# Con season_id (recomendado)
resultado = await engine.generar_pronostico(
    equipo_local='Manchester City',
    equipo_visitante='Arsenal',
    liga_id='ENGLAND_PREMIER_LEAGUE',
    season_id='ENGLAND_PREMIER_LEAGUE_2022-23'
)

# Acceder a resultados
tc = resultado.tiempo_completo
print(f"Pronóstico: {tc.pronostico}")           # "L"
print(f"Doble oportunidad: {tc.doble_oportunidad}")  # "1X"
print(f"Ambos marcan: {tc.ambos_marcan}")       # "SI"

# 🆕 Nuevos campos
print(f"Over 2.5: {tc.over_under['over_25']}")  # {"prediccion": "OVER", "probabilidad": 80.3}
print(f"Goles esperados: {tc.goles_esperados}")  # {"local": 2.1, "visitante": 1.5, "total": 3.6}

# 🆕 Forma reciente
print(f"Forma local: {resultado.forma_reciente['local']['ultimos_5']}")  # ["V","V","V","V","E"]
print(f"Racha: {resultado.forma_reciente['local']['racha']}")  # "4 victorias consecutivas"
```

### Obtener Forma Reciente

```python
from prediction_engine import StatsBuilder

stats_builder = StatsBuilder(db)

forma = await stats_builder.obtener_forma_reciente(
    nombre_equipo='Manchester City',
    liga_id='ENGLAND_PREMIER_LEAGUE',
    season_id='ENGLAND_PREMIER_LEAGUE_2022-23',
    n_partidos=5
)

# Resultado:
# {
#     "ultimos_5": ["V", "V", "V", "V", "E"],
#     "rendimiento": 86.67,
#     "goles_favor_avg": 3.8,
#     "goles_contra_avg": 0.6,
#     "racha": "4 victorias consecutivas"
# }
```

## Modelos de Datos

### PronosticoTiempo

```python
class PronosticoTiempo(BaseModel):
    pronostico: str           # "L", "E", "V"
    doble_oportunidad: str    # "1X", "X2", "12"
    ambos_marcan: str         # "SI", "NO"
    probabilidades: Dict      # {local, empate, visita}
    confianza: float          # 0-100
    
    # 🆕 Nuevos campos
    over_under: Dict[str, Any]  # over_15, over_25, over_35
    goles_esperados: Dict[str, float]  # local, visitante, total
```

### Pronostico

```python
class Pronostico(BaseModel):
    equipo_local: str
    equipo_visitante: str
    liga_id: str
    season_id: Optional[str]  # 🆕 Ahora incluido
    
    tiempo_completo: PronosticoTiempo
    primer_tiempo: PronosticoTiempo
    segundo_tiempo: PronosticoTiempo
    
    # 🆕 Forma reciente
    forma_reciente: Dict[str, Any]  # local, visitante
```

## Configuración (config.py)

### Umbrales de Pronóstico

| Parámetro | Valor | Descripción |
|-----------|-------|-------------|
| `PROB_LOCAL_MIN` | 43% | Mínimo para LOCAL |
| `PROB_LOCAL_MAX` | 69.5% | Máximo antes de "muy favorito" |
| `PROB_EMPATE_MAX` | 20% | Máximo para decidir |
| `UMBRAL_AMBOS_MARCAN` | 45% | Umbral SI/NO |

### 🆕 Nuevos Umbrales

| Parámetro | Valor | Descripción |
|-----------|-------|-------------|
| `OVER_15_UMBRAL` | 1.5 | Umbral Over 1.5 |
| `OVER_25_UMBRAL` | 2.5 | Umbral Over 2.5 |
| `OVER_35_UMBRAL` | 3.5 | Umbral Over 3.5 |
| `PESO_FORMA_RECIENTE` | 0.3 | Peso de forma (30%) |
| `PARTIDOS_FORMA_RECIENTE` | 5 | Últimos N partidos |

## Algoritmo de Over/Under

El cálculo de Over/Under usa distribución de Poisson:

```
P(X > umbral) = 1 - Σ P(X = k) para k = 0 hasta umbral

donde P(X = k) = (λ^k * e^-λ) / k!
      λ = goles esperados totales
```

## Algoritmo de Forma Reciente

1. Obtener últimos N partidos del equipo
2. Calcular resultados (V/E/D) y puntos
3. Calcular rendimiento: `puntos_obtenidos / puntos_posibles * 100`
4. Calcular racha: conteo de resultados consecutivos iguales
5. Ajustar probabilidades base con peso del 30%

---

*Ver documentación completa en `/docs/MOTOR_PRONOSTICOS.md`*
