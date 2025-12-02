"""Transformador de datos de la API a formato requerido."""
from typing import Dict, List, Optional, Any
from datetime import datetime
from .utils import setup_logger, normalize_string

logger = setup_logger(__name__)


class DataTransformer:
    """Transforma datos de la API al formato requerido."""
    
    @staticmethod
    def transform_league_id(country: str, league_name: str) -> str:
        """Transforma el ID de liga al formato PAIS_NOMBRE-DE-LIGA.
        
        Args:
            country: Nombre del país
            league_name: Nombre de la liga
            
        Returns:
            ID de liga transformado (ej: SPAIN_LALIGA)
        """
        country_normalized = normalize_string(country)
        league_normalized = normalize_string(league_name)
        
        return f"{country_normalized}_{league_normalized}"
    
    @staticmethod
    def extract_match_data(
        fixture: Dict,
        league_info: Dict,
        standings: Optional[Dict[int, int]] = None
    ) -> Optional[Dict[str, Any]]:
        """Extrae y transforma los datos de un partido.
        
        Args:
            fixture: Datos del partido desde la API
            league_info: Información de la liga
            standings: Diccionario con posiciones de equipos {team_id: posición}
            
        Returns:
            Diccionario con datos transformados o None si falta información crítica
        """
        try:
            # Extraer datos básicos del fixture
            fixture_data = fixture.get('fixture', {})
            teams = fixture.get('teams', {})
            goals = fixture.get('goals', {})
            score = fixture.get('score', {})
            league = fixture.get('league', {})
            
            # Validar que existan los datos mínimos necesarios
            if not fixture_data or not teams:
                logger.warning("Fixture sin datos mínimos necesarios")
                return None
            
            # Extraer equipos
            home_team = teams.get('home', {})
            away_team = teams.get('away', {})
            
            if not home_team or not away_team:
                logger.warning(f"Fixture {fixture_data.get('id')} sin equipos completos")
                return None
            
            # Extraer IDs de equipos
            home_team_id = home_team.get('id')
            away_team_id = away_team.get('id')
            
            # Obtener posiciones de clasificación
            home_position = standings.get(home_team_id, 0) if standings else 0
            away_position = standings.get(away_team_id, 0) if standings else 0
            
            # Extraer fecha y hora
            fixture_date = fixture_data.get('date', '')
            fecha = ''
            hora = ''
            
            if fixture_date:
                try:
                    dt = datetime.fromisoformat(fixture_date.replace('Z', '+00:00'))
                    fecha = dt.strftime('%Y-%m-%d')
                    hora = dt.strftime('%H:%M')
                except Exception as e:
                    logger.warning(f"Error parseando fecha {fixture_date}: {str(e)}")
            
            # Extraer goles
            halftime_score = score.get('halftime', {})
            fulltime_score = score.get('fulltime', {})
            
            goles_local_1mt = halftime_score.get('home') if halftime_score.get('home') is not None else 0
            goles_local_tr = fulltime_score.get('home') if fulltime_score.get('home') is not None else 0
            goles_visitante_1mt = halftime_score.get('away') if halftime_score.get('away') is not None else 0
            goles_visitante_tr = fulltime_score.get('away') if fulltime_score.get('away') is not None else 0
            
            # Transformar liga_id
            country = league_info.get('country', {}).get('name', 'UNKNOWN')
            league_name = league_info.get('league', {}).get('name', 'UNKNOWN')
            liga_id_transformed = DataTransformer.transform_league_id(country, league_name)
            
            # Construir el documento final
            match_data = {
                # Datos originales requeridos
                'equipo_local': home_team.get('name', ''),
                'equipo_visitante': away_team.get('name', ''),
                'estado_del_partido': fixture_data.get('status', {}).get('long', ''),
                'fecha': fecha,
                'goles_local_1MT': goles_local_1mt,
                'goles_local_TR': goles_local_tr,
                'goles_visitante_1MT': goles_visitante_1mt,
                'goles_visitante_TR': goles_visitante_tr,
                'hora': hora,
                'id_equipo_local': home_team_id,
                'id_equipo_visitante': away_team_id,
                'id_partido': fixture_data.get('id'),
                'liga_id': liga_id_transformed,
                'liga_nombre': league_name,
                'ronda': league.get('round', ''),
                
                # Campos adicionales para el formato de salida
                'pos_clasif_local': home_position,
                'pos_clasif_visita': away_position,
                
                # Metadatos
                'created_at': datetime.utcnow().isoformat(),
                'api_league_id': league_info.get('league', {}).get('id'),
                'season': league.get('season')
            }
            
            return match_data
            
        except Exception as e:
            logger.error(f"Error transformando fixture: {str(e)}")
            return None
    
    @staticmethod
    def batch_transform(
        fixtures: List[Dict],
        league_info: Dict,
        standings: Optional[Dict[int, int]] = None
    ) -> List[Dict[str, Any]]:
        """Transforma un lote de fixtures.
        
        Args:
            fixtures: Lista de fixtures desde la API
            league_info: Información de la liga
            standings: Diccionario con posiciones de equipos
            
        Returns:
            Lista de datos transformados
        """
        transformed_data = []
        
        for fixture in fixtures:
            match_data = DataTransformer.extract_match_data(
                fixture,
                league_info,
                standings
            )
            
            if match_data:
                transformed_data.append(match_data)
        
        logger.info(f"Transformados {len(transformed_data)} de {len(fixtures)} fixtures")
        
        return transformed_data
