/**
 * Página de Datos - Extracción y Exportación
 * 
 * Funcionalidades:
 * - Extracción de datos desde API Football
 * - Exportación de datos con filtros por temporada (season_id)
 * - Visualización de logs del sistema
 */

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Play, RefreshCw, AlertCircle, Download, FileJson, FileSpreadsheet, Calendar } from 'lucide-react';
import SeasonSelector from '../components/SeasonSelector';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Scraping = () => {
  // Estado para extracción
  const [status, setStatus] = useState(null);
  const [config, setConfig] = useState({
    season: 2023,
    limit: 5
  });
  const [logs, setLogs] = useState([]);

  // Estado para exportación
  const [exportConfig, setExportConfig] = useState({
    seasonId: '',
    format: 'csv',
    limit: 1000
  });
  const [exporting, setExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState('');

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

  const handleExport = async () => {
    if (!exportConfig.seasonId) {
      setExportMessage('Selecciona una temporada para exportar');
      return;
    }

    setExporting(true);
    setExportMessage('');

    try {
      const payload = {
        format: exportConfig.format,
        season_id: exportConfig.seasonId,
        limit: exportConfig.limit
      };

      if (exportConfig.format === 'json') {
        // Para JSON, mostrar en nueva pestaña o descargar
        const response = await axios.post(`${API}/export`, payload);
        const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `partidos_${exportConfig.seasonId}_${new Date().toISOString().slice(0,10)}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        setExportMessage(`✅ Exportados ${response.data.total} partidos en formato JSON`);
      } else {
        // Para CSV, descarga directa
        const response = await axios.post(`${API}/export`, payload, {
          responseType: 'blob'
        });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const a = document.createElement('a');
        a.href = url;
        a.download = `partidos_${exportConfig.seasonId}_${new Date().toISOString().slice(0,10)}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        setExportMessage('✅ Archivo CSV descargado exitosamente');
      }
    } catch (error) {
      console.error('Error exporting:', error);
      const errorMsg = error.response?.data?.detail || 'Error al exportar datos';
      setExportMessage(`❌ ${errorMsg}`);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.5rem' }}>Gestión de Datos</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Extracción desde API Football y exportación de datos</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        
        {/* Card de Extracción */}
        <div className="card">
          <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Play size={20} color="var(--accent)" />
            Extracción de Datos
          </h3>
          
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Temporada a Extraer
            </label>
            <select
              data-testid="config-season"
              value={config.season}
              onChange={(e) => setConfig(prev => ({ ...prev, season: parseInt(e.target.value) }))}
              style={{ width: '100%' }}
              disabled={status?.is_running}
            >
              <option value={2024}>2024-25</option>
              <option value={2023}>2023-24</option>
              <option value={2022}>2022-23</option>
              <option value={2021}>2021-22</option>
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

        {/* Card de Exportación */}
        <div className="card">
          <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Download size={20} color="var(--accent)" />
            Exportar Datos
          </h3>
          
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              <Calendar size={14} style={{ marginRight: '0.25rem' }} />
              Temporada
            </label>
            <SeasonSelector 
              ligaId="SPAIN_LA_LIGA"
              value={exportConfig.seasonId}
              onChange={(val) => setExportConfig(prev => ({ ...prev, seasonId: val }))}
              showLabel={false}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Formato de Exportación
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => setExportConfig(prev => ({ ...prev, format: 'csv' }))}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  background: exportConfig.format === 'csv' ? 'var(--accent)' : 'var(--bg-secondary)',
                  color: exportConfig.format === 'csv' ? 'white' : 'var(--text-primary)',
                  transition: 'all 0.2s'
                }}
              >
                <FileSpreadsheet size={18} />
                CSV
              </button>
              <button
                onClick={() => setExportConfig(prev => ({ ...prev, format: 'json' }))}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  background: exportConfig.format === 'json' ? 'var(--accent)' : 'var(--bg-secondary)',
                  color: exportConfig.format === 'json' ? 'white' : 'var(--text-primary)',
                  transition: 'all 0.2s'
                }}
              >
                <FileJson size={18} />
                JSON
              </button>
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Límite de Registros
            </label>
            <input
              type="number"
              min="1"
              max="10000"
              value={exportConfig.limit}
              onChange={(e) => setExportConfig(prev => ({ ...prev, limit: parseInt(e.target.value) || 1000 }))}
              style={{ width: '100%' }}
            />
          </div>

          <button
            onClick={handleExport}
            disabled={exporting || !exportConfig.seasonId}
            className="btn btn-primary"
            style={{ 
              width: '100%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '0.5rem',
              opacity: (exporting || !exportConfig.seasonId) ? 0.5 : 1
            }}
          >
            {exporting ? (
              <>
                <RefreshCw size={18} className="spinning" />
                Exportando...
              </>
            ) : (
              <>
                <Download size={18} />
                Descargar {exportConfig.format.toUpperCase()}
              </>
            )}
          </button>

          {exportMessage && (
            <div style={{ 
              marginTop: '1rem', 
              padding: '0.75rem', 
              background: exportMessage.startsWith('✅') ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              border: `1px solid ${exportMessage.startsWith('✅') ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
              borderRadius: '8px',
              fontSize: '0.9rem'
            }}>
              {exportMessage}
            </div>
          )}
        </div>

        {/* Card de Estado */}
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

      {/* Logs */}
      <div className="card">
        <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem' }}>Logs del Sistema</h3>
        <div style={{
          maxHeight: '300px',
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
