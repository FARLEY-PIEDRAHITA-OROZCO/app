#!/usr/bin/env bash
# shellcheck shell=bash

# ============================================
# Script para ejecutar el módulo API-Fútbol
# - Interactivo y por flags
# - Robusto, con validaciones y colores
# ============================================

set -Eeuo pipefail
shopt -s lastpipe 2>/dev/null || true

# ---------- Configuración ----------
# Puedes sobreescribir APP_DIR con variable de entorno.
# Si no se define, se asume el directorio del script.
APP_DIR="${APP_DIR:-}"
DEFAULT_LIMIT=5
PY_MIN_MAJOR=3
PY_MIN_MINOR=9

# Permite sobrescribir el binario de Python
PYTHON_BIN="${PYTHON_BIN:-}"

NO_COLOR="false"

# ---------- Colores ----------
# Respeta NO_COLOR (estándar de facto) o --no-color
if [[ -n "${NO_COLOR:-}" && "${NO_COLOR}" != "false" ]]; then
  NO_COLOR="true"
fi
if [[ -t 1 && "${NO_COLOR}" != "true" ]]; then
  RED="\033[31m"; GREEN="\033[32m"; YELLOW="\033[33m"; BLUE="\033[34m"; BOLD="\033[1m"; NC="\033[0m"
else
  RED=""; GREEN=""; YELLOW=""; BLUE=""; BOLD=""; NC=""
fi

# ---------- Utilidades (fix para rutas Windows) ----------
err()  { printf "%b%s\n" "${RED}[ERROR]${NC} " "$*" >&2; }
info() { printf "%b%s\n" "${BLUE}[INFO]${NC} " "$*"; }
ok()   { printf "%b%s\n" "${GREEN}[OK]${NC} " "$*"; }
warn() { printf "%b%s\n" "${YELLOW}[WARN]${NC} " "$*"; }

ensure_dir() { [[ -d "$1" ]] || mkdir -p "$1"; }

cleanup() { :; }

on_err() {
  err "Falló la ejecución en línea ${BASH_LINENO[0]}"
  cleanup
}
trap on_err ERR
trap 'warn "Interrumpido por el usuario"; cleanup; exit 130' INT

usage() {
  cat <<'EOF'
MÓDULO API-FÚTBOL

Uso:
  run_api_football.sh                     # Modo interactivo
  run_api_football.sh --all [-y|--yes]
  run_api_football.sh --limit N
  run_api_football.sh --league ID
  run_api_football.sh --stats
  run_api_football.sh --leagues [--csv [RUTA] | --out csv [RUTA]]
  run_api_football.sh --install-deps [dev|all] [--create-venv]
  run_api_football.sh --no-color
  run_api_football.sh --help

Opciones:
  --all                   Procesa TODAS las ligas (toma horas).
  -y, --yes               Omite confirmación al usar --all.
  --limit N               Procesa N ligas (modo prueba). Por defecto: 5
  --league ID             Procesa una liga específica (ID numérico).
  --stats                 Muestra estadísticas de la base de datos.
  --leagues               Lista los IDs existentes de ligas (desde la BD; si no hay, consulta la API).
    --csv [RUTA]          Exporta el listado a CSV. Si RUTA no se especifica, usa reports/leagues.csv
    --out csv [RUTA]      Igual que --csv (alias).

  --install-deps [dev|all]
                          Instala dependencias con pip.
                          Por defecto busca requirements.txt.
                          Con 'dev' intenta requirements-dev.txt además.
                          Con 'all' instala requirements.txt + requirements-dev.txt si existen.
  --create-venv           Si no hay venv, crea uno automáticamente (usado con --install-deps).

  --no-color              Desactiva colores en la salida (o exporta NO_COLOR=1)
  --help                  Muestra esta ayuda.

Variables de entorno:
  APP_DIR                 Directorio del backend. Si apunta a C:\... y existe 'cygpath',
                          se convertirá automáticamente a ruta Unix (/c/...).
  PYTHON_BIN              Ruta al binario de Python (ej: /usr/bin/python3). Si no, se usa python3/python.
  VENV_DIR                Ruta o nombre del entorno virtual preferido (p.ej., .venv).

  # Autenticación para Plan B (consulta directa a la API):
  X_RAPIDAPI_KEY          Clave RapidAPI (prioritaria si está presente). Alias: RAPIDAPI_KEY
  APISPORTS_KEY           Clave API-Sports directa. Alias: API_FOOTBALL_KEY
  APIFOOTBALL_BASE_URL    URL base opcional (si no se define, se deduce por la clave).
                          Ejemplos:
                           - RapidAPI:            https://api-football-v1.p.rapidapi.com/v3
                           - API-Sports directa:  https://v3.football.api-sports.io

  ENV_FILE                Nombre del archivo .env a cargar automáticamente (por defecto: .env)
EOF
}

