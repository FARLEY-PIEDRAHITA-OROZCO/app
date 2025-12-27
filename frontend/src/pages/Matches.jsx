/**
 * Página de Partidos - Motor PLLA 3.0
 * 
 * Consulta y exporta datos de partidos con:
 * - Filtro por temporada (season_id)
 * - Filtro por liga, fechas, equipo
 * - Exportación CSV/JSON
 */

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Download, Filter, Calendar } from 'lucide-react';
import SeasonSelector from '../components/SeasonSelector';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Matches = () => {
  const [matches, setMatches] = useState([]);
  const [leagues, setLeagues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [seasonId, setSeasonId] = useState('');
  const [filters, setFilters] = useState({
    liga_id: '',
    fecha_inicio: '',
    fecha_fin: '',
    equipo: '',
    limit: 50,
    skip: 0
  });
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });

  useEffect(() => {
    fetchLeagues();
  }, []);

  useEffect(() => {
    if (seasonId) {
      fetchMatches();
    }
  }, [seasonId]);

  const fetchLeagues = async () => {
    try {
      const response = await axios.get(`${API}/leagues`);
      setLeagues(response.data);
    } catch (error) {
      console.error('Error fetching leagues:', error);
    }
  };

  const fetchMatches = async () => {
    setLoading(true);
    try {
      const searchFilters = {
        ...filters,
        season_id: seasonId
      };
      
      const response = await axios.post(`${API}/matches/search`, searchFilters);
      setMatches(response.data.matches);
      setPagination({
        total: response.data.total,
        page: response.data.page,
        pages: response.data.pages
      });
    } catch (error) {
      console.error('Error fetching matches:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value, skip: 0 }));
  };

  const handleSearch = () => {
    fetchMatches();
  };

  const handleExport = async (format) => {
    if (!seasonId) {
      alert('Selecciona una temporada para exportar');
      return;
    }
    
    try {
      const response = await axios.post(`${API}/export`, {
        format,
        season_id: seasonId,
        liga_id: filters.liga_id || null,
        limit: 10000
      }, {
        responseType: format === 'csv' ? 'blob' : 'json'
      });

      const filename = `partidos_${seasonId}_${new Date().toISOString().split('T')[0]}`;

      if (format === 'csv') {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${filename}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      } else {
        const dataStr = JSON.stringify(response.data, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${filename}.json`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      }
    } catch (error) {
      console.error('Error exporting:', error);
      alert('Error al exportar datos');
    }
  };

  const nextPage = () => {
    if (pagination.page < pagination.pages) {
      setFilters(prev => ({ ...prev, skip: prev.skip + prev.limit }));
      setTimeout(fetchMatches, 100);
    }
  };

  const prevPage = () => {
    if (pagination.page > 1) {
      setFilters(prev => ({ ...prev, skip: Math.max(0, prev.skip - prev.limit) }));
      setTimeout(fetchMatches, 100);
    }
  };

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.5rem' }}>Partidos</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Consulta y exporta datos de partidos</p>
      </div>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Filter size={20} />
            <h3 style={{ fontSize: '1rem', fontWeight: '600' }}>Filtros</h3>
          </div>
          
          <SeasonSelector 
            ligaId="SPAIN_LA_LIGA"
            value={seasonId}
            onChange={setSeasonId}
          />
        </div>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          marginBottom: '1rem'
        }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Liga
            </label>
            <select
              data-testid="filter-league"
              value={filters.liga_id}
              onChange={(e) => handleFilterChange('liga_id', e.target.value)}
              style={{ width: '100%' }}
            >
              <option value="">Todas las ligas</option>
              {leagues.map(league => (
                <option key={league._id} value={league._id}>
                  {league.liga_nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Fecha Inicio
            </label>
            <input
              data-testid="filter-date-start"
              type="date"
              value={filters.fecha_inicio}
              onChange={(e) => handleFilterChange('fecha_inicio', e.target.value)}
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Fecha Fin
            </label>
            <input
              data-testid="filter-date-end"
              type="date"
              value={filters.fecha_fin}
              onChange={(e) => handleFilterChange('fecha_fin', e.target.value)}
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Equipo
            </label>
            <input
              data-testid="filter-team"
              type="text"
              placeholder="Buscar equipo..."
              value={filters.equipo}
              onChange={(e) => handleFilterChange('equipo', e.target.value)}
              style={{ width: '100%' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
          <button
            data-testid="btn-search"
            onClick={handleSearch}
            disabled={!seasonId}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: seasonId ? 1 : 0.5 }}
          >
            <Search size={18} />
            Buscar
          </button>
          <button
            data-testid="btn-export-csv"
            onClick={() => handleExport('csv')}
            disabled={!seasonId}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: seasonId ? 1 : 0.5 }}
          >
            <Download size={18} />
            Exportar CSV
          </button>
          <button
            data-testid="btn-export-json"
            onClick={() => handleExport('json')}
            disabled={!seasonId}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: seasonId ? 1 : 0.5 }}
          >
            <Download size={18} />
            Exportar JSON
          </button>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '600' }}>
            Resultados ({pagination.total.toLocaleString()})
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            {seasonId && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Calendar size={14} />
                {seasonId.split('_').pop()}
              </span>
            )}
            <span>Página {pagination.page} de {pagination.pages}</span>
          </div>
        </div>

        {!seasonId ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
            <Calendar size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
            <p>Selecciona una temporada para ver los partidos</p>
          </div>
        ) : loading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>Cargando...</div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Jornada</th>
                    <th>Local</th>
                    <th style={{ textAlign: 'center' }}>Resultado</th>
                    <th>Visitante</th>
                    <th style={{ textAlign: 'center' }}>1MT</th>
                  </tr>
                </thead>
                <tbody>
                  {matches.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                        No se encontraron partidos con los filtros seleccionados
                      </td>
                    </tr>
                  ) : (
                    matches.map((match, idx) => (
                      <tr key={match.match_id || match.id_partido || idx}>
                        <td style={{ fontSize: '0.9rem' }}>{match.fecha}</td>
                        <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          {match.ronda?.replace('Regular Season - ', 'J') || '-'}
                        </td>
                        <td style={{ fontWeight: '500' }}>
                          {match.equipo_local}
                        </td>
                        <td style={{ textAlign: 'center', fontWeight: '700', fontSize: '1.1rem' }}>
                          <span style={{ color: match.goles_local_TR > match.goles_visitante_TR ? '#10b981' : match.goles_local_TR < match.goles_visitante_TR ? '#ef4444' : '#f59e0b' }}>
                            {match.goles_local_TR}
                          </span>
                          {' - '}
                          <span style={{ color: match.goles_visitante_TR > match.goles_local_TR ? '#10b981' : match.goles_visitante_TR < match.goles_local_TR ? '#ef4444' : '#f59e0b' }}>
                            {match.goles_visitante_TR}
                          </span>
                        </td>
                        <td style={{ fontWeight: '500' }}>
                          {match.equipo_visitante}
                        </td>
                        <td style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                          {match.goles_local_1MT} - {match.goles_visitante_1MT}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {pagination.pages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1.5rem' }}>
                <button
                  onClick={prevPage}
                  disabled={pagination.page === 1}
                  className="btn btn-secondary"
                  style={{ opacity: pagination.page === 1 ? 0.5 : 1 }}
                >
                  Anterior
                </button>
                <button
                  onClick={nextPage}
                  disabled={pagination.page === pagination.pages}
                  className="btn btn-secondary"
                  style={{ opacity: pagination.page === pagination.pages ? 0.5 : 1 }}
                >
                  Siguiente
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Matches;
