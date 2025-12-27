# 🏠 Guía de Instalación Local - Motor PLLA 3.0

Esta guía te ayudará a ejecutar el sistema de pronósticos en tu máquina local.

## 📋 Requisitos Previos

### Software Necesario

| Software | Versión Mínima | Descarga |
|----------|----------------|----------|
| Python | 3.10+ (recomendado 3.11) | [python.org](https://www.python.org/downloads/) |
| Node.js | 18+ | [nodejs.org](https://nodejs.org/) |
| MongoDB | 6.0+ | [mongodb.com](https://www.mongodb.com/try/download/community) |
| Yarn | 1.22+ | `npm install -g yarn` |

### Verificar Instalaciones

```bash
python --version   # Python 3.11.x
node --version     # v18.x.x o superior
mongod --version   # db version v6.x.x
yarn --version     # 1.22.x
```

---

## 🚀 Instalación Paso a Paso

### Paso 1: Descargar el Proyecto

Desde Emergent, usa la opción "Download Code" o clona desde GitHub:

```bash
git clone <tu-repositorio>
cd app
```

### Paso 2: Iniciar MongoDB

**Windows:**
```bash
# Si instalaste como servicio, ya debería estar corriendo
# Si no, ejecuta:
"C:\Program Files\MongoDB\Server\6.0\bin\mongod.exe"
```

**macOS (con Homebrew):**
```bash
brew services start mongodb-community
```

**Linux:**
```bash
sudo systemctl start mongod
sudo systemctl enable mongod  # Para iniciar automáticamente
```

**Verificar que MongoDB está corriendo:**
```bash
mongosh --eval "db.stats()"
```

### Paso 3: Configurar Backend

```bash
cd backend

# Crear entorno virtual
python -m venv venv

# Activar entorno virtual
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt
```

### Paso 4: Configurar Variables de Entorno

Crea el archivo `backend/.env`:

```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=test_database
API_FOOTBALL_KEY=tu_api_key_aqui
```

> **Nota:** Puedes obtener una API key gratuita en [API-Football](https://www.api-football.com/) (100 llamadas/día)

### Paso 5: Importar Datos Pre-existentes

Si tienes los archivos de exportación de datos:

```bash
cd backend

# Verificar que los archivos existen
ls -la data_export/
# Deberías ver:
# - football_matches.json
# - team_statistics.json
# - seasons.json
# - import_data.py

# Copiar archivos al directorio actual
cp data_export/*.json .
cp data_export/import_data.py .

# Ejecutar importación
python import_data.py
```

**Salida esperada:**
```
==================================================
  IMPORTADOR DE DATOS - Motor PLLA 3.0
==================================================

Conectando a: mongodb://localhost:27017
Base de datos: test_database

✅ Conexión exitosa a MongoDB

Importando datos...
  ✅ football_matches: 760 documentos
  ✅ team_statistics: 40 documentos
  ✅ seasons: 2 documentos

Creando índices...
  ✅ Índices creados

==================================================
  ¡IMPORTACIÓN COMPLETADA!
==================================================
```

### Paso 6: Configurar Frontend

```bash
cd ../frontend

# Instalar dependencias
yarn install
```

Verifica el archivo `frontend/.env`:
```env
REACT_APP_BACKEND_URL=http://localhost:8001
```

### Paso 7: Iniciar la Aplicación

**Terminal 1 - Backend:**
```bash
cd backend
source venv/bin/activate  # Windows: venv\Scripts\activate
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

**Terminal 2 - Frontend:**
```bash
cd frontend
yarn start
```

### Paso 8: Acceder a la Aplicación

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8001/api
- **Documentación Swagger:** http://localhost:8001/docs

---

## 📊 Verificar que Todo Funciona

### Test 1: Backend

```bash
curl http://localhost:8001/api/leagues
```

**Respuesta esperada:**
```json
[
  {"_id": "SPAIN_LA_LIGA", "liga_nombre": "La Liga", "total_partidos": 380},
  {"_id": "ENGLAND_PREMIER_LEAGUE", "liga_nombre": "Premier League", "total_partidos": 380}
]
```

### Test 2: Equipos

```bash
curl "http://localhost:8001/api/prediction/teams?season_id=SPAIN_LA_LIGA_2023-24"
```

### Test 3: Generar Pronóstico

```bash
curl -X POST "http://localhost:8001/api/prediction/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "equipo_local": "Barcelona",
    "equipo_visitante": "Real Madrid",
    "season_id": "SPAIN_LA_LIGA_2023-24"
  }'
```

---

## 🛠️ Solución de Problemas

### Error: "Connection refused" en MongoDB

**Causa:** MongoDB no está corriendo.

**Solución:**
```bash
# Windows
net start MongoDB

# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongod
```

### Error: "No hay equipos disponibles"

**Causa:** No se han importado los datos o no se han construido las estadísticas.

**Solución:**
```bash
# Si tienes los archivos JSON
cd backend
python import_data.py

# Si no tienes los archivos, extrae datos nuevos
# Usa la página de Extracción en http://localhost:3000/scraping
```

### Error: "ModuleNotFoundError"

**Causa:** El entorno virtual no está activado o faltan dependencias.

**Solución:**
```bash
cd backend
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### Error: "CORS policy"

**Causa:** El frontend no puede conectar con el backend.

**Solución:**
1. Verifica que el backend esté corriendo en puerto 8001
2. Verifica `REACT_APP_BACKEND_URL` en `frontend/.env`
3. Reinicia el frontend después de cambiar `.env`

### Error: "API-Football: Account suspended"

**Causa:** Tu API key de API-Football está suspendida o excediste el límite.

**Solución:**
1. Verifica tu cuenta en https://dashboard.api-football.com
2. El plan gratuito tiene 100 llamadas/día
3. Usa los datos pre-importados mientras no extraigas más

---

## 📦 Estructura de Datos Importados

Después de importar, tendrás:

| Liga | Temporada | Partidos | Equipos |
|------|-----------|----------|--------|
| La Liga (España) | 2023-24 | 380 | 20 |
| Premier League (Inglaterra) | 2022-23 | 380 | 20 |

**Equipos de La Liga:**
- Real Madrid, Barcelona, Girona, Atletico Madrid, Athletic Club, Real Sociedad, Real Betis, Villarreal, Valencia, Deportivo Alavés, Osasuna, Getafe, Celta Vigo, Sevilla, Mallorca, Las Palmas, Rayo Vallecano, Cadiz, Granada, Almeria

**Equipos de Premier League:**
- Manchester City, Arsenal, Manchester United, Newcastle, Liverpool, Brighton, Aston Villa, Tottenham, Brentford, Fulham, Crystal Palace, Chelsea, Wolves, West Ham, Bournemouth, Nottingham Forest, Everton, Leicester, Leeds, Southampton

---

## 🔄 Extraer Nuevos Datos

Si quieres extraer datos de otras ligas o temporadas:

1. Ve a http://localhost:3000/scraping
2. Selecciona la liga (ej: Serie A)
3. Selecciona la temporada (ej: 2023-24)
4. Click en "Iniciar Extracción"
5. Después de extraer, construye estadísticas desde Pronósticos

> ⚠️ **Nota:** El plan gratuito de API-Football tiene límite de 100 llamadas/día.

---

*Guía de Instalación Local - Motor PLLA 3.0 - Diciembre 2024*
