# 📋 PLAN DE IMPLEMENTACIÓN - MOTOR DE PRONÓSTICOS PLLA 3.0

## Documento de Diseño Técnico
**Versión:** 1.0  
**Fecha:** Diciembre 2024  
**Estado:** En Desarrollo

---

## 1. RESUMEN EJECUTIVO

Este documento detalla el plan de implementación del Motor de Pronósticos Deportivos, 
basado en el sistema Excel PLLA 3.0. El objetivo es crear una versión en Python que:

1. **Replique exactamente** la lógica del Excel original
2. **Sea escalable** para múltiples ligas y temporadas
3. **Esté bien documentado** para futuras modificaciones
4. **Permita validación** comparativa con el Excel

---

## 2. ARQUITECTURA DEL SISTEMA

### 2.1 Diagrama de Flujo de Datos

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          FLUJO DE DATOS PLLA 3.0                            │
└─────────────────────────────────────────────────────────────────────────────┘

     ┌──────────────┐
     │   PARTIDOS   │  ← Datos de API-Football (ya existente)
     │   (MongoDB)  │
     └──────┬───────┘
            │
            ▼
┌─────────────────────┐
│  STATS BUILDER      │  ← Módulo: stats_builder.py
│                     │
│  • Acumula PJ,V,E,D │
│  • Calcula GF,GC,DF │
│  • Separa por:      │
│    - General        │
│    - Local          │
│    - Visitante      │
│  • 3 tiempos:       │
│    - TC (90 min)    │
│    - 1MT (45 min)   │
│    - 2MT (45 min)   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  CLASSIFICATION     │  ← Módulo: classification.py
│                     │
│  • Ordena equipos   │
│  • Criterios:       │
│    1. Puntos        │
│    2. Dif. goles    │
│    3. Goles favor   │
│  • Genera tabla     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────┐
│              PREDICTION ENGINE (CORAZÓN)                │  ← Módulo: prediction_engine.py
│                                                         │
│  PASO 1: Calcular Probabilidades Base                   │
│  ┌─────────────────────────────────────────────────┐   │
│  │ % Local = rendimiento_local_L / total * 100     │   │
│  │ % Visita = rendimiento_visita_V / total * 100   │   │
│  │ % Empate = 100 - % Local - % Visita             │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  PASO 2: Calcular Factores de Ajuste (1-5)              │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Factor = f(rendimiento_porcentual)              │   │
│  │   5: > 80%                                      │   │
│  │   4: 60-80%                                     │   │
│  │   3: 40-60%                                     │   │
│  │   2: 20-40%                                     │   │
│  │   1: < 20%                                      │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  PASO 3: Aplicar Algoritmo de Decisión                  │
│  ┌─────────────────────────────────────────────────┐   │
│  │ IF 43 < %Local < 69.5 AND %Empate < 20:         │   │
│  │    → LOCAL                                      │   │
│  │ ELIF %Local < 47 AND otros_criterios:           │   │
│  │    → VISITA                                     │   │
│  │ ELIF criterios_empate:                          │   │
│  │    → EMPATE                                     │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  PASO 4: Generar Doble Oportunidad                      │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 1X = Local o Empate                             │   │
│  │ X2 = Empate o Visita                            │   │
│  │ 12 = Local o Visita (sin empate)                │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  PASO 5: Calcular Ambos Marcan                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │ SI: promedio_goles > umbral                     │   │
│  │ NO: promedio_goles <= umbral                    │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────┬───────────────────────────────┘
                          │
                          ▼
           ┌──────────────────────────┐
           │       PRONÓSTICO         │
           │                          │
           │  • Principal: L/E/V      │
           │  • Doble Op: 1X/X2/12    │
           │  • Ambos: SI/NO          │
           │  • Probabilidades %      │
           └────────────┬─────────────┘
                        │
                        ▼
           ┌──────────────────────────┐
           │      VALIDACIÓN          │  ← Módulo: validation.py
           │                          │
           │  Tras jugar el partido:  │
           │  • Compara pronóstico    │
           │    vs resultado real     │
           │  • Resultado: GANA/PIERDE│
           │  • Calcula efectividad   │
           └──────────────────────────┘
