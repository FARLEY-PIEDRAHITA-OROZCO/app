/**
 * Página de Clasificación - Motor PLLA 3.0
 * 
 * Muestra:
 * - Tabla de posiciones
 * - Selector de tipo de tiempo (TC, 1MT, 2MT)
 * - Estadísticas por equipo
 */

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Trophy, Clock, ArrowUp, ArrowDown, Minus } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Classification = () => {
  const [classification, setClassification] = useState(null);
  const [timeType, setTimeType] = useState('completo');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchClassification();
  }, [timeType]);

  const fetchClassification = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(
        `${API}/prediction/classification?liga_id=SPAIN_LA_LIGA&temporada=2023&tipo_tiempo=${timeType}`
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

  if (loading) {
    return (
      <div className="fade-in" style={{ textAlign: 'center', padding: '3rem' }}>
        <div className="spinner">Cargando clasificación...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fade-in" style={{ textAlign: 'center', padding: '3rem', color: '#ef4444' }}>
        {error}
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.5rem' }}>Clasificación</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Tabla de posiciones La Liga 2023/24</p>
      </div>

      {/* Selector de Tiempo */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <Clock size={20} color="var(--accent)" />
          <span style={{ fontWeight: '600' }}>Tipo de Tiempo</span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {timeTypeOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setTimeType(option.value)}
              style={{
                padding: '0.75rem 1.25rem',
                borderRadius: '8px',
                border: timeType === option.value ? '2px solid var(--accent)' : '1px solid var(--border)',
                background: timeType === option.value ? 'rgba(59, 130, 246, 0.1)' : 'var(--bg-secondary)',
                color: timeType === option.value ? 'var(--accent)' : 'var(--text-primary)',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <div style={{ fontWeight: '600' }}>{option.label}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{option.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Leyenda */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap', fontSize: '0.8rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '2px', background: '#10b981' }} />
          <span style={{ color: 'var(--text-secondary)' }}>Champions League</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '2px', background: '#3b82f6' }} />
          <span style={{ color: 'var(--text-secondary)' }}>Europa League</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '2px', background: '#8b5cf6' }} />
          <span style={{ color: 'var(--text-secondary)' }}>Conference League</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '2px', background: '#ef4444' }} />
          <span style={{ color: 'var(--text-secondary)' }}>Descenso</span>
        </div>
      </div>

      {/* Tabla */}
      <div className="card">
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th style={{ width: '50px' }}>#</th>
                <th>Equipo</th>
                <th style={{ textAlign: 'center' }}>PJ</th>
                <th style={{ textAlign: 'center' }}>V</th>
                <th style={{ textAlign: 'center' }}>E</th>
                <th style={{ textAlign: 'center' }}>D</th>
                <th style={{ textAlign: 'center' }}>GF</th>
                <th style={{ textAlign: 'center' }}>GC</th>
                <th style={{ textAlign: 'center' }}>DIF</th>
                <th style={{ textAlign: 'center', fontWeight: '700' }}>PTS</th>
                <th style={{ textAlign: 'center' }}>Rend.</th>
              </tr>
            </thead>
            <tbody>
              {classification?.clasificacion?.map((team) => (
                <tr key={team.equipo}>
                  <td>
                    <div style={{
                      ...getPositionStyle(team.posicion),
                      width: '28px',
                      height: '28px',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '700',
                      fontSize: '0.85rem'
                    }}>
                      {team.posicion}
                    </div>
                  </td>
                  <td style={{ fontWeight: '600' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {team.posicion <= 3 && <Trophy size={16} color="#f59e0b" />}
                      {team.equipo}
                    </div>
                  </td>
                  <td style={{ textAlign: 'center' }}>{team.pj}</td>
                  <td style={{ textAlign: 'center', color: '#10b981' }}>{team.v}</td>
                  <td style={{ textAlign: 'center', color: '#f59e0b' }}>{team.e}</td>
                  <td style={{ textAlign: 'center', color: '#ef4444' }}>{team.d}</td>
                  <td style={{ textAlign: 'center' }}>{team.gf}</td>
                  <td style={{ textAlign: 'center' }}>{team.gc}</td>
                  <td style={{ textAlign: 'center', fontWeight: '600', color: team.dif > 0 ? '#10b981' : team.dif < 0 ? '#ef4444' : 'var(--text-secondary)' }}>
                    {team.dif > 0 ? '+' : ''}{team.dif}
                  </td>
                  <td style={{ textAlign: 'center', fontWeight: '700', fontSize: '1.1rem' }}>
                    {team.pts}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
                      {getFormIcon(team.rendimiento)}
                      <span style={{ fontSize: '0.85rem' }}>{team.rendimiento.toFixed(0)}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info */}
      <div style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
        Última actualización: {classification?.fecha_actualizacion && new Date(classification.fecha_actualizacion).toLocaleString('es-ES')}
      </div>
    </div>
  );
};

export default Classification;
