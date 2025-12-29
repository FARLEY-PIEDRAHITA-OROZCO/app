# ⚽ Football Prediction System - PLLA 3.0

Sistema avanzado de pronósticos deportivos con análisis estadístico, histórico consolidado y machine learning para fútbol.

## 🎯 Características Principales

### Motor de Pronósticos
- **Pronóstico Principal (L/E/V)** para tiempo completo, primer tiempo y segundo tiempo
- **Doble Oportunidad** (1X, X2, 12) con ~84% de precisión histórica
- **Over/Under** goles (1.5, 2.5, 3.5) con probabilidades calculadas
- **Ambos Marcan** (SI/NO)
- **Goles Esperados** por equipo y total

### Histórico Consolidado (NUEVO)
- **H2H (Head to Head)**: Historial de enfrentamientos directos entre equipos
- **Múltiples Temporadas**: Análisis ponderado de hasta 3 temporadas
- **Factores de Ajuste**: Probabilidades ajustadas por histórico

### Análisis de Forma
- **Forma Reciente**: Últimos 5 partidos de cada equipo
- **Rendimiento Local/Visitante**: Estadísticas separadas
- **Estadísticas Defensivas**: Goles en contra, promedio GC

### Vistas de Análisis
- **Temporada Completa**: Vista tipo Excel con 380+ partidos
- **Mejores Apuestas**: Dashboard con oportunidades ordenadas por confianza
- **Por Jornada**: Pronósticos de todos los partidos de una jornada
- **Por Partido**: Análisis detallado de un partido específico

### Validación
- **Backtesting**: Validación histórica contra resultados reales
- **Estadísticas de Aciertos**: En tiempo real por tipo de apuesta

---

## 📊 Precisión del Sistema (Backtesting)

| Tipo de Apuesta | La Liga 23-24 | Premier 22-23 |
|-----------------|---------------|---------------|
| Pronóstico L/E/V | 55.0% | 60.8% |
| **Doble Oportunidad** | **84.2%** | **82.6%** |
| Over 2.5 | 63.4% | 60.5% |
| Over 1.5 | 78.9% | 75.5% |
| ROI Simulado | +17.9% | +15.7% |

> **Recomendación**: El sistema es más preciso para **Doble Oportunidad** y **Over/Under** que para pronóstico directo.

---

## 🏗️ Arquitectura

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    Frontend     │────▶│     Backend     │────▶│    MongoDB      │
│   React + JS    │     │    FastAPI      │     │   Database      │
│   Port: 3000    │     │   Port: 8001    │     │   Port: 27017   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌─────────────────┐
                        │  API-Football   │
                        │   (RapidAPI)    │
                        └─────────────────┘
```

### Stack Tecnológico
- **Frontend**: React 18, Axios, Lucide Icons
- **Backend**: Python 3.11, FastAPI, Motor (async MongoDB)
- **Database**: MongoDB
- **API Externa**: API-Football (RapidAPI)

---

## 📁 Estructura del Proyecto

```
/app/
├── backend/
│   ├── api_football/           # Cliente API-Football
│   │   ├── api_client.py       # Cliente HTTP
│   │   ├── config.py           # Configuración API
│   │   ├── db_manager.py       # Gestión de BD
│   │   └── main.py             # Script de extracción
│   ├── prediction_engine/      # Motor de pronósticos
│   │   ├── prediction_engine.py    # Motor principal
│   │   ├── stats_builder.py        # Constructor de estadísticas
│   │   ├── classification.py       # Tabla de posiciones
│   │   ├── historico_consolidado.py # H2H y histórico (NUEVO)
│   │   ├── backtesting.py          # Validación histórica
│   │   ├── models.py               # Modelos Pydantic
│   │   └── config.py               # Configuración
│   ├── server.py               # API FastAPI
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx           # Panel principal
│   │   │   ├── TemporadaCompleta.jsx   # Vista Excel (NUEVO)
│   │   │   ├── MejoresApuestas.jsx     # Dashboard apuestas (NUEVO)
│   │   │   ├── JornadaPredictions.jsx  # Por jornada (NUEVO)
│   │   │   ├── Predictions.jsx         # Por partido
│   │   │   ├── Classification.jsx      # Clasificación
│   │   │   ├── TeamStats.jsx           # Estadísticas equipo
│   │   │   ├── Matches.jsx             # Partidos
│   │   │   └── Scraping.jsx            # Extracción
│   │   ├── components/
│   │   │   ├── Layout.jsx
│   │   │   ├── LeagueSelector.jsx
│   │   │   └── SeasonSelector.jsx
│   │   └── App.js
│   └── package.json
├── data_export/                # Datos exportados para setup local
│   ├── football_matches.json
│   ├── team_statistics.json
│   ├── seasons.json
│   └── import_data.py
├── docs/
│   ├── API_REFERENCE.md        # Referencia de API
│   ├── GUIA_INSTALACION_LOCAL.md
│   ├── MOTOR_PRONOSTICOS.md    # Documentación del algoritmo
│   └── ANALISIS_SEASON_ID.md
└── README.md
```

---

## 🚀 Inicio Rápido

### Requisitos
- Python 3.11+
- Node.js 18+
- MongoDB 6.0+
- API Key de RapidAPI (API-Football)

### Instalación Local

1. **Clonar y configurar backend**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

2. **Configurar variables de entorno**
```bash
# backend/.env
MONGO_URL=mongodb://localhost:27017
DB_NAME=test_database
API_FOOTBALL_KEY=tu_api_key_de_rapidapi
```

3. **Importar datos de muestra**
```bash
cd data_export
python import_data.py
```

4. **Iniciar backend**
```bash
cd backend
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

