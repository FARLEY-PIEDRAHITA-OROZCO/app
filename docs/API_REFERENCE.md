# 📚 Referencia de API - Sistema PLLA 3.0

> **Versión:** 3.1.0 | **Última actualización:** Diciembre 2024

## Base URL

```
Local: http://localhost:8001/api
Producción: {REACT_APP_BACKEND_URL}/api
```

---

## 🏆 Ligas

### GET /leagues

Lista todas las ligas disponibles en la base de datos.

**Ejemplo:**
```bash
curl -X GET "http://localhost:8001/api/leagues"
```

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

## 🗓️ Temporadas

### GET /seasons

Lista todas las temporadas disponibles.

**Parámetros Query:**
| Nombre | Tipo | Requerido | Descripción |
|--------|------|-----------|-------------|
| `liga_id` | string | No | Filtrar por liga |

**Ejemplo:**
```bash
curl -X GET "http://localhost:8001/api/seasons?liga_id=ENGLAND_PREMIER_LEAGUE"
```

**Respuesta:**
```json
{
  "total": 1,
  "seasons": [
    {
      "season_id": "ENGLAND_PREMIER_LEAGUE_2022-23",
      "liga_id": "ENGLAND_PREMIER_LEAGUE",
      "year": 2022,
      "label": "2022-23",
      "total_partidos": 380
    }
  ]
}
```

---

## ⚽ Pronósticos

### POST /prediction/generate

Genera un pronóstico completo para un partido.

**Body:**
```json
{
  "equipo_local": "Manchester City",
  "equipo_visitante": "Arsenal",
  "liga_id": "ENGLAND_PREMIER_LEAGUE",
  "season_id": "ENGLAND_PREMIER_LEAGUE_2022-23"
}
```

**Respuesta Completa:**
```json
{
  "success": true,
  "pronostico": {
    "id": "uuid-xxx",
    "equipo_local": "Manchester City",
    "equipo_visitante": "Arsenal",
    "liga_id": "ENGLAND_PREMIER_LEAGUE",
    "season_id": "ENGLAND_PREMIER_LEAGUE_2022-23",
    "tiempo_completo": {
      "pronostico": "L",
      "doble_oportunidad": "1X",
      "ambos_marcan": "SI",
      "probabilidades": {
        "local": 48.52,
        "empate": 26.31,
        "visita": 25.17
      },
      "confianza": 52.34,
      "over_under": {
        "over_15": {"prediccion": "OVER", "probabilidad": 92.14},
        "over_25": {"prediccion": "OVER", "probabilidad": 80.32},
        "over_35": {"prediccion": "OVER", "probabilidad": 62.47}
      },
      "goles_esperados": {
        "local": 2.12,
        "visitante": 1.48,
        "total": 3.60
      }
    },
    "primer_tiempo": {
      "pronostico": "L",
      "doble_oportunidad": "1X",
      "ambos_marcan": "NO",
      "probabilidades": {"local": 45.2, "empate": 32.1, "visita": 22.7},
      "over_under": {
        "over_15": {"prediccion": "UNDER", "probabilidad": 59.3},
        "over_25": {"prediccion": "UNDER", "probabilidad": 83.1},
        "over_35": {"prediccion": "UNDER", "probabilidad": 94.2}
      },
      "goles_esperados": {"local": 0.95, "visitante": 0.67, "total": 1.62}
    },
    "segundo_tiempo": {
      "pronostico": "L",
      "doble_oportunidad": "1X",
      "ambos_marcan": "NO",
      "probabilidades": {"local": 44.8, "empate": 30.5, "visita": 24.7},
      "over_under": {
        "over_15": {"prediccion": "OVER", "probabilidad": 51.2},
        "over_25": {"prediccion": "UNDER", "probabilidad": 76.4},
        "over_35": {"prediccion": "UNDER", "probabilidad": 91.8}
      },
      "goles_esperados": {"local": 1.17, "visitante": 0.81, "total": 1.98}
    },
    "forma_reciente": {
      "local": {
        "ultimos_5": ["V", "V", "V", "V", "E"],
        "rendimiento": 86.67,
        "goles_favor_avg": 3.8,
        "goles_contra_avg": 0.6,
        "racha": "4 victorias consecutivas"
      },
      "visitante": {
        "ultimos_5": ["V", "V", "V", "V", "V"],
        "rendimiento": 100.0,
        "goles_favor_avg": 2.6,
        "goles_contra_avg": 0.4,
        "racha": "5 victorias consecutivas"
      }
    },
    "version_algoritmo": "1.0.0",
    "fecha_generacion": "2024-12-27T08:00:00Z"
  }
}
```

---

### POST /prediction/build-stats

Construye estadísticas de equipos para una temporada.

