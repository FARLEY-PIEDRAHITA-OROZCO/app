# Frontend - Sistema PLLA 3.0

## Tecnologías

- React 18
- React Router DOM v6
- Axios
- Lucide React (iconos)

## Instalación

```bash
# Instalar dependencias
yarn install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con la URL del backend
```

## Configuración

Archivo `.env`:
```env
REACT_APP_BACKEND_URL=http://localhost:8001
```

## Ejecución

```bash
# Desarrollo
yarn start

# Build de producción
yarn build
```

## Estructura

```
src/
├── App.js                    # Rutas principales
├── index.js                  # Punto de entrada
├── index.css                 # Estilos globales
├── components/
│   ├── Layout.jsx            # Layout con sidebar
│   ├── SeasonSelector.jsx    # 🆕 Selector de temporadas
│   └── ui/                   # Componentes UI (shadcn)
└── pages/
    ├── Dashboard.jsx         # Página principal (Vista Global/Temporada)
    ├── Predictions.jsx       # Generador de pronósticos
    ├── Classification.jsx    # Tabla de posiciones
    ├── TeamStats.jsx         # Estadísticas por equipo
    ├── Matches.jsx           # Listado de partidos
    └── Scraping.jsx          # Extracción de datos
```

## Componentes Principales

### SeasonSelector

Componente reutilizable para seleccionar temporadas.

**Props:**
| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `ligaId` | string | `'SPAIN_LA_LIGA'` | ID de la liga |
| `value` | string | - | season_id seleccionado |
| `onChange` | function | - | Callback al cambiar |
| `showLabel` | boolean | `true` | Mostrar etiqueta |
| `disabled` | boolean | `false` | Deshabilitar selector |

**Uso:**
```jsx
import SeasonSelector from '../components/SeasonSelector';

const [seasonId, setSeasonId] = useState('');

<SeasonSelector 
  ligaId="SPAIN_LA_LIGA"
  value={seasonId}
  onChange={setSeasonId}
/>
```

### Páginas

| Página | Ruta | Descripción |
|--------|------|-------------|
| Dashboard | `/` | Vista general con toggle Global/Temporada |
| Predictions | `/predictions` | Generador de pronósticos |
| Classification | `/classification` | Tabla de posiciones por temporada |
| TeamStats | `/teams` | Estadísticas detalladas por equipo |
| Matches | `/matches` | Listado de partidos con filtros |
| Scraping | `/scraping` | Extracción de datos de API-Football |

## Rutas de la Aplicación

```jsx
// App.js
<Routes>
  <Route path="/" element={<Layout />}>
    <Route index element={<Dashboard />} />
    <Route path="predictions" element={<Predictions />} />
    <Route path="classification" element={<Classification />} />
    <Route path="teams" element={<TeamStats />} />
    <Route path="matches" element={<Matches />} />
    <Route path="scraping" element={<Scraping />} />
  </Route>
</Routes>
```

## Integración con Backend

Todas las llamadas API usan la variable de entorno `REACT_APP_BACKEND_URL`:

```javascript
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Ejemplo: Obtener estadísticas por temporada
const response = await axios.get(`${API}/stats?season_id=${seasonId}`);
```

## Endpoints Usados

| Página | Endpoint | Método |
|--------|----------|--------|
| Dashboard | `/api/stats` | GET |
| Dashboard | `/api/stats?season_id=X` | GET |
| Predictions | `/api/prediction/generate` | POST |
| Predictions | `/api/prediction/teams?season_id=X` | GET |
| Classification | `/api/prediction/classification?season_id=X` | GET |
| TeamStats | `/api/prediction/teams?season_id=X` | GET |
| Matches | `/api/matches/search` | POST |
| Matches | `/api/export` | POST |
| Scraping | `/api/scrape-league` | POST |
| Todos | `/api/seasons` | GET |

## Estilos

- CSS custom properties para theming
- Tema oscuro por defecto
- Componentes de shadcn/ui en `/components/ui/`

## Scripts Disponibles

| Comando | Descripción |
|---------|-------------|
| `yarn start` | Inicia servidor de desarrollo en puerto 3000 |
| `yarn build` | Build de producción |
| `yarn test` | Ejecuta tests |

---

*Ver documentación principal en `/app/README.md`*