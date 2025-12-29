# 🏠 Guía de Instalación Local

Esta guía te ayudará a configurar el sistema de pronósticos en tu máquina local.

---

## 📋 Requisitos Previos

### Software Necesario
| Software | Versión Mínima | Descarga |
|----------|----------------|----------|
| Python | 3.11+ | [python.org](https://python.org) |
| Node.js | 18+ | [nodejs.org](https://nodejs.org) |
| MongoDB | 6.0+ | [mongodb.com](https://www.mongodb.com/try/download/community) |
| Git | 2.0+ | [git-scm.com](https://git-scm.com) |

### API Key (Opcional para datos nuevos)
- Cuenta en [RapidAPI](https://rapidapi.com)
- Suscripción a [API-Football](https://rapidapi.com/api-sports/api/api-football)

---

## 🚀 Instalación Paso a Paso

### 1. Descargar el Código

Desde la plataforma Emergent, haz clic en **"Download Code"** para obtener el proyecto completo.

O si tienes acceso al repositorio:
```bash
git clone [url-del-repositorio]
cd app
```

### 2. Configurar MongoDB

**Windows:**
1. Descarga e instala MongoDB Community Server
2. Inicia el servicio:
```powershell
net start MongoDB
```

**macOS:**
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install -y mongodb
sudo systemctl start mongodb
sudo systemctl enable mongodb
```

Verifica la conexión:
```bash
mongosh
# Deberías ver: "Connecting to: mongodb://127.0.0.1:27017"
```

### 3. Configurar Backend

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

Crear archivo `backend/.env`:
```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=test_database
API_FOOTBALL_KEY=tu_api_key_aqui
```

> **Nota:** La `API_FOOTBALL_KEY` solo es necesaria si quieres extraer nuevos datos. Para usar los datos de muestra, puedes dejar este campo vacío.

### 4. Importar Datos de Muestra

El proyecto incluye datos de muestra en `/data_export/`:

```bash
cd data_export
python import_data.py
```

Deberías ver:
```
Conectando a MongoDB...
Conexión exitosa
Importando football_matches.json...
  Insertados 760 documentos
Importando team_statistics.json...
  Insertados 40 documentos
Importando seasons.json...
  Insertados 2 documentos
¡Importación completada!
```

### 5. Iniciar Backend

```bash
cd backend
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

Verifica que funciona:
```bash
curl http://localhost:8001/api/leagues
```

### 6. Configurar Frontend

```bash
cd frontend

# Instalar dependencias (usar yarn, NO npm)
yarn install
```

Crear archivo `frontend/.env`:
```env
REACT_APP_BACKEND_URL=http://localhost:8001
```

### 7. Iniciar Frontend

```bash
cd frontend
yarn start
```

La aplicación se abrirá automáticamente en `http://localhost:3000`

---

## 🔧 Solución de Problemas Comunes

### Error: "ECONNREFUSED" al conectar a MongoDB
**Problema:** MongoDB no está corriendo.
**Solución:**
```bash
# Windows
net start MongoDB

# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongodb
```

### Error: "localhost:3000/8001/api/..." (URL malformada)
**Problema:** La variable `REACT_APP_BACKEND_URL` está mal configurada.
**Solución:** Asegúrate que `frontend/.env` tenga:
```env
REACT_APP_BACKEND_URL=http://localhost:8001
```
(Con `http://` al inicio, sin `/` al final)

### Error: "No se encontraron equipos"
**Problema:** No hay datos en la base de datos o no se han construido las estadísticas.
**Solución:**
1. Verifica que importaste los datos:
   ```bash
   cd data_export
   python import_data.py
   ```
2. O extrae nuevos datos desde la página "Extracción" en la app

### Error: "API Key inválida" al extraer datos
**Problema:** Tu API key de RapidAPI no es válida o está mal configurada.
**Solución:**
1. Verifica que tienes una suscripción activa en RapidAPI
2. Asegúrate que la key en `backend/.env` es correcta
3. La API key debe ser de **RapidAPI**, no de api-football.com directo

### Los cambios en el código no se reflejan
**Problema:** Hot reload no funcionó.
**Solución:**
```bash
# Backend - reiniciar
Ctrl+C
uvicorn server:app --host 0.0.0.0 --port 8001 --reload

# Frontend - reiniciar
Ctrl+C
yarn start
```

### Error de WebSocket en la consola
**Mensaje:** `WebSocket connection to 'ws://localhost:443/ws' failed`
**Solución:** Este error es inofensivo y solo aparece en desarrollo local. No afecta la funcionalidad.

---

## 📊 Verificar la Instalación

### 1. Verificar Backend
```bash
curl http://localhost:8001/api/stats
```
Debería devolver estadísticas de la base de datos.

### 2. Verificar Datos
```bash
curl "http://localhost:8001/api/prediction/teams?season_id=SPAIN_LA_LIGA_2023-24"
```
Debería devolver 20 equipos.

### 3. Verificar Pronósticos
```bash
curl -X POST "http://localhost:8001/api/prediction/generate" \
  -H "Content-Type: application/json" \
  -d '{"equipo_local": "Real Madrid", "equipo_visitante": "Barcelona", "season_id": "SPAIN_LA_LIGA_2023-24"}'
```
Debería devolver un pronóstico completo.

### 4. Verificar Frontend
Abre `http://localhost:3000` y:
1. Ve a "Temporada Completa"
2. Haz clic en "Cargar Temporada"
3. Deberías ver 380 partidos con pronósticos

---

## 🔄 Extraer Nuevos Datos

Si tienes una API key válida y quieres extraer datos de otras ligas:

### Desde la Interfaz Web
1. Ve a la página "Extracción"
2. Selecciona la liga (ej: Premier League = ID 39)
3. Selecciona la temporada (ej: 2024)
4. Haz clic en "Iniciar Extracción"
5. Las estadísticas se construyen automáticamente

### Desde Línea de Comandos
```bash
cd backend
python -m api_football.main --league-id 39 --season 2024
```

**IDs de Ligas Comunes:**
| Liga | ID |
|------|-----|
| La Liga (España) | 140 |
| Premier League (Inglaterra) | 39 |
| Serie A (Italia) | 135 |
| Bundesliga (Alemania) | 78 |
| Ligue 1 (Francia) | 61 |
| Liga MX (México) | 262 |

---

## 📁 Estructura de Datos Importados

### football_matches.json (~608 KB)
760 partidos de:
- La Liga 2023-24 (380 partidos)
- Premier League 2022-23 (380 partidos)

### team_statistics.json (~96 KB)
40 equipos con estadísticas calculadas:
- 20 equipos de La Liga
- 20 equipos de Premier League

### seasons.json (~1 KB)
2 temporadas:
- SPAIN_LA_LIGA_2023-24
- ENGLAND_PREMIER_LEAGUE_2022-23

---

## 💻 Comandos Útiles

### Backend
```bash
# Iniciar con recarga automática
uvicorn server:app --host 0.0.0.0 --port 8001 --reload

# Ver logs
tail -f uvicorn.log

# Ejecutar tests
pytest
```

### Frontend
```bash
# Iniciar desarrollo
yarn start

# Build producción
yarn build

# Linting
yarn lint
```

### MongoDB
```bash
# Conectar a la consola
mongosh

# Ver bases de datos
show dbs

# Usar base de datos
use test_database

# Ver colecciones
show collections

# Contar documentos
db.football_matches.countDocuments()
db.team_statistics.countDocuments()

# Borrar datos (¡cuidado!)
db.football_matches.deleteMany({})
```

---

## 📞 Soporte

Si tienes problemas con la instalación:
1. Revisa esta guía completa
2. Verifica los logs del backend
3. Consulta la [API Reference](API_REFERENCE.md)
4. Revisa el [README principal](../README.md)