```

### 2.2 Estructura de Módulos

```
/app/backend/prediction_engine/
│
├── __init__.py           # Exporta clases principales
├── PLAN_IMPLEMENTACION.md # Este documento
├── README.md             # Documentación de uso
│
├── models.py             # Modelos de datos (Pydantic)
│   ├── Partido           # Datos de un partido
│   ├── EstadisticasEquipo # Stats acumuladas
│   ├── Equipo            # Equipo con sus estadísticas
│   ├── Probabilidades    # Porcentajes calculados
│   ├── Pronostico        # Resultado del motor
│   └── Validacion        # Resultado post-partido
│
├── config.py             # Configuración y umbrales
│   ├── UMBRALES          # Constantes del algoritmo
│   └── CONFIG            # Configuración general
│
├── stats_builder.py      # Constructor de estadísticas
│   └── StatsBuilder      # Clase principal
│       ├── construir_estadisticas()
│       ├── actualizar_con_partido()
│       └── obtener_stats_equipo()
│
├── classification.py     # Generador de clasificación
│   └── ClassificationEngine
│       ├── generar_clasificacion()
│       └── obtener_posicion()
│
├── prediction_engine.py  # Motor de pronósticos
│   └── PredictionEngine  # Clase principal
│       ├── generar_pronostico()
│       ├── _calcular_probabilidades()
│       ├── _calcular_factor_ajuste()
│       ├── _aplicar_algoritmo_decision()
│       ├── _generar_doble_oportunidad()
│       └── _calcular_ambos_marcan()
│
└── validation.py         # Validador de pronósticos
    └── ValidationEngine
        ├── validar_pronostico()
        └── calcular_efectividad()
```

---

## 3. ANÁLISIS DE UMBRALES

### 3.1 Umbrales del Excel Original

Basándome en el análisis de los documentos, estos son los umbrales identificados:

| Umbral | Valor | Uso | Justificación Estadística |
|--------|-------|-----|---------------------------|
| `PROB_LOCAL_MIN` | 43% | Mínimo para pronosticar LOCAL | Debajo de 43% no hay suficiente ventaja |
| `PROB_LOCAL_MAX` | 69.5% | Máximo para LOCAL (muy favorito) | Sobre 69.5% el partido es "seguro" |
| `PROB_EMPATE_MAX` | 20% | Máximo de empate para decidir ganador | Si empate > 20%, considerar X |
| `SUMA_PROB_MIN` | 116% | Suma mínima para "12" (cualquiera gana) | Indica dominio de no-empate |
| `SUMA_PROB_MAX` | 123% | Suma máxima | Límite superior |
| `PROB_VISITA_MAX` | 42% | Máximo para considerar visita | Complemento del local |
| `UMBRAL_AMBOS_MARCAN` | 45% | Probabilidad de ambos anotar | Basado en promedios de goles |

### 3.2 Recomendación de Experto: Validación de Umbrales

**IMPORTANTE:** Los umbrales actuales (43, 69.5, etc.) fueron calibrados empíricamente 
en el Excel. Para validar su exactitud, recomiendo:

1. **Fase 1: Implementar con umbrales originales**
   - Usar exactamente los valores del Excel
   - Esto permite comparación directa

2. **Fase 2: Backtesting**
   - Ejecutar el motor sobre datos históricos
   - Medir accuracy por tipo de apuesta
   - Identificar patrones de error

3. **Fase 3: Optimización (Futura)**
   - Grid Search para encontrar umbrales óptimos
   - A/B testing entre configuraciones
   - Machine Learning para ajuste automático

### 3.3 Análisis Estadístico de Datos Actuales (La Liga 2023)

```
Distribución de Resultados:
- LOCAL:  43.9% (167 partidos)
- EMPATE: 28.2% (107 partidos)
- VISITA: 27.9% (106 partidos)

Promedios de Goles:
- Goles Local (90 min):  1.48
- Goles Visita (90 min): 1.16
- Goles Local (1MT):     0.66
- Goles Visita (1MT):    0.54

Observaciones:
- La ventaja de local es significativa (~44%)
- El empate es relativamente alto (~28%)
- El umbral de 43% para LOCAL parece adecuado
```

---

## 4. MODELOS DE DATOS

### 4.1 Modelo: EstadisticasEquipo

```python
class EstadisticasEquipo:
    """
    Estadísticas acumuladas de un equipo.
    Separadas por contexto (general, local, visitante).
    """
    # Generales
    partidos_jugados: int = 0
    victorias: int = 0
    empates: int = 0
    derrotas: int = 0
    goles_favor: int = 0
    goles_contra: int = 0
    diferencia_goles: int = 0
    puntos: int = 0
    
    # Como Local
    pj_local: int = 0
    v_local: int = 0
    e_local: int = 0
    d_local: int = 0
    gf_local: int = 0
    gc_local: int = 0
    pts_local: int = 0
    
    # Como Visitante
    pj_visita: int = 0
    v_visita: int = 0
    e_visita: int = 0
    d_visita: int = 0
    gf_visita: int = 0
    gc_visita: int = 0
    pts_visita: int = 0
    
    # Derivados
    rendimiento_general: float = 0.0  # pts / (pj * 3) * 100
    rendimiento_local: float = 0.0
    rendimiento_visita: float = 0.0
    promedio_gf: float = 0.0
    promedio_gc: float = 0.0
