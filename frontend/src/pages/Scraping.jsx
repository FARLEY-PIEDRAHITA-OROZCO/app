/**
 * Página de Datos - Extracción y Exportación
 * 
 * Funcionalidades:
 * - Extracción de datos desde API Football (múltiples ligas)
 * - Exportación de datos con filtros por liga y temporada (season_id)
 * - Visualización de logs del sistema
 */

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Play, RefreshCw, AlertCircle, Download, FileJson, FileSpreadsheet, Calendar, Globe, Database, Calculator, CheckCircle } from 'lucide-react';
import LeagueSelector from '../components/LeagueSelector';
import SeasonSelector from '../components/SeasonSelector';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Ligas populares con sus IDs de API-Football
const POPULAR_LEAGUES = [
  { id: 140, name: 'La Liga (España)', liga_id: 'SPAIN_LA_LIGA' },
  { id: 39, name: 'Premier League (Inglaterra)', liga_id: 'ENGLAND_PREMIER_LEAGUE' },
  { id: 135, name: 'Serie A (Italia)', liga_id: 'ITALY_SERIE_A' },
  { id: 78, name: 'Bundesliga (Alemania)', liga_id: 'GERMANY_BUNDESLIGA' },
  { id: 61, name: 'Ligue 1 (Francia)', liga_id: 'FRANCE_LIGUE_1' },
  { id: 262, name: 'Liga MX (México)', liga_id: 'MEXICO_LIGA_MX' },
  { id: 253, name: 'MLS (USA)', liga_id: 'USA_MLS' },
  { id: 94, name: 'Primeira Liga (Portugal)', liga_id: 'PORTUGAL_PRIMEIRA_LIGA' },
  { id: 88, name: 'Eredivisie (Holanda)', liga_id: 'NETHERLANDS_EREDIVISIE' },
  { id: 144, name: 'Jupiler Pro League (Bélgica)', liga_id: 'BELGIUM_JUPILER_PRO' }
];

