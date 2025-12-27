/**
 * Dashboard - Motor PLLA 3.0
 * 
 * Resumen general del sistema con:
 * - Selector de liga
 * - Selector de temporada (season_id)
 * - Estadísticas globales o por temporada
 * - Top ligas/jornadas
 */

import { useState, useEffect } from 'react';
import axios from 'axios';
import { TrendingUp, Trophy, Target, Calendar, BarChart3, Globe } from 'lucide-react';
import LeagueSelector from '../components/LeagueSelector';
import SeasonSelector from '../components/SeasonSelector';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ligaId, setLigaId] = useState('');
  const [seasonId, setSeasonId] = useState('');
  const [viewMode, setViewMode] = useState('global'); // 'global' | 'season'

  useEffect(() => {
    fetchStats();
  }, [seasonId, viewMode]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const url = viewMode === 'season' && seasonId 
        ? `${API}/stats?season_id=${seasonId}`
        : `${API}/stats`;
      const response = await axios.get(url);
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  // Cuando cambia la liga, resetear la temporada
  const handleLigaChange = (newLigaId) => {
    setLigaId(newLigaId);
    setSeasonId(''); // Reset season when league changes
  };

  const statCards = [
    {
      title: 'Total Partidos',
      value: stats?.total_matches || 0,
      icon: <Trophy size={24} />,
      color: '#3b82f6'
    },
    {
      title: viewMode === 'season' ? 'Jornadas' : 'Ligas Activas',
      value: stats?.total_leagues || 0,
      icon: <Target size={24} />,
      color: '#10b981'
    },
    {
      title: 'Promedio Goles',
      value: stats?.avg_goals_per_match || 0,
      icon: <TrendingUp size={24} />,
      color: '#f59e0b'
    },
    {
      title: 'Total Goles',
      value: stats?.total_goals || 0,
      icon: <BarChart3 size={24} />,
      color: '#ef4444'
    }
  ];

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.5rem' }}>Dashboard</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Resumen general del sistema de análisis de fútbol</p>
      </div>

      {/* Controles de Vista */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap',
          gap: '1.5rem', 
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          {/* Toggle Vista Global/Temporada */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => setViewMode('global')}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s',
                background: viewMode === 'global' ? 'var(--accent)' : 'var(--bg-secondary)',
                color: viewMode === 'global' ? 'white' : 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.9rem'
              }}
            >
              <BarChart3 size={16} />
              Vista Global
            </button>
            <button
              onClick={() => setViewMode('season')}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s',
                background: viewMode === 'season' ? 'var(--accent)' : 'var(--bg-secondary)',
                color: viewMode === 'season' ? 'white' : 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.9rem'
              }}
            >
              <Calendar size={16} />
              Por Temporada
            </button>
          </div>

          {/* Selectores de Liga y Temporada (solo en modo temporada) */}
          {viewMode === 'season' && (
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <LeagueSelector 
                value={ligaId}
                onChange={handleLigaChange}
              />
              <SeasonSelector 
                ligaId={ligaId}
                value={seasonId}
                onChange={setSeasonId}
              />
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <div className="spinner">Cargando...</div>
        </div>
      ) : (
        <>
          {/* Badge de temporada activa */}
          {viewMode === 'season' && stats?.season_label && (
            <div style={{ 
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: 'var(--accent)',
              fontSize: '0.9rem'
            }}>
              <Globe size={16} />
              <span>Liga: <strong>{ligaId?.replace(/_/g, ' ')}</strong></span>
              <span style={{ margin: '0 0.5rem', color: 'var(--text-secondary)' }}>|</span>
              <Calendar size={16} />
              <span>Temporada: <strong>{stats.season_label}</strong></span>
            </div>
          )}

          {/* Tarjetas de estadísticas */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1.5rem',
            marginBottom: '2rem'
          }}>
            {statCards.map((card, idx) => (
              <div
                key={idx}
                data-testid={`stat-card-${idx}`}
                className="card"
                style={{
                  borderLeft: `4px solid ${card.color}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem'
                }}
              >
                <div style={{ color: card.color }}>{card.icon}</div>
                <div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                    {card.title}
                  </p>
                  <p style={{ fontSize: '2rem', fontWeight: '700' }}>
                    {typeof card.value === 'number' ? card.value.toLocaleString() : card.value}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Tabla de Ligas o Jornadas */}
          <div className="card" style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem' }}>
              {viewMode === 'season' ? 'Partidos por Jornada' : 'Top 10 Ligas'}
            </h2>
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>{viewMode === 'season' ? 'Jornada' : 'Liga'}</th>
                    {viewMode !== 'season' && <th>ID</th>}
                    <th style={{ textAlign: 'right' }}>Partidos</th>
                  </tr>
                </thead>
                <tbody>
                  {stats?.leagues?.length > 0 ? (
                    stats.leagues.map((item, idx) => (
                      <tr key={idx}>
                        <td style={{ fontWeight: '600', color: 'var(--text-secondary)' }}>{idx + 1}</td>
                        <td style={{ fontWeight: '500' }}>
                          {viewMode === 'season' 
                            ? (item._id?.replace('Regular Season - ', 'Jornada ') || `Registro ${idx + 1}`)
                            : (item.liga_nombre || item._id)
                          }
                        </td>
                        {viewMode !== 'season' && (
                          <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{item._id}</td>
                        )}
                        <td style={{ textAlign: 'right', fontWeight: '600', color: 'var(--accent)' }}>
                          {item.total?.toLocaleString() || 0}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={viewMode === 'season' ? 3 : 4} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                        No hay datos disponibles
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {stats?.last_update && (
            <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Última actualización: {new Date(stats.last_update).toLocaleString('es-ES')}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Dashboard;
