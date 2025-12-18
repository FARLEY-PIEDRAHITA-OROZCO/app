# 📚 Documentación del Sistema PLLA 3.0

## Índice de Documentos

### Documentación Principal

| Documento | Descripción | Audiencia |
|-----------|-------------|----------|
| [README Principal](../README.md) | Visión general del proyecto | Todos |
| [Guía de Usuario](./GUIA_USUARIO.md) | Cómo usar la aplicación | Usuarios finales |
| [Referencia de API](./API_REFERENCE.md) | Documentación de endpoints | Desarrolladores |
| [Arquitectura Técnica](./ARQUITECTURA_TECNICA.md) | Diseño del sistema | Desarrolladores |

### Documentación del Motor

| Documento | Descripción |
|-----------|-------------|
| [Motor de Pronósticos](../backend/prediction_engine/README.md) | Módulo prediction_engine |
| [Plan de Implementación](../backend/prediction_engine/PLAN_IMPLEMENTACION.md) | Diseño detallado del algoritmo |

### Documentación Legacy

| Documento | Descripción |
|-----------|-------------|
| [Quick Start Backend](../backend/QUICK_START.md) | Inicio rápido (original) |
| [Arquitectura Backend](../backend/ARQUITECTURA.md) | Arquitectura (original) |

---

## Resumen del Sistema

### ¿Qué es PLLA 3.0?

Sistema de pronósticos deportivos que:

1. **Extrae datos** de API-Football (partidos, resultados)
2. **Construye estadísticas** por equipo (PJ, V, E, D, GF, GC, Pts)
3. **Genera pronósticos** usando algoritmo basado en rendimientos
4. **Valida resultados** comparando pronósticos vs resultados reales

### Funcionalidades Principales

- ✅ Pronóstico principal (L/E/V)
- ✅ Doble oportunidad (1X/X2/12)
- ✅ Ambos marcan (SI/NO)
- ✅ Tres tiempos (TC/1MT/2MT)
- ✅ Clasificación de ligas
- ✅ Estadísticas por equipo
- ✅ Validación GANA/PIERDE

### Stack Tecnológico

```
Frontend: React 18 + React Router + Axios
Backend:  Python 3.11 + FastAPI + Pydantic
Database: MongoDB + Motor (async driver)
```

---

## Diagrama de Componentes

```
┌───────────────────────────────────────────────────┐
│                    FRONTEND                        │
├───────────────────────────────────────────────────┤
│  Dashboard │ Predictions │ Classification │ Teams  │
└────────────────────────┴──────────────────────────┘
                         │
                         ▼
┌───────────────────────────────────────────────────┐
│                   BACKEND API                       │
├───────────────────────────────────────────────────┤
│  /api/prediction/*  │  /api/stats  │  /api/matches  │
└──────────────────────┴────────────────────────────┘
                         │
                         ▼
┌───────────────────────────────────────────────────┐
│                PREDICTION ENGINE                    │
├───────────────────────────────────────────────────┤
│ StatsBuilder │ Classification │ PredictionEngine  │
└────────────────────────┴──────────────────────────┘
                         │
                         ▼
┌───────────────────────────────────────────────────┐
│                    MONGODB                          │
├───────────────────────────────────────────────────┤
│ matches │ team_statistics │ predictions │ validations│
└───────────────────────────────────────────────────┘
```

---

## Versión

| Componente | Versión |
|------------|--------|
| Sistema PLLA | 3.0 |
| Algoritmo | 1.0.0 |
| API | 1.0.0 |
| Documentación | 1.0 |

---

*Índice de Documentación - Diciembre 2024*
