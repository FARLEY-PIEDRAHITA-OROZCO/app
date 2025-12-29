/**
 * Vista de Temporada Completa - Tipo Excel
 * Muestra TODOS los partidos de una temporada con pronósticos y filtros avanzados
 */

import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { 
  Download, Filter, Search, ChevronUp, ChevronDown, 
  RefreshCw, Table, Eye, EyeOff, CheckCircle, XCircle
} from 'lucide-react';
import LeagueSelector from '../components/LeagueSelector';
import SeasonSelector from '../components/SeasonSelector';

const API = process.env.REACT_APP_BACKEND_URL;

const TemporadaCompleta = () => {
  const [ligaId, setLigaId] = useState('');
  const [seasonId, setSeasonId] = useState('');
  const [partidos, setPartidos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  
  // Filtros
  const [filters, setFilters] = useState({
    jornada: '',
    equipo: '',
    pronostico: '',
    confianzaMin: 0,
    soloJugados: false,
    soloPendientes: false,
    busqueda: ''
  });
  
  // Ordenamiento
  const [sortConfig, setSortConfig] = useState({ key: 'jornada_num', direction: 'asc' });
  
  // Columnas visibles
  const [visibleColumns, setVisibleColumns] = useState({
    jornada: true,
    fecha: true,
    local: true,
    visitante: true,
    pronostico: true,
    dobleOp: true,
    ambos: true,
    over25: true,
    over15: false,
    confianza: true,
    defLocal: true,
    defVisita: true,
    resultado: true,
    acierto: true
  });

  const fetchTemporadaCompleta = async () => {
    if (!seasonId) return;
    
    setLoading(true);
    setProgress(0);
    setError(null);
    setPartidos([]);
    
    try {
      setProgress(10);
      
      // Usar endpoint optimizado que carga toda la temporada de una vez
      const response = await axios.get(`${API}/api/prediction/temporada-completa?season_id=${seasonId}`);
      
      setProgress(90);
      
      if (response.data.partidos) {
        setPartidos(response.data.partidos);
      }
      
      setProgress(100);
      
    } catch (err) {
      console.error('Error:', err);
      setError('Error cargando datos de la temporada');
    } finally {
      setLoading(false);
    }
  };

  // Extraer opciones únicas para filtros
  const filterOptions = useMemo(() => {
    const jornadas = [...new Set(partidos.map(p => p.jornada))].sort((a, b) => {
      const numA = parseInt(a.match(/\d+/)?.[0] || 0);
      const numB = parseInt(b.match(/\d+/)?.[0] || 0);
      return numA - numB;
    });
    
    const equipos = [...new Set([
      ...partidos.map(p => p.equipo_local),
      ...partidos.map(p => p.equipo_visitante)
    ])].sort();
    
    return { jornadas, equipos };
  }, [partidos]);

  // Aplicar filtros y ordenamiento
  const partidosFiltrados = useMemo(() => {
    let filtered = [...partidos];
    
    // Filtro por jornada
    if (filters.jornada) {
      filtered = filtered.filter(p => p.jornada === filters.jornada);
    }
    
    // Filtro por equipo
    if (filters.equipo) {
      filtered = filtered.filter(p => 
        p.equipo_local === filters.equipo || p.equipo_visitante === filters.equipo
      );
    }
    
    // Filtro por pronóstico
    if (filters.pronostico) {
      filtered = filtered.filter(p => p.pronostico === filters.pronostico);
    }
    
    // Filtro por confianza mínima
    if (filters.confianzaMin > 0) {
      filtered = filtered.filter(p => (p.confianza || 0) >= filters.confianzaMin);
    }
    
    // Filtro solo jugados
    if (filters.soloJugados) {
      filtered = filtered.filter(p => p.resultado_real);
    }
    
    // Filtro solo pendientes
    if (filters.soloPendientes) {
      filtered = filtered.filter(p => !p.resultado_real);
    }
    
    // Búsqueda general
    if (filters.busqueda) {
      const search = filters.busqueda.toLowerCase();
      filtered = filtered.filter(p => 
        p.equipo_local.toLowerCase().includes(search) ||
        p.equipo_visitante.toLowerCase().includes(search)
      );
    }
    
    // Ordenamiento
    filtered.sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];
      
      if (sortConfig.key === 'confianza') {
        aVal = a.confianza || 0;
        bVal = b.confianza || 0;
      }
      
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    
    return filtered;
  }, [partidos, filters, sortConfig]);

  // Estadísticas de aciertos
  const estadisticas = useMemo(() => {
    const jugados = partidosFiltrados.filter(p => p.resultado_real);
    let aciertos = 0;
    let aciertosDO = 0;
    
    jugados.forEach(p => {
      // Manejar resultado_real como objeto {local, visitante}
      const gLocal = p.resultado_real?.local;
      const gVisita = p.resultado_real?.visitante;
      if (gLocal === null || gLocal === undefined || gVisita === null || gVisita === undefined) return;
      
      let resultadoReal = gLocal > gVisita ? 'L' : gLocal < gVisita ? 'V' : 'E';
      if (p.pronostico === resultadoReal) aciertos++;
      
      // Doble oportunidad
      if (p.doble_oportunidad === '1X' && (resultadoReal === 'L' || resultadoReal === 'E')) aciertosDO++;
      if (p.doble_oportunidad === 'X2' && (resultadoReal === 'E' || resultadoReal === 'V')) aciertosDO++;
      if (p.doble_oportunidad === '12' && (resultadoReal === 'L' || resultadoReal === 'V')) aciertosDO++;
    });
    
    return {
      total: partidosFiltrados.length,
      jugados: jugados.length,
      pendientes: partidosFiltrados.length - jugados.length,
      aciertos,
      porcentajeAcierto: jugados.length > 0 ? ((aciertos / jugados.length) * 100).toFixed(1) : 0,
      aciertosDO,
      porcentajeDO: jugados.length > 0 ? ((aciertosDO / jugados.length) * 100).toFixed(1) : 0
    };
  }, [partidosFiltrados]);

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const exportToCSV = () => {
    const headers = [
      'Jornada', 'Fecha', 'Local', 'Visitante', 'Pronóstico', 
      'Doble Op', 'Ambos Marcan', 'Over 2.5', 'Over 1.5', 
      'Confianza', 'Def Local', 'Def Visita', 'Resultado', 'Acertó'
    ];
    
    const rows = partidosFiltrados.map(p => {
      const [gL, gV] = (p.resultado_real || '-').split('-').map(Number);
      const resReal = !isNaN(gL) && !isNaN(gV) ? (gL > gV ? 'L' : gL < gV ? 'V' : 'E') : '';
      const acerto = resReal && p.pronostico === resReal ? 'SI' : resReal ? 'NO' : '';
      
      return [
        p.jornada,
        p.fecha || '',
        p.equipo_local,
        p.equipo_visitante,
        p.pronostico || '',
        p.doble_oportunidad || '',
        p.ambos_marcan || '',
        p.over_under?.over_25?.prediccion || '',
        p.over_under?.over_15?.prediccion || '',
        `${p.confianza?.toFixed(1) || 0}%`,
        p.defensa_local?.promedio_gc?.toFixed(2) || '',
        p.defensa_visitante?.promedio_gc?.toFixed(2) || '',
        p.resultado_real || '',
        acerto
      ];
    });
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `temporada_${seasonId}.csv`;
    a.click();
  };

  const SortIcon = ({ column }) => {
    if (sortConfig.key !== column) return null;
    return sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
  };

  const getPronosticoColor = (p) => {
    if (p === 'L') return '#10b981';
    if (p === 'E') return '#f59e0b';
    if (p === 'V') return '#3b82f6';
    return '#6b7280';
  };

  const verificarAcierto = (partido) => {
    if (!partido.resultado_real) return null;
    const [gL, gV] = partido.resultado_real.split('-').map(Number);
    if (isNaN(gL) || isNaN(gV)) return null;
    const resReal = gL > gV ? 'L' : gL < gV ? 'V' : 'E';
    return partido.pronostico === resReal;
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>📊 Vista Temporada Completa</h1>
        <p>Todos los partidos de la temporada con pronósticos - Estilo Excel</p>
      </div>

      {/* Selectores principales */}
      <div className="card" style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'end' }}>
          <LeagueSelector value={ligaId} onChange={setLigaId} />
          <SeasonSelector ligaId={ligaId} value={seasonId} onChange={setSeasonId} />
          
          <button
            onClick={fetchTemporadaCompleta}
            disabled={!seasonId || loading}
            className="btn btn-primary"
            style={{ height: '42px', minWidth: '180px' }}
          >
            {loading ? (
              <>
                <RefreshCw size={16} className="spin" style={{ marginRight: '0.5rem' }} />
                {progress}%
              </>
            ) : (
              <>
                <Table size={16} style={{ marginRight: '0.5rem' }} />
                Cargar Temporada
              </>
            )}
          </button>
          
          {partidos.length > 0 && (
            <button onClick={exportToCSV} className="btn btn-secondary" style={{ height: '42px' }}>
              <Download size={16} style={{ marginRight: '0.5rem' }} />
              Exportar CSV
            </button>
          )}
        </div>
      </div>

      {/* Estadísticas */}
      {partidos.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
          <div className="stat-chip">Total: <strong>{estadisticas.total}</strong></div>
          <div className="stat-chip">Jugados: <strong>{estadisticas.jugados}</strong></div>
          <div className="stat-chip">Pendientes: <strong>{estadisticas.pendientes}</strong></div>
          <div className="stat-chip" style={{ background: '#10b98120', color: '#10b981' }}>
            Acierto L/E/V: <strong>{estadisticas.porcentajeAcierto}%</strong> ({estadisticas.aciertos}/{estadisticas.jugados})
          </div>
          <div className="stat-chip" style={{ background: '#f59e0b20', color: '#f59e0b' }}>
            Acierto Doble Op: <strong>{estadisticas.porcentajeDO}%</strong> ({estadisticas.aciertosDO}/{estadisticas.jugados})
          </div>
        </div>
      )}

      {/* Filtros avanzados */}
      {partidos.length > 0 && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Filter size={16} />
            <strong>Filtros</strong>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem' }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Buscar equipo</label>
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={filters.busqueda}
                  onChange={(e) => setFilters(f => ({ ...f, busqueda: e.target.value }))}
                  style={{ paddingLeft: '32px', width: '100%' }}
                />
              </div>
            </div>
            
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Jornada</label>
              <select
                value={filters.jornada}
                onChange={(e) => setFilters(f => ({ ...f, jornada: e.target.value }))}
              >
                <option value="">Todas</option>
                {filterOptions.jornadas.map(j => (
                  <option key={j} value={j}>{j}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Equipo</label>
              <select
                value={filters.equipo}
                onChange={(e) => setFilters(f => ({ ...f, equipo: e.target.value }))}
              >
                <option value="">Todos</option>
                {filterOptions.equipos.map(e => (
                  <option key={e} value={e}>{e}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Pronóstico</label>
              <select
                value={filters.pronostico}
                onChange={(e) => setFilters(f => ({ ...f, pronostico: e.target.value }))}
              >
                <option value="">Todos</option>
                <option value="L">Local (L)</option>
                <option value="E">Empate (E)</option>
                <option value="V">Visitante (V)</option>
              </select>
            </div>
            
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Confianza mín.</label>
              <select
                value={filters.confianzaMin}
                onChange={(e) => setFilters(f => ({ ...f, confianzaMin: Number(e.target.value) }))}
              >
                <option value={0}>Todas</option>
                <option value={50}>50%+</option>
                <option value={60}>60%+</option>
                <option value={70}>70%+</option>
                <option value={80}>80%+</option>
              </select>
            </div>
            
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Estado</label>
              <select
                value={filters.soloJugados ? 'jugados' : filters.soloPendientes ? 'pendientes' : ''}
                onChange={(e) => setFilters(f => ({ 
                  ...f, 
                  soloJugados: e.target.value === 'jugados',
                  soloPendientes: e.target.value === 'pendientes'
                }))}
              >
                <option value="">Todos</option>
                <option value="jugados">Solo jugados</option>
                <option value="pendientes">Solo pendientes</option>
              </select>
            </div>
          </div>
          
          {/* Reset filtros */}
          <button
            onClick={() => setFilters({ jornada: '', equipo: '', pronostico: '', confianzaMin: 0, soloJugados: false, soloPendientes: false, busqueda: '' })}
            style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Limpiar filtros
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="card" style={{ background: 'rgba(239, 68, 68, 0.1)', borderColor: '#ef4444', marginBottom: '1rem' }}>
          <p style={{ color: '#ef4444' }}>{error}</p>
        </div>
      )}

      {/* Tabla principal */}
      {partidosFiltrados.length > 0 && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto', maxHeight: '70vh' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
              <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-secondary)', zIndex: 10 }}>
                <tr>
                  {visibleColumns.jornada && (
                    <th onClick={() => handleSort('jornada_num')} style={{ ...thStyle, cursor: 'pointer' }}>
                      Jornada <SortIcon column="jornada_num" />
                    </th>
                  )}
                  {visibleColumns.local && <th style={thStyle}>Local</th>}
                  {visibleColumns.visitante && <th style={thStyle}>Visitante</th>}
                  {visibleColumns.pronostico && (
                    <th onClick={() => handleSort('pronostico')} style={{ ...thStyle, cursor: 'pointer', textAlign: 'center' }}>
                      Pron. <SortIcon column="pronostico" />
                    </th>
                  )}
                  {visibleColumns.dobleOp && <th style={{ ...thStyle, textAlign: 'center' }}>D.Op</th>}
                  {visibleColumns.ambos && <th style={{ ...thStyle, textAlign: 'center' }}>Ambos</th>}
                  {visibleColumns.over25 && <th style={{ ...thStyle, textAlign: 'center' }}>O2.5</th>}
                  {visibleColumns.over15 && <th style={{ ...thStyle, textAlign: 'center' }}>O1.5</th>}
                  {visibleColumns.confianza && (
                    <th onClick={() => handleSort('confianza')} style={{ ...thStyle, cursor: 'pointer', textAlign: 'center' }}>
                      Conf. <SortIcon column="confianza" />
                    </th>
                  )}
                  {visibleColumns.defLocal && <th style={{ ...thStyle, textAlign: 'center' }}>Def.L</th>}
                  {visibleColumns.defVisita && <th style={{ ...thStyle, textAlign: 'center' }}>Def.V</th>}
                  {visibleColumns.resultado && <th style={{ ...thStyle, textAlign: 'center' }}>Result.</th>}
                  {visibleColumns.acierto && <th style={{ ...thStyle, textAlign: 'center' }}>✓</th>}
                </tr>
              </thead>
              <tbody>
                {partidosFiltrados.map((p, idx) => {
                  const acierto = verificarAcierto(p);
                  return (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)', background: idx % 2 === 0 ? 'transparent' : 'var(--bg-secondary)' }}>
                      {visibleColumns.jornada && <td style={tdStyle}>{p.jornada?.replace('Regular Season - ', 'J')}</td>}
                      {visibleColumns.local && <td style={{ ...tdStyle, fontWeight: '500' }}>{p.equipo_local}</td>}
                      {visibleColumns.visitante && <td style={{ ...tdStyle, fontWeight: '500' }}>{p.equipo_visitante}</td>}
                      {visibleColumns.pronostico && (
                        <td style={{ ...tdStyle, textAlign: 'center' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '0.15rem 0.5rem',
                            borderRadius: '4px',
                            background: getPronosticoColor(p.pronostico),
                            color: 'white',
                            fontWeight: '600',
                            fontSize: '0.75rem'
                          }}>
                            {p.pronostico || '-'}
                          </span>
                        </td>
                      )}
                      {visibleColumns.dobleOp && <td style={{ ...tdStyle, textAlign: 'center', color: '#f59e0b' }}>{p.doble_oportunidad || '-'}</td>}
                      {visibleColumns.ambos && <td style={{ ...tdStyle, textAlign: 'center', color: p.ambos_marcan === 'SI' ? '#10b981' : '#6b7280' }}>{p.ambos_marcan || '-'}</td>}
                      {visibleColumns.over25 && <td style={{ ...tdStyle, textAlign: 'center', color: p.over_under?.over_25?.prediccion === 'OVER' ? '#3b82f6' : '#6b7280' }}>{p.over_under?.over_25?.prediccion || '-'}</td>}
                      {visibleColumns.over15 && <td style={{ ...tdStyle, textAlign: 'center' }}>{p.over_under?.over_15?.prediccion || '-'}</td>}
                      {visibleColumns.confianza && (
                        <td style={{ ...tdStyle, textAlign: 'center' }}>
                          <span style={{ color: p.confianza >= 70 ? '#10b981' : p.confianza >= 50 ? '#f59e0b' : '#ef4444' }}>
                            {p.confianza?.toFixed(0) || 0}%
                          </span>
                        </td>
                      )}
                      {visibleColumns.defLocal && <td style={{ ...tdStyle, textAlign: 'center', color: '#ef4444' }}>{p.defensa_local?.promedio_gc?.toFixed(2) || '-'}</td>}
                      {visibleColumns.defVisita && <td style={{ ...tdStyle, textAlign: 'center', color: '#ef4444' }}>{p.defensa_visitante?.promedio_gc?.toFixed(2) || '-'}</td>}
                      {visibleColumns.resultado && (
                        <td style={{ ...tdStyle, textAlign: 'center', fontWeight: '600' }}>
                          {p.resultado_real?.local !== undefined && p.resultado_real?.local !== null
                            ? `${p.resultado_real.local}-${p.resultado_real.visitante}`
                            : '-'}
                        </td>
                      )}
                      {visibleColumns.acierto && (
                        <td style={{ ...tdStyle, textAlign: 'center' }}>
                          {acierto === true && <CheckCircle size={16} color="#10b981" />}
                          {acierto === false && <XCircle size={16} color="#ef4444" />}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Estado inicial */}
      {!loading && partidos.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '4rem' }}>
          <Table size={48} color="var(--text-secondary)" style={{ marginBottom: '1rem' }} />
          <h3 style={{ marginBottom: '0.5rem' }}>Vista de Temporada Completa</h3>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto' }}>
            Selecciona liga y temporada, luego haz clic en "Cargar Temporada" para ver todos los partidos con sus pronósticos.
          </p>
        </div>
      )}

      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .stat-chip {
          background: var(--bg-secondary);
          padding: 0.5rem 1rem;
          border-radius: 8px;
          font-size: 0.85rem;
        }
        input, select {
          padding: 0.5rem;
          border-radius: 6px;
          border: 1px solid var(--border-color);
          background: var(--bg-primary);
          color: var(--text-primary);
          width: 100%;
        }
      `}</style>
    </div>
  );
};

const thStyle = {
  padding: '0.75rem 0.5rem',
  textAlign: 'left',
  fontWeight: '600',
  fontSize: '0.75rem',
  color: 'var(--text-secondary)',
  borderBottom: '2px solid var(--border-color)',
  whiteSpace: 'nowrap'
};

const tdStyle = {
  padding: '0.5rem',
  whiteSpace: 'nowrap'
};

export default TemporadaCompleta;
