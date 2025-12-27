# Frontend - Sistema PLLA 3.0

## Tecnologías

- React 18
- React Router DOM v6
- Axios
- Lucide React (iconos)

## Instalación

```bash
yarn install
```

## Configuración

Archivo `.env`:
```env
REACT_APP_BACKEND_URL=http://localhost:8001
```

## Ejecución

```bash
yarn start    # Desarrollo
yarn build    # Producción
```

## Estructura

```
src/
├── App.js                    # Rutas principales
├── index.js                  # Punto de entrada
├── index.css                 # Estilos globales
├── components/
│   ├── Layout.jsx            # Layout con sidebar
│   ├── LeagueSelector.jsx    # 🆕 Selector de ligas
│   ├── SeasonSelector.jsx    # Selector de temporadas
│   └── ui/                   # Componentes UI (shadcn)
└── pages/
    ├── Dashboard.jsx         # Vista global/por temporada
    ├── Predictions.jsx       # 🆕 Con Over/Under y forma
    ├── Classification.jsx    # Tabla de posiciones
    ├── TeamStats.jsx         # Estadísticas por equipo
    ├── Matches.jsx           # Listado de partidos
    └── Scraping.jsx          # Extracción de datos
```

## Componentes Principales

### LeagueSelector 🆕

Selector dinámico de ligas disponibles.

```jsx
import LeagueSelector from '../components/LeagueSelector';

const [ligaId, setLigaId] = useState('');

<LeagueSelector 
  value={ligaId}
  onChange={setLigaId}
  showLabel={true}         // Mostrar etiqueta "Liga"
  showAllOption={false}    // Opción "Todas las ligas"
/>
```

### SeasonSelector

Selector de temporadas que carga dinámicamente según la liga.

```jsx
import SeasonSelector from '../components/SeasonSelector';

const [ligaId, setLigaId] = useState('');
const [seasonId, setSeasonId] = useState('');

<SeasonSelector 
  ligaId={ligaId}          // Liga de la cual cargar temporadas
  value={seasonId}
  onChange={setSeasonId}
  showLabel={true}
/>
```

**Importante:** Cuando `ligaId` cambia, el selector automáticamente:
1. Carga las temporadas de esa liga
2. Resetea el valor si la temporada anterior no existe en la nueva liga

### Uso Combinado (Patrón Recomendado)

```jsx
const [ligaId, setLigaId] = useState('');
const [seasonId, setSeasonId] = useState('');

const handleLigaChange = (newLigaId) => {
  setLigaId(newLigaId);
  setSeasonId(''); // Reset temporada al cambiar liga
};

<LeagueSelector value={ligaId} onChange={handleLigaChange} />
<SeasonSelector ligaId={ligaId} value={seasonId} onChange={setSeasonId} />
```

## Páginas

### Dashboard (`/`)
- Vista Global: estadísticas de todas las ligas
- Vista Por Temporada: filtrado por liga y temporada

### Predictions (`/predictions`)
🆕 **Nuevas funcionalidades:**
- Selector de liga y temporada
- Forma reciente (últimos 5 partidos)
- Over/Under 1.5, 2.5, 3.5 goles
- Goles esperados por equipo
- Pronósticos para TC, 1MT, 2MT

### Classification (`/classification`)
- Tabla de posiciones por temporada
- Selector de tipo de tiempo
- Leyenda de posiciones (Champions, Europa, Descenso)

### TeamStats (`/teams`)
- Estadísticas detalladas por equipo
- General, Local, Visitante
- Para los 3 tiempos

### Matches (`/matches`)
- Listado de partidos con filtros
- Exportación CSV/JSON
- Paginación

### Scraping (`/scraping`)
- Extracción de datos de API-Football
- Selector de liga predefinida (IDs populares)
- Panel de exportación con filtros

## Endpoints Usados

| Página | Endpoint | Método |
|--------|----------|--------|
| Todas | `/api/leagues` | GET |
| Todas | `/api/seasons` | GET |
| Dashboard | `/api/stats` | GET |
| Predictions | `/api/prediction/generate` | POST |
| Predictions | `/api/prediction/teams` | GET |
| Classification | `/api/prediction/classification` | GET |
| TeamStats | `/api/prediction/teams` | GET |
| TeamStats | `/api/prediction/team/{nombre}` | GET |
| Matches | `/api/matches/search` | POST |
| Matches | `/api/export` | POST |
| Scraping | `/api/scrape/start` | POST |
| Scraping | `/api/scrape/status` | GET |

---

*Ver documentación principal en `/README.md`*