```

### 4.2 Modelo: Pronostico

```python
class Pronostico:
    """
    Resultado del motor de pronósticos.
    Incluye los 3 tiempos (TC, 1MT, 2MT).
    """
    partido_id: str
    fecha_generacion: datetime
    
    # Tiempo Completo (90 min)
    pronostico_tc: str  # "L", "E", "V"
    doble_oportunidad_tc: str  # "1X", "X2", "12"
    ambos_marcan_tc: str  # "SI", "NO"
    probabilidades_tc: Probabilidades
    confianza_tc: float  # 0-100%
    
    # Primer Tiempo (similar estructura)
    pronostico_1mt: str
    doble_oportunidad_1mt: str
    ambos_marcan_1mt: str
    probabilidades_1mt: Probabilidades
    confianza_1mt: float
    
    # Segundo Tiempo (similar estructura)
    pronostico_2mt: str
    doble_oportunidad_2mt: str
    ambos_marcan_2mt: str
    probabilidades_2mt: Probabilidades
    confianza_2mt: float
```

---

## 5. ALGORITMOS DETALLADOS

### 5.1 Cálculo de Probabilidades Base

```python
def calcular_probabilidades(
    stats_local: EstadisticasEquipo,
    stats_visita: EstadisticasEquipo
) -> Probabilidades:
    """
    Calcula probabilidades base usando rendimiento.
    
    Lógica:
    - El rendimiento LOCAL se mide con sus stats como LOCAL
    - El rendimiento VISITA se mide con sus stats como VISITANTE
    - La probabilidad es proporcional al rendimiento
    """
    # Rendimiento: puntos obtenidos / puntos posibles * 100
    rend_local = stats_local.rendimiento_local  # Cómo rinde jugando en casa
    rend_visita = stats_visita.rendimiento_visita  # Cómo rinde jugando fuera
    
    # Total para normalizar
    total = rend_local + rend_visita
    
    if total == 0:
        # Sin datos suficientes, usar promedios históricos
        return Probabilidades(
            porcentaje_local=44.0,  # Promedio histórico
            porcentaje_empate=28.0,
            porcentaje_visita=28.0
        )
    
    # Probabilidad proporcional al rendimiento
    prob_local = (rend_local / total) * 100
    prob_visita = (rend_visita / total) * 100
    
    # El empate se calcula según la "cercanía" de fuerzas
    # Cuando las probabilidades son cercanas, más probable el empate
    diferencia = abs(prob_local - prob_visita)
    
    # Factor de empate: más alto cuando equipos parejos
    factor_empate = max(0, 30 - diferencia)  # Máximo 30% de base
    
    # Ajustar probabilidades
    prob_empate = factor_empate
    prob_local = prob_local * (100 - factor_empate) / 100
    prob_visita = prob_visita * (100 - factor_empate) / 100
    
    # Normalizar a 100%
    suma = prob_local + prob_empate + prob_visita
    
    return Probabilidades(
        porcentaje_local=round(prob_local / suma * 100, 2),
        porcentaje_empate=round(prob_empate / suma * 100, 2),
        porcentaje_visita=round(prob_visita / suma * 100, 2)
    )
```

### 5.2 Factores de Ajuste

```python
def calcular_factor_ajuste(rendimiento: float) -> int:
    """
    Convierte rendimiento porcentual a factor 1-5.
    
    Este factor pondera la "fuerza" del equipo:
    - 5: Equipo dominante (>80% rendimiento)
    - 4: Equipo fuerte (60-80%)
    - 3: Equipo promedio (40-60%)
    - 2: Equipo débil (20-40%)
    - 1: Equipo muy débil (<20%)
    """
    if rendimiento > 80:
        return 5
    elif rendimiento > 60:
        return 4
    elif rendimiento > 40:
        return 3
    elif rendimiento > 20:
        return 2
    else:
        return 1
