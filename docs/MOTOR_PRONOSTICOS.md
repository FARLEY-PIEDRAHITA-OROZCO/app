# ⚙️ Motor de Pronósticos PLLA 3.0

Documentación técnica del algoritmo de pronósticos deportivos.

---

## 📋 Índice

1. [Visión General](#visión-general)
2. [Arquitectura del Motor](#arquitectura-del-motor)
3. [Algoritmo Principal](#algoritmo-principal)
4. [Histórico Consolidado](#histórico-consolidado)
5. [Cálculo de Probabilidades](#cálculo-de-probabilidades)
6. [Over/Under y Goles Esperados](#overunder-y-goles-esperados)
7. [Configuración y Umbrales](#configuración-y-umbrales)
8. [Validación y Backtesting](#validación-y-backtesting)

---

## Visión General

El Motor PLLA 3.0 (Pronósticos de Liga con Lógica Avanzada) es un sistema de predicción deportiva que combina:

- **Estadísticas de temporada**: Rendimiento, goles, puntos
- **Forma reciente**: Últimos 5 partidos
- **Histórico consolidado**: Múltiples temporadas + H2H
- **Factores contextuales**: Local/visitante, defensa, ataque

### Tipos de Pronósticos

| Tipo | Descripción | Precisión Estimada |
|------|-------------|-------------------|
| L/E/V | Victoria Local/Empate/Visitante | ~55-60% |
| Doble Oportunidad | 1X, X2, 12 | ~82-84% |
| Ambos Marcan | SI/NO | ~51% |
| Over/Under 2.5 | Más/menos de 2.5 goles | ~60-65% |
| Over/Under 1.5 | Más/menos de 1.5 goles | ~75-80% |

---

## Arquitectura del Motor

```
┌─────────────────────────────────────────────────────────────┐
│                    PredictionEngine                          │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────────────┐ │
│  │StatsBuilder │  │Classification│  │HistoricoConsolidado │ │
│  │             │  │   Engine     │  │     (NUEVO)         │ │
│  └─────────────┘  └─────────────┘  └──────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│  Métodos Principales:                                        │
│  - generar_pronostico()                                      │
│  - _calcular_probabilidades()                                │
│  - _ajustar_por_forma_reciente()                            │
│  - _ajustar_por_historico()  (NUEVO)                        │
│  - _calcular_over_under()                                   │
│  - _calcular_confianza()                                    │
└─────────────────────────────────────────────────────────────┘
```

### Módulos

| Módulo | Responsabilidad |
|--------|-----------------|
| `prediction_engine.py` | Motor principal de pronósticos |
| `stats_builder.py` | Construcción de estadísticas por equipo |
| `classification.py` | Tabla de posiciones |
| `historico_consolidado.py` | H2H y análisis multi-temporada |
| `backtesting.py` | Validación histórica |
| `models.py` | Modelos de datos Pydantic |
| `config.py` | Configuración y umbrales |

---

## Algoritmo Principal

### Flujo de Generación de Pronóstico

```
1. Obtener estadísticas de ambos equipos
         ↓
2. Obtener forma reciente (últimos 5 partidos)
         ↓
3. Obtener factores históricos (H2H + temporadas)
         ↓
4. Calcular probabilidades base
         ↓
5. Ajustar por forma reciente (+/- 10%)
         ↓
6. Ajustar por histórico H2H (+/- 20%)
         ↓
7. Aplicar factores local/visitante
         ↓
8. Determinar pronóstico (L/E/V)
         ↓
9. Calcular doble oportunidad, ambos marcan, over/under
         ↓
10. Calcular confianza final
```

### Paso 1-3: Obtención de Datos

```python
# Estadísticas del equipo
stats_local = await stats_builder.obtener_stats_equipo(
    equipo_local, liga_id, season_id
)

# Forma reciente
forma_local = await stats_builder.obtener_forma_reciente(
    equipo_local, liga_id, season_id
)

# Factores históricos (NUEVO)
factores_historicos = await historico.calcular_factor_historico(
    equipo_local, equipo_visitante, liga_id, season_id
)
```

### Paso 4: Probabilidades Base

```python
def _calcular_probabilidades(stats_local, stats_visitante):
    # Rendimiento ponderado
    rend_local = stats_local.rendimiento_general * 0.6 + \
                 stats_local.rendimiento_local * 0.4
    rend_visita = stats_visitante.rendimiento_general * 0.6 + \
                  stats_visitante.rendimiento_visita * 0.4
    
    # Factor de goles
    gf_local = stats_local.promedio_gf / max(stats_visitante.promedio_gc, 0.5)
    gf_visita = stats_visitante.promedio_gf / max(stats_local.promedio_gc, 0.5)
    
    # Probabilidades iniciales
    total = rend_local + rend_visita + 33  # 33 = factor empate
    p_local = (rend_local / total) * 100
    p_visita = (rend_visita / total) * 100
    p_empate = 100 - p_local - p_visita
    
    return Probabilidades(p_local, p_empate, p_visita)
```

### Paso 5: Ajuste por Forma Reciente

```python
def _ajustar_por_forma_reciente(probabilidades, forma_local, forma_visitante):
    # Diferencia de rendimiento en últimos 5 partidos
    diff_forma = forma_local['rendimiento'] - forma_visitante['rendimiento']
    
    # Ajuste máximo de ±10%
    ajuste = min(max(diff_forma / 10, -10), 10)
    
    p_local = probabilidades.local + ajuste
    p_visita = probabilidades.visita - ajuste
    p_empate = 100 - p_local - p_visita
    
    return Probabilidades(p_local, p_empate, p_visita)
```

### Paso 6: Ajuste por Histórico (NUEVO)

```python
def _ajustar_por_historico(probabilidades, factores_historicos):
    h2h = factores_historicos.get('h2h', {})
    
    if h2h.get('tiene_historial') and h2h.get('total_partidos', 0) >= 3:
        # Peso del H2H: 20%
        peso_h2h = 0.20
        
        # Mezclar probabilidades actuales con H2H
        p_local = p_local * (1 - peso_h2h) + h2h['porcentaje_eq1'] * peso_h2h
        p_visita = p_visita * (1 - peso_h2h) + h2h['porcentaje_eq2'] * peso_h2h
        p_empate = p_empate * (1 - peso_h2h) + h2h['porcentaje_empate'] * peso_h2h
    
    # Aplicar factores de temporadas históricas
    p_local *= factores_historicos.get('factor_local', 1.0)
    p_visita *= factores_historicos.get('factor_visita', 1.0)
    
    # Normalizar
    total = p_local + p_empate + p_visita
    return Probabilidades(
        p_local / total * 100,
        p_empate / total * 100,
        p_visita / total * 100
    )
```

---

## Histórico Consolidado

### Módulo: historico_consolidado.py

Este módulo permite que el motor use datos de múltiples temporadas y enfrentamientos directos.

### H2H (Head to Head)

```python
async def obtener_h2h(equipo1, equipo2, liga_id=None, limite=10):
    """
    Analiza enfrentamientos directos entre dos equipos.
    
    Retorna:
    - victorias de cada equipo
    - empates
    - porcentajes
    - promedio de goles
    - tendencia
    """
    partidos = await db.football_matches.find({
        "$or": [
            {"equipo_local": equipo1, "equipo_visitante": equipo2},
            {"equipo_local": equipo2, "equipo_visitante": equipo1}
        ],
        "estado_del_partido": "Match Finished"
    }).limit(limite)
    
    # Analizar resultados...
```

### Estadísticas Multi-Temporada

```python
async def obtener_stats_historicas(equipo, liga_id, temporadas=3):
    """
    Obtiene estadísticas ponderadas de múltiples temporadas.
    
    Pesos:
    - Temporada actual: 70%
    - Temporadas anteriores: 30% (distribuido)
    """
    # Obtener temporadas disponibles
    seasons = await obtener_temporadas_disponibles(liga_id, equipo)
    
    # Calcular pesos: [0.70, 0.18, 0.12] para 3 temporadas
    pesos = _calcular_pesos(len(seasons))
    
    # Ponderar estadísticas
    stats_ponderadas = {}
    for i, season in enumerate(seasons):
        for campo in campos_numericos:
            stats_ponderadas[campo] += stats[campo] * pesos[i]
    
    return stats_ponderadas
```

### Tendencias H2H

| Tipo | Condición | Descripción |
|------|-----------|-------------|
| `dominante` | V1 > V2 + E | Un equipo domina claramente |
| `equilibrado` | E >= V1 y E >= V2 | Muchos empates |
| `parejo` | V1 ≈ V2 | Historial dividido |

---

## Cálculo de Probabilidades

### Fórmula de Probabilidad Base

```
P(Local) = (Rend_Local × 0.6 + Rend_Local_Casa × 0.4) / Total
P(Visita) = (Rend_Visita × 0.6 + Rend_Visita_Fuera × 0.4) / Total
P(Empate) = Factor_Empate / Total

Donde:
- Total = P(L) + P(V) + Factor_Empate
- Factor_Empate = 33 (constante base)
```

### Factores de Ajuste

| Factor | Peso | Descripción |
|--------|------|-------------|
| Rendimiento General | 60% | Puntos / Puntos posibles |
| Rendimiento Local/Visita | 40% | Solo como local o visitante |
| Forma Reciente | ±10% | Últimos 5 partidos |
| H2H | ±20% | Enfrentamientos directos |
| Histórico Multi-temp | ±5% | Temporadas anteriores |

### Doble Oportunidad

```python
def _generar_doble_oportunidad(pronostico, probabilidades):
    p_local = probabilidades.local
    p_empate = probabilidades.empate
    p_visita = probabilidades.visita
    
    # Calcular combinaciones
    p_1x = p_local + p_empate  # Local no pierde
    p_x2 = p_empate + p_visita  # Visitante no pierde
    p_12 = p_local + p_visita   # No empate
    
    # Seleccionar la más probable
    if pronostico == 'L':
        return '1X'
    elif pronostico == 'V':
        return 'X2'
    else:
        # Si es empate, elegir el equipo más fuerte
        return '1X' if p_local > p_visita else 'X2'
```

---

## Over/Under y Goles Esperados

### Cálculo de Goles Esperados

```python
def _calcular_goles_esperados(stats_local, stats_visitante, forma_local, forma_visitante):
    # Promedio de goles de cada equipo
    gf_local_base = stats_local.promedio_gf
    gf_visita_base = stats_visitante.promedio_gf
    
    # Ajuste por defensa rival
    factor_def_local = 1 / max(stats_local.promedio_gc, 0.5)
    factor_def_visita = 1 / max(stats_visitante.promedio_gc, 0.5)
    
    # Goles esperados
    ge_local = gf_local_base * factor_def_visita * 0.5 + gf_local_base * 0.5
    ge_visita = gf_visita_base * factor_def_local * 0.4 + gf_visita_base * 0.6
    
    # Ajuste por forma reciente
    if forma_local and forma_visitante:
        ge_local *= (1 + (forma_local['goles_favor_avg'] - 1.5) * 0.1)
        ge_visita *= (1 + (forma_visitante['goles_favor_avg'] - 1.5) * 0.1)
    
    return {
        'local': round(ge_local, 2),
        'visitante': round(ge_visita, 2),
        'total': round(ge_local + ge_visita, 2)
    }
```

### Probabilidades Over/Under

```python
def _calcular_over_under(goles_esperados):
    total = goles_esperados['total']
    
    # Distribución de Poisson simplificada
    over_15 = min(95, max(5, 50 + (total - 2.0) * 25))
    over_25 = min(90, max(10, 50 + (total - 2.5) * 20))
    over_35 = min(85, max(15, 50 + (total - 3.0) * 15))
    
    return {
        'over_15': {
            'prediccion': 'OVER' if over_15 > 50 else 'UNDER',
            'probabilidad': over_15 if over_15 > 50 else 100 - over_15
        },
        'over_25': {
            'prediccion': 'OVER' if over_25 > 50 else 'UNDER',
            'probabilidad': over_25 if over_25 > 50 else 100 - over_25
        },
        'over_35': {
            'prediccion': 'OVER' if over_35 > 50 else 'UNDER',
            'probabilidad': over_35 if over_35 > 50 else 100 - over_35
        }
    }
```

---

## Configuración y Umbrales

### Archivo: config.py

```python
class Config:
    """Configuración general del motor."""
    VERSION = "3.0.0"
    MIN_PARTIDOS_STATS = 5  # Mínimo de partidos para estadísticas
    MAX_TEMPORADAS_HISTORICO = 3  # Temporadas a considerar

class Umbrales:
    """Umbrales para decisiones."""
    # Confianza
    CONFIANZA_ALTA = 70.0
    CONFIANZA_MEDIA = 50.0
    CONFIANZA_BAJA = 30.0
    
    # Diferencias mínimas para pronóstico
    DIFF_MINIMA_PRONOSTICO = 5.0  # % mínimo de diferencia L vs V
    DIFF_EMPATE = 10.0  # Si diferencia < 10%, considerar empate
    
    # Pesos del algoritmo
    PESO_RENDIMIENTO = 0.35
    PESO_GOLES = 0.25
    PESO_FORMA = 0.20
    PESO_LOCAL = 0.15
    PESO_H2H = 0.05
    
    # Pesos históricos
    PESO_TEMPORADA_ACTUAL = 0.70
    PESO_HISTORICO = 0.30
    
    # Over/Under
    UMBRAL_OVER_15 = 2.0
    UMBRAL_OVER_25 = 2.5
    UMBRAL_OVER_35 = 3.0
```

---

## Validación y Backtesting

### Proceso de Backtesting

```python
async def ejecutar_backtesting(season_id, limite=100):
    """
    Evalúa la precisión del motor contra resultados reales.
    """
    partidos = await db.football_matches.find({
        "season_id": season_id,
        "estado_del_partido": "Match Finished"
    }).limit(limite)
    
    resultados = {
        'pronostico_principal': {'aciertos': 0, 'total': 0},
        'doble_oportunidad': {'aciertos': 0, 'total': 0},
        'over_25': {'aciertos': 0, 'total': 0},
        # ...
    }
    
    for partido in partidos:
        # Generar pronóstico
        pronostico = await prediction_engine.generar_pronostico(...)
        
        # Comparar con resultado real
        resultado_real = determinar_resultado(
            partido['goles_local_TR'],
            partido['goles_visitante_TR']
        )
        
        # Evaluar aciertos
        if pronostico.tiempo_completo.pronostico == resultado_real:
            resultados['pronostico_principal']['aciertos'] += 1
        
        # Evaluar doble oportunidad
        if evaluar_doble_oportunidad(pronostico, resultado_real):
            resultados['doble_oportunidad']['aciertos'] += 1
        
        # ...
    
    return calcular_porcentajes(resultados)
```

### Métricas de Evaluación

| Métrica | Cálculo | Objetivo |
|---------|---------|----------|
| Precisión L/E/V | Aciertos / Total | >55% |
| Precisión D.Op | Aciertos / Total | >80% |
| ROI | (Ganancia - Apuestas) / Apuestas | >15% |
| Calibración | Diferencia predicción vs realidad | <5% |

---

## Ejemplos de Uso

### Generar Pronóstico Simple

```python
from prediction_engine import PredictionEngine

engine = PredictionEngine(db)

pronostico = await engine.generar_pronostico(
    equipo_local="Real Madrid",
    equipo_visitante="Barcelona",
    liga_id="SPAIN_LA_LIGA",
    season_id="SPAIN_LA_LIGA_2023-24"
)

print(f"Pronóstico: {pronostico.tiempo_completo.pronostico}")
print(f"Confianza: {pronostico.tiempo_completo.confianza}%")
print(f"H2H: {pronostico.h2h}")
```

### Obtener H2H

```python
from prediction_engine import HistoricoConsolidado

historico = HistoricoConsolidado(db)

h2h = await historico.obtener_h2h(
    equipo1="Real Madrid",
    equipo2="Barcelona",
    liga_id="SPAIN_LA_LIGA",
    limite=10
)

print(f"Partidos: {h2h['total_partidos']}")
print(f"Tendencia: {h2h['tendencia']['descripcion']}")
```

### Ejecutar Backtesting

```python
from prediction_engine import BacktestingEngine

backtesting = BacktestingEngine(db)

resultados = await backtesting.ejecutar_backtesting(
    season_id="SPAIN_LA_LIGA_2023-24",
    limite=380
)

print(f"Precisión L/E/V: {resultados['pronostico_principal']['porcentaje']}%")
print(f"Precisión D.Op: {resultados['doble_oportunidad']['porcentaje']}%")
```

---

## Historial de Versiones

| Versión | Fecha | Cambios |
|---------|-------|---------|
| 3.0.0 | Dic 2024 | + Histórico consolidado (H2H + multi-temporada) |
| 2.5.0 | Dic 2024 | + Over/Under, Ambos Marcan, Forma Reciente |
| 2.0.0 | Nov 2024 | + Multi-liga, Multi-temporada |
| 1.0.0 | Oct 2024 | Versión inicial |