# ---------- Manejo temprano de --help/no-color ----------
for arg in "$@"; do
  case "$arg" in
    --help|-h) usage; exit 0 ;;
    --no-color) NO_COLOR="true" ;;
  esac
done

# ---------- Directorio de aplicación ----------
resolve_app_dir() {
  if [[ -z "${APP_DIR}" ]]; then
    # Por defecto: directorio del script
    local script_dir
    script_dir="$(cd -- "$(dirname "${BASH_LINENO[0]:-${BASH_SOURCE[0]}}")" && pwd -P)"
    APP_DIR="${script_dir}"
  fi

  # Si parece ruta Windows (C:\...) y existe cygpath, conviértela a Unix (/c/...)
  if [[ "$APP_DIR" =~ ^[A-Za-z]:\\ ]] && command -v cygpath >/dev/null 2>&1; then
    APP_DIR="$(cygpath -u "$APP_DIR")"
  fi

  if [[ ! -d "$APP_DIR" ]]; then
    err "Directorio no encontrado: $APP_DIR"
    exit 1
  fi
}

enter_app_dir() {
  resolve_app_dir
  cd "$APP_DIR"
  ok "Directorio actual: $(pwd)"
}

# ---------- Cargar .env (seguro, sin imprimir valores) ----------
load_env_file() {
  local env_file="${ENV_FILE:-.env}"
  if [[ -f "$APP_DIR/$env_file" ]]; then
    info "Cargando variables de entorno desde $env_file"
    set -a
    # Elimina CRLF si el archivo viene de Windows para evitar errores en Git Bash
    # shellcheck disable=SC1090
    source <(tr -d '\r' < "$APP_DIR/$env_file")
    set +a
  else
    warn "No se encontró $env_file en $APP_DIR (continuando sin cargar .env)"
  fi
}

# Detecta el binario de Python y verifica versión
detect_python() {
  if [[ -n "$PYTHON_BIN" ]]; then
    if ! command -v "$PYTHON_BIN" >/dev/null 2>&1; then
      err "PYTHON_BIN apunta a un binario inexistente: $PYTHON_BIN"
      exit 1
    fi
  else
    if command -v python3 >/dev/null 2>&1; then
      PYTHON_BIN="python3"
    elif command -v python >/dev/null 2>&1; then
      PYTHON_BIN="python"
    else
      err "No se encontró un binario de Python (python3 o python) en PATH."
      exit 1
    fi
  fi

  # Verificar versión mínima
  local ver MAJ MIN PATCH
  ver="$("$PYTHON_BIN" - <<'PY'
import sys
print(".".join(map(str, sys.version_info[:3])))
PY
)"
  IFS='.' read -r MAJ MIN PATCH <<<"$ver"
  if (( MAJ < PY_MIN_MAJOR )) || { (( MAJ == PY_MIN_MAJOR )) && (( MIN < PY_MIN_MINOR )); }; then
    err "Se requiere Python >= ${PY_MIN_MAJOR}.${PY_MIN_MINOR}, encontrado ${ver} en ${PYTHON_BIN}"
    exit 1
  fi
  ok "Usando ${PYTHON_BIN} (Python ${ver})"
}

