/**
 * Componente LeagueSelector - Selector de Ligas
 * 
 * Permite seleccionar la liga para filtrar datos.
 * Carga las ligas disponibles desde el backend.
 */

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Globe } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const LeagueSelector = ({ 
  value,
  onChange,
  showLabel = true,
  disabled = false,
  showAllOption = false
}) => {
  const [leagues, setLeagues] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeagues();
  }, []);

  const fetchLeagues = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/leagues`);
      const leagueList = response.data || [];
      setLeagues(leagueList);
      
      // Si no hay valor seleccionado y hay ligas, seleccionar la primera
      if (!value && leagueList.length > 0) {
        onChange(leagueList[0]._id);
      }
    } catch (err) {
      console.error('Error fetching leagues:', err);
      // Fallback: crear liga por defecto
      const defaultLeague = {
        _id: 'SPAIN_LA_LIGA',
        liga_nombre: 'La Liga',
        total_partidos: 0
      };
      setLeagues([defaultLeague]);
      if (!value) {
        onChange(defaultLeague._id);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    onChange(e.target.value);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {showLabel && (
          <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            <Globe size={14} style={{ marginRight: '0.25rem' }} />
            Liga
          </label>
        )}
        <select disabled style={{ opacity: 0.5 }}>
          <option>Cargando...</option>
        </select>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      {showLabel && (
        <label style={{ 
          fontSize: '0.85rem', 
          color: 'var(--text-secondary)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.25rem'
        }}>
          <Globe size={14} />
          Liga
        </label>
      )}
      <select
        value={value || ''}
        onChange={handleChange}
        disabled={disabled || leagues.length === 0}
        style={{ minWidth: '180px' }}
      >
        {showAllOption && (
          <option value="">Todas las ligas</option>
        )}
        {leagues.length === 0 ? (
          <option value="">Sin ligas</option>
        ) : (
          leagues.map((league) => (
            <option key={league._id} value={league._id}>
              {league.liga_nombre || league._id} ({league.total_partidos || 0})
            </option>
          ))
        )}
      </select>
    </div>
  );
};

export default LeagueSelector;