5. **Configurar e iniciar frontend**
```bash
cd frontend
yarn install

# frontend/.env
REACT_APP_BACKEND_URL=http://localhost:8001

yarn start
```

---

## 📖 Páginas de la Aplicación

### 1. Dashboard
Panel principal con estadísticas generales de la base de datos.

### 2. Temporada Completa (NUEVO)
Vista tipo Excel con todos los partidos de una temporada:
- 380 partidos con pronósticos
- Filtros avanzados (jornada, equipo, pronóstico, confianza)
- Estadísticas de aciertos en tiempo real
- Exportar a CSV

### 3. Mejores Apuestas (NUEVO)
Dashboard con las mejores oportunidades:
- Doble Oportunidad
- Favorito Claro
- Over 2.5 / Over 1.5
- Ambos Marcan
- Ordenadas por probabilidad

### 4. Por Jornada (NUEVO)
Pronósticos de todos los partidos de una jornada:
- 10 partidos por jornada
- Defensa local/visitante
- Exportar a CSV

### 5. Por Partido
Análisis detallado de un partido específico:
- Forma reciente
- H2H (enfrentamientos directos)
- Pronósticos TC/1MT/2MT
- Over/Under
- Goles esperados

### 6. Clasificación
Tabla de posiciones calculada dinámicamente.

### 7. Equipos
Estadísticas detalladas por equipo:
- General, Local, Visitante
- Ataque y Defensa
- Rendimiento por tiempo

### 8. Extracción
Interfaz para extraer datos de la API:
- Seleccionar liga y temporada
- Construcción automática de estadísticas

---

## 🔌 API Endpoints Principales

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/leagues` | Ligas disponibles |
| GET | `/api/seasons` | Temporadas disponibles |
| POST | `/api/prediction/generate` | Generar pronóstico |
| GET | `/api/prediction/jornada` | Pronósticos por jornada |
| GET | `/api/prediction/temporada-completa` | Temporada completa |
| GET | `/api/prediction/mejores-apuestas` | Mejores apuestas |
| GET | `/api/prediction/h2h` | Historial H2H |
| GET | `/api/prediction/backtesting` | Validación histórica |
| GET | `/api/prediction/teams` | Equipos con stats |
| GET | `/api/prediction/classification` | Clasificación |
| POST | `/api/prediction/build-stats` | Construir estadísticas |
| POST | `/api/scrape/start` | Iniciar extracción |

Ver [API_REFERENCE.md](docs/API_REFERENCE.md) para documentación completa.

---

## 📊 Modelo de Datos

### Colección: `football_matches`
```javascript
{
  "match_id": "12345",
  "season_id": "SPAIN_LA_LIGA_2023-24",
  "liga_id": "SPAIN_LA_LIGA",
  "equipo_local": "Real Madrid",
  "equipo_visitante": "Barcelona",
  "goles_local_TR": 2,
  "goles_visitante_TR": 1,
  "goles_local_1MT": 1,
  "goles_visitante_1MT": 0,
  "ronda": "Regular Season - 10",
  "fecha": "2023-10-28",
  "estado_del_partido": "Match Finished"
}
```

### Colección: `team_statistics`
```javascript
{
  "nombre": "Real Madrid",
  "liga_id": "SPAIN_LA_LIGA",
  "season_id": "SPAIN_LA_LIGA_2023-24",
  "stats_completo": {
    "partidos_jugados": 38,
    "victorias": 29,
    "empates": 8,
    "derrotas": 1,
    "goles_favor": 87,
    "goles_contra": 26,
    "puntos": 95,
    "rendimiento_general": 83.33,
    "promedio_gf": 2.29,
    "promedio_gc": 0.68
  },
  "forma_reciente": {
    "ultimos_5": ["V", "V", "V", "V", "V"],
    "rendimiento": 100
  }
}
```

---

## 🔧 Configuración del Motor

El motor de pronósticos usa umbrales configurables en `prediction_engine/config.py`:

```python
class Umbrales:
    # Umbrales de confianza
    CONFIANZA_ALTA = 70.0
    CONFIANZA_MEDIA = 50.0
    
    # Pesos del algoritmo
    PESO_RENDIMIENTO = 0.35
    PESO_GOLES = 0.25
    PESO_FORMA = 0.20
    PESO_LOCAL = 0.15
    PESO_H2H = 0.05
    
    # Pesos históricos
    PESO_TEMPORADA_ACTUAL = 0.70
    PESO_HISTORICO = 0.30
```

---

## 📈 Roadmap

### Completado ✅
- [x] Motor de pronósticos PLLA 3.0
- [x] Multi-liga y multi-temporada
- [x] Forma reciente
- [x] Over/Under y Ambos Marcan
- [x] Vista de Temporada Completa
- [x] Dashboard Mejores Apuestas
- [x] Histórico Consolidado (H2H)
- [x] Backtesting
- [x] Estadísticas defensivas
- [x] Generación automática de stats

### Próximas Mejoras 🔜
- [ ] Partidos futuros (fixtures)
- [ ] Predicción de marcador exacto
- [ ] Dashboard de precisión histórica
- [ ] Notificaciones de apuestas recomendadas
- [ ] Integración con casas de apuestas (cuotas)

---

## 📝 Licencia

Proyecto privado - Todos los derechos reservados.

---

## 📞 Soporte

Para consultas técnicas, revisar la documentación en `/docs/` o contactar al equipo de desarrollo.
