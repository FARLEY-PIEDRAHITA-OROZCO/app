import { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Download, Filter } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Matches = () => {
  const [matches, setMatches] = useState([]);
  const [leagues, setLeagues] = useState([]);
  const [loading, setLoading] = useState(false);
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
    fetchMatches();
  }, []);

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
      const response = await axios.post(`${API}/matches/search`, filters);
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
    try {
      const response = await axios.post(`${API}/export`, {
        format,
        liga_id: filters.liga_id || null,
        limit: 1000
      }, {
        responseType: format === 'csv' ? 'blob' : 'json'
      });

      if (format === 'csv') {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `partidos_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      } else {
        const dataStr = JSON.stringify(response.data, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `partidos_${new Date().toISOString().split('T')[0]}.json`);
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <Filter size={20} />
          <h3 style={{ fontSize: '1rem', fontWeight: '600' }}>Filtros</h3>
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

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            data-testid="btn-search"
            onClick={handleSearch}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Search size={18} />
            Buscar
          </button>
          <button
            data-testid="btn-export-csv"
            onClick={() => handleExport('csv')}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Download size={18} />
            Exportar CSV
          </button>
          <button
            data-testid="btn-export-json"
            onClick={() => handleExport('json')}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Download size={18} />
            Exportar JSON
          </button>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '600' }}>
            Resultados ({pagination.total.toLocaleString()})
          </h3>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Página {pagination.page} de {pagination.pages}
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>Cargando...</div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Liga</th>
                    <th>Local</th>
                    <th style={{ textAlign: 'center' }}>Resultado</th>
                    <th>Visitante</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {matches.map((match, idx) => (
                    <tr key={idx}>
                      <td style={{ fontSize: '0.9rem' }}>{match.fecha}</td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {match.liga_nombre}
                      </td>
                      <td style={{ fontWeight: '500' }}>
                        {match.equipo_local}
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>
                          ({match.pos_clasif_local}°)
                        </span>
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: '700', fontSize: '1.1rem' }}>
                        {match.goles_local_TR} - {match.goles_visitante_TR}
                      </td>
                      <td style={{ fontWeight: '500' }}>
                        {match.equipo_visitante}
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>
                          ({match.pos_clasif_visita}°)
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-success">
                          {match.estado_del_partido}
                        </span>
                      </td>
                    </tr>
                  ))}
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