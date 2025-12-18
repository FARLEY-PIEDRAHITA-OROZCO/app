# ⚽ Sistema de Pronósticos Deportivos PLLA 3.0

## 📋 Descripción

Sistema completo de análisis y pronósticos de fútbol basado en el modelo Excel PLLA 3.0.
Convierte la lógica compleja del Excel (526,550+ fórmulas) en una aplicación web moderna.

**Stack Tecnológico:**
- **Backend:** Python 3.11 + FastAPI + Motor (MongoDB async)
- **Frontend:** React 18 + React Router + Axios
- **Base de Datos:** MongoDB

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
# Ir al directorio backend
cd backend

# Crear entorno virtual (recomendado)
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
# MongoDB - Usa tu conexión local o Atlas
MONGO_URL=mongodb://localhost:27017
DB_NAME=football_database

# API Football (obtén tu key en https://www.api-football.com/)
API_FOOTBALL_KEY=tu_api_key_aqui
```

**Nota:** Si usas MongoDB Atlas, el formato es:
```env
MONGO_URL=mongodb+srv://usuario:password@cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

### Paso 4: Configurar Frontend

```bash
# Ir al directorio frontend
cd ../frontend

# Instalar dependencias
yarn install
```

### Paso 5: Configurar Variables de Entorno (Frontend)

Crea o edita el archivo `frontend/.env`:

```env
REACT_APP_BACKEND_URL=http://localhost:8001
```

---

## ▶️ Ejecución

### Iniciar Backend

```bash
cd backend

# Activar entorno virtual si no está activo
# Windows: venv\Scripts\activate
# Linux/Mac: source venv/bin/activate

# Iniciar servidor (puerto 8001)
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

### Iniciar Frontend

En otra terminal:

```bash
cd frontend
yarn start
```

La aplicación estará disponible en:
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8001/api
- **Documentación API:** http://localhost:8001/docs

---

## 🔧 Primer Uso

### 1. Construir Estadísticas

Antes de generar pronósticos, debes construir las estadísticas:

```bash
curl -X POST "http://localhost:8001/api/prediction/build-stats" \
  -H "Content-Type: application/json" \
  -d '{"liga_id": "SPAIN_LA_LIGA", "temporada": 2023}'
```

O desde la interfaz web: **Pronósticos > Generar Pronóstico**

### 2. Extraer Datos (Opcional)

Si necesitas datos frescos de la API:

1. Ve a **Datos > Extracción** en la interfaz web
2. Configura la temporada y límite de ligas
3. Haz clic en "Iniciar Extracción"

**Nota:** El plan gratuito de API-Football tiene límites de llamadas.

---

## 📁 Estructura del Proyecto

```
app/
├── README.md                    # Esta documentación
├── backend/
│   ├── server.py                # Servidor FastAPI principal
│   ├── requirements.txt         # Dependencias Python
│   ├── .env                     # Variables de entorno
│   ├── api_football/            # Módulo de extracción de datos
│   │   ├── api_client.py        # Cliente API-Football
│   │   ├── data_transformer.py  # Transformación de datos
│   │   └── db_manager.py        # Gestor de base de datos
│   └── prediction_engine/       # Motor de pronósticos PLLA 3.0
│       ├── config.py            # Umbrales y configuración
│       ├── stats_builder.py     # Constructor de estadísticas
│       ├── classification.py    # Motor de clasificación
│       ├── prediction_engine.py # Motor de pronósticos
│       └── validation.py        # Validador GANA/PIERDE
└── frontend/
    ├── package.json             # Dependencias Node.js
    ├── .env                     # Variables de entorno
    └── src/
        ├── App.js               # Componente principal
        ├── components/          # Componentes reutilizables
        └── pages/               # Páginas de la aplicación
            ├── Dashboard.jsx    # Página principal
            ├── Predictions.jsx  # Generador de pronósticos
            ├── Classification.jsx # Tabla de posiciones
            ├── TeamStats.jsx    # Estadísticas por equipo
            ├── Matches.jsx      # Listado de partidos
            └── Scraping.jsx     # Extracción de datos