activate_venv() {
  # 0) Si ya hay un venv ACTIVO en la shell, úsalo.
  if [[ -n "${VIRTUAL_ENV:-}" ]]; then
    ok "Se detectó un entorno virtual activo: ${VIRTUAL_ENV}"
    PYTHON_BIN="python"
    return
  fi

  # 1) Si hay VENV_DIR definido, pruébalo; si no, candidatos conocidos
  local CANDIDATES=()
  if [[ -n "${VENV_DIR:-}" ]]; then
    CANDIDATES+=("$VENV_DIR")
  fi
  CANDIDATES+=(
    ".venv-rebuild-api-football"
    ".venv"
    "venv"
  )

  for v in "${CANDIDATES[@]}"; do
    if [[ -f "$v/Scripts/activate" ]]; then
      # Windows / Git Bash
      # shellcheck source=/dev/null
      source "$v/Scripts/activate"
      ok "Entorno virtual activado: $v (Windows)"
      PYTHON_BIN="python"
      return
    fi
    if [[ -f "$v/bin/activate" ]]; then
      # Linux / macOS
      # shellcheck source=/dev/null
      source "$v/bin/activate"
      ok "Entorno virtual activado: $v (Unix)"
      PYTHON_BIN="python"
      return
    fi
  done

  warn "No se encontró entorno virtual (.venv-rebuild-api-football/.venv/venv). Usando ${PYTHON_BIN:-python} del sistema."
}

confirm() {
  local msg="$1"
  local auto="${2:-false}"
  if [[ "$auto" == "true" ]]; then
    return 0
  fi
  read -r -p "$msg (s/n | y/n): " ans
  case "$ans" in
    s|S|y|Y) return 0 ;;
    *) warn "Operación cancelada por el usuario."; return 1 ;;
  esac
}

# ---------- Helpers de instalación ----------
create_venv_if_needed() {
  # Crea VENV_DIR si se pasó --create-venv y no hay venv activo
  local venv_target="${VENV_DIR:-.venv}"
  if [[ -n "${CREATE_VENV:-}" && "${CREATE_VENV}" == "true" ]]; then
    # Si ya hay venv activo, no hacer nada
    if [[ -n "${VIRTUAL_ENV:-}" ]]; then
      info "Ya hay un venv activo: $VIRTUAL_ENV"
      return 0
    fi
    # Si existe uno de los candidatos, no recrear
    if [[ -d "$venv_target" || -d ".venv" || -d "venv" || -d ".venv-rebuild-api-football" ]]; then
      info "Se detectó un venv en el proyecto. No se creará uno nuevo."
      return 0
    fi
    info "Creando entorno virtual en: $venv_target"
    "$PYTHON_BIN" -m venv "$venv_target"
    # Activar
    if [[ -f "$venv_target/Scripts/activate" ]]; then
      # shellcheck source=/dev/null
      source "$venv_target/Scripts/activate"
      PYTHON_BIN="python"
      ok "Entorno virtual creado y activado (Windows): $venv_target"
    elif [[ -f "$venv_target/bin/activate" ]]; then
      # shellcheck source=/dev/null
      source "$venv_target/bin/activate"
      PYTHON_BIN="python"
      ok "Entorno virtual creado y activado (Unix): $venv_target"
    else
      warn "Se creó el venv pero no se pudo activar automáticamente."
    fi
  fi
}

