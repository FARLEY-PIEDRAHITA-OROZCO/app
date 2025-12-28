/**
 * Página de Estadísticas de Equipos - Motor PLLA 3.0
 * 
 * Muestra:
 * - Selector de liga
 * - Selector de temporada (season_id)
 * - Selector de equipo
 * - Estadísticas General, Local, Visitante
 * - Para los 3 tiempos: TC, 1MT, 2MT
 */

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, Trophy, TrendingUp, Home, Plane, Globe } from 'lucide-react';
import LeagueSelector from '../components/LeagueSelector';
import SeasonSelector from '../components/SeasonSelector';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const TeamStats = () => {
  const [ligaId, setLigaId] = useState('');
  const [seasonId, setSeasonId] = useState('');
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState('');
  const [teamStats, setTeamStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [teamsLoading, setTeamsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Cargar equipos cuando cambia la temporada
  useEffect(() => {
    if (seasonId) {
      fetchTeams();
    } else {
      setTeams([]);
      setSelectedTeam('');
      setTeamStats(null);
    }
  }, [seasonId]);

  // Cargar stats cuando cambia el equipo
  useEffect(() => {
    if (selectedTeam && seasonId) {
      fetchTeamStats();
    }
  }, [selectedTeam]);

  // Cuando cambia la liga, resetear todo
  const handleLigaChange = (newLigaId) => {
    setLigaId(newLigaId);
    setSeasonId('');
    setTeams([]);
    setSelectedTeam('');
    setTeamStats(null);
  };

  // Cuando cambia la temporada, resetear equipo
  const handleSeasonChange = (newSeasonId) => {
    setSeasonId(newSeasonId);
    setSelectedTeam('');
    setTeamStats(null);
  };

  const fetchTeams = async () => {
    try {
      setTeamsLoading(true);
      const response = await axios.get(`${API}/prediction/teams?season_id=${seasonId}`);
      setTeams(response.data.equipos || []);
    } catch (err) {
      console.error('Error fetching teams:', err);
      setTeams([]);
    } finally {
      setTeamsLoading(false);
    }
  };

  const fetchTeamStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(
        `${API}/prediction/team/${encodeURIComponent(selectedTeam)}?season_id=${seasonId}`
      );
      // El API devuelve directamente {nombre, liga_id, tiempo_completo, ...}
      setTeamStats(response.data);
    } catch (err) {
      console.error('Error fetching team stats:', err);
      setError('Error cargando estadísticas. Asegúrate de haber construido las estadísticas primero.');
      setTeamStats(null);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, icon, stats, color }) => (
    <div className="card" style={{ borderTop: `3px solid ${color}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
        {icon}
        <h4 style={{ fontSize: '1rem', fontWeight: '600' }}>{title}</h4>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
        <div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>PJ</p>
          <p style={{ fontSize: '1.25rem', fontWeight: '700' }}>{stats?.partidos_jugados || stats?.pj || 0}</p>
        </div>
        <div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>V-E-D</p>
          <p style={{ fontSize: '0.9rem', fontWeight: '600' }}>
            <span style={{ color: '#10b981' }}>{stats?.victorias || stats?.v || 0}</span>
            -<span style={{ color: '#f59e0b' }}>{stats?.empates || stats?.e || 0}</span>
            -<span style={{ color: '#ef4444' }}>{stats?.derrotas || stats?.d || 0}</span>
          </p>
        </div>
        <div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Ataque (GF)</p>
          <p style={{ fontSize: '1.1rem', fontWeight: '600', color: '#10b981' }}>
            {stats?.goles_favor || stats?.gf || 0}
          </p>
        </div>
        <div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Defensa (GC)</p>
          <p style={{ fontSize: '1.1rem', fontWeight: '600', color: '#ef4444' }}>
            {stats?.goles_contra || stats?.gc || 0}
          </p>
        </div>
      </div>
      
      {/* Promedios ofensivo/defensivo */}
      <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
        <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '0.5rem', borderRadius: '6px', textAlign: 'center' }}>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Prom. Goles Favor</p>
          <p style={{ fontSize: '1rem', fontWeight: '700', color: '#10b981' }}>
            {stats?.promedio_gf ? stats.promedio_gf.toFixed(2) : ((stats?.goles_favor || stats?.gf || 0) / (stats?.partidos_jugados || stats?.pj || 1)).toFixed(2)}
          </p>
        </div>
        <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '0.5rem', borderRadius: '6px', textAlign: 'center' }}>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Prom. Goles Contra</p>
          <p style={{ fontSize: '1rem', fontWeight: '700', color: '#ef4444' }}>
            {stats?.promedio_gc ? stats.promedio_gc.toFixed(2) : ((stats?.goles_contra || stats?.gc || 0) / (stats?.partidos_jugados || stats?.pj || 1)).toFixed(2)}
          </p>
        </div>
      </div>

      <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Puntos</span>
          <span style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--accent)' }}>
            {stats?.puntos || stats?.pts || 0}
          </span>
        </div>
        <div style={{ marginTop: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Rendimiento</span>
            <span>{(stats?.rendimiento_general || stats?.rendimiento || 0).toFixed(1)}%</span>
          </div>
          <div style={{ width: '100%', height: '6px', background: 'var(--bg-secondary)', borderRadius: '3px' }}>
            <div 
              style={{ 
                width: `${stats?.rendimiento_general || stats?.rendimiento || 0}%`, 
                height: '100%', 
                background: color,
                borderRadius: '3px',
                transition: 'width 0.3s'
              }} 
            />
          </div>
        </div>
      </div>
    </div>
  );

  const TimeSection = ({ title, stats }) => (
    <div style={{ marginBottom: '2rem' }}>
      <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--accent)' }}>
        {title}
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
        <StatCard 
          title="General" 
          icon={<Trophy size={18} color="#3b82f6" />}
          stats={stats}
          color="#3b82f6"
        />
        <StatCard 
          title="Como Local" 
          icon={<Home size={18} color="#10b981" />}
          stats={{
            partidos_jugados: stats?.pj_local,
            victorias: stats?.v_local,
            empates: stats?.e_local,
            derrotas: stats?.d_local,
            goles_favor: stats?.gf_local,
            goles_contra: stats?.gc_local,
            puntos: stats?.pts_local,
            rendimiento_general: stats?.rendimiento_local
          }}
          color="#10b981"
        />
        <StatCard 
          title="Como Visitante" 
          icon={<Plane size={18} color="#f59e0b" />}
          stats={{
            partidos_jugados: stats?.pj_visitante,
            victorias: stats?.v_visitante,
            empates: stats?.e_visitante,
            derrotas: stats?.d_visitante,
            goles_favor: stats?.gf_visitante,
            goles_contra: stats?.gc_visitante,
            puntos: stats?.pts_visitante,
            rendimiento_general: stats?.rendimiento_visitante
          }}
          color="#f59e0b"
        />
      </div>
    </div>
  );

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.5rem' }}>Estadísticas de Equipos</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Análisis detallado por equipo, contexto y tiempo</p>
      </div>

      {/* Filtros */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'flex-end' }}>
          <LeagueSelector 
            value={ligaId}
            onChange={handleLigaChange}
          />
          <SeasonSelector 
            ligaId={ligaId}
            value={seasonId}
            onChange={handleSeasonChange}
          />
          
          {/* Selector de Equipo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label style={{ 
              fontSize: '0.85rem', 
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}>
              <Users size={14} />
              Equipo
            </label>
            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              disabled={!seasonId || teamsLoading || teams.length === 0}
              style={{ minWidth: '200px', opacity: (!seasonId || teamsLoading) ? 0.5 : 1 }}
            >
              <option value="">
                {teamsLoading ? 'Cargando equipos...' : 
                 !seasonId ? 'Selecciona temporada' : 
                 teams.length === 0 ? 'Sin equipos' : 'Seleccionar equipo'}
              </option>
              {teams.map((team) => (
                <option key={team.nombre} value={team.nombre}>
                  {team.nombre} ({team.puntos || 0} pts)
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Estado: Sin selección */}
      {!selectedTeam && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <Users size={48} style={{ marginBottom: '1rem', opacity: 0.5, color: 'var(--text-secondary)' }} />
          <p style={{ color: 'var(--text-secondary)' }}>
            {!ligaId ? 'Selecciona una liga para comenzar' :
             !seasonId ? 'Selecciona una temporada' :
             'Selecciona un equipo para ver sus estadísticas'}
          </p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <div className="spinner">Cargando estadísticas...</div>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: '#ef4444' }}>
          {error}
        </div>
      )}

      {/* Estadísticas del Equipo */}
      {teamStats && !loading && !error && (
        <div>
          {/* Header del equipo */}
          <div className="card" style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ 
                width: '60px', 
                height: '60px', 
                borderRadius: '12px', 
                background: 'var(--accent)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                fontSize: '1.5rem',
                fontWeight: '700',
                color: 'white'
              }}>
                {teamStats.nombre?.charAt(0) || '?'}
              </div>
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '700' }}>{teamStats.nombre}</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  <Globe size={14} style={{ marginRight: '0.25rem' }} />
                  {ligaId?.replace(/_/g, ' ')} - Temporada {seasonId?.split('_').pop()}
                </p>
              </div>
            </div>
          </div>

          {/* Secciones por Tiempo */}
          <TimeSection title="⏱️ Tiempo Completo (90 min)" stats={teamStats.tiempo_completo} />
          <TimeSection title="🥇 Primer Tiempo (1MT)" stats={teamStats.primer_tiempo} />
          <TimeSection title="🥈 Segundo Tiempo (2MT)" stats={teamStats.segundo_tiempo} />
        </div>
      )}
    </div>
  );
};

export default TeamStats;
