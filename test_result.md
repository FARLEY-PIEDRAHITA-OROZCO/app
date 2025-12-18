#====================================================================================================
# START - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================

# THIS SECTION CONTAINS CRITICAL TESTING INSTRUCTIONS FOR BOTH AGENTS
# BOTH MAIN_AGENT AND TESTING_AGENT MUST PRESERVE THIS ENTIRE BLOCK

# Communication Protocol:
# If the `testing_agent` is available, main agent should delegate all testing tasks to it.
#
# You have access to a file called `test_result.md`. This file contains the complete testing state
# and history, and is the primary means of communication between main and the testing agent.
#
# Main and testing agents must follow this exact format to maintain testing data. 
# The testing data must be entered in yaml format Below is the data structure:
# 
## user_problem_statement: {problem_statement}
## backend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.py"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## frontend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.js"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## metadata:
##   created_by: "main_agent"
##   version: "1.0"
##   test_sequence: 0
##   run_ui: false
##
## test_plan:
##   current_focus:
##     - "Task name 1"
##     - "Task name 2"
##   stuck_tasks:
##     - "Task name with persistent issues"
##   test_all: false
##   test_priority: "high_first"  # or "sequential" or "stuck_first"
##
## agent_communication:
##     -agent: "main"  # or "testing" or "user"
##     -message: "Communication message between agents"

# Protocol Guidelines for Main agent
#
# 1. Update Test Result File Before Testing:
#    - Main agent must always update the `test_result.md` file before calling the testing agent
#    - Add implementation details to the status_history
#    - Set `needs_retesting` to true for tasks that need testing
#    - Update the `test_plan` section to guide testing priorities
#    - Add a message to `agent_communication` explaining what you've done
#
# 2. Incorporate User Feedback:
#    - When a user provides feedback that something is or isn't working, add this information to the relevant task's status_history
#    - Update the working status based on user feedback
#    - If a user reports an issue with a task that was marked as working, increment the stuck_count
#    - Whenever user reports issue in the app, if we have testing agent and task_result.md file so find the appropriate task for that and append in status_history of that task to contain the user concern and problem as well 
#
# 3. Track Stuck Tasks:
#    - Monitor which tasks have high stuck_count values or where you are fixing same issue again and again, analyze that when you read task_result.md
#    - For persistent issues, use websearch tool to find solutions
#    - Pay special attention to tasks in the stuck_tasks list
#    - When you fix an issue with a stuck task, don't reset the stuck_count until the testing agent confirms it's working
#
# 4. Provide Context to Testing Agent:
#    - When calling the testing agent, provide clear instructions about:
#      - Which tasks need testing (reference the test_plan)
#      - Any authentication details or configuration needed
#      - Specific test scenarios to focus on
#      - Any known issues or edge cases to verify
#
# 5. Call the testing agent with specific instructions referring to test_result.md
#
# IMPORTANT: Main agent must ALWAYS update test_result.md BEFORE calling the testing agent, as it relies on this file to understand what to test next.

#====================================================================================================
# END - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================



#====================================================================================================
# Testing Data - Main Agent and testing sub agent both should log testing data below this section
#====================================================================================================

user_problem_statement: |
  Implementar el Motor de Pronósticos Deportivos PLLA 3.0, un sistema que:
  1. Construye estadísticas acumuladas por equipo (General, Local, Visitante)
  2. Genera tablas de clasificación para 3 tiempos (TC, 1MT, 2MT)
  3. Calcula pronósticos usando algoritmo de decisión basado en probabilidades
  4. Genera Doble Oportunidad (1X, X2, 12) y Ambos Marcan (SI/NO)
  5. Valida pronósticos contra resultados reales (GANA/PIERDE)

