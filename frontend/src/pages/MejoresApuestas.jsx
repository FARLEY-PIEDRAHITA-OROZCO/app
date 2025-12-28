/**
 * Dashboard de Mejores Apuestas
 * Muestra las mejores oportunidades de apuesta ordenadas por confianza
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Trophy, TrendingUp, Target, Users, Zap, Filter, RefreshCw } from 'lucide-react';
import LeagueSelector from '../components/LeagueSelector';
import SeasonSelector from '../components/SeasonSelector';

const API = process.env.REACT_APP_BACKEND_URL;

const MejoresApuestas = () => {
  const [ligaId, setLigaId] = useState('');
  const [seasonId, setSeasonId] = useState('');
  const [jornadas, setJornadas] = useState([]);
  const [selectedJornada, setSelectedJornada] = useState('');
  const [minConfianza, setMinConfianza] = useState(60);
  const [apuestas, setApuestas] = useState(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({});

  useEffect(() => {
    if (seasonId) {
      fetchJornadas();
    }
  }, [seasonId]);

  const fetchJornadas = async () => {
    try {
      const response = await axios.get(`${API}/api/prediction/jornada?season_id=${seasonId}`);
      setJornadas(response.data.jornadas || []);
    } catch (err) {
      console.error('Error fetching jornadas:', err);
    }
  };

  const fetchMejoresApuestas = async () => {
    if (!seasonId) return;
    
    setLoading(true);
    try {
      let url = `${API}/api/prediction/mejores-apuestas?season_id=${seasonId}&min_confianza=${minConfianza}`;
      if (selectedJornada) {
        url += `&jornada=${encodeURIComponent(selectedJornada)}`;
      }
      
      const response = await axios.get(url);
      setApuestas(response.data.apuestas);
      setStats({
        totalPartidos: response.data.total_partidos_analizados,
        totalApuestas: response.data.total_apuestas_encontradas,
        jornada: response.data.jornada
      });
    } catch (err) {
      console.error('Error fetching mejores apuestas:', err);
    } finally {
      setLoading(false);
    }
  };

  const CategoryCard = ({ title, icon, color, items, apuestaKey }) => (
    <div className="card" style={{ borderTop: `3px solid ${color}` }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {icon}
          <h3 style={{ fontSize: '1rem', fontWeight: '600' }}>{title}</h3>
        </div>
        <span style={{ 
          background: `${color}20`, 
          color: color, 
          padding: '0.25rem 0.75rem', 
          borderRadius: '999px',
          fontSize: '0.8rem',
          fontWeight: '600'
        }}>
          {items?.length || 0}
        </span>
      </div>
      
      {items && items.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '400px', overflowY: 'auto' }}>
          {items.map((item, idx) => (
            <div 
              key={idx}
              style={{
                padding: '0.75rem',
                background: 'var(--bg-secondary)',
                borderRadius: '8px',
                borderLeft: `3px solid ${color}`
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                <span style={{ fontWeight: '600', fontSize: '0.85rem' }}>
                  {item.equipo_local} vs {item.equipo_visitante}
                </span>
                <span style={{
                  background: item.probabilidad >= 70 ? '#10b98120' : item.probabilidad >= 50 ? '#f59e0b20' : '#6b728020',
                  color: item.probabilidad >= 70 ? '#10b981' : item.probabilidad >= 50 ? '#f59e0b' : '#6b7280',
                  padding: '0.15rem 0.5rem',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  fontWeight: '600'
                }}>
                  {item.probabilidad?.toFixed(0) || item.confianza?.toFixed(0)}%
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                <span style={{ color: color, fontWeight: '500' }}>{item.apuesta}</span>
                {item.resultado_real && (
                  <span>Real: {item.resultado_real}</span>
                )}
              </div>
              {item.goles_esperados && (
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                  Goles esperados: {item.goles_esperados?.total?.toFixed(1) || '-'}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textAlign: 'center', padding: '2rem' }}>
          No hay apuestas en esta categoría
        </p>
      )}
    </div>
  );

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>🎯 Mejores Apuestas</h1>
        <p>Las mejores oportunidades ordenadas por probabilidad de acierto</p>
      </div>

      {/* Filtros */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', alignItems: 'end' }}>
          <LeagueSelector value={ligaId} onChange={setLigaId} />
          <SeasonSelector ligaId={ligaId} value={seasonId} onChange={setSeasonId} />
          
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
              <Filter size={14} style={{ marginRight: '0.25rem', verticalAlign: 'middle' }} />
              Jornada
            </label>
            <select
              value={selectedJornada}
              onChange={(e) => setSelectedJornada(e.target.value)}
              style={{
                width: '100%',
                padding: '0.625rem',
                borderRadius: '0.5rem',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)'
              }}
            >
              <option value="">Todas las jornadas</option>
              {jornadas.map((j, idx) => (
                <option key={idx} value={j.nombre}>{j.nombre}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
              <Target size={14} style={{ marginRight: '0.25rem', verticalAlign: 'middle' }} />
              Confianza mín.
            </label>
            <select
              value={minConfianza}
              onChange={(e) => setMinConfianza(Number(e.target.value))}
              style={{
                width: '100%',
                padding: '0.625rem',
                borderRadius: '0.5rem',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)'
              }}
            >
              <option value={50}>50%+</option>
              <option value={60}>60%+</option>
              <option value={70}>70%+</option>
              <option value={80}>80%+</option>
            </select>
          </div>

          <button
            onClick={fetchMejoresApuestas}
            disabled={!seasonId || loading}
            className="btn btn-primary"
            style={{ height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
          >
            {loading ? <RefreshCw size={16} className="spin" /> : <Zap size={16} />}
            {loading ? 'Analizando...' : 'Buscar Apuestas'}
          </button>
        </div>
      </div>

      {/* Stats */}
      {apuestas && (
        <div style={{ 
          display: 'flex', 
          gap: '1rem', 
          marginBottom: '1.5rem',
          flexWrap: 'wrap'
        }}>
          <div style={{ 
            background: 'var(--bg-secondary)', 
            padding: '0.75rem 1.25rem', 
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Partidos analizados:</span>
            <span style={{ fontWeight: '700', color: 'var(--accent)' }}>{stats.totalPartidos}</span>
          </div>
          <div style={{ 
            background: 'var(--bg-secondary)', 
            padding: '0.75rem 1.25rem', 
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Apuestas encontradas:</span>
            <span style={{ fontWeight: '700', color: '#10b981' }}>{stats.totalApuestas}</span>
          </div>
          <div style={{ 
            background: 'var(--bg-secondary)', 
            padding: '0.75rem 1.25rem', 
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Jornada:</span>
            <span style={{ fontWeight: '600' }}>{stats.jornada}</span>
          </div>
        </div>
      )}

      {/* Categorías de Apuestas */}
      {apuestas && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem' }}>
          <CategoryCard
            title="Doble Oportunidad"
            icon={<Trophy size={18} color="#f59e0b" />}
            color="#f59e0b"
            items={apuestas.doble_oportunidad}
            apuestaKey="doble_oportunidad"
          />
          
          <CategoryCard
            title="Favorito Claro"
            icon={<TrendingUp size={18} color="#10b981" />}
            color="#10b981"
            items={apuestas.favorito_claro}
            apuestaKey="favorito_claro"
          />
          
          <CategoryCard
            title="Over 2.5 Goles"
            icon={<Target size={18} color="#3b82f6" />}
            color="#3b82f6"
            items={apuestas.over_25}
            apuestaKey="over_25"
          />
          
          <CategoryCard
            title="Over 1.5 Goles"
            icon={<Target size={18} color="#8b5cf6" />}
            color="#8b5cf6"
            items={apuestas.over_15}
            apuestaKey="over_15"
          />
          
          <CategoryCard
            title="Ambos Marcan"
            icon={<Users size={18} color="#ec4899" />}
            color="#ec4899"
            items={apuestas.ambos_marcan}
            apuestaKey="ambos_marcan"
          />
        </div>
      )}

      {/* Estado inicial */}
      {!apuestas && !loading && (
        <div className="card" style={{ textAlign: 'center', padding: '4rem' }}>
          <Zap size={48} color="var(--text-secondary)" style={{ marginBottom: '1rem' }} />
          <h3 style={{ marginBottom: '0.5rem' }}>Encuentra las Mejores Apuestas</h3>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto' }}>
            Selecciona una liga y temporada, luego haz clic en "Buscar Apuestas" para ver las mejores oportunidades ordenadas por probabilidad.
          </p>
        </div>
      )}

      <style>{`
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default MejoresApuestas;
