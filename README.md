# ⚽ Sistema de Pronósticos Deportivos PLLA 3.0

## 📋 Descripción

Sistema completo de análisis y pronósticos de fútbol basado en el modelo Excel PLLA 3.0.
Convierte la lógica compleja del Excel (526,550+ fórmulas) en una aplicación web moderna.

**Stack Tecnológico:**
- **Backend:** Python 3.11 + FastAPI + Motor (MongoDB async)
- **Frontend:** React 18 + React Router + Axios
- **Base de Datos:** MongoDB
- **Data Source:** API-Football

---

## 🆕 Novedades v3.1.0 (Diciembre 2024)

### Nuevas Funcionalidades
- ✅ **Sistema Multi-Liga:** Soporte completo para múltiples ligas (La Liga, Premier League, Serie A, etc.)
- ✅ **Over/Under Goles:** Predicciones de Over/Under 1.5, 2.5 y 3.5 goles
- ✅ **Goles Esperados:** Cálculo de goles esperados por equipo usando Poisson
- ✅ **Forma Reciente:** Análisis de los últimos 5 partidos de cada equipo
- ✅ **Ajuste por Forma:** Las probabilidades se ajustan según el rendimiento reciente (30%)
- ✅ **Selector de Liga:** Nuevo componente para cambiar entre ligas
- ✅ **Exportación de Datos:** Exportar datos para uso local

### Correcciones
- ✅ El endpoint `/prediction/generate` ahora usa correctamente `season_id`
- ✅ El endpoint `/prediction/teams` filtra correctamente por liga
- ✅ El endpoint `/prediction/build-stats` extrae `liga_id` del `season_id`

---

## 🚀 Instalación Local

### Prerrequisitos

- **Python 3.11+** (recomendado, 3.10 mínimo)
- **Node.js 18+** y **Yarn**
- **MongoDB** (local o Atlas)

### Paso 1: Clonar el Proyecto

```bash
git clone <tu-repositorio>
cd app
```

### Paso 2: Configurar Backend

```bash
cd backend

# Crear entorno virtual
python -m venv venv

# Activar entorno virtual
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt
```

### Paso 3: Configurar Variables de Entorno (Backend)

Crea o edita el archivo `backend/.env`:

```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=test_database
API_FOOTBALL_KEY=tu_api_key_aqui
```

### Paso 4: Importar Datos (Opcional pero Recomendado)

Si tienes los archivos de exportación de datos:

```bash
cd backend
python import_data.py
```

Esto importará:
- La Liga 2023-24 (380 partidos, 20 equipos)
- Premier League 2022-23 (380 partidos, 20 equipos)

### Paso 5: Configurar Frontend

```bash
cd frontend
yarn install
```

Archivo `frontend/.env`:
```env
REACT_APP_BACKEND_URL=http://localhost:8001
```

### Paso 6: Iniciar la Aplicación

```bash
# Terminal 1 - Backend
cd backend
uvicorn server:app --host 0.0.0.0 --port 8001 --reload

# Terminal 2 - Frontend
cd frontend
yarn start
```

La aplicación estará disponible en:
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8001/api
- **Documentación API:** http://localhost:8001/docs

---

## 📁 Estructura del Proyecto

```
app/
├── README.md                    # Esta documentación
├── data_export/                 # Datos exportados para uso local
│   ├── football_matches.json    # Partidos (760)
│   ├── team_statistics.json     # Estadísticas de equipos (40)
│   ├── seasons.json             # Temporadas (2)
│   └── import_data.py           # Script de importación
├── docs/
│   ├── MOTOR_PRONOSTICOS.md     # Documentación técnica del algoritmo
│   ├── ANALISIS_SEASON_ID.md    # Implementación season_id
│   └── API_REFERENCE.md         # Referencia completa de la API
├── backend/
│   ├── server.py                # Servidor FastAPI principal
│   ├── requirements.txt         # Dependencias Python
│   ├── .env                     # Variables de entorno
│   ├── api_football/            # Módulo de extracción de datos
│   └── prediction_engine/       # Motor de pronósticos PLLA 3.0
│       ├── config.py            # Umbrales y configuración
│       ├── models.py            # Modelos Pydantic
│       ├── stats_builder.py     # Constructor de estadísticas
│       ├── classification.py    # Motor de clasificación
│       ├── prediction_engine.py # Motor de pronósticos
│       └── validation.py        # Validador GANA/PIERDE
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── LeagueSelector.jsx    # 🆕 Selector de ligas
    │   │   └── SeasonSelector.jsx    # Selector de temporadas
    │   └── pages/
    │       ├── Dashboard.jsx         # Vista global/por temporada
    │       ├── Predictions.jsx       # 🆕 Con Over/Under y forma
    │       ├── Classification.jsx    # Tabla de posiciones
    │       ├── TeamStats.jsx         # Estadísticas por equipo
    │       ├── Matches.jsx           # Listado de partidos
    │       └── Scraping.jsx          # Extracción de datos
    └── package.json
```

---

## 🎯 Funcionalidades

### Motor de Pronósticos

| Funcionalidad | Descripción |
|--------------|-------------|
| **Pronóstico Principal** | L (Local) / E (Empate) / V (Visitante) |
| **Doble Oportunidad** | 1X / X2 / 12 |
| **Ambos Marcan** | SI / NO |
| **Over/Under 1.5** | 🆕 Predicción con probabilidad |
| **Over/Under 2.5** | 🆕 Predicción con probabilidad |
| **Over/Under 3.5** | 🆕 Predicción con probabilidad |
| **Goles Esperados** | 🆕 Local, Visitante, Total |
| **Forma Reciente** | 🆕 Últimos 5 partidos (V/E/D) |
| **Tres Tiempos** | Completo, 1er Tiempo, 2do Tiempo |

