# 📖 Guía de Usuario - Sistema PLLA 3.0

## Introducción

Bienvenido al Sistema de Pronósticos Deportivos PLLA 3.0. Esta guía te ayudará
a entender cómo utilizar todas las funcionalidades de la aplicación.

---

## 🏠 Dashboard

La página principal muestra un resumen general del sistema:

- **Total Partidos**: Número de partidos en la base de datos
- **Ligas Activas**: Cantidad de ligas disponibles
- **Promedio Goles**: Promedio de goles por partido
- **Total Goles**: Suma total de goles registrados
- **Top 10 Ligas**: Tabla con las ligas más populares

---

## 🎯 Generar Pronóstico

### Pasos:

1. **Navegar** a "Generar Pronóstico" en el menú lateral
2. **Seleccionar** el equipo local en el primer desplegable
3. **Seleccionar** el equipo visitante en el segundo desplegable
4. **Click** en "Generar Pronóstico"

### Interpretar Resultados:

#### Pronóstico Principal (L/E/V)
- **L (Local)**: Se espera victoria del equipo local
- **E (Empate)**: Se espera empate
- **V (Visita)**: Se espera victoria del visitante

#### Doble Oportunidad
Apuesta más segura que cubre 2 de 3 resultados:
- **1X**: Local gana O empata (cubre L y E)
- **X2**: Empata O visita gana (cubre E y V)
- **12**: Local O visita gana (excluye empate)

#### Ambos Marcan
- **SI**: Ambos equipos marcarán al menos 1 gol
- **NO**: Al menos un equipo no marcará

#### Barra de Probabilidades
Muestra visualmente la distribución de probabilidades:
- 🟢 **Verde**: Probabilidad del Local
- 🟡 **Amarillo**: Probabilidad del Empate
- 🔴 **Rojo**: Probabilidad de la Visita

#### Confianza
Indicador de 0-100% que muestra qué tan seguro es el pronóstico:
- **> 60%**: Alta confianza (verde)
- **40-60%**: Media confianza (amarillo)
- **< 40%**: Baja confianza (rojo)

### Tres Tiempos
El sistema genera pronósticos para:
1. **Tiempo Completo (90 min)**: Resultado final del partido
2. **Primer Tiempo (1MT)**: Solo primeros 45 minutos
3. **Segundo Tiempo (2MT)**: Solo últimos 45 minutos

---

## 🏆 Clasificación

### Selector de Tiempo
Puede ver la clasificación basada en:
- **Tiempo Completo**: Resultados de 90 minutos
- **Primer Tiempo**: Solo resultados del 1er tiempo
- **Segundo Tiempo**: Solo resultados del 2do tiempo

### Columnas de la Tabla
| Columna | Significado |
|---------|-------------|
| # | Posición en la tabla |
| Equipo | Nombre del equipo |
| PJ | Partidos Jugados |
| V | Victorias |
| E | Empates |
| D | Derrotas |
| GF | Goles a Favor |
| GC | Goles en Contra |
| DIF | Diferencia de Goles |
| PTS | Puntos |
| Rend. | Rendimiento (%) |

### Colores de Zonas
- 🟢 **Posiciones 1-4**: Champions League
- 🔵 **Posición 5**: Europa League
- 🟣 **Posición 6**: Conference League
- 🔴 **Posiciones 18-20**: Descenso

---

## 👥 Estadísticas de Equipo

### Visualización
Al seleccionar un equipo, verás:

1. **Card General**: Resumen con PJ, V-E-D, GF-GC, PTS
2. **Card Como Local**: Estadísticas jugando en casa
3. **Card Como Visitante**: Estadísticas jugando fuera
4. **Barra de Rendimiento**: Porcentaje visual

### Secciones por Tiempo
- Tiempo Completo (verde)
- Primer Tiempo (azul)
- Segundo Tiempo (amarillo)

---

## 📊 Partidos

Vista de todos los partidos en la base de datos con:
- Fecha y hora
- Equipos (local vs visitante)
- Resultado (goles)
- Liga

### Filtros Disponibles
- Por liga
- Por temporada

---

## ⬇️ Extracción de Datos

### Proceso
1. Seleccionar liga y temporada
2. Click en "Extraer Datos"
3. Esperar a que se complete el proceso
4. Los datos se guardan automáticamente en la base de datos

### Importante
- Cada extracción consume créditos de API
- Se recomienda extraer solo cuando sea necesario
- Los datos duplicados se ignoran automáticamente

---

## 💡 Consejos de Uso

### Para Mejores Pronósticos
1. **Actualizar Estadísticas**: Antes de generar pronósticos importantes, asegúrate de que las estadísticas estén actualizadas
2. **Considerar el Contexto**: El pronóstico es estadístico, no considera factores como lesiones, motivación, etc.
3. **Usar Doble Oportunidad**: Para apuestas más seguras, considera la doble oportunidad en lugar del resultado exacto

### Interpretación de Confianza
- Alta confianza no garantiza acierto
- Baja confianza indica partido incierto
- Los clásicos suelen tener baja confianza por ser impredecibles

---

## ❓ Preguntas Frecuentes

### ¿Cada cuánto se actualizan los datos?
Los datos no se actualizan automáticamente. Debes usar la función de Extracción para obtener partidos nuevos.

### ¿Puedo ver pronósticos históricos?
Actualmente no hay una vista de pronósticos históricos en el frontend, pero se guardan en la base de datos.

### ¿Qué significa rendimiento?
Es el porcentaje de puntos obtenidos vs puntos posibles:
- 100% = Todas victorias
- 33% = Todos empates
- 0% = Todas derrotas

### ¿Por qué algunos equipos no aparecen?
Solo aparecen equipos de los que hay datos en la temporada seleccionada.

---

*Guía de Usuario v1.0 - Diciembre 2024*