```

---

## 🎯 Funcionalidades

### Motor de Pronósticos
- ✅ **Pronóstico Principal:** L (Local) / E (Empate) / V (Visitante)
- ✅ **Doble Oportunidad:** 1X / X2 / 12
- ✅ **Ambos Marcan:** SI / NO
- ✅ **Tres Tiempos:** Completo (90min), 1er Tiempo, 2do Tiempo
- ✅ **Clasificación:** Tablas de posiciones por liga
- ✅ **Estadísticas:** Por equipo, local y visitante

### Interfaz Web
- ✅ Dashboard con estadísticas generales
- ✅ Generador interactivo de pronósticos
- ✅ Tablas de clasificación con selector de tiempo
- ✅ Visualización de estadísticas por equipo
- ✅ Historial de partidos
- ✅ Módulo de extracción de datos

---

## 🔌 API Endpoints

### Pronósticos

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/prediction/build-stats` | Construye estadísticas de equipos |
| GET | `/api/prediction/classification` | Tabla de clasificación |
| POST | `/api/prediction/generate` | **Genera pronóstico** |
| GET | `/api/prediction/team/{nombre}` | Stats de un equipo |
| POST | `/api/prediction/validate` | Valida pronóstico vs resultado |
| GET | `/api/prediction/teams` | Lista de equipos |

### Datos

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/stats` | Estadísticas generales |
| GET | `/api/leagues` | Lista de ligas |
| GET | `/api/matches` | Lista de partidos |
| POST | `/api/scrape/start` | Iniciar extracción |
| GET | `/api/scrape/status` | Estado de extracción |

### Ejemplo: Generar Pronóstico

```bash
curl -X POST "http://localhost:8001/api/prediction/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "equipo_local": "Barcelona",
    "equipo_visitante": "Real Madrid",
    "liga_id": "SPAIN_LA_LIGA",
    "temporada": 2023
  }'
```

**Respuesta:**
```json
{
  "success": true,
  "pronostico": {
    "equipo_local": "Barcelona",
    "equipo_visitante": "Real Madrid",
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
    }
  }
}
```

---

## ⚙️ Configuración del Algoritmo

### Umbrales (backend/prediction_engine/config.py)

| Parámetro | Valor | Descripción |
|-----------|-------|-------------|
| `PROB_LOCAL_MIN` | 43% | Mínimo para pronosticar LOCAL |
| `PROB_LOCAL_MAX` | 69.5% | Máximo antes de "muy favorito" |
| `PROB_EMPATE_MAX` | 20% | Máximo de empate para decidir |
| `SUMA_PROB_MIN` | 116% | Mínimo para doble oportunidad "12" |
| `UMBRAL_AMBOS_MARCAN` | 45% | Umbral para SI/NO |

### Factores de Rendimiento

| Factor | Rendimiento | Descripción |
|--------|-------------|-------------|
| 5 | > 80% | Equipo dominante |
| 4 | 60-80% | Equipo fuerte |
| 3 | 40-60% | Equipo promedio |
| 2 | 20-40% | Equipo débil |
| 1 | < 20% | Equipo muy débil |

---

## 🗄️ Base de Datos

### Colecciones MongoDB

| Colección | Descripción |
|-----------|-------------|
| `football_matches` | Partidos históricos |
| `team_statistics` | Estadísticas por equipo |
| `predictions` | Pronósticos generados |
| `validations` | Validaciones post-partido |

---

## ❓ Solución de Problemas

### Error: "No module named 'motor'"

Asegúrate de haber instalado todas las dependencias:
```bash
cd backend
pip install -r requirements.txt
```

### Error: "Connection refused" en MongoDB

1. Verifica que MongoDB esté corriendo
2. Revisa la URL en `backend/.env`
3. Si usas Atlas, verifica que tu IP esté en la whitelist

### Error: "API account suspended"

Tu cuenta de API-Football puede estar suspendida. Verifica en:
https://dashboard.api-football.com

### El frontend no conecta con el backend

1. Verifica que `REACT_APP_BACKEND_URL` en `frontend/.env` sea correcto
2. Asegúrate de que el backend esté corriendo en el puerto 8001
3. Reinicia el frontend después de cambiar el `.env`

---

## 📊 Arquitectura

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    FRONTEND     │     │     BACKEND     │     │    DATABASE     │
│    (React)      │ ←→  │    (FastAPI)    │ ←→  │    (MongoDB)    │
│    Port 3000    │     │    Port 8001    │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │
                  ┌────────────┴────────────┐
                  │    PREDICTION ENGINE    │
                  │    (Motor PLLA 3.0)     │
                  └─────────────────────────┘
```

---

## 📝 Versiones

- **Sistema PLLA:** 3.0
- **Algoritmo:** v1.0.0
- **API:** v1.0.0

---

## 📄 Licencia

Proyecto privado - PLLA 3.0

---

*Documentación actualizada: Diciembre 2024*
