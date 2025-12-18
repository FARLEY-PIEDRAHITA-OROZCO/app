# Frontend - Sistema PLLA 3.0

## Tecnologías

- React 18
- React Router DOM
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
├── App.js              # Rutas principales
├── index.js            # Punto de entrada
├── index.css           # Estilos globales
├── components/
│   ├── Layout.jsx      # Layout con sidebar
│   └── ui/             # Componentes UI (shadcn)
└── pages/
    ├── Dashboard.jsx   # Página principal
    ├── Predictions.jsx # Generador de pronósticos
    ├── Classification.jsx # Tabla de posiciones
    ├── TeamStats.jsx   # Estadísticas por equipo
    ├── Matches.jsx     # Listado de partidos
    └── Scraping.jsx    # Extracción de datos
```

## Scripts Disponibles

| Comando | Descripción |
|---------|-------------|
| `yarn start` | Inicia servidor de desarrollo |
| `yarn build` | Build de producción |
| `yarn test` | Ejecuta tests |

---

*Ver documentación principal en `/app/README.md`*
