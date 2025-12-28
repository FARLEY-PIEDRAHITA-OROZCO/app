/**
 * Página de Pronósticos por Jornada
 * Genera pronósticos para todos los partidos de una jornada completa
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, TrendingUp, Shield, Target, ChevronDown, Download, Filter } from 'lucide-react';
import LeagueSelector from '../components/LeagueSelector';
import SeasonSelector from '../components/SeasonSelector';

const API = process.env.REACT_APP_BACKEND_URL;

const JornadaPredictions = () => {
  const [ligaId, setLigaId] = useState('');
  const [seasonId, setSeasonId] = useState('');
  const [jornadas, setJornadas] = useState([]);
  const [selectedJornada, setSelectedJornada] = useState('');
  const [partidos, setPartidos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Cargar jornadas cuando cambia la temporada
  useEffect(() => {
    if (seasonId) {
      fetchJornadas();
    }
  }, [seasonId]);

  const fetchJornadas = async () => {
    try {
      const response = await axios.get(`${API}/api/prediction/jornada?season_id=${seasonId}`);
      setJornadas(response.data.jornadas || []);
      setSelectedJornada('');
      setPartidos([]);
    } catch (err) {
      console.error('Error fetching jornadas:', err);
    }
  };

  const fetchPredictions = async () => {
    if (!selectedJornada) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(
        `${API}/api/prediction/jornada?season_id=${seasonId}&jornada=${encodeURIComponent(selectedJornada)}`
      );
      setPartidos(response.data.partidos || []);
    } catch (err) {
      console.error('Error fetching predictions:', err);
      setError('Error cargando pronósticos');
    } finally {
      setLoading(false);
    }
  };

  const getPronosticoColor = (pronostico) => {
    switch (pronostico) {
      case 'L': return '#10b981';
      case 'E': return '#f59e0b';
      case 'V': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  const getConfianzaColor = (confianza) => {
    if (confianza >= 70) return '#10b981';
    if (confianza >= 50) return '#f59e0b';
    return '#ef4444';
  };

  const exportToCSV = () => {
    if (partidos.length === 0) return;
    
    const headers = ['Local', 'Visitante', 'Pronóstico', 'Doble Op', 'Ambos Marcan', 'Over 2.5', 'Confianza', 'GC Local', 'GC Visitante'];
    const rows = partidos.map(p => [
      p.equipo_local,
      p.equipo_visitante,
      p.pronostico || '-',
      p.doble_oportunidad || '-',
      p.ambos_marcan || '-',
      p.over_under?.over_25?.prediccion || '-',
      `${p.confianza?.toFixed(1) || 0}%`,
      p.defensa_local?.promedio_gc?.toFixed(2) || '-',
      p.defensa_visitante?.promedio_gc?.toFixed(2) || '-'
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pronosticos_${selectedJornada.replace(/\s+/g, '_')}.csv`;
    a.click();
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Pronósticos por Jornada</h1>
        <p>Genera pronósticos completos para todos los partidos de una jornada</p>
      </div>

      {/* Selectores */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', alignItems: 'end' }}>
          <LeagueSelector value={ligaId} onChange={setLigaId} />
          <SeasonSelector ligaId={ligaId} value={seasonId} onChange={setSeasonId} />
          
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
              <Calendar size={14} style={{ marginRight: '0.25rem', verticalAlign: 'middle' }} />
              Jornada
            </label>
            <select
              value={selectedJornada}
              onChange={(e) => setSelectedJornada(e.target.value)}
              disabled={jornadas.length === 0}
              style={{
                width: '100%',
                padding: '0.625rem',
                borderRadius: '0.5rem',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)'
              }}
            >
              <option value="">Seleccionar jornada...</option>
              {jornadas.map((j, idx) => (
                <option key={idx} value={j.nombre}>
                  {j.nombre} ({j.partidos} partidos)
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={fetchPredictions}
            disabled={!selectedJornada || loading}
            className="btn btn-primary"
            style={{ height: '42px' }}
          >
            {loading ? 'Generando...' : 'Generar Pronósticos'}
          </button>
        </div>
      </div>

      {/* Acciones */}
      {partidos.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <span style={{ color: 'var(--text-secondary)' }}>
            {partidos.length} partidos encontrados
          </span>
          <button onClick={exportToCSV} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Download size={16} />
            Exportar CSV
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="card" style={{ background: 'rgba(239, 68, 68, 0.1)', borderColor: '#ef4444', marginBottom: '1rem' }}>
          <p style={{ color: '#ef4444' }}>{error}</p>
        </div>
      )}

      {/* Tabla de Partidos */}
      {partidos.length > 0 && (
        <div className="card" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Local</th>
                <th style={{ padding: '0.75rem', textAlign: 'center' }}>vs</th>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Visitante</th>
                <th style={{ padding: '0.75rem', textAlign: 'center' }}>
                  <TrendingUp size={14} style={{ verticalAlign: 'middle' }} /> Pronóstico
                </th>
                <th style={{ padding: '0.75rem', textAlign: 'center' }}>Doble Op</th>
                <th style={{ padding: '0.75rem', textAlign: 'center' }}>Ambos</th>
                <th style={{ padding: '0.75rem', textAlign: 'center' }}>Over 2.5</th>
                <th style={{ padding: '0.75rem', textAlign: 'center' }}>
                  <Shield size={14} style={{ verticalAlign: 'middle' }} /> Def. Local
                </th>
                <th style={{ padding: '0.75rem', textAlign: 'center' }}>
                  <Shield size={14} style={{ verticalAlign: 'middle' }} /> Def. Visita
                </th>
                <th style={{ padding: '0.75rem', textAlign: 'center' }}>
                  <Target size={14} style={{ verticalAlign: 'middle' }} /> Confianza
                </th>
                <th style={{ padding: '0.75rem', textAlign: 'center' }}>Resultado</th>
              </tr>
            </thead>
            <tbody>
              {partidos.map((partido, idx) => (
                <tr 
                  key={idx} 
                  style={{ 
                    borderBottom: '1px solid var(--border-color)',
                    background: idx % 2 === 0 ? 'transparent' : 'var(--bg-secondary)'
                  }}
                >
                  <td style={{ padding: '0.75rem', fontWeight: '500' }}>{partido.equipo_local}</td>
                  <td style={{ padding: '0.75rem', textAlign: 'center', color: 'var(--text-secondary)' }}>vs</td>
                  <td style={{ padding: '0.75rem', fontWeight: '500' }}>{partido.equipo_visitante}</td>
                  
                  <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                    {partido.error ? (
                      <span style={{ color: '#ef4444' }}>Error</span>
                    ) : (
                      <span style={{
                        display: 'inline-block',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '9999px',
                        background: getPronosticoColor(partido.pronostico),
                        color: 'white',
                        fontWeight: '600',
                        fontSize: '0.8rem'
                      }}>
                        {partido.pronostico}
                      </span>
                    )}
                  </td>
                  
                  <td style={{ padding: '0.75rem', textAlign: 'center', fontWeight: '500' }}>
                    {partido.doble_oportunidad || '-'}
                  </td>
                  
                  <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                    <span style={{ color: partido.ambos_marcan === 'SI' ? '#10b981' : '#6b7280' }}>
                      {partido.ambos_marcan || '-'}
                    </span>
                  </td>
                  
                  <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                    <span style={{ 
                      color: partido.over_under?.over_25?.prediccion === 'OVER' ? '#10b981' : '#6b7280' 
                    }}>
                      {partido.over_under?.over_25?.prediccion || '-'}
                    </span>
                  </td>
                  
                  <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                    <span style={{ color: '#ef4444' }}>
                      {partido.defensa_local?.promedio_gc?.toFixed(2) || '-'}
                    </span>
                  </td>
                  
                  <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                    <span style={{ color: '#ef4444' }}>
                      {partido.defensa_visitante?.promedio_gc?.toFixed(2) || '-'}
                    </span>
                  </td>
                  
                  <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      background: `${getConfianzaColor(partido.confianza)}20`,
                      color: getConfianzaColor(partido.confianza),
                      fontWeight: '600',
                      fontSize: '0.8rem'
                    }}>
                      {partido.confianza?.toFixed(1) || 0}%
                    </span>
                  </td>
                  
                  <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                    {partido.resultado_real ? (
                      <span style={{ fontWeight: '600' }}>
                        {partido.resultado_real.local} - {partido.resultado_real.visitante}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-secondary)' }}>-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Leyenda */}
      {partidos.length > 0 && (
        <div className="card" style={{ marginTop: '1rem' }}>
          <h4 style={{ marginBottom: '0.75rem', fontSize: '0.9rem' }}>Leyenda</h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', fontSize: '0.8rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ background: '#10b981', color: 'white', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>L</span>
              <span>Victoria Local</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ background: '#f59e0b', color: 'white', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>E</span>
              <span>Empate</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ background: '#3b82f6', color: 'white', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>V</span>
              <span>Victoria Visitante</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Shield size={14} color="#ef4444" />
              <span>Def. = Promedio goles recibidos (menor = mejor defensa)</span>
            </div>
          </div>
        </div>
      )}

      {/* Estado vacío */}
      {!loading && partidos.length === 0 && selectedJornada && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <Calendar size={48} color="var(--text-secondary)" style={{ marginBottom: '1rem' }} />
          <p style={{ color: 'var(--text-secondary)' }}>
            Selecciona una jornada y haz clic en "Generar Pronósticos"
          </p>
        </div>
      )}
    </div>
  );
};

export default JornadaPredictions;
