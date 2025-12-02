import { useState, useEffect } from 'react';
import axios from 'axios';
import { TrendingUp, Trophy, Target, Calendar } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API}/stats`);
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <div className="spinner">Cargando...</div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Partidos',
      value: stats?.total_matches || 0,
      icon: <Trophy size={24} />,
      color: '#3b82f6'
    },
    {
      title: 'Ligas Activas',
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
      icon: <Calendar size={24} />,
      color: '#ef4444'
    }
  ];

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.5rem' }}>Dashboard</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Resumen general del sistema de análisis de fútbol</p>
      </div>

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
                {card.value.toLocaleString()}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem' }}>Top 10 Ligas</h2>
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Liga</th>
                <th>ID</th>
                <th style={{ textAlign: 'right' }}>Partidos</th>
              </tr>
            </thead>
            <tbody>
              {stats?.leagues?.map((league, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: '600', color: 'var(--text-secondary)' }}>{idx + 1}</td>
                  <td style={{ fontWeight: '500' }}>{league.liga_nombre}</td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{league._id}</td>
                  <td style={{ textAlign: 'right', fontWeight: '600', color: 'var(--accent)' }}>
                    {league.total.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {stats?.last_update && (
        <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Última actualización: {new Date(stats.last_update).toLocaleString('es-ES')}
        </div>
      )}
    </div>
  );
};

export default Dashboard;