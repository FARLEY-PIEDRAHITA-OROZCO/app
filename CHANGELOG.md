# 📝 Changelog - Football Prediction System

Todos los cambios notables del proyecto.

---

## [3.1.0] - 2024-12-29

### ✨ Nuevas Funcionalidades

#### Vista de Temporada Completa
- Nueva página `/temporada` estilo Excel
- Carga de 380+ partidos en ~1 segundo
- Filtros avanzados: jornada, equipo, pronóstico, confianza, estado
- Ordenamiento por columnas
- Estadísticas de aciertos en tiempo real
- Exportar a CSV

#### Dashboard de Mejores Apuestas
- Nueva página `/mejores-apuestas`
- 5 categorías: Doble Oportunidad, Favorito Claro, Over 2.5, Over 1.5, Ambos Marcan
- Filtros por jornada y confianza mínima
- Ordenado por probabilidad

#### Histórico Consolidado (H2H)
- Nuevo módulo `historico_consolidado.py`
- Análisis de enfrentamientos directos
- Estadísticas de múltiples temporadas (hasta 3)
- Ponderación: 70% temporada actual, 30% históricas
- Influencia H2H: 20% en probabilidades
- Nuevo endpoint `/api/prediction/h2h`

#### Pronósticos por Jornada
- Nueva página `/jornada`
- Pronósticos de todos los partidos de una jornada
- Defensa local/visitante visible
- Exportar a CSV

### 🔧 Mejoras

#### Motor de Pronósticos
- Ajuste de probabilidades por H2H
- Factores históricos multi-temporada
- Nuevo campo `temporadas_analizadas` en respuesta

#### Interfaz de Usuario
- Sección H2H en página de pronósticos
- Estadísticas defensivas en página de Equipos
- Menú reorganizado con secciones

#### Backend
- Endpoint optimizado `/api/prediction/temporada-completa`
- Generación automática de estadísticas al extraer datos
- Mejor inferencia de `liga_id` desde `season_id`

### 🐛 Correcciones
- Fix: Estadísticas de visitante mostraban 0
- Fix: Selectores de temporada no actualizaban
- Fix: URL de RapidAPI para API-Football
- Fix: Endpoints con `liga_id` hardcodeado

---

## [3.0.0] - 2024-12-27

### ✨ Nuevas Funcionalidades

#### Over/Under y Goles Esperados
- Predicción Over/Under 1.5, 2.5, 3.5
- Cálculo de goles esperados por equipo
- Probabilidades para cada umbral

#### Forma Reciente
- Análisis de últimos 5 partidos
- Rendimiento reciente
- Rachas (victorias/derrotas consecutivas)
- Ajuste de probabilidades por forma

#### Backtesting
- Nuevo módulo de validación histórica
- Endpoint `/api/prediction/backtesting`
- Métricas: precisión por tipo, ROI simulado

#### UI de Pronósticos Mejorada
- Sección de forma reciente
- Over/Under con probabilidades
- Goles esperados
- Indicadores de confianza con colores

### 🔧 Mejoras
- Estadísticas defensivas (goles en contra)
- Promedios de goles favor/contra
- Documentación de API actualizada

---

## [2.5.0] - 2024-12-26

### ✨ Nuevas Funcionalidades

#### Multi-Liga y Multi-Temporada
- Soporte para múltiples ligas
- Selector de liga dinámico
- `season_id` como identificador principal
- Filtrado correcto en todos los endpoints

#### Componentes Reutilizables
- `LeagueSelector.jsx`
- `SeasonSelector.jsx`

### 🐛 Correcciones
- Fix: Endpoints ignoraban `season_id`
- Fix: Defaults hardcodeados de `liga_id`

---

## [2.0.0] - 2024-12-25

### ✨ Nuevas Funcionalidades

#### Motor PLLA 3.0
- Algoritmo de pronósticos completo
- Pronósticos TC, 1MT, 2MT
- Doble oportunidad
- Ambos marcan

#### Extracción de Datos
- Cliente API-Football
- Soporte RapidAPI
- Guardado en MongoDB

### 📦 Infraestructura
- Backend FastAPI
- Frontend React
- MongoDB como base de datos

---

## [1.0.0] - 2024-12-20

### 🎉 Lanzamiento Inicial
- Estructura base del proyecto
- Configuración de entorno
- Modelos de datos iniciales

---

## Leyenda

- ✨ Nueva funcionalidad
- 🔧 Mejora
- 🐛 Corrección de bug
- 📦 Infraestructura
- 📝 Documentación
- ⚠️ Deprecación
- 🗑️ Eliminación
