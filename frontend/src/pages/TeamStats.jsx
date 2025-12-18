/**
 * Página de Estadísticas de Equipo - Motor PLLA 3.0
 * 
 * Muestra estadísticas detalladas de un equipo:
 * - Generales, como local y como visitante
 * - Para los 3 tiempos (TC, 1MT, 2MT)
 */

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, Home, MapPin, TrendingUp, Search } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const TeamStats = () => {
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState('');
  const [teamStats, setTeamStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingTeams, setLoadingTeams] = useState(true);

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      setLoadingTeams(true);
      const response = await axios.get(`${API}/prediction/teams?liga_id=SPAIN_LA_LIGA&temporada=2023`);
      setTeams(response.data.equipos || []);
    } catch (err) {
      console.error('Error fetching teams:', err);
    } finally {
      setLoadingTeams(false);
    }
  };

  const fetchTeamStats = async (teamName) => {
    if (!teamName) return;
    
    try {
      setLoading(true);
      const response = await axios.get(
        `${API}/prediction/team/${encodeURIComponent(teamName)}?liga_id=SPAIN_LA_LIGA&temporada=2023`
      );
      setTeamStats(response.data);
    } catch (err) {
      console.error('Error fetching team stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTeamChange = (e) => {
    const team = e.target.value;
    setSelectedTeam(team);
    fetchTeamStats(team);
  };

  const StatsCard = ({ title, icon, stats, color }) => (
    <div className="card" style={{ borderLeft: `4px solid ${color}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
        {icon}
        <h3 style={{ fontSize: '1rem', fontWeight: '600' }}>{title}</h3>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
        <div style={{ textAlign: 'center', padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>PJ</p>
          <p style={{ fontSize: '1.25rem', fontWeight: '700' }}>{stats.partidos_jugados}</p>
        </div>
        <div style={{ textAlign: 'center', padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>V-E-D</p>
          <p style={{ fontSize: '1rem', fontWeight: '600' }}>
            <span style={{ color: '#10b981' }}>{stats.victorias}</span>-
            <span style={{ color: '#f59e0b' }}>{stats.empates}</span>-
            <span style={{ color: '#ef4444' }}>{stats.derrotas}</span>
          </p>
        </div>
        <div style={{ textAlign: 'center', padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>GF-GC</p>
          <p style={{ fontSize: '1rem', fontWeight: '600' }}>
            <span style={{ color: '#10b981' }}>{stats.goles_favor}</span>-
            <span style={{ color: '#ef4444' }}>{stats.goles_contra}</span>
          </p>
        </div>
        <div style={{ textAlign: 'center', padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>PTS</p>
          <p style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--accent)' }}>{stats.puntos}</p>
        </div>
      </div>

      <div style={{ marginTop: '1rem' }}>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
          Rendimiento: {stats.rendimiento_general?.toFixed(1) || 0}%
        </p>
        <div style={{ background: 'var(--bg-secondary)', borderRadius: '4px', height: '8px', overflow: 'hidden' }}>
          <div style={{ 
            width: `${stats.rendimiento_general || 0}%`, 
            background: color,
            height: '100%',
            transition: 'width 0.3s'
          }} />
        </div>
      </div>
    </div>
  );

  const ContextStats = ({ title, icon, stats, color }) => (
    <div className="card" style={{ borderTop: `3px solid ${color}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
        {icon}
        <h4 style={{ fontSize: '0.95rem', fontWeight: '600' }}>{title}</h4>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', fontSize: '0.85rem' }}>
        <div>
          <span style={{ color: 'var(--text-secondary)' }}>PJ: </span>
          <span style={{ fontWeight: '600' }}>{stats.pj}</span>
        </div>
        <div>
          <span style={{ color: 'var(--text-secondary)' }}>V: </span>
          <span style={{ fontWeight: '600', color: '#10b981' }}>{stats.v}</span>
        </div>
        <div>
          <span style={{ color: 'var(--text-secondary)' }}>E: </span>
          <span style={{ fontWeight: '600', color: '#f59e0b' }}>{stats.e}</span>
        </div>
        <div>
          <span style={{ color: 'var(--text-secondary)' }}>D: </span>
          <span style={{ fontWeight: '600', color: '#ef4444' }}>{stats.d}</span>
        </div>
        <div>
          <span style={{ color: 'var(--text-secondary)' }}>GF: </span>
          <span style={{ fontWeight: '600' }}>{stats.gf}</span>
        </div>
        <div>
          <span style={{ color: 'var(--text-secondary)' }}>GC: </span>
          <span style={{ fontWeight: '600' }}>{stats.gc}</span>
        </div>
      </div>
      
      <div style={{ marginTop: '0.75rem', padding: '0.5rem', background: 'var(--bg-secondary)', borderRadius: '6px', textAlign: 'center' }}>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Puntos: </span>
        <span style={{ fontWeight: '700', color: 'var(--accent)' }}>{stats.pts}</span>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>
          ({stats.rendimiento?.toFixed(0) || 0}%)
        </span>
      </div>
    </div>
  );

  const TimeSection = ({ title, data, color }) => {
    const localStats = {
      pj: data.pj_local,
      v: data.v_local,
      e: data.e_local,
      d: data.d_local,
      gf: data.gf_local,
      gc: data.gc_local,
      pts: data.pts_local,
      rendimiento: data.rendimiento_local
    };

    const awayStats = {
      pj: data.pj_visita,
      v: data.v_visita,
      e: data.e_visita,
      d: data.d_visita,
      gf: data.gf_visita,
      gc: data.gc_visita,
      pts: data.pts_visita,
      rendimiento: data.rendimiento_visita
    };

    return (
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem', color, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <TrendingUp size={18} />
          {title}
        </h3>
        
        <StatsCard 
          title="General" 
          icon={<Users size={18} color={color} />}
          stats={data}
          color={color}
        />
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
          <ContextStats 
            title="Como Local" 
            icon={<Home size={16} color="#10b981" />}
            stats={localStats}
            color="#10b981"
          />
          <ContextStats 
            title="Como Visitante" 
            icon={<MapPin size={16} color="#f59e0b" />}
            stats={awayStats}
            color="#f59e0b"
          />
        </div>
      </div>
    );
  };

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.5rem' }}>Estadísticas de Equipo</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Análisis detallado por equipo</p>
      </div>

      {/* Selector */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Search size={20} color="var(--accent)" />
          <select
            value={selectedTeam}
            onChange={handleTeamChange}
            style={{ flex: 1 }}
            disabled={loadingTeams}
          >
            <option value="">Seleccionar equipo...</option>
            {teams.map((team) => (
              <option key={team.nombre} value={team.nombre}>
                {team.nombre} - {team.puntos} pts ({team.rendimiento.toFixed(0)}%)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
          Cargando estadísticas...
        </div>
      )}

      {teamStats && !loading && (
        <div className="fade-in">
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1.5rem' }}>
            {teamStats.nombre}
          </h2>

          <TimeSection 
            title="Tiempo Completo (90 min)" 
            data={teamStats.tiempo_completo}
            color="#10b981"
          />

          <TimeSection 
            title="Primer Tiempo (1MT)" 
            data={teamStats.primer_tiempo}
            color="#3b82f6"
          />

          <TimeSection 
            title="Segundo Tiempo (2MT)" 
            data={teamStats.segundo_tiempo}
            color="#f59e0b"
          />
        </div>
      )}

      {!selectedTeam && !loading && (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
          <Users size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
          <p>Selecciona un equipo para ver sus estadísticas</p>
        </div>
      )}
    </div>
  );
};

export default TeamStats;
