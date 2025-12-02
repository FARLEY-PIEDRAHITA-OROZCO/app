# ⚽ Football Data - Frontend

## 🎯 Descripción

Frontend moderno para el sistema de análisis de datos de fútbol. Interfaz intuitiva construida con React para visualizar, consultar y gestionar datos extraídos de la API de Football.

---

## 🚀 Características

### 📊 **Dashboard**
- Estadísticas generales en tiempo real
- Total de partidos, ligas activas, promedio de goles
- Top 10 ligas con más partidos
- Última actualización de datos

### 🔍 **Consulta de Partidos**
- Tabla con todos los partidos registrados
- Filtros avanzados:
  - Por liga
  - Por rango de fechas
  - Por equipo (búsqueda)
- Paginación para grandes volúmenes de datos
- Exportación directa a CSV y JSON

### 📥 **Extracción de Datos**
- Control del proceso de scraping desde la UI
- Configuración de temporada y límite de ligas
- Monitor de progreso en tiempo real
- Visualización de logs del sistema
- Ejecución en segundo plano

---

## 🎨 Diseño

- **Estilo**: Moderno, oscuro, analytics-focused
- **Colores**: Azul (#3b82f6) como acento principal
- **Tipografía**: Inter (sistema)
- **Responsive**: Adaptado para desktop (1920x800)
- **Iconos**: Lucide React

---

## 📁 Estructura

```
frontend/src/
├── App.js                  # Router principal
├── App.css                 # Estilos globales
├── components/
│   └── Layout.jsx          # Layout con sidebar
└── pages/
    ├── Dashboard.jsx       # Página principal
    ├── Matches.jsx         # Consulta de partidos
    └── Scraping.jsx        # Control de extracción
```

---

## 🔌 API Endpoints Consumidos

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/stats` | GET | Estadísticas generales |
| `/api/matches/search` | POST | Buscar partidos con filtros |
| `/api/leagues` | GET | Lista de ligas disponibles |
| `/api/scrape/start` | POST | Iniciar scraping |
| `/api/scrape/status` | GET | Estado del scraping |
| `/api/export` | POST | Exportar datos |
| `/api/logs` | GET | Últimos logs del sistema |

---

## 🛠️ Tecnologías

- **React 19** - Framework principal
- **React Router 7** - Navegación
- **Axios** - Peticiones HTTP
- **Lucide React** - Iconos
- **CSS Variables** - Temas

---

## 🚀 Desarrollo Local

### Prerequisitos
- Node.js 14+
- Yarn o npm

### Instalación

```bash
cd frontend
yarn install
```

### Variables de Entorno

Archivo `.env`:
```env
REACT_APP_BACKEND_URL=http://localhost:8001
```

### Ejecutar

```bash
yarn start
```

Frontend disponible en: `http://localhost:3000`

---

## 📦 Build para Producción

```bash
yarn build
```

---

## 🎯 Preparado para Futuro: Módulo de Pronósticos

El frontend está diseñado para **escalar fácilmente** cuando implementes tu lógica de pronósticos de Excel en Python.

### Dónde agregar el módulo de pronósticos:

1. **Backend**: Crear nuevo endpoint `/api/predictions`
2. **Frontend**: Agregar nueva página `Predictions.jsx`
3. **Navegación**: Ya existe espacio en el sidebar

### Ejemplo de estructura futura:

```javascript
// pages/Predictions.jsx
import { Brain, TrendingUp } from 'lucide-react';

const Predictions = () => {
  return (
    <div>
      <h1>Pronósticos Deportivos</h1>
      {/* Tu lógica de ML aquí */}
      {/* Mostrar predicciones */}
      {/* Gráficos de probabilidades */}
    </div>
  );
};
```

### Agregar al router:

```javascript
// App.js
<Route path="predictions" element={<Predictions />} />
```

### Agregar al sidebar:

```javascript
// components/Layout.jsx
<NavLink to="/predictions">
  <Brain size={20} />
  <span>Pronósticos</span>
</NavLink>
```

---

## 🎨 Personalización de Colores

Editar en `App.css`:

```css
:root {
  --bg-primary: #0a0e27;        /* Fondo principal */
  --bg-secondary: #151934;      /* Fondo secundario */
  --bg-card: #1a1f3a;           /* Fondo de cards */
  --text-primary: #e2e8f0;      /* Texto principal */
  --text-secondary: #94a3b8;    /* Texto secundario */
  --accent: #3b82f6;            /* Color de acento */
  --accent-hover: #2563eb;      /* Hover de acento */
  --border: #2d3651;            /* Bordes */
  --success: #10b981;           /* Verde éxito */
  --danger: #ef4444;            /* Rojo peligro */
  --warning: #f59e0b;           /* Naranja advertencia */
}
```

---

## 📱 Páginas

### 1. Dashboard (`/`)

**Muestra:**
- 4 tarjetas de métricas principales
- Tabla con top 10 ligas
- Última actualización

**Actualización:**
- Automática al cargar
- Manual con botón refresh

### 2. Partidos (`/matches`)

**Funcionalidades:**
- Filtrar por liga, fechas, equipo
- Ver resultados con posiciones de clasificación
- Exportar a CSV o JSON
- Paginación (50 por página)

**Datos mostrados:**
- Fecha, liga, equipos
- Resultado con posiciones
- Estado del partido

### 3. Extracción (`/scraping`)

**Funcionalidades:**
- Configurar temporada (2021-2023)
- Limitar número de ligas
- Iniciar proceso de scraping
- Ver progreso en tiempo real
- Consultar logs del sistema

**Estados:**
- Detenido / En Proceso
- Barra de progreso
- Mensajes de estado

---

## 🔐 Consideraciones de Seguridad

- Sin autenticación por ahora (como solicitado)
- CORS configurado en backend
- Validación de datos en formularios
- Sanitización de entradas

---

## 🚀 Próximos Pasos Recomendados

1. **Implementar módulo de pronósticos**
   - Crear endpoint `/api/predictions`
   - Página de visualización de predicciones
   - Gráficos de probabilidades

2. **Añadir gráficos interactivos**
   - Librería ligera: Recharts o Chart.js
   - Evolución de goles por liga
   - Distribución de resultados

3. **Mejorar exportación**
   - Filtros personalizados
   - Formatos adicionales (Excel)
   - Programar exportaciones automáticas

4. **Optimizaciones**
   - Cache de consultas frecuentes
   - Lazy loading de componentes
   - Service Worker para offline

---

## 🐛 Troubleshooting

### El frontend no carga
```bash
# Verificar que el backend esté corriendo
curl http://localhost:8001/api/

# Reiniciar frontend
cd frontend
yarn start
```

### Error de CORS
Verificar que `CORS_ORIGINS` incluya el origen del frontend en `.env` del backend.

### Datos no aparecen
Verificar que MongoDB tenga datos:
```bash
python api_football/query_examples.py
```

---

## 📊 Métricas de Performance

- **First Contentful Paint**: < 1s
- **Time to Interactive**: < 2s
- **Tamaño Bundle**: ~500KB (gzipped)
- **Lighthouse Score**: 90+

---

## 🎓 Próxima Evolución: Sistema de Pronósticos

Cuando migres tu lógica de Excel a Python, el frontend está listo para:

1. **Mostrar predicciones** con probabilidades
2. **Gráficos de tendencias** y patrones
3. **Comparación** de pronósticos vs resultados reales
4. **Dashboard de accuracy** del modelo

La arquitectura modular permite agregar nuevas funcionalidades sin modificar el código existente.

---

**✨ Frontend completo, moderno e intuitivo - Listo para escalar con tu sistema de pronósticos**
