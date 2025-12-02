import { useState, useEffect } from 'react';
import axios from 'axios';
import { Play, RefreshCw, AlertCircle } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Scraping = () => {
  const [status, setStatus] = useState(null);
  const [config, setConfig] = useState({
    season: 2023,
    limit: 5
  });
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await axios.get(`${API}/scrape/status`);
      setStatus(response.data);
    } catch (error) {
      console.error('Error fetching status:', error);
    }
  };

  const fetchLogs = async () => {
    try {
      const response = await axios.get(`${API}/logs`);
      setLogs(response.data.logs || []);
    } catch (error) {
      console.error('Error fetching logs:', error);
    }
  };

  const startScraping = async () => {
    try {
      await axios.post(`${API}/scrape/start`, config);
      alert('Proceso iniciado en segundo plano');
    } catch (error) {
      console.error('Error starting scraping:', error);
      alert(error.response?.data?.detail || 'Error al iniciar proceso');
    }
  };

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.5rem' }}>Extracción de Datos</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Ejecuta el proceso de scraping de la API de Football</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="card">
          <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem' }}>Configuración</h3>
          
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Temporada
            </label>
            <select
              data-testid="config-season"
              value={config.season}
              onChange={(e) => setConfig(prev => ({ ...prev, season: parseInt(e.target.value) }))}
              style={{ width: '100%' }}
              disabled={status?.is_running}
            >
              <option value={2023}>2023</option>
              <option value={2022}>2022</option>
              <option value={2021}>2021</option>
            </select>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Límite de Ligas (0 = todas)
            </label>
            <input
              data-testid="config-limit"
              type="number"
              min="0"
              value={config.limit}
              onChange={(e) => setConfig(prev => ({ ...prev, limit: parseInt(e.target.value) }))}
              style={{ width: '100%' }}
              disabled={status?.is_running}
            />
          </div>

          <button
            data-testid="btn-start-scraping"
            onClick={startScraping}
            disabled={status?.is_running}
            className="btn btn-primary"
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', opacity: status?.is_running ? 0.5 : 1 }}
          >
            <Play size={18} />
            {status?.is_running ? 'Procesando...' : 'Iniciar Extracción'}
          </button>

          <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '8px', display: 'flex', gap: '0.5rem' }}>
            <AlertCircle size={18} style={{ color: 'var(--warning)', flexShrink: 0 }} />
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
              El proceso puede tomar varios minutos. Se ejecuta en segundo plano.
            </p>
          </div>
        </div>

        <div className="card">
          <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <RefreshCw size={20} className={status?.is_running ? 'spinning' : ''} />
            Estado del Proceso
          </h3>
          
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Progreso</span>
              <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>{status?.progress || 0}%</span>
            </div>
            <div style={{ width: '100%', height: '8px', background: 'var(--bg-secondary)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${status?.progress || 0}%`, height: '100%', background: 'var(--accent)', transition: 'width 0.3s' }} />
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Estado:</p>
            <p style={{ fontWeight: '500' }}>{status?.message || 'Esperando...'}</p>
          </div>

          <div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Ejecutando:</p>
            <span className={`badge ${status?.is_running ? 'badge-warning' : 'badge-success'}`}>
              {status?.is_running ? 'En Proceso' : 'Detenido'}
            </span>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem' }}>Logs del Sistema</h3>
        <div style={{
          maxHeight: '400px',
          overflowY: 'auto',
          background: 'var(--bg-secondary)',
          padding: '1rem',
          borderRadius: '8px',
          fontFamily: 'monospace',
          fontSize: '0.85rem'
        }}>
          {logs.length > 0 ? (
            logs.map((log, idx) => (
              <div key={idx} style={{ marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                {log}
              </div>
            ))
          ) : (
            <div style={{ color: 'var(--text-secondary)' }}>No hay logs disponibles</div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spinning {
          animation: spin 2s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default Scraping;