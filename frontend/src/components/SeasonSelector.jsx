/**
 * Componente SeasonSelector - Selector de Temporadas
 * 
 * Permite seleccionar la temporada para filtrar datos.
 * Carga las temporadas disponibles desde el backend según la liga seleccionada.
 */

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const SeasonSelector = ({ 
  ligaId = '',
  value,
  onChange,
  showLabel = true,
  disabled = false
}) => {
  const [seasons, setSeasons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (ligaId) {
      fetchSeasons();
    } else {
      setSeasons([]);
      setLoading(false);
    }
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
      } else if (value && seasonList.length > 0) {
        // Verificar si el valor actual existe en la nueva lista de temporadas
        const exists = seasonList.some(s => s.season_id === value);
        if (!exists) {
          onChange(seasonList[0].season_id);
        }
      }
    } catch (err) {
      console.error('Error fetching seasons:', err);
      // Fallback: crear temporada por defecto basada en la liga
      if (ligaId) {
        const defaultSeason = {
          season_id: `${ligaId}_2023-24`,
          label: '2023-24',
          year: 2023
        };
        setSeasons([defaultSeason]);
        if (!value) {
          onChange(defaultSeason.season_id);
        }
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

  if (!ligaId) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {showLabel && (
          <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            <Calendar size={14} style={{ marginRight: '0.25rem' }} />
            Temporada
          </label>
        )}
        <select disabled style={{ opacity: 0.5 }}>
          <option>Selecciona una liga</option>
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
        style={{ minWidth: '160px' }}
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
