/**
 * Página de Clasificación - Motor PLLA 3.0
 * 
 * Muestra:
 * - Tabla de posiciones
 * - Selector de temporada (season_id)
 * - Selector de tipo de tiempo (TC, 1MT, 2MT)
 * - Estadísticas por equipo
 */

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Trophy, Clock, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import SeasonSelector from '../components/SeasonSelector';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Classification = () => {
  const [classification, setClassification] = useState(null);
  const [timeType, setTimeType] = useState('completo');
  const [seasonId, setSeasonId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (seasonId) {
      fetchClassification();
    }
  }, [timeType, seasonId]);

  const fetchClassification = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(
        `${API}/prediction/classification?season_id=${seasonId}&tipo_tiempo=${timeType}`
      );
      setClassification(response.data);
    } catch (err) {
      console.error('Error fetching classification:', err);
      setError('Error cargando clasificación');
    } finally {
      setLoading(false);
    }
  };

  const getPositionStyle = (pos) => {
    if (pos <= 4) return { background: '#10b981', color: 'white' }; // Champions
    if (pos === 5) return { background: '#3b82f6', color: 'white' }; // Europa League
    if (pos === 6) return { background: '#8b5cf6', color: 'white' }; // Conference
    if (pos >= 18) return { background: '#ef4444', color: 'white' }; // Descenso
    return { background: 'var(--bg-secondary)', color: 'var(--text-primary)' };
  };

  const getFormIcon = (rendimiento) => {
    if (rendimiento >= 60) return <ArrowUp size={14} color="#10b981" />;
    if (rendimiento <= 40) return <ArrowDown size={14} color="#ef4444" />;
    return <Minus size={14} color="#f59e0b" />;
  };

  const timeTypeOptions = [
    { value: 'completo', label: 'Tiempo Completo', desc: '90 minutos' },
    { value: 'primer_tiempo', label: 'Primer Tiempo', desc: '1MT (45 min)' },
    { value: 'segundo_tiempo', label: 'Segundo Tiempo', desc: '2MT (45 min)' }
  ];

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.5rem' }}>
          Clasificación
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Tabla de posiciones calculada por el motor PLLA 3.0
        </p>
      </div>

      {/* Filtros */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap',
          gap: '1.5rem', 
          alignItems: 'flex-end',
          justifyContent: 'space-between'
        }}>
          {/* Selector de Temporada */}
          <SeasonSelector 
            ligaId="SPAIN_LA_LIGA"
            value={seasonId}
            onChange={setSeasonId}
          />

          {/* Selector de Tiempo */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {timeTypeOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setTimeType(option.value)}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  background: timeType === option.value ? 'var(--accent)' : 'var(--bg-secondary)',
                  color: timeType === option.value ? 'white' : 'var(--text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.9rem'
                }}
              >
                <Clock size={14} />
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <div className="spinner">Cargando clasificación...</div>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#ef4444' }}>
          {error}
        </div>
      )}

      {/* Tabla de Clasificación */}
      {!loading && !error && classification && (
        <div className="card" style={{ overflowX: 'auto' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            marginBottom: '1rem',
            flexWrap: 'wrap',
            gap: '0.5rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Trophy size={20} color="var(--accent)" />
              <h2 style={{ fontSize: '1.1rem', fontWeight: '600' }}>
                {classification.liga_id?.replace('_', ' ')} - {classification.season_id?.split('_').pop()}
              </h2>
            </div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              {classification.total_equipos} equipos
            </span>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                <th style={{ padding: '0.75rem', textAlign: 'center', width: '50px' }}>#</th>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Equipo</th>
                <th style={{ padding: '0.75rem', textAlign: 'center' }}>PJ</th>
                <th style={{ padding: '0.75rem', textAlign: 'center' }}>V</th>
                <th style={{ padding: '0.75rem', textAlign: 'center' }}>E</th>
                <th style={{ padding: '0.75rem', textAlign: 'center' }}>D</th>
                <th style={{ padding: '0.75rem', textAlign: 'center' }}>GF</th>
                <th style={{ padding: '0.75rem', textAlign: 'center' }}>GC</th>
                <th style={{ padding: '0.75rem', textAlign: 'center' }}>DIF</th>
                <th style={{ padding: '0.75rem', textAlign: 'center', fontWeight: '700' }}>PTS</th>
                <th style={{ padding: '0.75rem', textAlign: 'center' }}>Rend.</th>
              </tr>
            </thead>
            <tbody>
              {(classification.clasificacion || classification.tabla || []).map((team, index) => (
                <tr 
                  key={team.equipo}
                  style={{ 
                    borderBottom: '1px solid var(--border-color)',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-secondary)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                    <span style={{
                      ...getPositionStyle(team.posicion),
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.85rem',
                      fontWeight: '600'
                    }}>
                      {team.posicion}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem', fontWeight: '500' }}>{team.equipo}</td>
                  <td style={{ padding: '0.75rem', textAlign: 'center' }}>{team.pj}</td>
                  <td style={{ padding: '0.75rem', textAlign: 'center', color: '#10b981' }}>{team.v}</td>
                  <td style={{ padding: '0.75rem', textAlign: 'center', color: '#f59e0b' }}>{team.e}</td>
                  <td style={{ padding: '0.75rem', textAlign: 'center', color: '#ef4444' }}>{team.d}</td>
                  <td style={{ padding: '0.75rem', textAlign: 'center' }}>{team.gf}</td>
                  <td style={{ padding: '0.75rem', textAlign: 'center' }}>{team.gc}</td>
                  <td style={{ 
                    padding: '0.75rem', 
                    textAlign: 'center',
                    color: team.dif > 0 ? '#10b981' : team.dif < 0 ? '#ef4444' : 'var(--text-secondary)'
                  }}>
                    {team.dif > 0 ? '+' : ''}{team.dif}
                  </td>
                  <td style={{ 
                    padding: '0.75rem', 
                    textAlign: 'center', 
                    fontWeight: '700',
                    fontSize: '1rem'
                  }}>
                    {team.pts}
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
                      {getFormIcon(team.rendimiento)}
                      <span style={{ fontSize: '0.85rem' }}>{team.rendimiento?.toFixed(1)}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Leyenda */}
          <div style={{ 
            marginTop: '1rem', 
            padding: '1rem', 
            background: 'var(--bg-secondary)', 
            borderRadius: '8px',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '1rem',
            fontSize: '0.8rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '2px', background: '#10b981' }}></span>
              Champions League
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '2px', background: '#3b82f6' }}></span>
              Europa League
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '2px', background: '#8b5cf6' }}></span>
              Conference League
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '2px', background: '#ef4444' }}></span>
              Descenso
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Classification;