backend:
  - task: "Build Statistics Endpoint - POST /api/prediction/build-stats"
    implemented: true
    working: true
    file: "prediction_engine/stats_builder.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Implementado endpoint para construir estadísticas de equipos. Procesa partidos y calcula PJ, V, E, D, GF, GC, Pts por contexto (General/Local/Visitante) y tiempo (TC/1MT/2MT)"
      - working: true
        agent: "testing"
        comment: "✅ TESTED: Endpoint funciona correctamente. Construye estadísticas para 20 equipos de La Liga 2023. Retorna success=true, mensaje con equipos construidos, y lista de equipos procesados."

  - task: "Classification Endpoint - GET /api/prediction/classification"
    implemented: true
    working: true
    file: "prediction_engine/classification.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Implementado endpoint para obtener tabla de clasificación ordenada por Puntos > Diferencia de goles > Goles a favor"
      - working: true
        agent: "testing"
        comment: "✅ TESTED: Clasificación funciona perfectamente. Real Madrid 1ro con 95 pts como esperado. Soporta tiempo_completo, primer_tiempo, segundo_tiempo. Retorna 20 equipos ordenados correctamente por puntos."

  - task: "Generate Prediction Endpoint - POST /api/prediction/generate"
    implemented: true
    working: true
    file: "prediction_engine/prediction_engine.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Implementado motor de pronósticos con: cálculo de probabilidades, factores de ajuste (1-5), algoritmo de decisión, doble oportunidad, ambos marcan"
      - working: true
        agent: "testing"
        comment: "✅ TESTED: Motor de pronósticos funciona excelentemente. Genera pronósticos para TC/1MT/2MT con probabilidades (suman ~100%), doble oportunidad, ambos marcan, confianza. Real Madrid vs Almeria favorece correctamente a Real Madrid (L). Maneja errores 404 para equipos inexistentes."

  - task: "Team Stats Endpoint - GET /api/prediction/team/{nombre}"
    implemented: true
    working: true
    file: "prediction_engine/stats_builder.py"
    stuck_count: 0
    priority: "medium"
    needs_retesting: false
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Endpoint para obtener estadísticas detalladas de un equipo específico"
      - working: true
        agent: "testing"
        comment: "✅ TESTED: Estadísticas de equipo funcionan correctamente. Retorna stats completas para Barcelona: tiempo_completo, primer_tiempo, segundo_tiempo con todos los campos requeridos (PJ, V, E, D, GF, GC, Pts, rendimientos)."

  - task: "Validate Prediction Endpoint - POST /api/prediction/validate"
    implemented: true
    working: true
    file: "prediction_engine/validation.py"
    stuck_count: 0
    priority: "medium"
    needs_retesting: false
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Implementado validador que compara pronósticos con resultados reales y determina GANA/PIERDE"
      - working: true
        agent: "testing"
        comment: "✅ TESTED: Validación de pronósticos funciona correctamente. Acepta pronostico_id y goles reales, retorna validación con resultado_real, doble_oportunidad, ambos_marcan, acierto_principal para tiempo_completo."

  - task: "Effectiveness Endpoint - GET /api/prediction/effectiveness"
    implemented: true
    working: true
    file: "prediction_engine/validation.py"
    stuck_count: 0
    priority: "low"
    needs_retesting: false
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Endpoint para calcular métricas de efectividad del sistema"
      - working: true
        agent: "testing"
        comment: "✅ TESTED: Endpoint de efectividad funciona correctamente. Retorna success=true y datos de efectividad del sistema."

  - task: "Config Endpoint - GET /api/prediction/config"
    implemented: true
    working: true
    file: "server.py"
    stuck_count: 0
    priority: "low"
    needs_retesting: false
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Endpoint que retorna configuración y umbrales del algoritmo"
      - working: true
        agent: "testing"
        comment: "✅ TESTED: Configuración funciona perfectamente. Retorna version='1.0.0', umbrales del algoritmo, y configuración general como esperado."

  - task: "Teams List Endpoint - GET /api/prediction/teams"
    implemented: true
    working: true
    file: "server.py"
    stuck_count: 0
    priority: "low"
    needs_retesting: false
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Endpoint para listar todos los equipos disponibles con sus estadísticas básicas"
      - working: true
        agent: "testing"
        comment: "✅ TESTED: Lista de equipos funciona correctamente. Retorna 20 equipos de La Liga 2023 con nombre, puntos, partidos_jugados, rendimiento ordenados por puntos descendente."

frontend:
  - task: "Frontend básico existente (Dashboard, Matches, Scraping)"
    implemented: true
    working: true
    file: "frontend/src/App.js"
    stuck_count: 0
    priority: "low"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: "Frontend existente del job anterior, funcional"

metadata:
  created_by: "main_agent"
  version: "1.0"
  test_sequence: 1
  run_ui: false

test_plan:
  current_focus:
    - "Build Statistics Endpoint - POST /api/prediction/build-stats"
    - "Classification Endpoint - GET /api/prediction/classification"
    - "Generate Prediction Endpoint - POST /api/prediction/generate"
    - "Team Stats Endpoint - GET /api/prediction/team/{nombre}"
    - "Validate Prediction Endpoint - POST /api/prediction/validate"
  stuck_tasks: []
  test_all: true
  test_priority: "high_first"

agent_communication:
  - agent: "main"
    message: |
      He implementado el Motor de Pronósticos PLLA 3.0 completo. Los módulos están en /app/backend/prediction_engine/:
      
      - models.py: Modelos Pydantic (Equipo, EstadisticasEquipo, Pronostico, Validacion)
      - config.py: Configuración y umbrales del algoritmo
      - stats_builder.py: Constructor de estadísticas por equipo
      - classification.py: Motor de clasificación
      - prediction_engine.py: Motor principal de pronósticos
      - validation.py: Validador de pronósticos
      
      Base de datos tiene 380 partidos de La Liga 2023 con datos de goles por tiempo.
      
      Por favor probar:
      1. POST /api/prediction/build-stats - Construir estadísticas (debe ejecutarse primero)
      2. GET /api/prediction/classification - Obtener tabla de posiciones
      3. POST /api/prediction/generate - Generar pronóstico (usar equipos de La Liga)
      4. GET /api/prediction/team/{nombre} - Stats de un equipo (ej: Barcelona, Real Madrid)
      5. POST /api/prediction/validate - Validar un pronóstico con resultado real
      
      Equipos disponibles: Real Madrid, Barcelona, Girona, Atletico Madrid, Athletic Club, etc.
      Liga ID: SPAIN_LA_LIGA, Temporada: 2023