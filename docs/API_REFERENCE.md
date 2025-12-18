# 📚 Referencia de API - Sistema PLLA 3.0

## Base URL

```
Producción: https://[tu-dominio]/api
Desarrollo: http://localhost:8001/api
```

## Autenticación

Actualmente la API no requiere autenticación.

---

## Endpoints de Pronósticos

### POST /prediction/build-stats

Construye las estadísticas de todos los equipos de una liga. **Debe ejecutarse antes de generar pronósticos.**

**Request Body:**
```json
{
  "liga_id": "SPAIN_LA_LIGA",
  "temporada": 2023
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Estadísticas construidas para 20 equipos",
  "liga_id": "SPAIN_LA_LIGA",
  "temporada": 2023,
  "equipos": ["SPAIN_LA_LIGA_Real Madrid", "SPAIN_LA_LIGA_Barcelona", ...]
}
```

---

### GET /prediction/classification

Obtiene la tabla de clasificación de una liga.

**Query Parameters:**
| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `liga_id` | string | No | ID de la liga (default: SPAIN_LA_LIGA) |
| `temporada` | int | No | Año (default: 2023) |
| `tipo_tiempo` | string | No | "completo", "primer_tiempo", "segundo_tiempo" |

**Response (200):**
```json
{
  "liga_id": "SPAIN_LA_LIGA",
  "temporada": 2023,
  "tipo_tiempo": "completo",
  "total_equipos": 20,
  "fecha_actualizacion": "2024-12-18T00:30:00Z",
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
      "rendimiento": 83.33,
      "local": {
        "pj": 19, "v": 16, "e": 3, "d": 0,
        "gf": 50, "gc": 9, "pts": 51, "rendimiento": 89.47
      },
      "visitante": {
        "pj": 19, "v": 13, "e": 5, "d": 1,
        "gf": 37, "gc": 17, "pts": 44, "rendimiento": 77.19
      }
    },
    ...
  ]
}
```

---

### POST /prediction/generate

**⭐ Endpoint Principal** - Genera un pronóstico para un partido.

**Request Body:**
```json
{
  "equipo_local": "Barcelona",
  "equipo_visitante": "Real Madrid",
  "liga_id": "SPAIN_LA_LIGA",
  "temporada": 2023
}
```

**Response (200):**
```json
{
  "success": true,
  "pronostico": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "partido_id": null,
    "equipo_local": "Barcelona",
    "equipo_visitante": "Real Madrid",
    "liga_id": "SPAIN_LA_LIGA",
    
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
    
    "primer_tiempo": {
      "pronostico": "L",
      "doble_oportunidad": "1X",
      "ambos_marcan": "NO",
      "probabilidades": {
        "local": 45.12,
        "empate": 32.45,
        "visita": 22.43
      },
      "confianza": 51.23
    },
    
    "segundo_tiempo": {
      "pronostico": "V",
      "doble_oportunidad": "X2",
      "ambos_marcan": "SI",
      "probabilidades": {
        "local": 28.34,
        "empate": 25.67,
        "visita": 45.99
      },
      "confianza": 55.67
    },
    
    "version_algoritmo": "1.0.0",
    "fecha_generacion": "2024-12-18T00:32:14.432759Z"
  }
}
```

**Códigos de Pronóstico:**
| Código | Significado |
|--------|-------------|
| `L` | Victoria Local |
| `E` | Empate |
| `V` | Victoria Visitante |
| `1X` | Local o Empate |
| `X2` | Empate o Visita |
| `12` | Local o Visita (sin empate) |
| `SI` | Ambos equipos marcarán |
| `NO` | Al menos uno no marcará |

**Errores:**
- `404`: Equipo no encontrado
- `500`: Error interno del servidor

---

### GET /prediction/team/{nombre}

Obtiene las estadísticas detalladas de un equipo.

**Path Parameters:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `nombre` | string | Nombre del equipo (ej: "Barcelona") |

**Query Parameters:**
| Parámetro | Tipo | Requerido | Default |
|-----------|------|-----------|-------------|
| `liga_id` | string | No | SPAIN_LA_LIGA |
| `temporada` | int | No | 2023 |

**Response (200):**
```json
{
  "nombre": "Barcelona",
  "liga_id": "SPAIN_LA_LIGA",
  "temporada": 2023,
  
  "tiempo_completo": {
    "partidos_jugados": 38,
    "victorias": 25,
    "empates": 7,
    "derrotas": 6,
    "goles_favor": 79,
    "goles_contra": 44,
    "diferencia_goles": 35,
    "puntos": 82,
    "pj_local": 19,
    "v_local": 15,
    "e_local": 3,
    "d_local": 1,
    "gf_local": 46,
    "gc_local": 15,
    "pts_local": 48,
    "pj_visita": 19,
    "v_visita": 10,
    "e_visita": 4,
    "d_visita": 5,
    "gf_visita": 33,
    "gc_visita": 29,
    "pts_visita": 34,
    "rendimiento_general": 71.93,
    "rendimiento_local": 84.21,
    "rendimiento_visita": 59.65,
    "promedio_gf": 2.08,
    "promedio_gc": 1.16
  },
  
  "primer_tiempo": { ... },
  "segundo_tiempo": { ... }
}
```

