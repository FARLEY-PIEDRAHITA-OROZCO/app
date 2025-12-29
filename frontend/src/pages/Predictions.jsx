/**
 * Página de Pronósticos - Motor PLLA 3.0
 * 
 * NUEVA VERSIÓN con:
 * - Over/Under goles
 * - Goles esperados
 * - Forma reciente de los equipos
 * - Soporte multi-liga + season_id
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Target, TrendingUp, Users, AlertCircle, RefreshCw, Globe, Flame, Goal, History } from 'lucide-react';
import LeagueSelector from '../components/LeagueSelector';
import SeasonSelector from '../components/SeasonSelector';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Predictions = () => {
  const [teams, setTeams] = useState([]);
  const [localTeam, setLocalTeam] = useState('');
  const [awayTeam, setAwayTeam] = useState('');
  const [ligaId, setLigaId] = useState('');
  const [seasonId, setSeasonId] = useState('');
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (seasonId) {
      fetchTeams();
    } else {
      setTeams([]);
      setLocalTeam('');
      setAwayTeam('');
      setPrediction(null);
    }
  }, [seasonId]);

  const handleLigaChange = (newLigaId) => {
    setLigaId(newLigaId);
    setSeasonId('');
    setTeams([]);
    setLocalTeam('');
    setAwayTeam('');
    setPrediction(null);
    setError('');
  };

  const handleSeasonChange = (newSeasonId) => {
    setSeasonId(newSeasonId);
    setLocalTeam('');
    setAwayTeam('');
    setPrediction(null);
    setError('');
  };

  const fetchTeams = async () => {
    try {
      setLoadingTeams(true);
      const response = await axios.get(`${API}/prediction/teams?season_id=${seasonId}`);
      setTeams(response.data.equipos || []);
    } catch (err) {
      console.error('Error fetching teams:', err);
      setError('Error cargando equipos. Asegúrate de haber construido las estadísticas primero.');
    } finally {
      setLoadingTeams(false);
    }
  };

  const generatePrediction = async () => {
    if (!localTeam || !awayTeam) {
      setError('Selecciona ambos equipos');
      return;
    }
    if (localTeam === awayTeam) {
      setError('Los equipos deben ser diferentes');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await axios.post(`${API}/prediction/generate`, {
        equipo_local: localTeam,
        equipo_visitante: awayTeam,
        liga_id: ligaId,
        season_id: seasonId
      });

      setPrediction(response.data.pronostico);
    } catch (err) {
      console.error('Error generating prediction:', err);
      setError(err.response?.data?.detail || 'Error generando pronóstico');
    } finally {
      setLoading(false);
    }
  };

  const getResultColor = (result) => {
    const colors = { 'L': '#10b981', 'V': '#ef4444', 'E': '#f59e0b' };
    return colors[result] || '#94a3b8';
  };

  const getResultText = (result) => {
    const texts = { 'L': 'LOCAL', 'V': 'VISITA', 'E': 'EMPATE' };
    return texts[result] || '-';
  };

  const getFormaBadge = (resultado) => {
    const colors = { 'V': '#10b981', 'E': '#f59e0b', 'D': '#ef4444' };
    return (
      <span style={{
        display: 'inline-block',
        width: '24px',
        height: '24px',
        borderRadius: '4px',
        background: colors[resultado] || '#94a3b8',
        color: 'white',
        textAlign: 'center',
        lineHeight: '24px',
        fontSize: '0.75rem',
        fontWeight: '700'
      }}>
        {resultado}
      </span>
    );
  };

  // Safe access to nested prediction data
  const getPredictionData = (timeKey) => {
    if (!prediction || !prediction[timeKey]) {
      return { 
        pronostico: '-', 
        doble_oportunidad: '-', 
        ambos_marcan: '-', 
        probabilidades: { local: 0, empate: 0, visita: 0 }, 
        confianza: 0,
        over_under: {
          over_15: { prediccion: '-', probabilidad: 0 },
          over_25: { prediccion: '-', probabilidad: 0 },
          over_35: { prediccion: '-', probabilidad: 0 }
        },
        goles_esperados: { local: 0, visitante: 0, total: 0 }
      };
    }
    return prediction[timeKey];
  };

  const tcData = getPredictionData('tiempo_completo');
  const mt1Data = getPredictionData('primer_tiempo');
  const mt2Data = getPredictionData('segundo_tiempo');
  const formaReciente = prediction?.forma_reciente || { local: null, visitante: null };

  const showResults = prediction !== null;
  const showError = error !== '';

  const TimeCard = ({ title, data, color, icon }) => (
    <div className="card" style={{ borderTop: `4px solid ${color}` }}>
      <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {icon}
        {title}
      </h4>
      
      {/* Pronóstico Principal */}
      <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
        <div style={{
          display: 'inline-block',
          padding: '0.75rem 1.5rem',
          borderRadius: '12px',
          background: getResultColor(data.pronostico),
          color: 'white',
          fontWeight: '700',
          fontSize: '1.5rem'
        }}>
          {getResultText(data.pronostico)}
        </div>
      </div>

      {/* Apuestas básicas */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
        <div style={{ textAlign: 'center', padding: '0.5rem', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Doble Oport.</p>
          <p style={{ fontWeight: '700', fontSize: '1rem' }}>{data.doble_oportunidad}</p>
        </div>
        <div style={{ textAlign: 'center', padding: '0.5rem', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Ambos Marcan</p>
          <p style={{ fontWeight: '700', fontSize: '1rem', color: data.ambos_marcan === 'SI' ? '#10b981' : '#ef4444' }}>
            {data.ambos_marcan}
          </p>
        </div>
      </div>

      {/* Over/Under */}
      <div style={{ marginBottom: '1rem', padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <Goal size={12} /> Over/Under Goles
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
          {['over_15', 'over_25', 'over_35'].map((key) => {
            const ou = data.over_under?.[key] || { prediccion: '-', probabilidad: 0 };
            const isOver = ou.prediccion === 'OVER';
            return (
              <div key={key} style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
                  {key.replace('over_', '').replace('5', '.5')}
                </p>
                <p style={{ 
                  fontWeight: '700', 
                  fontSize: '0.85rem',
                  color: isOver ? '#10b981' : '#ef4444'
                }}>
                  {ou.prediccion}
                </p>
                <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
                  {ou.probabilidad}%
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Goles esperados */}
      <div style={{ marginBottom: '1rem', padding: '0.75rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Goles Esperados</p>
        <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '1.25rem', fontWeight: '700', color: '#10b981' }}>
              {data.goles_esperados?.local?.toFixed(1) || '0.0'}
            </p>
            <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Local</p>
          </div>
          <div style={{ textAlign: 'center', padding: '0 1rem' }}>
            <p style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--accent)' }}>
              {data.goles_esperados?.total?.toFixed(1) || '0.0'}
            </p>
            <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Total</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '1.25rem', fontWeight: '700', color: '#ef4444' }}>
              {data.goles_esperados?.visitante?.toFixed(1) || '0.0'}
            </p>
            <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Visita</p>
          </div>
        </div>
      </div>

      {/* Probabilidades */}
      <div style={{ fontSize: '0.85rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <span>Local</span><span style={{ fontWeight: '600' }}>{data.probabilidades?.local?.toFixed(1)}%</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <span>Empate</span><span style={{ fontWeight: '600' }}>{data.probabilidades?.empate?.toFixed(1)}%</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <span>Visita</span><span style={{ fontWeight: '600' }}>{data.probabilidades?.visita?.toFixed(1)}%</span>
        </div>
        <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between' }}>
          <span>Confianza</span>
          <span style={{ fontWeight: '700', color }}>{data.confianza?.toFixed(1)}%</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.5rem' }}>Pronósticos</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Motor PLLA 3.0 - Pronósticos avanzados con Over/Under y forma reciente</p>
      </div>

      {/* Selection Card */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={20} />
            Seleccionar Partido
          </h2>
          
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <LeagueSelector 
              value={ligaId}
              onChange={handleLigaChange}
            />
            <SeasonSelector 
              ligaId={ligaId}
              value={seasonId}
              onChange={handleSeasonChange}
            />
          </div>
        </div>

        {ligaId && seasonId && (
          <div style={{ 
            marginBottom: '1rem', 
            padding: '0.5rem 1rem', 
            background: 'var(--bg-secondary)', 
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.85rem',
            color: 'var(--text-secondary)'
          }}>
            <Globe size={14} />
            <span>{ligaId.replace(/_/g, ' ')}</span>
            <span style={{ margin: '0 0.25rem' }}>•</span>
            <span>Temporada {seasonId.split('_').pop()}</span>
            <span style={{ margin: '0 0.25rem' }}>•</span>
            <span>{teams.length} equipos disponibles</span>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '1rem', alignItems: 'end' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              Equipo Local
            </label>
            <select
              value={localTeam}
              onChange={(e) => setLocalTeam(e.target.value)}
              style={{ width: '100%', opacity: (!seasonId || loadingTeams) ? 0.5 : 1 }}
              disabled={loadingTeams || !seasonId || teams.length === 0}
            >
              <option value="">
                {loadingTeams ? 'Cargando...' : !seasonId ? 'Selecciona temporada' : 'Seleccionar equipo'}
              </option>
              {teams.map((team) => (
                <option key={`local-${team.nombre}`} value={team.nombre}>
                  {team.nombre} ({team.puntos} pts)
                </option>
              ))}
            </select>
          </div>

          <div style={{ textAlign: 'center', padding: '0.5rem', color: 'var(--text-secondary)', fontWeight: '700' }}>
            VS
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              Equipo Visitante
            </label>
            <select
              value={awayTeam}
              onChange={(e) => setAwayTeam(e.target.value)}
              style={{ width: '100%', opacity: (!seasonId || loadingTeams) ? 0.5 : 1 }}
              disabled={loadingTeams || !seasonId || teams.length === 0}
            >
              <option value="">
                {loadingTeams ? 'Cargando...' : !seasonId ? 'Selecciona temporada' : 'Seleccionar equipo'}
              </option>
              {teams.map((team) => (
                <option key={`away-${team.nombre}`} value={team.nombre}>
                  {team.nombre} ({team.puntos} pts)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Error message */}
        <div style={{ 
          marginTop: '1rem', 
          padding: '0.75rem', 
          background: 'rgba(239, 68, 68, 0.1)', 
          borderRadius: '8px',
          color: '#ef4444',
          display: showError ? 'flex' : 'none',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <AlertCircle size={18} />
          <span>{error || 'placeholder'}</span>
        </div>

        <button
          className="btn btn-primary"
          onClick={generatePrediction}
          disabled={loading || !localTeam || !awayTeam}
          style={{ marginTop: '1.5rem', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
        >
          {loading ? (
            <>
              <RefreshCw size={18} className="spin" />
              Generando...
            </>
          ) : (
            <>
              <Target size={18} />
              Generar Pronóstico
            </>
          )}
        </button>
      </div>

      {/* Results Section */}
      <div style={{ display: showResults ? 'block' : 'none' }}>
        {/* Match Header */}
        <div className="card" style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>
            {localTeam || 'Local'} vs {awayTeam || 'Visitante'}
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            {ligaId?.replace(/_/g, ' ')} - Temporada {seasonId?.split('_').pop()}
          </p>
        </div>

        {/* Forma Reciente */}
        {(formaReciente.local || formaReciente.visitante) && (
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Flame size={18} color="#f59e0b" />
              Forma Reciente (Últimos 5 partidos)
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              {/* Local */}
              <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                <p style={{ fontWeight: '600', marginBottom: '0.75rem', color: '#10b981' }}>{localTeam}</p>
                <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '0.75rem' }}>
                  {(formaReciente.local?.ultimos_5 || []).map((r, i) => (
                    <span key={i}>{getFormaBadge(r)}</span>
                  ))}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  <p>Rendimiento: <strong style={{ color: 'var(--text-primary)' }}>{formaReciente.local?.rendimiento || 0}%</strong></p>
                  <p>Goles/partido: <strong style={{ color: 'var(--text-primary)' }}>{formaReciente.local?.goles_favor_avg || 0}</strong></p>
                  <p style={{ color: 'var(--accent)', marginTop: '0.5rem' }}>{formaReciente.local?.racha || 'Sin datos'}</p>
                </div>
              </div>
              
              {/* Visitante */}
              <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                <p style={{ fontWeight: '600', marginBottom: '0.75rem', color: '#ef4444' }}>{awayTeam}</p>
                <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '0.75rem' }}>
                  {(formaReciente.visitante?.ultimos_5 || []).map((r, i) => (
                    <span key={i}>{getFormaBadge(r)}</span>
                  ))}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  <p>Rendimiento: <strong style={{ color: 'var(--text-primary)' }}>{formaReciente.visitante?.rendimiento || 0}%</strong></p>
                  <p>Goles/partido: <strong style={{ color: 'var(--text-primary)' }}>{formaReciente.visitante?.goles_favor_avg || 0}</strong></p>
                  <p style={{ color: 'var(--accent)', marginTop: '0.5rem' }}>{formaReciente.visitante?.racha || 'Sin datos'}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Results Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
          <TimeCard 
            title="Tiempo Completo" 
            data={tcData} 
            color="var(--accent)" 
            icon={<Target size={18} />} 
          />
          <TimeCard 
            title="Primer Tiempo" 
            data={mt1Data} 
            color="#10b981" 
            icon={<TrendingUp size={18} />} 
          />
          <TimeCard 
            title="Segundo Tiempo" 
            data={mt2Data} 
            color="#f59e0b" 
            icon={<TrendingUp size={18} />} 
          />
        </div>
      </div>
    </div>
  );
};

export default Predictions;
