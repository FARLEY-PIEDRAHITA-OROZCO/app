"""
========================================
MÓDULO: stats_builder.py
========================================

Constructor de Estadísticas - Equivalente a hojas CONSTRUCCIÓN del Excel.

Este módulo procesa los partidos de la base de datos y construye
las estadísticas acumuladas por equipo, separadas por:
- Contexto: General, Local, Visitante
- Tiempo: Completo (90 min), Primer Tiempo, Segundo Tiempo

Flujo de Datos:
--------------
Partidos (MongoDB) → StatsBuilder → Estadísticas por Equipo (MongoDB)

Clases:
-------
- StatsBuilder: Clase principal para construir estadísticas

Historial de Cambios:
--------------------
- v1.0.0 (Dic 2024): Versión inicial
"""

from typing import Dict, List, Optional, Any
from datetime import datetime, timezone
import logging

from .models import Equipo, EstadisticasEquipo
from .config import Config, TipoTiempo, ResultadoEnum

logger = logging.getLogger(__name__)


class StatsBuilder:
    """
    Constructor de estadísticas por equipo.
    
    Equivalente a las hojas CONSTRUCCIÓN, CONS. 1 MT, CONS. 2 MT del Excel.
    Procesa partidos y acumula estadísticas por equipo.
    
    Atributos:
    ----------
    db : AsyncIOMotorDatabase
        Conexión a la base de datos MongoDB
    equipos_cache : Dict[str, Equipo]
        Cache de equipos procesados
    
    Métodos Públicos:
    ----------------
    construir_estadisticas(liga_id, temporada)
        Construye estadísticas para todos los equipos de una liga
    
    obtener_stats_equipo(nombre, liga_id)
        Obtiene estadísticas de un equipo específico
    
    Ejemplo de Uso:
    ---------------
    ```python
    builder = StatsBuilder(db)
    await builder.construir_estadisticas('SPAIN_LA_LIGA', 2023)
    
    stats = await builder.obtener_stats_equipo('Barcelona', 'SPAIN_LA_LIGA')
    print(stats.stats_completo.puntos)  # 75
    ```
    """
    
    def __init__(self, db):
        """
        Inicializa el constructor de estadísticas.
        
        Parámetros:
        -----------
        db : AsyncIOMotorDatabase
            Conexión a MongoDB (motor async)
        """
        self.db = db
        self.equipos_cache: Dict[str, Equipo] = {}
        logger.info("StatsBuilder inicializado")
    
    async def construir_estadisticas(
        self,
        liga_id: str,
        temporada: Optional[int] = None
    ) -> Dict[str, Equipo]:
        """
        Construye estadísticas para todos los equipos de una liga.
        
        Este método:
        1. Obtiene todos los partidos de la liga
        2. Procesa cada partido cronológicamente
        3. Acumula estadísticas por equipo
        4. Guarda en la colección team_statistics
        
        Parámetros:
        -----------
        liga_id : str
            Identificador de la liga (ej: 'SPAIN_LA_LIGA')
        temporada : int, optional
            Año de la temporada. Si no se especifica, usa todos los datos.
        
        Retorna:
        --------
        Dict[str, Equipo]
            Diccionario con equipos y sus estadísticas
            Clave: nombre del equipo
            Valor: objeto Equipo con stats
        
        Raises:
        -------
        ValueError
            Si no hay partidos para procesar
        
        Ejemplo:
        --------
        ```python
        equipos = await builder.construir_estadisticas('SPAIN_LA_LIGA', 2023)
        for nombre, equipo in equipos.items():
            print(f"{nombre}: {equipo.stats_completo.puntos} pts")
        ```
        """
        logger.info(f"Construyendo estadísticas para {liga_id}, temporada {temporada}")
        
        # Limpiar cache
        self.equipos_cache = {}
        
        # Obtener partidos ordenados por fecha
        query = {"liga_id": liga_id}
        if temporada:
            query["season"] = temporada
        
        partidos = await self.db[Config.COLECCION_PARTIDOS].find(
            query
        ).sort("fecha", 1).to_list(None)
        
        if not partidos:
            logger.warning(f"No hay partidos para {liga_id}")
            raise ValueError(f"No hay partidos para procesar en {liga_id}")
        
        logger.info(f"Procesando {len(partidos)} partidos")
        
        # Procesar cada partido
        for partido in partidos:
            await self._procesar_partido(partido, liga_id, temporada or partido.get('season', 2023))
        
        # Calcular campos derivados para cada equipo
        for equipo in self.equipos_cache.values():
            equipo.stats_completo.calcular_derivados()
            equipo.stats_primer_tiempo.calcular_derivados()
            equipo.stats_segundo_tiempo.calcular_derivados()
            equipo.updated_at = datetime.now(timezone.utc)
        
        # Guardar en base de datos
        await self._guardar_estadisticas(liga_id, temporada or 2023)
        
        logger.info(f"Estadísticas construidas para {len(self.equipos_cache)} equipos")
        return self.equipos_cache
    
    async def _procesar_partido(
        self,
        partido: Dict[str, Any],
        liga_id: str,
        temporada: int
    ) -> None:
        """
        Procesa un partido y actualiza las estadísticas de ambos equipos.
        
        Parámetros:
        -----------
        partido : dict
            Datos del partido de MongoDB
        liga_id : str
            ID de la liga
        temporada : int
            Año de la temporada
        
        Lógica:
        -------
        1. Obtiene o crea los equipos
        2. Extrae goles (TC, 1MT, 2MT)
        3. Determina resultado para cada tiempo
        4. Actualiza estadísticas de ambos equipos
        """
        equipo_local_nombre = partido['equipo_local']
        equipo_visitante_nombre = partido['equipo_visitante']
        
        # Obtener o crear equipos
        equipo_local = self._obtener_o_crear_equipo(equipo_local_nombre, liga_id, temporada)
        equipo_visitante = self._obtener_o_crear_equipo(equipo_visitante_nombre, liga_id, temporada)
        
        # Extraer goles
        goles_local_tc = partido.get('goles_local_TR', 0)
        goles_visita_tc = partido.get('goles_visitante_TR', 0)
        goles_local_1mt = partido.get('goles_local_1MT', 0)
        goles_visita_1mt = partido.get('goles_visitante_1MT', 0)
        
        # Calcular goles 2MT (diferencia entre TC y 1MT)
        goles_local_2mt = goles_local_tc - goles_local_1mt
        goles_visita_2mt = goles_visita_tc - goles_visita_1mt
        
        # Actualizar estadísticas para cada tiempo
        # Tiempo Completo
        self._actualizar_stats(
            equipo_local.stats_completo,
            equipo_visitante.stats_completo,
            goles_local_tc,
            goles_visita_tc,
            es_local=True
        )
        
        # Primer Tiempo
        self._actualizar_stats(
            equipo_local.stats_primer_tiempo,
            equipo_visitante.stats_primer_tiempo,
            goles_local_1mt,
            goles_visita_1mt,
            es_local=True
        )
        
        # Segundo Tiempo
        self._actualizar_stats(
            equipo_local.stats_segundo_tiempo,
            equipo_visitante.stats_segundo_tiempo,
            goles_local_2mt,
            goles_visita_2mt,
            es_local=True
        )
    
    def _obtener_o_crear_equipo(
        self,
        nombre: str,
        liga_id: str,
        temporada: int
    ) -> Equipo:
        """
        Obtiene un equipo del cache o lo crea si no existe.
        
        Parámetros:
        -----------
        nombre : str
            Nombre del equipo
        liga_id : str
            ID de la liga
        temporada : int
            Año de la temporada
        
        Retorna:
        --------
        Equipo
            El equipo solicitado
        """
        clave = f"{liga_id}_{nombre}"
        
        if clave not in self.equipos_cache:
            self.equipos_cache[clave] = Equipo(
                nombre=nombre,
                liga_id=liga_id,
                temporada=temporada
            )
        
        return self.equipos_cache[clave]
    
    def _actualizar_stats(
        self,
        stats_local: EstadisticasEquipo,
        stats_visita: EstadisticasEquipo,
        goles_local: int,
        goles_visita: int,
        es_local: bool = True
    ) -> None:
        """
        Actualiza las estadísticas de ambos equipos tras un partido.
        
        Este método implementa la lógica de las hojas CONSTRUCCIÓN.
        Actualiza:
        - Partidos jugados
        - Victorias/Empates/Derrotas
        - Goles a favor/contra
        - Diferencia de goles
        - Puntos
        
        Parámetros:
        -----------
        stats_local : EstadisticasEquipo
            Stats del equipo local
        stats_visita : EstadisticasEquipo
            Stats del equipo visitante
        goles_local : int
            Goles marcados por el local
        goles_visita : int
            Goles marcados por el visitante
        es_local : bool
            Si estamos actualizando desde perspectiva local
        
        Lógica de Puntos:
        -----------------
        - Victoria: 3 puntos
        - Empate: 1 punto
        - Derrota: 0 puntos
        """
        # Determinar resultado
        if goles_local > goles_visita:
            resultado = ResultadoEnum.LOCAL
            puntos_local = Config.PUNTOS_VICTORIA
            puntos_visita = Config.PUNTOS_DERROTA
        elif goles_local == goles_visita:
            resultado = ResultadoEnum.EMPATE
            puntos_local = Config.PUNTOS_EMPATE
            puntos_visita = Config.PUNTOS_EMPATE
        else:
            resultado = ResultadoEnum.VISITA
            puntos_local = Config.PUNTOS_DERROTA
            puntos_visita = Config.PUNTOS_VICTORIA
        
        # ===== ACTUALIZAR EQUIPO LOCAL =====
        # Generales
        stats_local.partidos_jugados += 1
        stats_local.goles_favor += goles_local
        stats_local.goles_contra += goles_visita
        stats_local.diferencia_goles += (goles_local - goles_visita)
        stats_local.puntos += puntos_local
        
        # Como local
        stats_local.pj_local += 1
        stats_local.gf_local += goles_local
        stats_local.gc_local += goles_visita
        stats_local.pts_local += puntos_local
        
        if resultado == ResultadoEnum.LOCAL:
            stats_local.victorias += 1
            stats_local.v_local += 1
        elif resultado == ResultadoEnum.EMPATE:
            stats_local.empates += 1
            stats_local.e_local += 1
        else:
            stats_local.derrotas += 1
            stats_local.d_local += 1
        
        # ===== ACTUALIZAR EQUIPO VISITANTE =====
        # Generales
        stats_visita.partidos_jugados += 1
        stats_visita.goles_favor += goles_visita
        stats_visita.goles_contra += goles_local
        stats_visita.diferencia_goles += (goles_visita - goles_local)
        stats_visita.puntos += puntos_visita
        
        # Como visitante
        stats_visita.pj_visita += 1
        stats_visita.gf_visita += goles_visita
        stats_visita.gc_visita += goles_local
        stats_visita.pts_visita += puntos_visita
        
        if resultado == ResultadoEnum.VISITA:
            stats_visita.victorias += 1
            stats_visita.v_visita += 1
        elif resultado == ResultadoEnum.EMPATE:
            stats_visita.empates += 1
            stats_visita.e_visita += 1
        else:
            stats_visita.derrotas += 1
            stats_visita.d_visita += 1
    
    async def _guardar_estadisticas(
        self,
        liga_id: str,
        temporada: int
    ) -> None:
        """
        Guarda las estadísticas en MongoDB.
        
        Usa upsert para crear o actualizar según corresponda.
        
        Parámetros:
        -----------
        liga_id : str
            ID de la liga
        temporada : int
            Año de la temporada
        """
        collection = self.db[Config.COLECCION_ESTADISTICAS]
        
        for clave, equipo in self.equipos_cache.items():
            # Convertir a dict para MongoDB
            equipo_dict = equipo.model_dump()
            
            # Upsert: actualizar si existe, crear si no
            await collection.update_one(
                {
                    "nombre": equipo.nombre,
                    "liga_id": liga_id,
                    "temporada": temporada
                },
                {"$set": equipo_dict},
                upsert=True
            )
        
        logger.info(f"Guardadas estadísticas de {len(self.equipos_cache)} equipos")
    
    async def obtener_stats_equipo(
        self,
        nombre: str,
        liga_id: str,
        temporada: Optional[int] = None
    ) -> Optional[Equipo]:
        """
        Obtiene las estadísticas de un equipo específico.
        
        Primero busca en cache, luego en base de datos.
        
        Parámetros:
        -----------
        nombre : str
            Nombre del equipo
        liga_id : str
            ID de la liga
        temporada : int, optional
            Año de la temporada
        
        Retorna:
        --------
        Equipo or None
            El equipo con sus estadísticas, o None si no existe
        
        Ejemplo:
        --------
        ```python
        stats = await builder.obtener_stats_equipo('Barcelona', 'SPAIN_LA_LIGA', 2023)
        if stats:
            print(f"Puntos: {stats.stats_completo.puntos}")
            print(f"Rendimiento local: {stats.stats_completo.rendimiento_local}%")
        ```
        """
        # Buscar en cache primero
        clave = f"{liga_id}_{nombre}"
        if clave in self.equipos_cache:
            return self.equipos_cache[clave]
        
        # Buscar en base de datos
        query = {
            "nombre": nombre,
            "liga_id": liga_id
        }
        if temporada:
            query["temporada"] = temporada
        
        doc = await self.db[Config.COLECCION_ESTADISTICAS].find_one(query)
        
        if doc:
            # Remover _id para evitar problemas con Pydantic
            doc.pop('_id', None)
            equipo = Equipo(**doc)
            self.equipos_cache[clave] = equipo
            return equipo
        
        return None
    
    async def obtener_todos_equipos(
        self,
        liga_id: str,
        temporada: Optional[int] = None
    ) -> List[Equipo]:
        """
        Obtiene todos los equipos de una liga.
        
        Parámetros:
        -----------
        liga_id : str
            ID de la liga
        temporada : int, optional
            Año de la temporada
        
        Retorna:
        --------
        List[Equipo]
            Lista de equipos con estadísticas
        """
        query = {"liga_id": liga_id}
        if temporada:
            query["temporada"] = temporada
        
        cursor = self.db[Config.COLECCION_ESTADISTICAS].find(query)
        equipos = []
        
        async for doc in cursor:
            doc.pop('_id', None)
            equipos.append(Equipo(**doc))
        
        return equipos
