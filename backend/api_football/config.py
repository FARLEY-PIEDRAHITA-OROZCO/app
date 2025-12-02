"""Configuración del módulo API-Futbol."""
import os
from pathlib import Path
from dotenv import load_dotenv

# Cargar variables de entorno
ROOT_DIR = Path(__file__).parent.parent
load_dotenv(ROOT_DIR / '.env')

# Configuración de la API
API_FOOTBALL_KEY = os.getenv('API_FOOTBALL_KEY', '')
API_FOOTBALL_BASE_URL = 'https://v3.football.api-sports.io'

# Configuración de MongoDB
MONGO_URL = os.getenv('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.getenv('DB_NAME', 'test_database')
COLLECTION_NAME = 'football_matches'

# Configuración de la API
API_TIMEOUT = 30  # segundos
MAX_RETRIES = 3
RETRY_DELAY = 2  # segundos

# Configuración de logs
LOG_LEVEL = 'INFO'
LOG_FILE = 'api_football.log'
LOG_FORMAT = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