install_deps() {
  # $1 = scope: base|dev|all
  local scope="${1:-base}"
  info "Instalando dependencias (scope: ${scope})..."

  # Crear venv si se indicó
  create_venv_if_needed

  # Upgrade de herramientas base
  "$PYTHON_BIN" -m pip install --upgrade pip setuptools wheel

  local installed_any="false"

  # Instalar por archivos requirements si existen
  if [[ -f "requirements.txt" ]]; then
    info "Instalando requirements.txt..."
    "$PYTHON_BIN" -m pip install -r requirements.txt
    installed_any="true"
  fi

  if [[ "$scope" == "dev" || "$scope" == "all" ]]; then
    if [[ -f "requirements-dev.txt" ]]; then
      info "Instalando requirements-dev.txt..."
      "$PYTHON_BIN" -m pip install -r requirements-dev.txt
      installed_any="true"
    else
      warn "No se encontró requirements-dev.txt; se instalarán utilidades de dev por paquetes."
    fi
  fi

  # Si no hay requirements, instala un set mínimo útil
  if [[ "$installed_any" == "false" ]]; then
    warn "No se encontraron archivos de requirements. Nada específico que instalar."
    local base_pkgs=( )
    if [[ "$scope" == "dev" || "$scope" == "all" ]]; then
      base_pkgs+=( "ipython" )
    fi
    if ((${#base_pkgs[@]})); then
      "$PYTHON_BIN" -m pip install "${base_pkgs[@]}"
    fi
  fi

  ok "Dependencias instaladas."
}

# ---------- Acciones del módulo ----------
process_all() {
  local assume_yes="${1:-false}"
  info "Procesar TODAS las ligas."
  if confirm "¿Estás seguro? Esto puede tomar varias horas?" "$assume_yes"; then
    "$PYTHON_BIN" -m api_football.main
  else
    return 1
  fi
}

process_limit() {
  local n="$1"
  if [[ ! "$n" =~ ^[0-9]+$ ]] || (( n <= 0 )); then
    err "Valor inválido para --limit: $n (debe ser entero > 0)"
    exit 1
  fi
  info "Procesando ${n} ligas (modo prueba)..."
  "$PYTHON_BIN" -m api_football.main --limit "$n"
}

process_league() {
  local league_id="$1"
  if [[ ! "$league_id" =~ ^[0-9]+$ ]]; then
    err "ID de liga inválido: $league_id (solo dígitos)"
    exit 1
  fi
  info "Procesando liga ${league_id}..."
  "$PYTHON_BIN" -m api_football.main --league-id "$league_id"
}

show_stats() {
  info "Obteniendo estadísticas..."
  "$PYTHON_BIN" - <<'PY'
try:
    from api_football.db_manager import DatabaseManager
except Exception as e:
    raise SystemExit(f"No se pudo importar DatabaseManager: {e}")

db = DatabaseManager()
if db.connect():
    try:
        stats = db.get_statistics()
        print(f'\nTotal partidos: {stats.get("total_partidos", 0)}')
        print(f'Total ligas: {stats.get("total_ligas", 0)}')
        print('\nTop 10 ligas con más partidos:')
        for i, liga in enumerate(stats.get('partidos_por_liga', [])[:10], 1):
            print(f'  {i}. {liga.get("liga_nombre", "N/A")} ({liga.get("_id", "N/A")}): {liga.get("count", 0)} partidos')
    finally:
        db.close()
else:
    raise SystemExit("No se pudo conectar a la base de datos.")
PY
}

# --- Nueva función: listar IDs de ligas (BD -> API) con export a CSV ---
list_league_ids() {
  info "Listando IDs de ligas disponibles..."
  # Pasar formato/ruta de salida a Python mediante variables de entorno
  LEAGUES_OUT_FORMAT="${LEAGUES_OUT_FORMAT:-}" \
  LEAGUES_OUT_PATH="${LEAGUES_OUT_PATH:-}" \
  "$PYTHON_BIN" - <<'PY'
from typing import Any, Dict, List, Tuple, Optional
import os, json, csv

def is_numeric(s: Any) -> bool:
    try:
        int(str(s).strip())
        return True
    except Exception:
        return False

def get_first(d: Dict[str, Any], keys: List[str]) -> Optional[Any]:
    for k in keys:
        if k in d and d[k] is not None:
            return d[k]
    return None

def normalize_league_item(x: Any) -> Tuple[str, str]:
    """
    Normaliza un item de liga a (id_str, name_str).
    - Prefiere IDs numéricos: league_id | id | leagueId | liga_id | (nested league.id)
    - Usa _id SOLO como ID si es numérico; si no, lo usa como nombre.
    - Nombre: league_name | liga_nombre | name | (nested league.name) | _id (si no numérico)
    """
    lid: Optional[Any] = None
    name: Optional[str] = None

    if isinstance(x, dict):
        # ID en campos "buenos"
        lid = get_first(x, ["league_id", "leagueId", "liga_id", "id"])
        # ID anidado
        if lid is None and isinstance(x.get("league"), dict):
            lid = get_first(x["league"], ["id", "league_id", "leagueId"])
        # _id solo si es numérico
        if lid is None and "_id" in x and is_numeric(x["_id"]):
            lid = x["_id"]

        # Nombre
        name = get_first(x, ["league_name", "liga_nombre", "name"])
        if name is None and isinstance(x.get("league"), dict):
            name = get_first(x["league"], ["name", "league_name", "liga_nombre"])
        if (name is None or str(name).strip() == "") and "_id" in x and not is_numeric(x["_id"]):
            name = str(x["_id"])

        return (str(lid).strip() if lid is not None else "", str(name or "").strip())

    elif isinstance(x, (list, tuple)):
        if len(x) >= 2:
            a, b = str(x[0] or "").strip(), str(x[1] or "").strip()
            if not is_numeric(a) and is_numeric(b):
                a, b = b, a
            return (a, b)
        elif len(x) == 1:
            v = str(x[0] or "").strip()
            return (v if is_numeric(v) else "", "")

    return ("", "")

def print_table(rows: List[Tuple[str, str]]) -> None:
    rows = [(i, n) for (i, n) in rows if i]
    if not rows:
        print("No se encontraron ligas con IDs numéricos.")
        return
    rows.sort(key=lambda r: (r[1].casefold() if r[1] else "~", int(r[0]) if r[0].isdigit() else r[0]))
    id_w = max(2, *(len(r[0]) for r in rows))
    nm_w = max(6, *(len(r[1]) for r in rows))
    print(f"\nTotal ligas: {len(rows)}\n")
    print(f"{'ID'.ljust(id_w)}  {'Nombre'.ljust(nm_w)}")
    print(f"{'-'*id_w}  {'-'*nm_w}")
    for lid, name in rows:
        print(f"{lid.ljust(id_w)}  {name}")

def export_csv(rows: List[Tuple[str, str]], path: str) -> None:
    if not rows:
        print(f"No hay datos para exportar a CSV ({path}).")
        return
    dirn = os.path.dirname(path)
    if dirn:
        os.makedirs(dirn, exist_ok=True)
    # Escribir CSV con encabezado UTF-8
    with open(path, "w", encoding="utf-8", newline="") as f:
        w = csv.writer(f)
        w.writerow(["id", "nombre"])
        for lid, name in rows:
            if lid:
                w.writerow([lid, name])
    print(f"CSV exportado a: {path}")

def try_db() -> List[Tuple[str, str]]:
    try:
        from api_football.db_manager import DatabaseManager  # type: ignore
    except Exception:
        return []
    db = DatabaseManager()
    if not getattr(db, "connect", None) or not db.connect():
        return []
    rows: List[Tuple[str, str]] = []
    try:
        if hasattr(db, "get_leagues"):
            try:
                data = db.get_leagues()  # type: ignore[attr-defined]
                for it in (data or []):
                    lid, name = normalize_league_item(it)
                    if lid:
                        rows.append((lid, name))
                if rows:
                    return rows
            except Exception:
                pass
        if hasattr(db, "get_statistics"):
            try:
                stats = db.get_statistics()  # type: ignore[attr-defined]
                for it in stats.get("partidos_por_liga", []):
                    lid, name = normalize_league_item(it)
                    if lid:
                        rows.append((lid, name))
            except Exception:
                pass
    finally:
        try:
            if hasattr(db, "close"):
                db.close()
        except Exception:
            pass
    return rows

def try_api() -> List[Tuple[str, str]]:
    """
    Consulta directa a la API si no hay datos en BD.
    Soporta:
      - RapidAPI:            https://api-football-v1.p.rapidapi.com/v3/leagues
        headers: x-rapidapi-key, x-rapidapi-host
      - API-Sports directa:  https://v3.football.api-sports.io/leagues
        headers: x-apisports-key
    Usa variables de entorno:
      - X_RAPIDAPI_KEY (o RAPIDAPI_KEY)  -> RapidAPI
      - APISPORTS_KEY (o API_FOOTBALL_KEY) -> API-Sports
      - APIFOOTBALL_BASE_URL (o API_FOOTBALL_BASE_URL) -> override base URL

    Heurística: si API_FOOTBALL_KEY "parece" RapidAPI (contiene 'msh'), se trata como RapidAPI.
    """
    import ssl
    from urllib.request import Request, urlopen
    from urllib.error import URLError, HTTPError

    env = os.environ
    rapid_key = env.get("X_RAPIDAPI_KEY") or env.get("RAPIDAPI_KEY")
    apisports_key = env.get("APISPORTS_KEY") or env.get("API_FOOTBALL_KEY")

    # Heurística: si solo tenemos API_FOOTBALL_KEY y parece RapidAPI (contiene 'msh'),
    # úsala como RapidAPI.
    if not rapid_key and apisports_key and "msh" in str(apisports_key).lower():
        rapid_key = apisports_key
        apisports_key = None

    # Detectar modo y URL base por defecto
    base = env.get("APIFOOTBALL_BASE_URL") or env.get("API_FOOTBALL_BASE_URL")
    headers = {}
    if rapid_key:
        if not base:
            base = "https://api-football-v1.p.rapidapi.com/v3"
        headers["x-rapidapi-key"] = rapid_key
        headers["x-rapidapi-host"] = "api-football-v1.p.rapidapi.com"
    elif apisports_key:
        if not base:
            base = "https://v3.football.api-sports.io"
        headers["x-apisports-key"] = apisports_key
    else:
        # Sin claves -> no se puede consultar
        return []

    url = (base.rstrip("/") + "/leagues")
    req = Request(url, method="GET", headers=headers)
    ctx = ssl.create_default_context()

    try:
        with urlopen(req, context=ctx, timeout=30) as resp:
            raw = resp.read()
        data = json.loads(raw.decode("utf-8", "ignore"))
    except HTTPError as e:
        print(f"Error HTTP consultando API: {e.code} {e.reason}")
        return []
    except URLError as e:
        print(f"Error de red consultando API: {e.reason}")
        return []
    except Exception as e:
        print(f"Error procesando respuesta de API: {e}")
        return []

    # API-Football responde con {"response":[{league:{id,name,...}, ...}, ...]}
    rows: List[Tuple[str, str]] = []
    try:
        for item in data.get("response", []) or []:
            league = item.get("league") or {}
            lid = league.get("id")
            name = league.get("name") or ""
            if is_numeric(lid):
                rows.append((str(lid), str(name or "")))
    except Exception:
        pass

    # Deduplicar por ID
    dedup: Dict[str, str] = {}
    for lid, name in rows:
        if lid not in dedup:
            dedup[lid] = name
    rows = [(lid, dedup[lid]) for lid in dedup.keys()]
    return rows

def maybe_export(rows: List[Tuple[str, str]]):
    out_fmt = os.environ.get("LEAGUES_OUT_FORMAT", "").lower().strip()
    if out_fmt != "csv":
        return
    out_path = os.environ.get("LEAGUES_OUT_PATH") or "reports/leagues.csv"
    export_csv(rows, out_path)

def main():
    # 1) Intentar BD
    rows = try_db()
    if rows:
        print_table(rows)
        maybe_export(rows)
        return
    # 2) Consultar API si no hay datos en BD
    rows = try_api()
    if rows:
        print_table(rows)
        maybe_export(rows)
        return
    # 3) Sin datos
    print("No fue posible obtener los IDs de ligas desde la BD ni desde la API.")
    print("Sugerencias:")
    print("  • Define X_RAPIDAPI_KEY (RapidAPI) o APISPORTS_KEY (API-Sports) como variables de entorno.")
    print("  • Opcional: APIFOOTBALL_BASE_URL para personalizar la URL base de la API.")
    print("  • Asegúrate de tener conexión a internet y permisos en la clave.")

if __name__ == "__main__":
    main()
PY
}

# ---------- Parseo de flags (no interactivo) ----------
if (( $# > 0 )); then
  ASSUME_YES="false"
  DO_ALL="false"; DO_LIMIT="false"; DO_LEAGUE="false"; DO_STATS="false"; DO_LEAGUES="false"
  DO_INSTALL_DEPS="false"; INSTALL_SCOPE="base"; CREATE_VENV="false"
  LIMIT_N="$DEFAULT_LIMIT"; LEAGUE_ID=""
  LEAGUES_OUT_FORMAT=""; LEAGUES_OUT_PATH=""

  while (( $# > 0 )); do
    case "$1" in
      --all) DO_ALL="true"; shift;;
      --limit) DO_LIMIT="true"; LIMIT_N="${2:-$DEFAULT_LIMIT}"; shift 2;;
      --league) DO_LEAGUE="true"; LEAGUE_ID="${2:-}"; shift 2;;
      --stats) DO_STATS="true"; shift;;
      --leagues) DO_LEAGUES="true"; shift;;
      --csv)
        LEAGUES_OUT_FORMAT="csv"
        if [[ -n "${2:-}" && "${2:0:1}" != "-" ]]; then
          LEAGUES_OUT_PATH="${2}"
          shift 2
        else
          LEAGUES_OUT_PATH="reports/leagues.csv"
          shift
        fi
        ;;
      --out)
        fmt="${2:-}"
        if [[ -z "$fmt" ]]; then
          err "Falta el formato para --out (solo 'csv' soportado)"; exit 2
        fi
        case "$fmt" in
          csv|CSV)
            LEAGUES_OUT_FORMAT="csv"
            shift 2
            if [[ -n "${1:-}" && "${1:0:1}" != "-" ]]; then
              LEAGUES_OUT_PATH="$1"; shift
            else
              LEAGUES_OUT_PATH="reports/leagues.csv"
            fi
            ;;
          *)
            err "Formato no soportado para --out: $fmt (solo 'csv')"; exit 2;;
        esac
        ;;
      -y|--yes) ASSUME_YES="true"; shift;;
      --no-color) NO_COLOR="true"; shift;;
      --install-deps)
        DO_INSTALL_DEPS="true"
        if [[ -n "${2:-}" && "${2:0:1}" != "-" ]]; then
          case "$2" in
            dev|all|base) INSTALL_SCOPE="$2" ;;
            *) warn "Alcance de --install-deps no reconocido: $2 (usando 'base')"; INSTALL_SCOPE="base" ;;
          esac
          shift 2
        else
          INSTALL_SCOPE="base"
          shift
        fi
        ;;
      --create-venv) CREATE_VENV="true"; shift;;
      --help|-h) usage; exit 0;;
      --) shift; break;;
      *) err "Opción no reconocida: $1"; usage; exit 2;;
    esac
  done

  # Setup (respeta venv activo y priorízalo)
  enter_app_dir
  load_env_file
  activate_venv
  detect_python
  if [[ "$DO_INSTALL_DEPS" == "true" ]]; then
    install_deps "$INSTALL_SCOPE"
  fi

  # Acciones
  [[ "$DO_ALL" == "true" ]] && process_all "$ASSUME_YES"
  [[ "$DO_LIMIT" == "true" ]] && process_limit "$LIMIT_N"
  if [[ "$DO_LEAGUE" == "true" ]]; then
    [[ -z "$LEAGUE_ID" ]] && { err "Falta el ID de liga para --league"; exit 1; }
    process_league "$LEAGUE_ID"
  fi
  [[ "$DO_STATS" == "true" ]] && show_stats

  if [[ "$DO_LEAGUES" == "true" ]]; then
    # Exportar variables de salida (si se pidieron) para que las lea Python
    if [[ -n "$LEAGUES_OUT_FORMAT" ]]; then export LEAGUES_OUT_FORMAT; fi
    if [[ -n "$LEAGUES_OUT_PATH" ]]; then export LEAGUES_OUT_PATH; fi
    list_league_ids
  fi

  exit 0