---

### POST /prediction/validate

Valida un pronóstico contra el resultado real del partido.

**Request Body:**
```json
{
  "pronostico_id": "550e8400-e29b-41d4-a716-446655440000",
  "gol_local_tc": 2,
  "gol_visita_tc": 1,
  "gol_local_1mt": 1,
  "gol_visita_1mt": 0
}
```

**Response (200):**
```json
{
  "success": true,
  "validacion": {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "pronostico_id": "550e8400-e29b-41d4-a716-446655440000",
    "resultado_real": {
      "gol_local_tc": 2,
      "gol_visita_tc": 1
    },
    "tiempo_completo": {
      "doble_oportunidad": "GANA",
      "ambos_marcan": "GANA",
      "acierto_principal": true
    }
  }
}
```

**Valores de Validación:**
| Valor | Significado |
|-------|-------------|
| `GANA` | El pronóstico fue correcto |
| `PIERDE` | El pronóstico fue incorrecto |

---

### GET /prediction/effectiveness

Obtiene las métricas de efectividad del sistema.

**Response (200):**
```json
{
  "success": true,
  "efectividad": {
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
    },
    "primer_tiempo": { ... },
    "segundo_tiempo": { ... },
    "version_algoritmo": "1.0.0"
  }
}
```

---

### GET /prediction/config

Obtiene la configuración actual del algoritmo.

**Response (200):**
```json
{
  "version": "1.0.0",
  "umbrales": {
    "PROB_LOCAL_MIN": 43.0,
    "PROB_LOCAL_MAX": 69.5,
    "PROB_EMPATE_MAX": 20.0,
    "DIFERENCIA_EMPATE": 10.0,
    "SUMA_PROB_MIN": 116.0,
    "SUMA_PROB_MAX": 123.0,
    "PROB_VISITA_MAX": 42.0,
    "UMBRAL_AMBOS_MARCAN": 45.0,
    "FACTOR_5_MIN": 80.0,
    "FACTOR_4_MIN": 60.0,
    "FACTOR_3_MIN": 40.0,
    "FACTOR_2_MIN": 20.0
  },
  "config": {
    "version": "1.0.0",
    "puntos_victoria": 3,
    "puntos_empate": 1,
    "puntos_derrota": 0,
    "min_partidos_confiable": 5,
    "promedios_por_defecto": {
      "prob_local": 44.0,
      "prob_empate": 28.0,
      "prob_visita": 28.0,
      "goles_local": 1.48,
      "goles_visita": 1.16
    }
  }
}
```

---

### GET /prediction/teams

Lista todos los equipos disponibles.

**Query Parameters:**
| Parámetro | Tipo | Requerido | Default |
|-----------|------|-----------|-------------|
| `liga_id` | string | No | SPAIN_LA_LIGA |
| `temporada` | int | No | 2023 |

**Response (200):**
```json
{
  "liga_id": "SPAIN_LA_LIGA",
  "temporada": 2023,
  "total": 20,
  "equipos": [
    {
      "nombre": "Real Madrid",
      "puntos": 95,
      "partidos_jugados": 38,
      "rendimiento": 83.33
    },
    {
      "nombre": "Barcelona",
      "puntos": 82,
      "partidos_jugados": 38,
      "rendimiento": 71.93
    },
    ...
  ]
}
```

---

## Endpoints de Datos

### GET /stats

Obtiene estadísticas generales del sistema.

**Response (200):**
```json
{
  "total_matches": 380,
  "total_leagues": 1,
  "avg_goals_per_match": 2.64,
  "total_goals": 1005,
  "leagues": [
    {
      "_id": "SPAIN_LA_LIGA",
      "liga_nombre": "La Liga",
      "total": 380
    }
  ],
  "last_update": "2024-12-18T00:00:00Z"
}
```

### GET /matches

Obtiene lista de partidos.

**Query Parameters:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `liga_id` | string | Filtrar por liga |
| `season` | int | Filtrar por temporada |
| `limit` | int | Límite de resultados |

---

## Códigos de Error

| Código | Descripción |
|--------|-------------|
| 200 | Éxito |
| 400 | Request inválido |
| 404 | Recurso no encontrado |
| 500 | Error interno del servidor |

**Formato de Error:**
```json
{
  "detail": "Mensaje de error descriptivo"
}
```

---

*Documentación de API v1.0.0 - Diciembre 2024*
