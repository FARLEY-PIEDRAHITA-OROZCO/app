/**
 * Página de Pronósticos - Motor PLLA 3.0
 * 
 * SOLUCIÓN: Estructura DOM fija - sin renderizado condicional que altere estructura
 * Solo cambia visibilidad y contenido, nunca la estructura del árbol DOM
 * 
 * Actualización: Soporte para múltiples ligas + season_id
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Target, TrendingUp, Users, AlertCircle, RefreshCw, Globe } from 'lucide-react';
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

  // Cuando cambia la liga, resetear todo
  const handleLigaChange = (newLigaId) => {
    setLigaId(newLigaId);
    setSeasonId('');
    setTeams([]);
    setLocalTeam('');
    setAwayTeam('');
    setPrediction(null);
    setError('');
  };

  // Cuando cambia la temporada, resetear equipos
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

  // Safe access to nested prediction data
  const getPredictionData = (timeKey) => {
    if (!prediction || !prediction[timeKey]) {
      return { pronostico: '-', doble_oportunidad: '-', ambos_marcan: '-', probabilidades: { local: 0, empate: 0, visita: 0 }, confianza: 0 };
    }
    return prediction[timeKey];
  };

  const tcData = getPredictionData('tiempo_completo');
  const mt1Data = getPredictionData('primer_tiempo');
  const mt2Data = getPredictionData('segundo_tiempo');

  // Determine visibility
  const showResults = prediction !== null;
  const showError = error !== '';

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.5rem' }}>Pronósticos</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Genera pronósticos usando el motor PLLA 3.0</p>
      </div>

      {/* Selection Card - Always rendered */}
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
          
          {/* Selectores de Liga y Temporada */}
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

        {/* Info de contexto */}
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

        {/* Error message - Always in DOM, visibility controlled by CSS */}
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

      {/* Results Section - Always in DOM, visibility controlled */}
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

        {/* Results Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {/* Tiempo Completo */}
          <div className="card" style={{ borderTop: '4px solid var(--accent)' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Target size={18} />
              Tiempo Completo
            </h4>
            
            <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
              <div style={{
                display: 'inline-block',
                padding: '0.75rem 1.5rem',
                borderRadius: '12px',
                background: getResultColor(tcData.pronostico),
                color: 'white',
                fontWeight: '700',
                fontSize: '1.5rem'
              }}>
                {getResultText(tcData.pronostico)}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ textAlign: 'center', padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Doble Oport.</p>
                <p style={{ fontWeight: '700', fontSize: '1.1rem' }}>{tcData.doble_oportunidad}</p>
              </div>
              <div style={{ textAlign: 'center', padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Ambos Marcan</p>
                <p style={{ fontWeight: '700', fontSize: '1.1rem', color: tcData.ambos_marcan === 'SI' ? '#10b981' : '#ef4444' }}>
                  {tcData.ambos_marcan}
                </p>
              </div>
            </div>

            <div style={{ fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span>Local</span><span style={{ fontWeight: '600' }}>{tcData.probabilidades?.local?.toFixed(1)}%</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span>Empate</span><span style={{ fontWeight: '600' }}>{tcData.probabilidades?.empate?.toFixed(1)}%</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span>Visita</span><span style={{ fontWeight: '600' }}>{tcData.probabilidades?.visita?.toFixed(1)}%</span>
              </div>
              <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between' }}>
                <span>Confianza</span>
                <span style={{ fontWeight: '700', color: 'var(--accent)' }}>{tcData.confianza?.toFixed(1)}%</span>
              </div>
            </div>
          </div>

          {/* Primer Tiempo */}
          <div className="card" style={{ borderTop: '4px solid #10b981' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <TrendingUp size={18} />
              Primer Tiempo
            </h4>
            
            <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
              <div style={{
                display: 'inline-block',
                padding: '0.75rem 1.5rem',
                borderRadius: '12px',
                background: getResultColor(mt1Data.pronostico),
                color: 'white',
                fontWeight: '700',
                fontSize: '1.5rem'
              }}>
                {getResultText(mt1Data.pronostico)}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ textAlign: 'center', padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Doble Oport.</p>
                <p style={{ fontWeight: '700', fontSize: '1.1rem' }}>{mt1Data.doble_oportunidad}</p>
              </div>
              <div style={{ textAlign: 'center', padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Ambos Marcan</p>
                <p style={{ fontWeight: '700', fontSize: '1.1rem', color: mt1Data.ambos_marcan === 'SI' ? '#10b981' : '#ef4444' }}>
                  {mt1Data.ambos_marcan}
                </p>
              </div>
            </div>

            <div style={{ fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span>Local</span><span style={{ fontWeight: '600' }}>{mt1Data.probabilidades?.local?.toFixed(1)}%</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span>Empate</span><span style={{ fontWeight: '600' }}>{mt1Data.probabilidades?.empate?.toFixed(1)}%</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span>Visita</span><span style={{ fontWeight: '600' }}>{mt1Data.probabilidades?.visita?.toFixed(1)}%</span>
              </div>
              <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between' }}>
                <span>Confianza</span>
                <span style={{ fontWeight: '700', color: '#10b981' }}>{mt1Data.confianza?.toFixed(1)}%</span>
              </div>
            </div>
          </div>

          {/* Segundo Tiempo */}
          <div className="card" style={{ borderTop: '4px solid #f59e0b' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <TrendingUp size={18} />
              Segundo Tiempo
            </h4>
            
            <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
              <div style={{
                display: 'inline-block',
                padding: '0.75rem 1.5rem',
                borderRadius: '12px',
                background: getResultColor(mt2Data.pronostico),
                color: 'white',
                fontWeight: '700',
                fontSize: '1.5rem'
              }}>
                {getResultText(mt2Data.pronostico)}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ textAlign: 'center', padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Doble Oport.</p>
                <p style={{ fontWeight: '700', fontSize: '1.1rem' }}>{mt2Data.doble_oportunidad}</p>
              </div>
              <div style={{ textAlign: 'center', padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Ambos Marcan</p>
                <p style={{ fontWeight: '700', fontSize: '1.1rem', color: mt2Data.ambos_marcan === 'SI' ? '#10b981' : '#ef4444' }}>
                  {mt2Data.ambos_marcan}
                </p>
              </div>
            </div>

            <div style={{ fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span>Local</span><span style={{ fontWeight: '600' }}>{mt2Data.probabilidades?.local?.toFixed(1)}%</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span>Empate</span><span style={{ fontWeight: '600' }}>{mt2Data.probabilidades?.empate?.toFixed(1)}%</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span>Visita</span><span style={{ fontWeight: '600' }}>{mt2Data.probabilidades?.visita?.toFixed(1)}%</span>
              </div>
              <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between' }}>
                <span>Confianza</span>
                <span style={{ fontWeight: '700', color: '#f59e0b' }}>{mt2Data.confianza?.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Predictions;
