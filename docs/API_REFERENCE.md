# 📚 API Reference - Football Prediction System

Documentación completa de todos los endpoints de la API REST.

**Base URL**: `http://localhost:8001/api`

---

## 📋 Índice

1. [Ligas y Temporadas](#ligas-y-temporadas)
2. [Pronósticos](#pronósticos)
3. [Estadísticas](#estadísticas)
4. [Clasificación](#clasificación)
5. [Extracción de Datos](#extracción-de-datos)
6. [Validación](#validación)

---

## Ligas y Temporadas

### GET /api/leagues
Lista todas las ligas disponibles en la base de datos.

**Respuesta:**
```json
[
  {
    "_id": "SPAIN_LA_LIGA",
    "liga_nombre": "La Liga",
    "total_partidos": 380
  },
  {
    "_id": "ENGLAND_PREMIER_LEAGUE",
    "liga_nombre": "Premier League",
    "total_partidos": 380
  }
]
```

---

### GET /api/seasons
Lista todas las temporadas disponibles.

**Parámetros Query:**
| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `liga_id` | string | No | Filtrar por liga específica |

**Respuesta:**
```json
{
  "total": 2,
  "seasons": [
    {
      "season_id": "SPAIN_LA_LIGA_2023-24",
      "liga_id": "SPAIN_LA_LIGA",
      "year": 2023,
      "label": "2023-24",
      "total_partidos": 380
    }
  ]
}
```

---

## Pronósticos

### POST /api/prediction/generate
Genera un pronóstico completo para un partido.

**Body:**
```json
{
  "equipo_local": "Real Madrid",
  "equipo_visitante": "Barcelona",
  "season_id": "SPAIN_LA_LIGA_2023-24"
}
```

**Respuesta:**
```json
{
  "success": true,
  "pronostico": {
    "partido_id": "abc123",
    "equipo_local": "Real Madrid",
    "equipo_visitante": "Barcelona",
    "liga_id": "SPAIN_LA_LIGA",
    "season_id": "SPAIN_LA_LIGA_2023-24",
    "tiempo_completo": {
      "pronostico": "L",
      "probabilidades": {
        "local": 55.5,
        "empate": 24.2,
        "visita": 20.3
      },
      "doble_oportunidad": "1X",
      "ambos_marcan": "SI",
      "over_under": {
        "over_15": {"prediccion": "OVER", "probabilidad": 85.2},
        "over_25": {"prediccion": "OVER", "probabilidad": 68.5},
        "over_35": {"prediccion": "UNDER", "probabilidad": 45.1}
      },
      "goles_esperados": {
        "local": 2.1,
        "visitante": 1.3,
        "total": 3.4
      },
      "confianza": 72.5
    },
    "primer_tiempo": { ... },
    "segundo_tiempo": { ... },
    "forma_reciente": {
      "local": {
        "ultimos_5": ["V", "V", "V", "E", "V"],
        "rendimiento": 86.67,
        "racha": "3 victorias consecutivas"
      },
      "visitante": { ... }
    },
    "h2h": {
      "tiene_historial": true,
      "total_partidos": 10,
      "victorias_eq1": 5,
      "victorias_eq2": 3,
      "empates": 2,
      "porcentaje_eq1": 50.0,
      "porcentaje_eq2": 30.0,
      "porcentaje_empate": 20.0,
      "tendencia": {
        "tipo": "dominante",
        "favorito": "Real Madrid",
        "descripcion": "Real Madrid domina el historial"
      }
    },
    "temporadas_analizadas": 2,
    "version_algoritmo": "3.0.0"
  }
}
```

---

### GET /api/prediction/jornada
Obtiene pronósticos para todos los partidos de una jornada.

**Parámetros Query:**
| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `season_id` | string | Sí | ID de la temporada |
| `jornada` | string | No | Nombre de la jornada. Si no se especifica, devuelve lista de jornadas |

**Ejemplo sin jornada:**
```
GET /api/prediction/jornada?season_id=SPAIN_LA_LIGA_2023-24
```

**Respuesta:**
```json
{
  "season_id": "SPAIN_LA_LIGA_2023-24",
  "jornadas": [
    {"nombre": "Regular Season - 1", "partidos": 10},
    {"nombre": "Regular Season - 2", "partidos": 10}
  ]
}
```

**Ejemplo con jornada:**
```
GET /api/prediction/jornada?season_id=SPAIN_LA_LIGA_2023-24&jornada=Regular%20Season%20-%201
```

**Respuesta:**
```json
{
  "success": true,
  "season_id": "SPAIN_LA_LIGA_2023-24",
  "jornada": "Regular Season - 1",
  "total_partidos": 10,
  "partidos": [
    {
      "equipo_local": "Almeria",
      "equipo_visitante": "Rayo Vallecano",
      "fecha": "2023-08-11",
      "pronostico": "V",
      "doble_oportunidad": "X2",
      "ambos_marcan": "SI",
      "over_under": { ... },
      "confianza": 65.2,
      "defensa_local": {"gc_total": 45, "promedio_gc": 1.18},
      "defensa_visitante": {"gc_total": 38, "promedio_gc": 1.0},
      "resultado_real": {"local": 1, "visitante": 2}
    }
  ]
}
```

---

### GET /api/prediction/temporada-completa
Genera pronósticos para TODOS los partidos de una temporada.

**Parámetros Query:**
| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `season_id` | string | Sí | ID de la temporada |

**Ejemplo:**
```
GET /api/prediction/temporada-completa?season_id=SPAIN_LA_LIGA_2023-24
```

**Respuesta:**
```json
{
  "success": true,
  "season_id": "SPAIN_LA_LIGA_2023-24",
  "liga_id": "SPAIN_LA_LIGA",
  "total_partidos": 380,
  "partidos": [
    {
      "jornada": "Regular Season - 1",
      "jornada_num": 1,
      "fecha": "2023-08-11",
      "equipo_local": "Almeria",
      "equipo_visitante": "Rayo Vallecano",
      "pronostico": "V",
      "doble_oportunidad": "X2",
      "ambos_marcan": "SI",
      "over_under": { ... },
      "probabilidades": {"local": 32.1, "empate": 28.5, "visita": 39.4},
      "confianza": 65.2,
      "goles_esperados": {"local": 1.2, "visitante": 1.5, "total": 2.7},
      "defensa_local": {"gc_total": 45, "promedio_gc": 1.18},
      "defensa_visitante": {"gc_total": 38, "promedio_gc": 1.0},
      "resultado_real": {"local": 1, "visitante": 2}
    }
  ]
}
```

---

### GET /api/prediction/mejores-apuestas
Obtiene las mejores apuestas ordenadas por confianza.

**Parámetros Query:**
| Parámetro | Tipo | Requerido | Default | Descripción |
|-----------|------|-----------|---------|-------------|
| `season_id` | string | Sí | - | ID de la temporada |
| `jornada` | string | No | Todas | Filtrar por jornada |
| `min_confianza` | float | No | 60.0 | Confianza mínima |
| `limite` | int | No | 20 | Máximo por categoría |

**Ejemplo:**
```
GET /api/prediction/mejores-apuestas?season_id=SPAIN_LA_LIGA_2023-24&min_confianza=70
```

**Respuesta:**
```json
{
  "success": true,
  "season_id": "SPAIN_LA_LIGA_2023-24",
  "jornada": "Todas",
  "min_confianza": 70.0,
  "total_partidos_analizados": 380,
  "total_apuestas_encontradas": 85,
  "apuestas": {
    "doble_oportunidad": [
      {
        "equipo_local": "Real Madrid",
        "equipo_visitante": "Getafe",
        "jornada": "Regular Season - 5",
        "apuesta": "1X",
        "probabilidad": 92.5,
        "confianza": 78.3,
        "resultado_real": "3-0"
      }
    ],
    "over_25": [ ... ],
    "over_15": [ ... ],
    "ambos_marcan": [ ... ],
    "favorito_claro": [ ... ]
  }
}
```

---

### GET /api/prediction/h2h
Obtiene el historial de enfrentamientos directos entre dos equipos.

**Parámetros Query:**
| Parámetro | Tipo | Requerido | Default | Descripción |
|-----------|------|-----------|---------|-------------|
| `equipo1` | string | Sí | - | Primer equipo |
| `equipo2` | string | Sí | - | Segundo equipo |
| `liga_id` | string | No | - | Filtrar por liga |
| `limite` | int | No | 10 | Máximo de partidos |

**Ejemplo:**
```
GET /api/prediction/h2h?equipo1=Real%20Madrid&equipo2=Barcelona
```

**Respuesta:**
```json
{
  "success": true,
  "h2h": {
    "tiene_historial": true,
    "total_partidos": 10,
    "equipo1": "Real Madrid",
    "equipo2": "Barcelona",
    "victorias_eq1": 5,
    "victorias_eq2": 3,
    "empates": 2,
    "goles_eq1": 15,
    "goles_eq2": 12,
    "promedio_goles_total": 2.7,
    "porcentaje_eq1": 50.0,
    "porcentaje_eq2": 30.0,
    "porcentaje_empate": 20.0,
    "ultimos_5": ["G Real Madrid", "E", "G Barcelona", "G Real Madrid", "G Real Madrid"],
    "tendencia": {
      "tipo": "dominante",
      "favorito": "Real Madrid",
      "descripcion": "Real Madrid domina el historial"
    }
  }
}
```

---

## Estadísticas

### GET /api/prediction/teams
Lista todos los equipos con sus estadísticas.

**Parámetros Query:**
| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `season_id` | string | No | ID de la temporada |

**Respuesta:**
```json
{
  "liga_id": "SPAIN_LA_LIGA",
  "temporada": 2023,
  "season_id": "SPAIN_LA_LIGA_2023-24",
  "total": 20,
  "equipos": [
    {
      "nombre": "Real Madrid",
      "puntos": 95,
      "partidos_jugados": 38,
      "rendimiento": 83.33
    }
  ]
}
```

---

### GET /api/prediction/team/{nombre}
Obtiene estadísticas detalladas de un equipo.

**Parámetros Path:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `nombre` | string | Nombre del equipo |

**Parámetros Query:**
| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `season_id` | string | No | ID de la temporada |

**Respuesta:**
```json
{
  "nombre": "Real Madrid",
  "liga_id": "SPAIN_LA_LIGA",
  "temporada": 2023,
  "season_id": "SPAIN_LA_LIGA_2023-24",
  "tiempo_completo": {
    "partidos_jugados": 38,
    "victorias": 29,
    "empates": 8,
    "derrotas": 1,
    "goles_favor": 87,
    "goles_contra": 26,
    "puntos": 95,
    "rendimiento_general": 83.33,
    "promedio_gf": 2.29,
    "promedio_gc": 0.68,
    "pj_local": 19,
    "pj_visita": 19,
    "rendimiento_local": 89.47,
    "rendimiento_visita": 77.19
  },
  "primer_tiempo": { ... },
  "segundo_tiempo": { ... }
}
```

---

### POST /api/prediction/build-stats
Construye/actualiza estadísticas de equipos.

**Body:**
```json
{
  "season_id": "SPAIN_LA_LIGA_2023-24"
}
```

**Respuesta:**
```json
{
  "success": true,
  "equipos_procesados": 20,
  "season_id": "SPAIN_LA_LIGA_2023-24",
  "message": "Estadísticas construidas exitosamente"
}
```

---

## Clasificación

### GET /api/prediction/classification
Obtiene la tabla de clasificación.

**Parámetros Query:**
| Parámetro | Tipo | Requerido | Default | Descripción |
|-----------|------|-----------|---------|-------------|
| `season_id` | string | No | - | ID de la temporada |
| `tipo_tiempo` | string | No | completo | completo, primer_tiempo, segundo_tiempo |

**Respuesta:**
```json
{
  "liga_id": "SPAIN_LA_LIGA",
  "temporada": 2023,
  "season_id": "SPAIN_LA_LIGA_2023-24",
  "tipo_tiempo": "completo",
  "clasificacion": [
    {
      "posicion": 1,
      "equipo": "Real Madrid",
      "pj": 38,
      "v": 29,
      "e": 8,
      "d": 1,
      "gf": 87,
      "gc": 26,
      "dg": 61,
      "pts": 95
    }
  ]
}
```

---

## Extracción de Datos

### POST /api/scrape/start
Inicia proceso de extracción de datos de API-Football.

**Body:**
```json
{
  "season": 2023,
  "league_ids": [140],
  "limit": null
}
```

**Nota:** Las estadísticas se construyen automáticamente al finalizar la extracción.

**Respuesta:**
```json
{
  "message": "Scraping iniciado",
  "status": "running"
}
```

---

### GET /api/scrape/status
Obtiene el estado del proceso de extracción.

**Respuesta:**
```json
{
  "is_running": true,
  "progress": 65,
  "message": "Extrayendo partidos...",
  "logs": [
    "2024-01-15 10:30:00: Proceso iniciado",
    "2024-01-15 10:30:05: Extracción completada"
  ]
}
```

---

## Validación

### GET /api/prediction/backtesting
Ejecuta validación histórica del sistema de pronósticos.

**Parámetros Query:**
| Parámetro | Tipo | Requerido | Default | Descripción |
|-----------|------|-----------|---------|-------------|
| `season_id` | string | No | - | Filtrar por temporada |
| `liga_id` | string | No | - | Filtrar por liga |
| `limite` | int | No | 100 | Máximo de partidos |

**Ejemplo:**
```
GET /api/prediction/backtesting?season_id=SPAIN_LA_LIGA_2023-24&limite=380
```

**Respuesta:**
```json
{
  "success": true,
  "backtesting": {
    "total_partidos": 380,
    "pronostico_principal": {
      "aciertos": 209,
      "total": 380,
      "porcentaje": 55.0
    },
    "doble_oportunidad": {
      "aciertos": 320,
      "total": 380,
      "porcentaje": 84.21
    },
    "ambos_marcan": {
      "aciertos": 195,
      "total": 380,
      "porcentaje": 51.32
    },
    "over_15": {
      "aciertos": 300,
      "total": 380,
      "porcentaje": 78.95
    },
    "over_25": {
      "aciertos": 241,
      "total": 380,
      "porcentaje": 63.42
    },
    "over_35": {
      "aciertos": 152,
      "total": 380,
      "porcentaje": 40.0
    },
    "roi_simulado": {
      "apuestas": 3800,
      "ganancia": 4480,
      "roi_porcentaje": 17.89
    },
    "errores": 0
  }
}
```

---

## Códigos de Error

| Código | Descripción |
|--------|-------------|
| 400 | Parámetros inválidos |
| 404 | Recurso no encontrado (equipo, temporada, etc.) |
| 500 | Error interno del servidor |

**Ejemplo de error:**
```json
{
  "detail": "No se encontraron estadísticas para el equipo: Equipo Inexistente"
}
```

---

## Notas de Uso

1. **season_id**: Formato `LIGA_ID_YYYY-YY` (ej: `SPAIN_LA_LIGA_2023-24`)
2. **liga_id**: Se puede inferir automáticamente del `season_id`
3. **Resultados**: `resultado_real` es `null` si el partido no se ha jugado
4. **H2H**: Requiere al menos 3 partidos para influir en las probabilidades