**Body:**
```json
{
  "season_id": "ENGLAND_PREMIER_LEAGUE_2022-23"
}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Estadísticas construidas para 20 equipos",
  "liga_id": "ENGLAND_PREMIER_LEAGUE",
  "temporada": 2022,
  "season_id": "ENGLAND_PREMIER_LEAGUE_2022-23",
  "equipos": ["Manchester City", "Arsenal", "Manchester United", ...]
}
```

---

### GET /prediction/teams

Lista todos los equipos disponibles para pronósticos.

**Parámetros Query:**
| Nombre | Tipo | Requerido | Descripción |
|--------|------|-----------|-------------|
| `season_id` | string | Sí* | ID de temporada estructurado |
| `liga_id` | string | No | Legacy: ID de liga |
| `temporada` | int | No | Legacy: Año |

**Ejemplo:**
```bash
curl "http://localhost:8001/api/prediction/teams?season_id=ENGLAND_PREMIER_LEAGUE_2022-23"
```

**Respuesta:**
```json
{
  "liga_id": "ENGLAND_PREMIER_LEAGUE",
  "temporada": 2022,
  "season_id": "ENGLAND_PREMIER_LEAGUE_2022-23",
  "total_equipos": 20,
  "equipos": [
    {"nombre": "Manchester City", "puntos": 89, "rendimiento": 78.07},
    {"nombre": "Arsenal", "puntos": 84, "rendimiento": 73.68},
    {"nombre": "Manchester United", "puntos": 75, "rendimiento": 65.79},
    ...
  ]
}
```

---

### GET /prediction/classification

Obtiene la tabla de clasificación.

**Parámetros Query:**
| Nombre | Tipo | Requerido | Descripción |
|--------|------|-----------|-------------|
| `season_id` | string | Sí* | ID de temporada |
| `tipo_tiempo` | string | No | `completo`, `primer_tiempo`, `segundo_tiempo` |

**Ejemplo:**
```bash
curl "http://localhost:8001/api/prediction/classification?season_id=SPAIN_LA_LIGA_2023-24&tipo_tiempo=completo"
```

**Respuesta:**
```json
{
  "success": true,
  "liga_id": "SPAIN_LA_LIGA",
  "season_id": "SPAIN_LA_LIGA_2023-24",
  "tipo_tiempo": "completo",
  "total_equipos": 20,
  "clasificacion": [
    {
      "posicion": 1,
      "equipo": "Real Madrid",
      "pj": 38, "v": 29, "e": 8, "d": 1,
      "gf": 87, "gc": 26, "dif": 61,
      "pts": 95, "rendimiento": 83.33
    },
    ...
  ]
}
```

---

## 📊 Estadísticas

### GET /stats

Obtiene estadísticas generales del sistema.

**Parámetros Query:**
| Nombre | Tipo | Requerido | Descripción |
|--------|------|-----------|-------------|
| `season_id` | string | No | Filtrar por temporada |

**Ejemplo (Vista Global):**
```bash
curl "http://localhost:8001/api/stats"
```

**Ejemplo (Por Temporada):**
```bash
curl "http://localhost:8001/api/stats?season_id=SPAIN_LA_LIGA_2023-24"
```

---

## 📥 Exportación

### POST /export

Exporta datos a CSV o JSON.

**Body:**
```json
{
  "format": "json",
  "season_id": "SPAIN_LA_LIGA_2023-24",
  "limit": 10000
}
```

**Respuesta:** Archivo descargable (CSV o JSON)

---

## 🔄 Extracción de Datos

### POST /scrape/start

Inicia extracción de datos desde API-Football.

**Body:**
```json
{
  "season": 2022,
  "league_ids": [39],
  "limit": 1
}
```

**IDs de Ligas:**
| Liga | ID |
|------|----|
| La Liga | 140 |
| Premier League | 39 |
| Serie A | 135 |
| Bundesliga | 78 |
| Ligue 1 | 61 |
| Liga MX | 262 |

### GET /scrape/status

Obtiene el estado del proceso de extracción.

**Respuesta:**
```json
{
  "is_running": false,
  "progress": 100,
  "message": "Proceso completado"
}
```

---

## ❌ Códigos de Error

| Código | Descripción |
|--------|-------------|
| 400 | Parámetros inválidos |
| 404 | Recurso no encontrado |
| 500 | Error interno del servidor |

**Ejemplo de error:**
```json
{
  "detail": "No se encontraron estadísticas para Manchester City"
}
```

---

## 🔄 Compatibilidad Legacy

Todos los endpoints mantienen compatibilidad con el formato anterior:

| Nuevo (Recomendado) | Legacy (Compatible) |
|---------------------|---------------------|
| `?season_id=SPAIN_LA_LIGA_2023-24` | `?liga_id=SPAIN_LA_LIGA&temporada=2023` |

---

*Documentación API - Sistema PLLA 3.1.0 - Diciembre 2024*