```

### 5.3 Algoritmo de Decisión Principal

```python
def aplicar_algoritmo_decision(
    probabilidades: Probabilidades,
    factor_local: int,
    factor_visita: int,
    config: dict
) -> str:
    """
    Algoritmo principal de decisión.
    Retorna: "L" (Local), "E" (Empate), "V" (Visita)
    
    REGLAS (basadas en el Excel PLLA 3.0):
    """
    p_local = probabilidades.porcentaje_local
    p_empate = probabilidades.porcentaje_empate
    p_visita = probabilidades.porcentaje_visita
    
    # REGLA 1: Local claro favorito
    # Si probabilidad local está en rango óptimo y empate bajo
    if (config['PROB_LOCAL_MIN'] < p_local < config['PROB_LOCAL_MAX'] 
        and p_empate < config['PROB_EMPATE_MAX']):
        return "L"
    
    # REGLA 2: Visita favorito
    # Si local tiene poca probabilidad
    if p_local < config['PROB_LOCAL_MIN'] and p_visita > p_local:
        return "V"
    
    # REGLA 3: Empate probable
    # Equipos muy parejos
    if p_empate >= config['PROB_EMPATE_MAX']:
        # Verificar si realmente están parejos
        diferencia = abs(p_local - p_visita)
        if diferencia < 10:  # Muy parejos
            return "E"
    
    # REGLA 4: Local muy favorito (sobre el máximo)
    if p_local >= config['PROB_LOCAL_MAX']:
        return "L"
    
    # REGLA 5: Por defecto, el de mayor probabilidad
    if p_local >= p_visita and p_local >= p_empate:
        return "L"
    elif p_visita >= p_local and p_visita >= p_empate:
        return "V"
    else:
        return "E"
```

### 5.4 Doble Oportunidad

```python
def generar_doble_oportunidad(
    pronostico: str,
    probabilidades: Probabilidades,
    config: dict
) -> str:
    """
    Genera apuesta de doble oportunidad.
    
    - 1X: Gana local o empata (cubre L y E)
    - X2: Empata o gana visita (cubre E y V)
    - 12: Gana local o visita (sin empate)
    """
    p_local = probabilidades.porcentaje_local
    p_empate = probabilidades.porcentaje_empate
    p_visita = probabilidades.porcentaje_visita
    
    # Suma de probabilidades sin empate
    suma_sin_empate = p_local + p_visita
    
    # REGLA: Si suma sin empate es alta, apostar "12" (cualquiera gana)
    if suma_sin_empate > config['SUMA_PROB_MIN']:
        return "12"
    
    # REGLA: Basarse en el pronóstico principal
    if pronostico == "L":
        # Local favorito, cubrir con empate
        return "1X"
    elif pronostico == "V":
        # Visita favorito, cubrir con empate
        return "X2"
    else:  # Empate
        # Ver cuál es segundo favorito
        if p_local > p_visita:
            return "1X"
        else:
            return "X2"
```

### 5.5 Ambos Marcan

```python
def calcular_ambos_marcan(
    stats_local: EstadisticasEquipo,
    stats_visita: EstadisticasEquipo,
    config: dict
) -> str:
    """
    Determina si ambos equipos marcarán.
    
    Basado en:
    - Promedio de goles a favor del local en casa
    - Promedio de goles a favor del visitante fuera
    - Promedio de goles en contra de cada uno
    """
    # Promedios de goles
    if stats_local.pj_local > 0:
        avg_gf_local = stats_local.gf_local / stats_local.pj_local
        avg_gc_local = stats_local.gc_local / stats_local.pj_local
    else:
        avg_gf_local = 1.5  # Promedio por defecto
        avg_gc_local = 1.0
    
    if stats_visita.pj_visita > 0:
        avg_gf_visita = stats_visita.gf_visita / stats_visita.pj_visita
        avg_gc_visita = stats_visita.gc_visita / stats_visita.pj_visita
    else:
        avg_gf_visita = 1.0
        avg_gc_visita = 1.5
    
    # Probabilidad de que local marque: combina su capacidad ofensiva y 
    # debilidad defensiva del rival
    prob_local_marca = (avg_gf_local + avg_gc_visita) / 2
    
    # Probabilidad de que visita marque
    prob_visita_marca = (avg_gf_visita + avg_gc_local) / 2
    
    # Probabilidad de ambos (simplificado)
    prob_ambos = prob_local_marca * prob_visita_marca / 2 * 100
    
    # Umbral para decidir
    if prob_ambos > config['UMBRAL_AMBOS_MARCAN']:
        return "SI"
    else:
        return "NO"