### Sistema Multi-Liga

| Liga | ID API-Football | Soporte |
|------|-----------------|--------|
| La Liga (España) | 140 | ✅ Completo |
| Premier League (Inglaterra) | 39 | ✅ Completo |
| Serie A (Italia) | 135 | ✅ Disponible |
| Bundesliga (Alemania) | 78 | ✅ Disponible |
| Ligue 1 (Francia) | 61 | ✅ Disponible |
| Liga MX (México) | 262 | ✅ Disponible |

---

## 🔌 API Endpoints Principales

### Pronósticos

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/prediction/generate` | Genera pronóstico completo |
| POST | `/api/prediction/build-stats` | Construye estadísticas |
| GET | `/api/prediction/teams?season_id=X` | Lista equipos |
| GET | `/api/prediction/classification?season_id=X` | Tabla de posiciones |

### Datos

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/leagues` | Lista de ligas |
| GET | `/api/seasons` | Lista de temporadas |
| GET | `/api/stats?season_id=X` | Estadísticas generales |
| POST | `/api/export` | Exportar datos CSV/JSON |

### Ejemplo: Generar Pronóstico

```bash
curl -X POST "http://localhost:8001/api/prediction/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "equipo_local": "Manchester City",
    "equipo_visitante": "Arsenal",
    "liga_id": "ENGLAND_PREMIER_LEAGUE",
    "season_id": "ENGLAND_PREMIER_LEAGUE_2022-23"
  }'
```

**Respuesta:**
```json
{
  "success": true,
  "pronostico": {
    "equipo_local": "Manchester City",
    "equipo_visitante": "Arsenal",
    "season_id": "ENGLAND_PREMIER_LEAGUE_2022-23",
    "tiempo_completo": {
      "pronostico": "L",
      "doble_oportunidad": "1X",
      "ambos_marcan": "SI",
      "probabilidades": {"local": 48.5, "empate": 26.3, "visita": 25.2},
      "over_under": {
        "over_15": {"prediccion": "OVER", "probabilidad": 92.1},
        "over_25": {"prediccion": "OVER", "probabilidad": 80.3},
        "over_35": {"prediccion": "OVER", "probabilidad": 62.5}
      },
      "goles_esperados": {"local": 2.1, "visitante": 1.5, "total": 3.6}
    },
    "forma_reciente": {
      "local": {"ultimos_5": ["V","V","V","V","E"], "rendimiento": 86.67},
      "visitante": {"ultimos_5": ["V","V","V","V","V"], "rendimiento": 100.0}
    }
  }
}
```

---

## ⚙️ Configuración del Algoritmo

### Umbrales Principales (config.py)

| Parámetro | Valor | Descripción |
|-----------|-------|-------------|
| `PROB_LOCAL_MIN` | 43% | Mínimo para pronosticar LOCAL |
| `PROB_LOCAL_MAX` | 69.5% | Máximo antes de "muy favorito" |
| `PROB_EMPATE_MAX` | 20% | Máximo de empate para decidir |
| `UMBRAL_AMBOS_MARCAN` | 45% | Umbral para SI/NO |
| `PESO_FORMA_RECIENTE` | 30% | 🆕 Peso de forma vs temporada |
| `PARTIDOS_FORMA_RECIENTE` | 5 | 🆕 Últimos N partidos |

---

## 📊 Datos Disponibles

El proyecto incluye datos pre-exportados en `/data_export/`:

| Liga | Temporada | Partidos | Equipos |
|------|-----------|----------|--------|
| La Liga (España) | 2023-24 | 380 | 20 |
| Premier League (Inglaterra) | 2022-23 | 380 | 20 |
| **Total** | | **760** | **40** |

Para importar estos datos en tu MongoDB local:
```bash
cd backend
python import_data.py
```

---

## 🛠️ Solución de Problemas

### "No hay equipos disponibles"
1. Verifica que MongoDB esté corriendo
2. Importa los datos: `python import_data.py`
3. O extrae datos nuevos desde la página de Extracción

### "Error de conexión al backend"
1. Verifica que el backend esté corriendo en puerto 8001
2. Revisa `REACT_APP_BACKEND_URL` en `frontend/.env`

### "API-Football: Account suspended"
1. Verifica tu API key en https://dashboard.api-football.com
2. El plan gratuito tiene límite de 100 llamadas/día

---

## 📚 Documentación Adicional

- **[Motor de Pronósticos](/docs/MOTOR_PRONOSTICOS.md)** - Algoritmo detallado
- **[Referencia API](/docs/API_REFERENCE.md)** - Todos los endpoints
- **[Análisis Season ID](/docs/ANALISIS_SEASON_ID.md)** - Sistema de temporadas

---

## 📝 Changelog

### v3.1.0 (Diciembre 2024)
- Sistema multi-liga completo
- Over/Under goles con Poisson
- Goles esperados
- Forma reciente (últimos 5)
- Ajuste de probabilidades por forma
- Exportación de datos para uso local
- Corrección de bugs en endpoints

### v3.0.1 (Diciembre 2024)
- Implementación de `season_id`
- Selector de temporada
- Documentación mejorada

### v3.0.0 (Diciembre 2024)
- Versión inicial del Motor PLLA 3.0
- Sistema de pronósticos completo
- Integración con API-Football

---

## 📄 Licencia

Proyecto privado - PLLA 3.0

---

*Documentación actualizada: Diciembre 2024*
