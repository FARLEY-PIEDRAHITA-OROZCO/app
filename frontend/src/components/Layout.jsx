import { Outlet, NavLink } from 'react-router-dom';
import { BarChart3, Database, Download } from 'lucide-react';

const Layout = () => {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside style={{
        width: '250px',
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border)',
        padding: '2rem 0'
      }}>
        <div style={{ padding: '0 1.5rem', marginBottom: '3rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--accent)' }}>
            ⚽ Football Data
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            Sistema de Análisis
          </p>
        </div>
        
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <NavLink
            to="/"
            data-testid="nav-dashboard"
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              padding: '0.75rem 1.5rem',
              color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
              background: isActive ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
              borderLeft: isActive ? '3px solid var(--accent)' : '3px solid transparent',
              textDecoration: 'none',
              transition: 'all 0.2s'
            })}
          >
            <BarChart3 size={20} />
            <span>Dashboard</span>
          </NavLink>
          
          <NavLink
            to="/matches"
            data-testid="nav-matches"
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              padding: '0.75rem 1.5rem',
              color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
              background: isActive ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
              borderLeft: isActive ? '3px solid var(--accent)' : '3px solid transparent',
              textDecoration: 'none',
              transition: 'all 0.2s'
            })}
          >
            <Database size={20} />
            <span>Partidos</span>
          </NavLink>
          
          <NavLink
            to="/scraping"
            data-testid="nav-scraping"
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              padding: '0.75rem 1.5rem',
              color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
              background: isActive ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
              borderLeft: isActive ? '3px solid var(--accent)' : '3px solid transparent',
              textDecoration: 'none',
              transition: 'all 0.2s'
            })}
          >
            <Download size={20} />
            <span>Extracción</span>
          </NavLink>
        </nav>
      </aside>
      
      <main style={{ flex: 1, padding: '2rem', overflow: 'auto' }}>
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;