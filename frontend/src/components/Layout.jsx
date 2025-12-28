import { Outlet, NavLink } from 'react-router-dom';
import { BarChart3, Database, Download, Target, Trophy, Users, Calendar, Zap } from 'lucide-react';

const Layout = () => {
  const navLinkStyle = ({ isActive }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '0.75rem 1.5rem',
    color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
    background: isActive ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
    borderLeft: isActive ? '3px solid var(--accent)' : '3px solid transparent',
    textDecoration: 'none',
    transition: 'all 0.2s'
  });

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside style={{
        width: '250px',
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border)',
        padding: '2rem 0',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh'
      }}>
        <div style={{ padding: '0 1.5rem', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--accent)' }}>
            ⚽ Football Data
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            Sistema PLLA 3.0
          </p>
        </div>
        
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1 }}>
          {/* Sección Principal */}
          <div style={{ padding: '0.5rem 1.5rem', fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '0.5rem' }}>
            Principal
          </div>
          
          <NavLink to="/" data-testid="nav-dashboard" style={navLinkStyle}>
            <BarChart3 size={20} />
            <span>Dashboard</span>
          </NavLink>
          
          {/* Sección Pronósticos */}
          <div style={{ padding: '0.5rem 1.5rem', fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '1rem' }}>
            Pronósticos
          </div>
          
          <NavLink to="/mejores-apuestas" data-testid="nav-mejores" style={navLinkStyle}>
            <Zap size={20} />
            <span>Mejores Apuestas</span>
          </NavLink>
          
          <NavLink to="/jornada" data-testid="nav-jornada" style={navLinkStyle}>
            <Calendar size={20} />
            <span>Por Jornada</span>
          </NavLink>
          
          <NavLink to="/predictions" data-testid="nav-predictions" style={navLinkStyle}>
            <Target size={20} />
            <span>Por Partido</span>
          </NavLink>
          
          <NavLink to="/classification" data-testid="nav-classification" style={navLinkStyle}>
            <Trophy size={20} />
            <span>Clasificación</span>
          </NavLink>
          
          <NavLink to="/teams" data-testid="nav-teams" style={navLinkStyle}>
            <Users size={20} />
            <span>Equipos</span>
          </NavLink>
          
          {/* Sección Datos */}
          <div style={{ padding: '0.5rem 1.5rem', fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '1rem' }}>
            Datos
          </div>
          
          <NavLink to="/matches" data-testid="nav-matches" style={navLinkStyle}>
            <Database size={20} />
            <span>Partidos</span>
          </NavLink>
          
          <NavLink to="/scraping" data-testid="nav-scraping" style={navLinkStyle}>
            <Download size={20} />
            <span>Extracción</span>
          </NavLink>
        </nav>
        
        {/* Footer del sidebar - ahora usando margin-top: auto para empujarlo abajo */}
        <div style={{ 
          margin: '1.5rem',
          marginTop: 'auto',
          padding: '0.75rem',
          background: 'var(--bg-card)',
          borderRadius: '8px',
          fontSize: '0.75rem',
          color: 'var(--text-secondary)'
        }}>
          <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>Motor PLLA 3.0</div>
          <div>v1.0.0</div>
        </div>
      </aside>
      
      <main style={{ flex: 1, padding: '2rem', overflow: 'auto' }}>
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;