const Scraping = () => {
  // Estado para extracción
  const [status, setStatus] = useState(null);
  const [config, setConfig] = useState({
    season: 2023,
    leagueId: 140, // La Liga por defecto
    limit: 1
  });
  const [logs, setLogs] = useState([]);

  // Estado para exportación
  const [exportLigaId, setExportLigaId] = useState('');
  const [exportSeasonId, setExportSeasonId] = useState('');
  const [exportFormat, setExportFormat] = useState('csv');
  const [exportLimit, setExportLimit] = useState(1000);
  const [exporting, setExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState('');

  // Estado para construcción de estadísticas
  const [statsLigaId, setStatsLigaId] = useState('');
  const [statsSeasonId, setStatsSeasonId] = useState('');
  const [buildingStats, setBuildingStats] = useState(false);
  const [statsMessage, setStatsMessage] = useState('');

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
      const payload = {
        season: config.season,
        league_ids: [config.leagueId],
        limit: config.limit
      };
      await axios.post(`${API}/scrape/start`, payload);
      
      const selectedLeague = POPULAR_LEAGUES.find(l => l.id === config.leagueId);
      alert(`Proceso iniciado para ${selectedLeague?.name || 'Liga seleccionada'} (Temporada ${config.season}-${config.season + 1})`);
    } catch (error) {
      console.error('Error starting scraping:', error);
      alert(error.response?.data?.detail || 'Error al iniciar proceso');
    }
  };

  const handleExportLigaChange = (newLigaId) => {
    setExportLigaId(newLigaId);
    setExportSeasonId(''); // Reset season when league changes
  };

  const handleStatsLigaChange = (newLigaId) => {
    setStatsLigaId(newLigaId);
    setStatsSeasonId(''); // Reset season when league changes
  };

  const handleBuildStats = async () => {
    if (!statsSeasonId) {
      setStatsMessage('❌ Selecciona una liga y temporada');
      return;
    }

    setBuildingStats(true);
    setStatsMessage('');

    try {
      const response = await axios.post(`${API}/prediction/build-stats`, {
        season_id: statsSeasonId
      });

      if (response.data.success) {
        const equipos = response.data.equipos?.length || 0;
        setStatsMessage(`✅ Estadísticas construidas para ${equipos} equipos en ${statsSeasonId}`);
      } else {
        setStatsMessage('❌ Error al construir estadísticas');
      }
    } catch (error) {
      console.error('Error building stats:', error);
      const errorMsg = error.response?.data?.detail || 'Error al construir estadísticas';
      setStatsMessage(`❌ ${errorMsg}`);
    } finally {
      setBuildingStats(false);
    }
  };

  const handleExport = async () => {
    if (!exportSeasonId) {
      setExportMessage('❌ Selecciona una liga y temporada para exportar');
      return;
    }

    setExporting(true);
    setExportMessage('');

    try {
      const payload = {
        format: exportFormat,
        season_id: exportSeasonId,
        limit: exportLimit
      };

      if (exportFormat === 'json') {
        const response = await axios.post(`${API}/export`, payload);
        const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `partidos_${exportSeasonId}_${new Date().toISOString().slice(0,10)}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        setExportMessage(`✅ Exportados ${response.data.total} partidos en formato JSON`);
      } else {
        const response = await axios.post(`${API}/export`, payload, {
          responseType: 'blob'
        });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const a = document.createElement('a');
        a.href = url;
        a.download = `partidos_${exportSeasonId}_${new Date().toISOString().slice(0,10)}.csv`;
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        
        {/* Card de Extracción */}
        <div className="card">
          <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Database size={20} color="var(--accent)" />
            Extracción de Datos
          </h3>
          
          {/* Selector de Liga para Extracción */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              <Globe size={14} style={{ marginRight: '0.25rem' }} />
              Liga a Extraer
            </label>
            <select
              data-testid="config-league"
              value={config.leagueId}
              onChange={(e) => setConfig(prev => ({ ...prev, leagueId: parseInt(e.target.value) }))}
              style={{ width: '100%' }}
              disabled={status?.is_running}
            >
              {POPULAR_LEAGUES.map(league => (
                <option key={league.id} value={league.id}>
                  {league.name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              <Calendar size={14} style={{ marginRight: '0.25rem' }} />
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

          <button
            data-testid="btn-start-scraping"
            onClick={startScraping}
            disabled={status?.is_running}
            className="btn btn-primary"
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', opacity: status?.is_running ? 0.5 : 1 }}
          >
            {status?.is_running ? (
              <>
                <RefreshCw size={18} className="spin" />
                Procesando...
              </>
            ) : (
              <>
                <Play size={18} />
                Iniciar Extracción
              </>
            )}
          </button>

          {/* Estado del proceso */}
          {status && (
            <div style={{ marginTop: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Progreso</span>
                <span>{status.progress || 0}%</span>
              </div>
              <div style={{ width: '100%', height: '8px', background: 'var(--bg-secondary)', borderRadius: '4px' }}>
                <div 
                  style={{ 
                    width: `${status.progress || 0}%`, 
                    height: '100%', 
                    background: status.is_running ? 'var(--accent)' : (status.progress === 100 ? '#10b981' : 'var(--bg-secondary)'),
                    borderRadius: '4px',
                    transition: 'width 0.3s'
                  }} 
                />
              </div>
              {status.message && (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                  {status.message}
                </p>
              )}
            </div>
          )}

          <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '8px', display: 'flex', gap: '0.5rem' }}>
            <AlertCircle size={18} style={{ color: 'var(--warning)', flexShrink: 0, marginTop: '2px' }} />
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <p style={{ margin: '0 0 0.5rem 0' }}>El proceso puede tomar varios minutos.</p>
              <p style={{ margin: 0 }}>Plan gratuito de API-Football: 100 llamadas/día</p>
            </div>
          </div>
        </div>

        {/* Card de Exportación */}
        <div className="card">
          <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Download size={20} color="var(--accent)" />
            Exportar Datos
          </h3>
          
          {/* Selector de Liga */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              <Globe size={14} style={{ marginRight: '0.25rem' }} />
              Liga
            </label>
            <LeagueSelector 
              value={exportLigaId}
              onChange={handleExportLigaChange}
              showLabel={false}
            />
          </div>

          {/* Selector de Temporada */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              <Calendar size={14} style={{ marginRight: '0.25rem' }} />
              Temporada
            </label>
            <SeasonSelector 
              ligaId={exportLigaId}
              value={exportSeasonId}
              onChange={setExportSeasonId}
              showLabel={false}
            />
          </div>

          {/* Formato */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Formato de Exportación
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => setExportFormat('csv')}
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
                  background: exportFormat === 'csv' ? 'var(--accent)' : 'var(--bg-secondary)',
                  color: exportFormat === 'csv' ? 'white' : 'var(--text-primary)',
                  transition: 'all 0.2s'
                }}
              >
                <FileSpreadsheet size={18} />
                CSV
              </button>
              <button
                onClick={() => setExportFormat('json')}
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
                  background: exportFormat === 'json' ? 'var(--accent)' : 'var(--bg-secondary)',
                  color: exportFormat === 'json' ? 'white' : 'var(--text-primary)',
                  transition: 'all 0.2s'
                }}
              >
                <FileJson size={18} />
                JSON
              </button>
            </div>
          </div>

          {/* Límite */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Límite de Partidos
            </label>
            <input
              type="number"
              min="1"
              max="10000"
              value={exportLimit}
              onChange={(e) => setExportLimit(parseInt(e.target.value) || 1000)}
              style={{ width: '100%' }}
            />
          </div>

          <button
            onClick={handleExport}
            disabled={exporting || !exportSeasonId}
            className="btn btn-primary"
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', opacity: (!exportSeasonId || exporting) ? 0.5 : 1 }}
          >
            {exporting ? (
              <>
                <RefreshCw size={18} className="spin" />
                Exportando...
              </>
            ) : (
              <>
                <Download size={18} />
                Exportar Datos
              </>
            )}
          </button>

          {exportMessage && (
            <p style={{ 
              marginTop: '1rem', 
              padding: '0.75rem', 
              background: exportMessage.startsWith('✅') ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              borderRadius: '8px',
              fontSize: '0.9rem',
              textAlign: 'center'
            }}>
              {exportMessage}
            </p>
          )}
        </div>
      </div>

      {/* Logs del Sistema */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '600' }}>Logs del Sistema</h3>
          <button 
            onClick={fetchLogs} 
            className="btn btn-secondary" 
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}
          >
            <RefreshCw size={16} />
            Actualizar
          </button>
        </div>
        <div style={{ 
          background: '#1a1a2e', 
          borderRadius: '8px', 
          padding: '1rem', 
          maxHeight: '300px', 
          overflowY: 'auto',
          fontFamily: 'monospace',
          fontSize: '0.85rem',
          color: '#94a3b8'
        }}>
          {logs.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>No hay logs disponibles</p>
          ) : (
            logs.map((log, idx) => (
              <div key={idx} style={{ 
                borderBottom: idx < logs.length - 1 ? '1px solid rgba(255,255,255,0.1)' : 'none',
                paddingBottom: '0.5rem',
                marginBottom: '0.5rem'
              }}>
                {log}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Scraping;
