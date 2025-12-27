# 📚 Referencia de API - Sistema PLLA 3.0

## Base URL

```
http://localhost:8001/api
```

---

## 🗓️ Temporadas

### GET /seasons

Lista todas las temporadas disponibles.

**Parámetros Query:**
| Nombre | Tipo | Requerido | Descripción |
|--------|------|-----------|-------------|
| `liga_id` | string | No | Filtrar por liga (default: todas) |

**Ejemplo:**
```bash
curl -X GET "http://localhost:8001/api/seasons?liga_id=SPAIN_LA_LIGA"
```

**Respuesta:**
```json
{
  "success": true,
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

### GET /seasons/{season_id}

Obtiene detalle de una temporada específica.

**Ejemplo:**
```bash
curl -X GET "http://localhost:8001/api/seasons/SPAIN_LA_LIGA_2023-24"
```

**Respuesta:**
```json
{
  "success": true,
  "season": {
    "season_id": "SPAIN_LA_LIGA_2023-24",
    "liga_id": "SPAIN_LA_LIGA",
    "liga_nombre": "La Liga",
    "year": 2023,
    "label": "2023-24",
    "total_partidos": 380,
    "equipos": ["Barcelona", "Real Madrid", ...]
  }
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

**Sin season_id (Vista Global):**
```bash
curl -X GET "http://localhost:8001/api/stats"
```

**Respuesta:**
```json
{
  "total_matches": 380,
  "total_leagues": 1,
  "leagues": [
    {
      "_id": "SPAIN_LA_LIGA",
      "liga_nombre": "La Liga",
      "total": 380
    }
  ],
  "avg_goals_per_match": 2.64,
  "total_goals": 1005,
  "last_update": "2024-12-02T04:33:18Z"
}
```

**Con season_id (Por Temporada):**
```bash
curl -X GET "http://localhost:8001/api/stats?season_id=SPAIN_LA_LIGA_2023-24"
```

**Respuesta:**
```json
{
  "total_matches": 380,
  "total_leagues": 10,
  "leagues": [
    {"_id": "Regular Season - 1", "total": 10},
    {"_id": "Regular Season - 2", "total": 10},
    ...
  ],
  "avg_goals_per_match": 2.64,
  "total_goals": 1005,
  "last_update": "2024-12-02T04:33:18Z",
  "season_id": "SPAIN_LA_LIGA_2023-24",
  "season_label": "2023-24"
}
```

---

## ⚽ Pronósticos

### POST /prediction/build-stats

Construye estadísticas de equipos para una temporada.

**Body:**
```json
{
  "season_id": "SPAIN_LA_LIGA_2023-24"
}
```

**O (legacy):**
```json
{
  "liga_id": "SPAIN_LA_LIGA",
  "temporada": 2023
}
```

**Ejemplo:**
```bash
curl -X POST "http://localhost:8001/api/prediction/build-stats" \
  -H "Content-Type: application/json" \
  -d '{"season_id": "SPAIN_LA_LIGA_2023-24"}'
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Estadísticas construidas para 20 equipos",
  "season_id": "SPAIN_LA_LIGA_2023-24",
  "equipos": ["Real Madrid", "Barcelona", ...]
}
```

---

### POST /prediction/generate

Genera un pronóstico para un partido.

**Body:**
```json
{
  "equipo_local": "Barcelona",
  "equipo_visitante": "Real Madrid",
  "season_id": "SPAIN_LA_LIGA_2023-24"
}
```

**Ejemplo:**
```bash
curl -X POST "http://localhost:8001/api/prediction/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "equipo_local": "Barcelona",
    "equipo_visitante": "Real Madrid",
    "season_id": "SPAIN_LA_LIGA_2023-24"
  }'
```

**Respuesta:**
```json
{
  "success": true,
  "pronostico": {
    "id": "uuid-xxx",
    "equipo_local": "Barcelona",
    "equipo_visitante": "Real Madrid",
    "season_id": "SPAIN_LA_LIGA_2023-24",
    "tiempo_completo": {
      "pronostico": "E",
      "doble_oportunidad": "1X",
      "ambos_marcan": "SI",
      "probabilidades": {
        "local": 36.88,
        "empate": 27.85,
        "visita": 35.27
      },
      "confianza": 42.54
    },
    "primer_tiempo": { ... },
    "segundo_tiempo": { ... }
  }
}
```

---

### GET /prediction/classification

Obtiene la tabla de clasificación.

**Parámetros Query:**
| Nombre | Tipo | Requerido | Descripción |
|--------|------|-----------|-------------|
| `season_id` | string | Sí* | ID de temporada |
| `liga_id` | string | No | Legacy: ID de liga |
| `temporada` | int | No | Legacy: Año |
| `tipo_tiempo` | string | No | `completo`, `primer_tiempo`, `segundo_tiempo` |

*Se puede usar `season_id` O `liga_id` + `temporada`

**Ejemplo:**
```bash
curl -X GET "http://localhost:8001/api/prediction/classification?season_id=SPAIN_LA_LIGA_2023-24&tipo_tiempo=completo"
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
      "pj": 38,
      "v": 29,
      "e": 8,
      "d": 1,
      "gf": 87,
      "gc": 26,
      "dif": 61,
      "pts": 95,
      "rendimiento": 83.33
    },
    ...
  ]
}
```

---

### GET /prediction/teams

Lista todos los equipos con estadísticas básicas.

**Parámetros Query:**
| Nombre | Tipo | Requerido | Descripción |
|--------|------|-----------|-------------|
| `season_id` | string | Sí* | ID de temporada |
| `liga_id` | string | No | Legacy: ID de liga |
| `temporada` | int | No | Legacy: Año |

**Ejemplo:**
```bash
curl -X GET "http://localhost:8001/api/prediction/teams?season_id=SPAIN_LA_LIGA_2023-24"
```

**Respuesta:**
```json
{
  "success": true,
  "season_id": "SPAIN_LA_LIGA_2023-24",
  "total_equipos": 20,
  "equipos": [
    {
      "nombre": "Real Madrid",
      "puntos": 95,
      "partidos_jugados": 38,
      "rendimiento": 83.33
    },
    ...
  ]
}
```

---

### GET /prediction/team/{nombre}

Obtiene estadísticas detalladas de un equipo.

**Parámetros Path:**
| Nombre | Tipo | Descripción |
|--------|------|-------------|
| `nombre` | string | Nombre del equipo |

**Parámetros Query:**
| Nombre | Tipo | Requerido | Descripción |
|--------|------|-----------|-------------|
| `season_id` | string | Sí | ID de temporada |

**Ejemplo:**
```bash
curl -X GET "http://localhost:8001/api/prediction/team/Barcelona?season_id=SPAIN_LA_LIGA_2023-24"
```

**Respuesta:**
```json
{
  "success": true,
  "equipo": {
    "nombre": "Barcelona",
    "season_id": "SPAIN_LA_LIGA_2023-24",
    "tiempo_completo": {
      "partidos_jugados": 38,
      "victorias": 26,
      "empates": 7,
      "derrotas": 5,
      "goles_favor": 79,
      "goles_contra": 44,
      "puntos": 85,
      "rendimiento_general": 74.56,
      "pj_local": 19,
      "v_local": 16,
      "rendimiento_local": 84.21,
      "pj_visitante": 19,
      "v_visitante": 10,
      "rendimiento_visitante": 59.65
    },
    "primer_tiempo": { ... },
    "segundo_tiempo": { ... }
  }
}
```

---

### POST /prediction/validate

Valida un pronóstico contra el resultado real.

**Body:**
```json
{
  "pronostico_id": "uuid-xxx",
  "goles_local_tr": 2,
  "goles_visitante_tr": 1,
  "goles_local_1mt": 1,
  "goles_visitante_1mt": 0
}
```

**Respuesta:**
```json
{
  "success": true,
  "validacion": {
    "pronostico_id": "uuid-xxx",
    "tiempo_completo": {
      "pronostico": "E",
      "resultado_real": "L",
      "acierto_principal": false,
      "doble_oportunidad_gana": true,
      "ambos_marcan_gana": true
    },
    ...
  }
}
```

---

### GET /prediction/effectiveness

Obtiene métricas de efectividad del sistema.

**Ejemplo:**
```bash
curl -X GET "http://localhost:8001/api/prediction/effectiveness"
```

**Respuesta:**
```json
{
  "success": true,
  "total_validaciones": 150,
  "tiempo_completo": {
    "principal": { "aciertos": 65, "accuracy": 43.33 },
    "doble_oportunidad": { "aciertos": 112, "accuracy": 74.67 },
    "ambos_marcan": { "aciertos": 98, "accuracy": 65.33 }
  }
}
```

---

### GET /prediction/config

Obtiene la configuración actual del algoritmo.

**Ejemplo:**
```bash
curl -X GET "http://localhost:8001/api/prediction/config"
```

**Respuesta:**
```json
{
  "version": "1.0.0",
  "umbrales": {
    "PROB_LOCAL_MIN": 43.0,
    "PROB_LOCAL_MAX": 69.5,
    "PROB_EMPATE_MAX": 20.0,
    "SUMA_PROB_MIN": 116.0,
    "UMBRAL_AMBOS_MARCAN": 45.0
  },
  "factores": {
    "FACTOR_5_MIN": 80.0,
    "FACTOR_4_MIN": 60.0,
    "FACTOR_3_MIN": 40.0,
    "FACTOR_2_MIN": 20.0
  }
}
```

---

## 📋 Datos

### POST /matches/search

Busca partidos con filtros.

**Body:**
```json
{
  "season_id": "SPAIN_LA_LIGA_2023-24",
  "liga_id": "",
  "fecha_inicio": "",
  "fecha_fin": "",
  "equipo": "",
  "limit": 50,
  "skip": 0
}
```

**Respuesta:**
```json
{
  "success": true,
  "matches": [...],
  "total": 380,
  "page": 1,
  "pages": 8
}
```

---

### POST /export

Exporta datos a CSV o JSON.

**Body:**
```json
{
  "format": "csv",
  "season_id": "SPAIN_LA_LIGA_2023-24",
  "liga_id": null,
  "limit": 10000
}
```

**Respuesta:** Archivo CSV/JSON descargable.

---

### GET /leagues

Lista todas las ligas disponibles.

**Respuesta:**
```json
[
  {
    "_id": "SPAIN_LA_LIGA",
    "liga_nombre": "La Liga",
    "total": 380
  }
]
```

---

### POST /scrape-league

Inicia extracción de datos de API-Football.

**Body:**
```json
{
  "league_id": 140,
  "season": 2024,
  "liga_id": "SPAIN_LA_LIGA"
}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Scraping iniciado",
  "season_id": "SPAIN_LA_LIGA_2024-25",
  "partidos_procesados": 150
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
  "detail": "Equipo 'EquipoInexistente' no encontrado"
}
```

---

## 🔄 Compatibilidad Legacy

Todos los endpoints mantienen compatibilidad con el sistema anterior:

| Nuevo (Recomendado) | Legacy (Compatible) |
|---------------------|---------------------|
| `?season_id=SPAIN_LA_LIGA_2023-24` | `?liga_id=SPAIN_LA_LIGA&temporada=2023` |

---

*Documentación API - Sistema PLLA 3.0.1 - Diciembre 2024*