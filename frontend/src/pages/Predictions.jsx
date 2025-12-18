/**
 * Página de Pronósticos - Motor PLLA 3.0
 * 
 * Permite:
 * - Seleccionar equipos local y visitante
 * - Generar pronósticos para TC, 1MT, 2MT
 * - Ver probabilidades, doble oportunidad y ambos marcan
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Target, TrendingUp, Users, AlertCircle, RefreshCw } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Componente separado para la barra de probabilidades
const ProbabilityBar = ({ local, empate, visita }) => {
  return (
    <div>
      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Probabilidades</p>
      <div style={{ display: 'flex', height: '24px', borderRadius: '12px', overflow: 'hidden', background: 'var(--bg-secondary)' }}>
        <div style={{ 
          width: `${local}%`, 
          background: '#10b981',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.75rem',
          fontWeight: '600',
          color: 'white'
        }}>
          {local > 15 ? `${local.toFixed(1)}%` : ''}
        </div>
        <div style={{ 
          width: `${empate}%`, 
          background: '#f59e0b',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.75rem',
          fontWeight: '600',
          color: 'white'
        }}>
          {empate > 15 ? `${empate.toFixed(1)}%` : ''}
        </div>
        <div style={{ 
          width: `${visita}%`, 
          background: '#ef4444',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.75rem',
          fontWeight: '600',
          color: 'white'
        }}>
          {visita > 15 ? `${visita.toFixed(1)}%` : ''}
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
        <span>{local.toFixed(1)}% Local</span>
        <span>{empate.toFixed(1)}% Empate</span>
        <span>{visita.toFixed(1)}% Visita</span>
      </div>
    </div>
  );
};

// Componente separado para la tarjeta de pronóstico
const PredictionCard = ({ title, data, icon, getResultColor, getResultText }) => {
  if (!data) return null;
  
  return (
    <div className="card" style={{ marginBottom: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
        {icon}
        <h3 style={{ fontSize: '1.1rem', fontWeight: '600' }}>{title}</h3>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
        <div style={{ textAlign: 'center', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Pronóstico</p>
          <p style={{ 
            fontSize: '1.5rem', 
            fontWeight: '700', 
            color: getResultColor(data.pronostico)
          }}>
            {getResultText(data.pronostico)}
          </p>
        </div>
        
        <div style={{ textAlign: 'center', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Doble Oportunidad</p>
          <p style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--accent)' }}>
            {data.doble_oportunidad}
          </p>
        </div>
        
        <div style={{ textAlign: 'center', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Ambos Marcan</p>
          <p style={{ 
            fontSize: '1.5rem', 
            fontWeight: '700', 
            color: data.ambos_marcan === 'SI' ? '#10b981' : '#ef4444'
          }}>
            {data.ambos_marcan}
          </p>
        </div>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <ProbabilityBar 
          local={data.probabilidades?.local || 0}
          empate={data.probabilidades?.empate || 0}
          visita={data.probabilidades?.visita || 0}
        />
      </div>

      <div>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
          Confianza: {(data.confianza || 0).toFixed(1)}%
        </p>
        <div style={{ background: 'var(--bg-secondary)', borderRadius: '4px', height: '8px', overflow: 'hidden' }}>
          <div style={{ 
            width: `${data.confianza || 0}%`, 
            background: (data.confianza || 0) > 60 ? '#10b981' : (data.confianza || 0) > 40 ? '#f59e0b' : '#ef4444',
            height: '100%',
            transition: 'width 0.3s'
          }} />
        </div>
      </div>
    </div>
  );
};

const Predictions = () => {
  const [teams, setTeams] = useState([]);
  const [localTeam, setLocalTeam] = useState('');
  const [awayTeam, setAwayTeam] = useState('');
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingTeams, setLoadingTeams] = useState(true);
  const [error, setError] = useState(null);

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
      setError(null);
      setPrediction(null);

      const response = await axios.post(`${API}/prediction/generate`, {
        equipo_local: localTeam,
        equipo_visitante: awayTeam,
        liga_id: 'SPAIN_LA_LIGA',
        temporada: 2023
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
    switch (result) {
      case 'L': return '#10b981';
      case 'V': return '#ef4444';
      case 'E': return '#f59e0b';
      default: return '#94a3b8';
    }
  };

  const getResultText = (result) => {
    switch (result) {
      case 'L': return 'LOCAL';
      case 'V': return 'VISITA';
      case 'E': return 'EMPATE';
      default: return result || '-';
    }
  };

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.5rem' }}>Pronósticos</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Genera pronósticos usando el motor PLLA 3.0</p>
      </div>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Users size={20} />
          Seleccionar Partido
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '1rem', alignItems: 'end' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              Equipo Local
            </label>
            <select
              value={localTeam}
              onChange={(e) => setLocalTeam(e.target.value)}
              style={{ width: '100%' }}
              disabled={loadingTeams}
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
              disabled={loadingTeams}
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

        {error && (
          <div style={{ 
            marginTop: '1rem', 
            padding: '0.75rem', 
            background: 'rgba(239, 68, 68, 0.1)', 
            borderRadius: '8px',
            color: '#ef4444',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <button
          className="btn btn-primary"
          onClick={generatePrediction}
          disabled={loading || !localTeam || !awayTeam}
          style={{ marginTop: '1.5rem', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
        >
          {loading ? (
            <React.Fragment>
              <RefreshCw size={18} className="spinning" /> Generando...
            </React.Fragment>
          ) : (
            <React.Fragment>
              <Target size={18} /> Generar Pronóstico
            </React.Fragment>
          )}
        </button>
      </div>

      {prediction && (
        <div className="fade-in">
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
            {prediction.equipo_local} vs {prediction.equipo_visitante}
          </h2>
          
          <PredictionCard 
            title="Tiempo Completo (90 min)" 
            data={prediction.tiempo_completo}
            icon={<TrendingUp size={20} color="#10b981" />}
            getResultColor={getResultColor}
            getResultText={getResultText}
          />
          <PredictionCard 
            title="Primer Tiempo (1MT)" 
            data={prediction.primer_tiempo}
            icon={<TrendingUp size={20} color="#3b82f6" />}
            getResultColor={getResultColor}
            getResultText={getResultText}
          />
          <PredictionCard 
            title="Segundo Tiempo (2MT)" 
            data={prediction.segundo_tiempo}
            icon={<TrendingUp size={20} color="#f59e0b" />}
            getResultColor={getResultColor}
            getResultText={getResultText}
          />

          <div style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Versión del algoritmo: {prediction.version_algoritmo} | 
            Generado: {new Date(prediction.fecha_generacion).toLocaleString('es-ES')}
          </div>
        </div>
      )}
    </div>
  );
};

export default Predictions;
