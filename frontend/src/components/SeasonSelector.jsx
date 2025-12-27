/**
 * Componente SeasonSelector - Selector de Temporadas
 * 
 * Permite seleccionar la temporada para filtrar datos.
 * Carga las temporadas disponibles desde el backend.
 */

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const SeasonSelector = ({ 
  ligaId = 'SPAIN_LA_LIGA',
  value,
  onChange,
  showLabel = true,
  disabled = false
}) => {
  const [seasons, setSeasons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSeasons();
  }, [ligaId]);

  const fetchSeasons = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/seasons?liga_id=${ligaId}`);
      const seasonList = response.data.seasons || [];
      setSeasons(seasonList);
      
      // Si no hay valor seleccionado y hay temporadas, seleccionar la primera
      if (!value && seasonList.length > 0) {
        onChange(seasonList[0].season_id);
      }
    } catch (err) {
      console.error('Error fetching seasons:', err);
      // Fallback: crear temporada por defecto
      const defaultSeason = {
        season_id: `${ligaId}_2023-24`,
        label: '2023-24',
        year: 2023
      };
      setSeasons([defaultSeason]);
      if (!value) {
        onChange(defaultSeason.season_id);
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
            <Calendar size={14} style={{ marginRight: '0.25rem' }} />
            Temporada
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
          <Calendar size={14} />
          Temporada
        </label>
      )}
      <select
        value={value || ''}
        onChange={handleChange}
        disabled={disabled || seasons.length === 0}
        style={{ minWidth: '140px' }}
      >
        {seasons.length === 0 ? (
          <option value="">Sin temporadas</option>
        ) : (
          seasons.map((season) => (
            <option key={season.season_id} value={season.season_id}>
              {season.label} ({season.total_partidos || 0} partidos)
            </option>
          ))
        )}
      </select>
    </div>
  );
};

export default SeasonSelector;
