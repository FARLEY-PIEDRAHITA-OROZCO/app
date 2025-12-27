/**
 * Página de Pronósticos - Motor PLLA 3.0
 * 
 * SOLUCIÓN: Estructura DOM fija - sin renderizado condicional que altere estructura
 * Solo cambia visibilidad y contenido, nunca la estructura del árbol DOM
 * 
 * Actualización: Soporte para season_id
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Target, TrendingUp, Users, AlertCircle, RefreshCw } from 'lucide-react';
import SeasonSelector from '../components/SeasonSelector';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Predictions = () => {
  const [teams, setTeams] = useState([]);
  const [localTeam, setLocalTeam] = useState('');
  const [awayTeam, setAwayTeam] = useState('');
  const [seasonId, setSeasonId] = useState('');
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingTeams, setLoadingTeams] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (seasonId) {
      fetchTeams();
    }
  }, [seasonId]);

  const fetchTeams = async () => {
    try {
      setLoadingTeams(true);
      setLocalTeam('');
      setAwayTeam('');
      setPrediction(null);
      const response = await axios.get(`${API}/prediction/teams?season_id=${seasonId}`);
      setTeams(response.data.equipos || []);
    } catch (err) {
      console.error('Error fetching teams:', err);
      setError('Error cargando equipos');
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
        liga_id: 'SPAIN_LA_LIGA',
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
          
          {/* Selector de Temporada */}
          <SeasonSelector 
            ligaId="SPAIN_LA_LIGA"
            value={seasonId}
            onChange={setSeasonId}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '1rem', alignItems: 'end' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              Equipo Local
            </label>
            <select
              value={localTeam}
              onChange={(e) => setLocalTeam(e.target.value)}
              style={{ width: '100%' }}
              disabled={loadingTeams || !seasonId}
            >
              <option value="">Seleccionar equipo</option>
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
              style={{ width: '100%' }}
              disabled={loadingTeams || !seasonId}
            >
              <option value="">Seleccionar equipo</option>
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
          <span style={{ display: loading ? 'flex' : 'none', alignItems: 'center', gap: '0.5rem' }}>
            <RefreshCw size={18} className="spinning" /> Generando...
          </span>
          <span style={{ display: loading ? 'none' : 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Target size={18} /> Generar Pronóstico
          </span>
        </button>
      </div>

      {/* Results Section - Always in DOM, visibility controlled by CSS */}
      <div style={{ display: showResults ? 'block' : 'none' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
          {prediction?.equipo_local || 'Local'} vs {prediction?.equipo_visitante || 'Visitante'}
        </h2>
        
        {/* Tiempo Completo Card - Always rendered */}
        <div className="card" style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <TrendingUp size={20} color="#10b981" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: '600' }}>Tiempo Completo (90 min)</h3>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ textAlign: 'center', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Pronóstico</p>
              <p style={{ fontSize: '1.5rem', fontWeight: '700', color: getResultColor(tcData.pronostico) }}>
                {getResultText(tcData.pronostico)}
              </p>
            </div>
            <div style={{ textAlign: 'center', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Doble Oportunidad</p>
              <p style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--accent)' }}>{tcData.doble_oportunidad}</p>
            </div>
            <div style={{ textAlign: 'center', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Ambos Marcan</p>
              <p style={{ fontSize: '1.5rem', fontWeight: '700', color: tcData.ambos_marcan === 'SI' ? '#10b981' : '#ef4444' }}>
                {tcData.ambos_marcan}
              </p>
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Probabilidades</p>
            <div style={{ display: 'flex', height: '24px', borderRadius: '12px', overflow: 'hidden', background: 'var(--bg-secondary)' }}>
              <div style={{ width: `${tcData.probabilidades?.local || 0}%`, background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: '600', color: 'white' }}>
                {(tcData.probabilidades?.local || 0) > 15 ? `${(tcData.probabilidades?.local || 0).toFixed(1)}%` : ''}
              </div>
              <div style={{ width: `${tcData.probabilidades?.empate || 0}%`, background: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: '600', color: 'white' }}>
                {(tcData.probabilidades?.empate || 0) > 15 ? `${(tcData.probabilidades?.empate || 0).toFixed(1)}%` : ''}
              </div>
              <div style={{ width: `${tcData.probabilidades?.visita || 0}%`, background: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: '600', color: 'white' }}>
                {(tcData.probabilidades?.visita || 0) > 15 ? `${(tcData.probabilidades?.visita || 0).toFixed(1)}%` : ''}
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              <span>{(tcData.probabilidades?.local || 0).toFixed(1)}% Local</span>
              <span>{(tcData.probabilidades?.empate || 0).toFixed(1)}% Empate</span>
              <span>{(tcData.probabilidades?.visita || 0).toFixed(1)}% Visita</span>
            </div>
          </div>

          <div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Confianza: {(tcData.confianza || 0).toFixed(1)}%</p>
            <div style={{ background: 'var(--bg-secondary)', borderRadius: '4px', height: '8px', overflow: 'hidden' }}>
              <div style={{ width: `${tcData.confianza || 0}%`, background: (tcData.confianza || 0) > 60 ? '#10b981' : (tcData.confianza || 0) > 40 ? '#f59e0b' : '#ef4444', height: '100%' }} />
            </div>
          </div>
        </div>

        {/* Primer Tiempo Card - Always rendered */}
        <div className="card" style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <TrendingUp size={20} color="#3b82f6" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: '600' }}>Primer Tiempo (1MT)</h3>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ textAlign: 'center', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Pronóstico</p>
              <p style={{ fontSize: '1.5rem', fontWeight: '700', color: getResultColor(mt1Data.pronostico) }}>
                {getResultText(mt1Data.pronostico)}
              </p>
            </div>
            <div style={{ textAlign: 'center', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Doble Oportunidad</p>
              <p style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--accent)' }}>{mt1Data.doble_oportunidad}</p>
            </div>
            <div style={{ textAlign: 'center', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Ambos Marcan</p>
              <p style={{ fontSize: '1.5rem', fontWeight: '700', color: mt1Data.ambos_marcan === 'SI' ? '#10b981' : '#ef4444' }}>
                {mt1Data.ambos_marcan}
              </p>
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Probabilidades</p>
            <div style={{ display: 'flex', height: '24px', borderRadius: '12px', overflow: 'hidden', background: 'var(--bg-secondary)' }}>
              <div style={{ width: `${mt1Data.probabilidades?.local || 0}%`, background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: '600', color: 'white' }}>
                {(mt1Data.probabilidades?.local || 0) > 15 ? `${(mt1Data.probabilidades?.local || 0).toFixed(1)}%` : ''}
              </div>
              <div style={{ width: `${mt1Data.probabilidades?.empate || 0}%`, background: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: '600', color: 'white' }}>
                {(mt1Data.probabilidades?.empate || 0) > 15 ? `${(mt1Data.probabilidades?.empate || 0).toFixed(1)}%` : ''}
              </div>
              <div style={{ width: `${mt1Data.probabilidades?.visita || 0}%`, background: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: '600', color: 'white' }}>
                {(mt1Data.probabilidades?.visita || 0) > 15 ? `${(mt1Data.probabilidades?.visita || 0).toFixed(1)}%` : ''}
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              <span>{(mt1Data.probabilidades?.local || 0).toFixed(1)}% Local</span>
              <span>{(mt1Data.probabilidades?.empate || 0).toFixed(1)}% Empate</span>
              <span>{(mt1Data.probabilidades?.visita || 0).toFixed(1)}% Visita</span>
            </div>
          </div>

          <div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Confianza: {(mt1Data.confianza || 0).toFixed(1)}%</p>
            <div style={{ background: 'var(--bg-secondary)', borderRadius: '4px', height: '8px', overflow: 'hidden' }}>
              <div style={{ width: `${mt1Data.confianza || 0}%`, background: (mt1Data.confianza || 0) > 60 ? '#10b981' : (mt1Data.confianza || 0) > 40 ? '#f59e0b' : '#ef4444', height: '100%' }} />
            </div>
          </div>
        </div>

        {/* Segundo Tiempo Card - Always rendered */}
        <div className="card" style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <TrendingUp size={20} color="#f59e0b" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: '600' }}>Segundo Tiempo (2MT)</h3>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ textAlign: 'center', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Pronóstico</p>
              <p style={{ fontSize: '1.5rem', fontWeight: '700', color: getResultColor(mt2Data.pronostico) }}>
                {getResultText(mt2Data.pronostico)}
              </p>
            </div>
            <div style={{ textAlign: 'center', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Doble Oportunidad</p>
              <p style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--accent)' }}>{mt2Data.doble_oportunidad}</p>
            </div>
            <div style={{ textAlign: 'center', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Ambos Marcan</p>
              <p style={{ fontSize: '1.5rem', fontWeight: '700', color: mt2Data.ambos_marcan === 'SI' ? '#10b981' : '#ef4444' }}>
                {mt2Data.ambos_marcan}
              </p>
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Probabilidades</p>
            <div style={{ display: 'flex', height: '24px', borderRadius: '12px', overflow: 'hidden', background: 'var(--bg-secondary)' }}>
              <div style={{ width: `${mt2Data.probabilidades?.local || 0}%`, background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: '600', color: 'white' }}>
                {(mt2Data.probabilidades?.local || 0) > 15 ? `${(mt2Data.probabilidades?.local || 0).toFixed(1)}%` : ''}
              </div>
              <div style={{ width: `${mt2Data.probabilidades?.empate || 0}%`, background: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: '600', color: 'white' }}>
                {(mt2Data.probabilidades?.empate || 0) > 15 ? `${(mt2Data.probabilidades?.empate || 0).toFixed(1)}%` : ''}
              </div>
              <div style={{ width: `${mt2Data.probabilidades?.visita || 0}%`, background: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: '600', color: 'white' }}>
                {(mt2Data.probabilidades?.visita || 0) > 15 ? `${(mt2Data.probabilidades?.visita || 0).toFixed(1)}%` : ''}
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              <span>{(mt2Data.probabilidades?.local || 0).toFixed(1)}% Local</span>
              <span>{(mt2Data.probabilidades?.empate || 0).toFixed(1)}% Empate</span>
              <span>{(mt2Data.probabilidades?.visita || 0).toFixed(1)}% Visita</span>
            </div>
          </div>

          <div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Confianza: {(mt2Data.confianza || 0).toFixed(1)}%</p>
            <div style={{ background: 'var(--bg-secondary)', borderRadius: '4px', height: '8px', overflow: 'hidden' }}>
              <div style={{ width: `${mt2Data.confianza || 0}%`, background: (mt2Data.confianza || 0) > 60 ? '#10b981' : (mt2Data.confianza || 0) > 40 ? '#f59e0b' : '#ef4444', height: '100%' }} />
            </div>
          </div>
        </div>

        {/* Footer info - Always rendered */}
        <div style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Versión del algoritmo: {prediction?.version_algoritmo || '-'} | 
          Generado: {prediction?.fecha_generacion ? new Date(prediction.fecha_generacion).toLocaleString('es-ES') : '-'}
        </div>
      </div>
    </div>
  );
};

export default Predictions;