```

---

## 6. PLAN DE TRABAJO DETALLADO

### Fase 1: Modelos y Configuración (Actual)

| # | Tarea | Archivo | Estado |
|---|-------|---------|--------|
| 1.1 | Crear modelos Pydantic | models.py | ⏳ |
| 1.2 | Definir configuración y umbrales | config.py | ⏳ |
| 1.3 | Crear documentación base | README.md | ⏳ |

### Fase 2: Constructor de Estadísticas

| # | Tarea | Archivo | Estado |
|---|-------|---------|--------|
| 2.1 | Implementar StatsBuilder | stats_builder.py | ⏳ |
| 2.2 | Método construir_estadisticas() | stats_builder.py | ⏳ |
| 2.3 | Integrar con MongoDB existente | stats_builder.py | ⏳ |
| 2.4 | Tests unitarios | test_stats_builder.py | ⏳ |

### Fase 3: Motor de Clasificación

| # | Tarea | Archivo | Estado |
|---|-------|---------|--------|
| 3.1 | Implementar ClassificationEngine | classification.py | ⏳ |
| 3.2 | Método generar_clasificacion() | classification.py | ⏳ |
| 3.3 | Tests unitarios | test_classification.py | ⏳ |

### Fase 4: Motor de Pronósticos

| # | Tarea | Archivo | Estado |
|---|-------|---------|--------|
| 4.1 | Implementar PredictionEngine | prediction_engine.py | ⏳ |
| 4.2 | Método calcular_probabilidades() | prediction_engine.py | ⏳ |
| 4.3 | Método aplicar_algoritmo_decision() | prediction_engine.py | ⏳ |
| 4.4 | Método generar_doble_oportunidad() | prediction_engine.py | ⏳ |
| 4.5 | Método calcular_ambos_marcan() | prediction_engine.py | ⏳ |
| 4.6 | Tests unitarios | test_prediction_engine.py | ⏳ |

### Fase 5: Validación

| # | Tarea | Archivo | Estado |
|---|-------|---------|--------|
| 5.1 | Implementar ValidationEngine | validation.py | ⏳ |
| 5.2 | Método validar_pronostico() | validation.py | ⏳ |
| 5.3 | Método calcular_efectividad() | validation.py | ⏳ |
| 5.4 | Tests unitarios | test_validation.py | ⏳ |

### Fase 6: Integración API

| # | Tarea | Archivo | Estado |
|---|-------|---------|--------|
| 6.1 | Endpoint POST /api/pronostico | server.py | ⏳ |
| 6.2 | Endpoint GET /api/clasificacion | server.py | ⏳ |
| 6.3 | Endpoint GET /api/equipos/{nombre}/stats | server.py | ⏳ |
| 6.4 | Endpoint POST /api/validar | server.py | ⏳ |
| 6.5 | Endpoint GET /api/efectividad | server.py | ⏳ |
| 6.6 | Tests de integración | test_api.py | ⏳ |

---

## 7. CRITERIOS DE ÉXITO

### 7.1 Funcionales
- [ ] El motor genera pronósticos para cualquier partido
- [ ] Soporta los 3 tiempos (TC, 1MT, 2MT)
- [ ] Genera doble oportunidad correctamente
- [ ] Calcula ambos marcan correctamente
- [ ] Valida pronósticos contra resultados reales

### 7.2 Comparabilidad con Excel
- [ ] Mismo input produce mismo output que Excel
- [ ] Estadísticas acumuladas idénticas
- [ ] Clasificación idéntica

### 7.3 Calidad de Código
- [ ] Documentación completa en cada módulo
- [ ] Type hints en todas las funciones
- [ ] Tests unitarios con >80% cobertura
- [ ] Código limpio y mantenible

---

## 8. NOTAS IMPORTANTES

### 8.1 Sobre los Umbrales
Los umbrales (43, 69.5, etc.) son valores empíricos del Excel. 
Se implementarán exactamente como están para permitir validación.
Optimización de umbrales es una tarea FUTURA.

### 8.2 Sobre los Datos
Los datos actuales son de La Liga 2023 (380 partidos).
Incluyen goles de 1MT y TR (tiempo reglamentario).
El 2MT se calcula como: goles_2MT = goles_TR - goles_1MT

### 8.3 Sobre el Diseño
Se prioriza:
1. Exactitud sobre velocidad
2. Claridad sobre brevedad
3. Documentación sobre complejidad

---

*Documento creado para el proyecto de migración PLLA 3.0*
*Diciembre 2024*