fi

# ---------- Modo interactivo ----------
enter_app_dir
load_env_file
activate_venv
detect_python

printf "%b\n" "${BOLD}====================================${NC}"
printf "%b\n" "${BOLD}MÓDULO API-FÚTBOL${NC}"
printf "%b\n" "${BOLD}====================================${NC}"
echo
echo "Opciones:"
echo "1. Procesar todas las ligas"
echo "2. Procesar ${DEFAULT_LIMIT} ligas (modo prueba)"
echo "3. Procesar una liga específica"
echo "4. Ver estadísticas de la BD"
echo "5. Ver IDs de ligas disponibles (BD -> API)"
echo "6. Instalar dependencias"
echo

read -r -p "Selecciona una opción (1-6): " option

case "$option" in
  1)
    echo
    process_all "false" || true
    ;;
  2)
    echo
    process_limit "$DEFAULT_LIMIT"
    ;;
  3)
    echo
    read -r -p "Ingresa el ID de la liga (ej: 140 para La Liga): " league_id
    process_league "$league_id"
    ;;
  4)
    echo
    show_stats
    ;;
  5)
    echo
    read -r -p "¿Deseas exportar a CSV? (s/n): " doexp
    LEAGUES_OUT_FORMAT=""
    LEAGUES_OUT_PATH=""
    case "$doexp" in
      s|S|y|Y)
        LEAGUES_OUT_FORMAT="csv"
        read -r -p "Ruta del CSV (Enter para usar 'reports/leagues.csv'): " path
        if [[ -z "$path" ]]; then
          LEAGUES_OUT_PATH="reports/leagues.csv"
        else
          LEAGUES_OUT_PATH="$path"
        fi
        ;;
      *) ;;
    esac
    # Pasar variables a Python
    if [[ -n "$LEAGUES_OUT_FORMAT" ]]; then export LEAGUES_OUT_FORMAT; fi
    if [[ -n "$LEAGUES_OUT_PATH" ]]; then export LEAGUES_OUT_PATH; fi
    list_league_ids
    ;;
  6)
    echo
    echo "Alcance de instalación:"
    echo "  1) Base (requirements.txt)"
    echo "  2) Dev (requirements-dev.txt además)"
    echo "  3) All (requirements + dev si existen)"
    read -r -p "Elige (1-3): " sc
    case "$sc" in
      1) INSTALL_SCOPE="base" ;;
      2) INSTALL_SCOPE="dev" ;;
      3) INSTALL_SCOPE="all" ;;
      *) INSTALL_SCOPE="base" ;;
    esac
    read -r -p "¿Crear venv si no existe? (s/n): " mk
    case "$mk" in
      s|S|y|Y) CREATE_VENV="true" ;;
      *) CREATE_VENV="false" ;;
    esac
    install_deps "$INSTALL_SCOPE"
    ;;
  *)
    err "Opción inválida"
    exit 1
    ;;
esac

ok "Finalizado."