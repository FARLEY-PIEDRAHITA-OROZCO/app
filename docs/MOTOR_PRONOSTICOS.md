# 🎯 Motor de Pronósticos PLLA 3.0 - Documentación Técnica Completa

> **Versión:** 3.0.1 | **Última actualización:** Diciembre 2024

## Índice

1. [Visión General](#1-visión-general)
2. [Flujo del Algoritmo](#2-flujo-del-algoritmo)
3. [Fase 1: Construcción de Estadísticas](#3-fase-1-construcción-de-estadísticas)
4. [Fase 2: Cálculo de Probabilidades](#4-fase-2-cálculo-de-probabilidades)
5. [Fase 3: Factores de Ajuste](#5-fase-3-factores-de-ajuste)
6. [Fase 4: Algoritmo de Decisión](#6-fase-4-algoritmo-de-decisión)
7. [Fase 5: Doble Oportunidad](#7-fase-5-doble-oportunidad)
8. [Fase 6: Ambos Marcan](#8-fase-6-ambos-marcan)
9. [Fase 7: Cálculo de Confianza](#9-fase-7-cálculo-de-confianza)
10. [Sistema de Validación](#10-sistema-de-validación)
11. [Métricas de Calidad](#11-métricas-de-calidad)
12. [Cómo Mejorar el Sistema](#12-cómo-mejorar-el-sistema)
13. [Umbrales Configurables](#13-umbrales-configurables)
14. [Sistema de Temporadas (season_id)](#14-sistema-de-temporadas-season_id)

---

## 1. Visión General

### ¿Qué es PLLA 3.0?

El Motor PLLA 3.0 es un sistema de pronósticos deportivos que analiza estadísticas históricas de equipos de fútbol para predecir resultados de partidos. El sistema genera tres tipos de pronósticos:

| Tipo | Descripción | Valores Posibles |
|------|-------------|------------------|
| **Pronóstico Principal** | Resultado más probable | L (Local), E (Empate), V (Visita) |
| **Doble Oportunidad** | Apuesta que cubre 2 resultados | 1X, X2, 12 |
| **Ambos Marcan** | Si ambos equipos anotarán | SI, NO |

### Arquitectura del Motor

```
┌─────────────────────────────────────────────────────────────────┐
│                    FLUJO DEL PRONÓSTICO                          │
└─────────────────────────────────────────────────────────────────┘

     ┌──────────────┐
     │   PARTIDOS   │  ← Base de datos histórica
     │  (MongoDB)   │
     └──────┬───────┘
            │
            ▼
┌───────────────────────┐
│   STATS BUILDER       │  ← Construye estadísticas por equipo
│   (stats_builder.py)  │     PJ, V, E, D, GF, GC, Pts
└───────────┬───────────┘
            │
            ▼
┌───────────────────────┐
│   PREDICTION ENGINE   │  ← Genera pronósticos
│   (prediction_engine) │
│                       │
│   ┌─────────────────┐ │
│   │ 1. Probabilidad │ │  ← Calcula L/E/V %
│   │ 2. Factores     │ │  ← Ajuste 1-5
│   │ 3. Decisión     │ │  ← Aplica reglas
│   │ 4. Doble Oport. │ │  ← 1X/X2/12
│   │ 5. Ambos Marcan │ │  ← SI/NO
│   │ 6. Confianza    │ │  ← 0-100%
│   └─────────────────┘ │
└───────────┬───────────┘
            │
            ▼
┌───────────────────────┐
│   VALIDATION ENGINE   │  ← Compara con resultados reales
│   (validation.py)     │     GANA/PIERDE
└───────────────────────┘
```

---

## 2. Flujo del Algoritmo

El motor ejecuta estos pasos en secuencia para cada pronóstico:

```
ENTRADA: Equipo Local + Equipo Visitante
                    │
                    ▼
┌─────────────────────────────────────┐
│ PASO 1: Obtener Estadísticas        │
│ - Stats del local COMO LOCAL        │
│ - Stats del visitante COMO VISITANTE│
└─────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────┐
│ PASO 2: Calcular Probabilidades     │
│ prob_local = rend_L / (rend_L+rend_V)│
│ factor_empate = 30 - diferencia     │
└─────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────┐
│ PASO 3: Calcular Factores (1-5)     │
│ factor = f(rendimiento %)           │
└─────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────┐
│ PASO 4: Aplicar Algoritmo Decisión  │
│ - Reglas de umbrales                │
│ - Ajustes por factores              │
└─────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────┐
│ PASO 5: Generar Doble Oportunidad   │
│ - Si empate improbable → 12         │
│ - Si local → 1X                     │
│ - Si visita → X2                    │
└─────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────┐
│ PASO 6: Calcular Ambos Marcan       │
│ prob = (ataque + defensa_rival) / 2 │
│ Si prob > 45% → SI                  │
└─────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────┐
│ PASO 7: Calcular Confianza          │
│ confianza = base + claridad + factor│
└─────────────────────────────────────┘
                    │
                    ▼
SALIDA: Pronóstico completo (TC, 1MT, 2MT)
```

---

## 3. Fase 1: Construcción de Estadísticas

### Origen de los Datos

Los datos provienen de partidos históricos almacenados en MongoDB con esta estructura:

```json
{
  "liga_id": "SPAIN_LA_LIGA",
  "equipo_local": "Barcelona",
  "equipo_visitante": "Real Madrid",
  "fecha": "2023-10-28",
  "goles_local_TR": 2,      // Tiempo Reglamentario (90 min)
  "goles_visitante_TR": 1,
  "goles_local_1MT": 1,     // Primer Tiempo (45 min)
  "goles_visitante_1MT": 0
}
```

### Estadísticas Calculadas por Equipo

Para cada equipo, el sistema calcula estas métricas separadas por contexto:

| Estadística | Descripción | Fórmula |
|-------------|-------------|---------|
| **PJ** | Partidos Jugados | Suma de partidos |
| **V** | Victorias | Partidos donde GF > GC |
| **E** | Empates | Partidos donde GF = GC |
| **D** | Derrotas | Partidos donde GF < GC |
| **GF** | Goles a Favor | Suma de goles marcados |
| **GC** | Goles en Contra | Suma de goles recibidos |
| **DIF** | Diferencia | GF - GC |
| **PTS** | Puntos | V×3 + E×1 |
| **Rendimiento** | % de puntos obtenidos | (PTS / PTS_posibles) × 100 |

### Contextos de Análisis

El sistema mantiene estadísticas separadas:

```
EQUIPO "Barcelona"
├── GENERAL (todos los partidos)
│   ├── PJ, V, E, D, GF, GC, PTS
│   └── Rendimiento General: 71.93%
│
├── COMO LOCAL (partidos en casa)
│   ├── PJ_L, V_L, E_L, D_L, GF_L, GC_L, PTS_L
│   └── Rendimiento Local: 84.21%
│
└── COMO VISITANTE (partidos fuera)
    ├── PJ_V, V_V, E_V, D_V, GF_V, GC_V, PTS_V
    └── Rendimiento Visitante: 59.65%
```

### Tiempos de Análisis

Las estadísticas se calculan para tres periodos:

| Tiempo | Descripción | Goles Usados |
|--------|-------------|--------------|
| **TC** | Tiempo Completo (90 min) | goles_TR |
| **1MT** | Primer Tiempo (0-45 min) | goles_1MT |
| **2MT** | Segundo Tiempo (45-90 min) | goles_TR - goles_1MT |

---

## 4. Fase 2: Cálculo de Probabilidades

### Concepto

Las probabilidades base se calculan comparando el **rendimiento del local jugando en casa** vs el **rendimiento del visitante jugando fuera**.

### Fórmulas

```python
# Rendimientos específicos por contexto
rend_local = stats_local.rendimiento_local      # Ej: 84.21%
rend_visita = stats_visitante.rendimiento_visita # Ej: 59.65%

# Suma total para normalización
total = rend_local + rend_visita  # Ej: 143.86

# Probabilidades base (sin empate)
prob_local_base = (rend_local / total) × 100   # Ej: 58.53%
prob_visita_base = (rend_visita / total) × 100 # Ej: 41.47%

# Factor de empate (equipos parejos = más empate)
diferencia = |prob_local_base - prob_visita_base|  # Ej: 17.06
factor_empate = max(0, 30 - diferencia)            # Ej: 12.94%

# Redistribución final
prob_empate = factor_empate
resto = 100 - factor_empate
prob_local = prob_local_base × resto / 100
prob_visita = prob_visita_base × resto / 100

# Normalización a 100%
suma = prob_local + prob_empate + prob_visita
prob_local = prob_local / suma × 100
prob_empate = prob_empate / suma × 100
prob_visita = prob_visita / suma × 100
```

### Ejemplo Práctico

```
Barcelona (Local) vs Real Madrid (Visita)
-----------------------------------------
Rendimiento Barcelona como LOCAL:  84.21%
Rendimiento Real Madrid como VISITA: 77.19%

Total: 161.40
Prob Local Base: 52.18%
Prob Visita Base: 47.82%
Diferencia: 4.36

Factor Empate: max(0, 30 - 4.36) = 25.64%

Probabilidades Finales (normalizadas):
- Local: 36.88%
- Empate: 27.85%
- Visita: 35.27%
```

---

## 5. Fase 3: Factores de Ajuste

### Concepto

El factor de ajuste (1-5) representa la "fuerza" del equipo basándose en su rendimiento histórico. Un factor más alto indica un equipo más dominante.

### Tabla de Factores

| Factor | Rendimiento | Descripción | Ejemplo |
|--------|-------------|-------------|---------|
| **5** | > 80% | Equipo dominante | Real Madrid 2023 (83.33%) |
| **4** | 60-80% | Equipo fuerte | Barcelona 2023 (71.93%) |
| **3** | 40-60% | Equipo promedio | Sevilla 2023 (52.63%) |
| **2** | 20-40% | Equipo débil | Cádiz 2023 (32.89%) |
| **1** | < 20% | Equipo muy débil | Almería 2023 (19.74%) |

### Aplicación del Factor

```python
# El factor modifica las probabilidades
ajuste_local = (factor_local - 3) × 2   # Rango: -4 a +4
ajuste_visita = (factor_visita - 3) × 2

prob_local_ajustado = prob_local + ajuste_local
prob_visita_ajustado = prob_visita + ajuste_visita
```

### Ejemplo

```
Factor Local: 4 (Barcelona, rendimiento 71.93%)
Factor Visita: 5 (Real Madrid, rendimiento 83.33%)

Ajuste Local: (4-3) × 2 = +2
Ajuste Visita: (5-3) × 2 = +4

Prob Local Original: 36.88% → Ajustada: 38.88%
Prob Visita Original: 35.27% → Ajustada: 39.27%
```

---

## 6. Fase 4: Algoritmo de Decisión

### Reglas de Decisión

El algoritmo aplica estas reglas en orden de prioridad:

```
┌─────────────────────────────────────────────────────────────┐
│ REGLA 1: LOCAL CLARO FAVORITO                               │
│ SI: 43% < prob_local_ajustado < 69.5%                       │
│ Y:  prob_empate < 20%                                       │
│ ENTONCES: Pronóstico = LOCAL                                │
└─────────────────────────────────────────────────────────────┘
                            │ NO
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ REGLA 2: LOCAL MUY FAVORITO                                 │
│ SI: prob_local_ajustado >= 69.5%                            │
│ ENTONCES: Pronóstico = LOCAL                                │
└─────────────────────────────────────────────────────────────┘
                            │ NO
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ REGLA 3: VISITA FAVORITO                                    │
│ SI: prob_local_ajustado < 43%                               │
│ Y:  prob_visita_ajustado > prob_local_ajustado              │
│ ENTONCES: Pronóstico = VISITA                               │
└─────────────────────────────────────────────────────────────┘
                            │ NO
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ REGLA 4: EMPATE PROBABLE                                    │
│ SI: prob_empate >= 20%                                      │
│ Y:  |prob_local - prob_visita| < 10%                        │
│ ENTONCES: Pronóstico = EMPATE                               │
└─────────────────────────────────────────────────────────────┘
                            │ NO
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ REGLA 5: MAYOR PROBABILIDAD (DEFAULT)                       │
│ ENTONCES: Pronóstico = max(prob_local, prob_empate, prob_v) │
└─────────────────────────────────────────────────────────────┘
```

### Umbrales Clave

| Umbral | Valor | Propósito |
|--------|-------|-----------|
| `PROB_LOCAL_MIN` | 43% | Mínimo para considerar local favorito |
| `PROB_LOCAL_MAX` | 69.5% | Máximo del rango "óptimo" |
| `PROB_EMPATE_MAX` | 20% | Máximo para decidir ganador claro |
| `DIFERENCIA_EMPATE` | 10% | Diferencia máxima para considerar empate |

---

## 7. Fase 5: Doble Oportunidad

### Concepto

La doble oportunidad es una apuesta que cubre 2 de los 3 posibles resultados:

| Código | Significado | Cubre |
|--------|-------------|-------|
| **1X** | Local o Empate | L ✓, E ✓, V ✗ |
| **X2** | Empate o Visita | L ✗, E ✓, V ✓ |
| **12** | Local o Visita | L ✓, E ✗, V ✓ |

### Lógica de Asignación

```python
# Suma de probabilidades sin empate
suma_sin_empate = prob_local + prob_visita

# REGLA 1: Empate muy improbable
if suma_sin_empate > 116%:
    doble_oportunidad = "12"  # Cualquiera gana

# REGLA 2: Basarse en pronóstico principal
elif pronostico == "L":
    doble_oportunidad = "1X"  # Local o empate

elif pronostico == "V":
    doble_oportunidad = "X2"  # Visita o empate

else:  # Empate
    # Cubrir con el segundo favorito
    if prob_local > prob_visita:
        doble_oportunidad = "1X"
    else:
        doble_oportunidad = "X2"
```

---

## 8. Fase 6: Ambos Marcan

### Concepto

Predice si ambos equipos anotarán al menos un gol durante el partido.

### Fórmula

```python
# Promedios de goles del LOCAL jugando en casa
avg_gf_local = goles_favor_local / partidos_local  # Capacidad ofensiva
avg_gc_local = goles_contra_local / partidos_local # Debilidad defensiva

# Promedios de goles del VISITANTE jugando fuera
avg_gf_visita = goles_favor_visita / partidos_visita
avg_gc_visita = goles_contra_visita / partidos_visita

# Probabilidad de que el LOCAL marque
# Combina su ataque + debilidad defensiva del rival
prob_local_marca = (avg_gf_local + avg_gc_visita) / 2

# Probabilidad de que el VISITANTE marque
prob_visita_marca = (avg_gf_visita + avg_gc_local) / 2

# Probabilidad combinada de que AMBOS marquen
prob_ambos = (prob_local_marca × prob_visita_marca) / 2 × 100

# Decisión
if prob_ambos > 45%:
    ambos_marcan = "SI"
else:
    ambos_marcan = "NO"
```

### Ejemplo

```
Barcelona como LOCAL:
- Promedio goles a favor: 2.42
- Promedio goles en contra: 0.79

Real Madrid como VISITANTE:
- Promedio goles a favor: 1.95
- Promedio goles en contra: 0.89

Prob Barcelona marca: (2.42 + 0.89) / 2 = 1.655
Prob Real Madrid marca: (1.95 + 0.79) / 2 = 1.370

Prob Ambos: (1.655 × 1.370) / 2 × 100 = 113.4%

Resultado: SI (ambos marcarán)
```

---

## 9. Fase 7: Cálculo de Confianza

### Concepto

La confianza indica qué tan seguro es el pronóstico, en escala de 0-100%.

### Fórmula

```python
# Confianza base: probabilidad del resultado pronosticado
if pronostico == "L":
    confianza_base = prob_local
elif pronostico == "V":
    confianza_base = prob_visita
else:
    confianza_base = prob_empate

# Ajuste por claridad (diferencia entre 1ro y 2do)
probs_ordenadas = sorted([prob_local, prob_empate, prob_visita], reverse=True)
diferencia_top = probs_ordenadas[0] - probs_ordenadas[1]
ajuste_claridad = min(diferencia_top × 0.5, 15)  # Máximo +15

# Ajuste por factores
if pronostico == "L":
    ajuste_factor = (factor_local - factor_visita) × 2
elif pronostico == "V":
    ajuste_factor = (factor_visita - factor_local) × 2
else:
    ajuste_factor = -|factor_local - factor_visita|  # Empate prefiere igualdad

# Confianza final
confianza = confianza_base + ajuste_claridad + ajuste_factor
confianza = max(0, min(100, confianza))  # Limitar 0-100
```

### Interpretación de Confianza

| Rango | Interpretación | Recomendación |
|-------|----------------|---------------|
| 70-100% | Alta confianza | Apuesta recomendada |
| 50-70% | Confianza media | Considerar con cautela |
| 30-50% | Baja confianza | Partido impredecible |
| 0-30% | Muy baja confianza | Evitar apostar |

---

## 10. Sistema de Validación

### Proceso de Validación

Después de que se juega el partido, el sistema compara el pronóstico con el resultado real:

```
PRONÓSTICO              RESULTADO REAL         VALIDACIÓN
─────────────          ────────────────       ─────────────
Pronostico: L     vs   Goles: 2-1 (L)    →   ACIERTO
Doble Oport: 1X   vs   Resultado: L      →   GANA (L está en 1X)
Ambos Marcan: SI  vs   Goles: 2-1        →   GANA (ambos marcaron)
```

### Resultados de Validación

| Métrica | Resultado | Significado |
|---------|-----------|-------------|
| **Principal** | Acierto/Fallo | ¿Se acertó L/E/V? |
| **Doble Oportunidad** | GANA/PIERDE | ¿El resultado está cubierto? |
| **Ambos Marcan** | GANA/PIERDE | ¿Se acertó SI/NO? |

---

## 11. Métricas de Calidad

### Cómo Medir la Calidad del Sistema

El sistema proporciona métricas de efectividad a través del endpoint `/api/prediction/effectiveness`:

```json
{
  "total_validaciones": 150,
  "tiempo_completo": {
    "doble_oportunidad": {
      "aciertos": 112,
      "accuracy": 74.67
    },
    "ambos_marcan": {
      "aciertos": 98,
      "accuracy": 65.33
    },
    "principal": {
      "aciertos": 65,
      "accuracy": 43.33
    }
  }
}
```

### Interpretación de Métricas

| Métrica | Baseline Esperado | Objetivo | Excelente |
|---------|-------------------|----------|-----------|
| **Principal (L/E/V)** | 33.3% (aleatorio) | > 40% | > 50% |
| **Doble Oportunidad** | 66.7% (aleatorio) | > 70% | > 80% |
| **Ambos Marcan** | 50% (aleatorio) | > 55% | > 65% |

### Análisis de Rendimiento

```
Para validar la calidad, ejecuta:

1. Generar pronósticos para partidos futuros
2. Esperar resultados reales
3. Validar con POST /api/prediction/validate
4. Revisar métricas con GET /api/prediction/effectiveness

Si accuracy está por debajo del baseline, los umbrales necesitan ajuste.
```

---

## 12. Cómo Mejorar el Sistema

### 1. Ajuste de Umbrales

Los umbrales en `config.py` pueden ajustarse para optimizar resultados:

```python
# Archivo: prediction_engine/config.py

class Umbrales:
    PROB_LOCAL_MIN = 43.0      # ↓ Reduce = más pronósticos LOCAL
    PROB_LOCAL_MAX = 69.5      # ↑ Aumenta = más LOCAL muy favorito
    PROB_EMPATE_MAX = 20.0     # ↑ Aumenta = más pronósticos EMPATE
    UMBRAL_AMBOS_MARCAN = 45.0 # ↓ Reduce = más SI en ambos marcan
```

### 2. Incorporar Más Variables

Variables adicionales que podrían mejorar la precisión:

| Variable | Impacto Potencial | Dificultad |
|----------|-------------------|------------|
| Forma reciente (últimos 5 partidos) | Alto | Media |
| Historial de enfrentamientos directos | Medio | Baja |
| Jugadores lesionados/suspendidos | Alto | Alta |
| Ventaja de localía específica | Medio | Baja |
| Importancia del partido | Medio | Media |
| Días de descanso | Bajo | Baja |

### 3. Análisis por Liga

Cada liga tiene características diferentes. Considerar:

```python
# Diferentes umbrales por liga
UMBRALES_POR_LIGA = {
    "SPAIN_LA_LIGA": {
        "PROB_LOCAL_MIN": 43.0,  # Liga equilibrada
        "UMBRAL_AMBOS_MARCAN": 45.0
    },
    "ENGLAND_PREMIER_LEAGUE": {
        "PROB_LOCAL_MIN": 40.0,  # Más impredecible
        "UMBRAL_AMBOS_MARCAN": 50.0  # Más goles
    },
    "ITALY_SERIE_A": {
        "PROB_LOCAL_MIN": 45.0,  # Más defensiva
        "UMBRAL_AMBOS_MARCAN": 40.0  # Menos goles
    }
}
```

### 4. Machine Learning (Futuro)

Para una mejora significativa, considerar:

1. **Regresión Logística**: Predecir probabilidades de L/E/V
2. **Random Forest**: Clasificación de resultados
3. **Redes Neuronales**: Patrones complejos en datos históricos
4. **XGBoost**: Combinación de múltiples features

### 5. Backtesting

Proceso para validar cambios:

```
1. Dividir datos: 80% entrenamiento, 20% prueba
2. Aplicar algoritmo en datos de entrenamiento
3. Validar en datos de prueba
4. Comparar accuracy antes/después del cambio
5. Si mejora > 2%, aplicar cambio en producción
```

---

## 13. Umbrales Configurables

### Tabla de Umbrales Actuales

| Parámetro | Valor Actual | Rango Recomendado | Efecto |
|-----------|--------------|-------------------|--------|
| `PROB_LOCAL_MIN` | 43.0% | 38-48% | ↓ = más L, ↑ = menos L |
| `PROB_LOCAL_MAX` | 69.5% | 65-75% | ↓ = más E/V, ↑ = más L |
| `PROB_EMPATE_MAX` | 20.0% | 15-25% | ↓ = menos E, ↑ = más E |
| `DIFERENCIA_EMPATE` | 10.0% | 8-15% | ↓ = menos E, ↑ = más E |
| `SUMA_PROB_MIN` | 116.0% | 110-120% | ↓ = más 12, ↑ = menos 12 |
| `UMBRAL_AMBOS_MARCAN` | 45.0% | 40-55% | ↓ = más SI, ↑ = más NO |
| `FACTOR_5_MIN` | 80.0% | 75-85% | Define "equipo dominante" |
| `FACTOR_4_MIN` | 60.0% | 55-65% | Define "equipo fuerte" |
| `FACTOR_3_MIN` | 40.0% | 35-45% | Define "equipo promedio" |
| `FACTOR_2_MIN` | 20.0% | 15-25% | Define "equipo débil" |

### Proceso de Calibración

```
1. Recopilar 100+ validaciones
2. Calcular accuracy por métrica
3. Si accuracy < baseline:
   a. Identificar métrica problemática
   b. Ajustar umbral relacionado ±5%
   c. Regenerar pronósticos de prueba
   d. Validar mejora
4. Repetir hasta alcanzar objetivo
```

---

## Resumen

El Motor PLLA 3.0 es un sistema basado en reglas que:

1. **Construye estadísticas** detalladas por equipo, contexto y tiempo
2. **Calcula probabilidades** basadas en rendimientos históricos
3. **Aplica factores de ajuste** según la fuerza del equipo
4. **Usa un algoritmo de decisión** con umbrales configurables
5. **Genera apuestas complementarias** (doble oportunidad, ambos marcan)
6. **Valida resultados** para medir efectividad

Para mejorar el sistema:
- Ajustar umbrales basándose en validaciones
- Incorporar más variables (forma, lesiones, etc.)
- Considerar características específicas por liga
- Eventualmente, explorar machine learning

---

*Documentación técnica - Motor PLLA v3.0 - Diciembre 2024*
