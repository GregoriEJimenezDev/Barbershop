import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Layout = () => {
  const { user, isSuperAdmin, isBarber, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    setMobileOpen(false);
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;
  const closeMobile = () => setMobileOpen(false);

  return (
    <>
      <header className="app-header">
        <div className="container app-header__inner">
          <Link to="/" className="app-logo" onClick={closeMobile}>
            <span className="app-logo__icon">B</span>
            <span>Barbería</span>
          </Link>

          <nav className="nav">
            <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>
              Inicio
            </Link>
            {user && isSuperAdmin && (
              <>
                <Link to="/admin" className={`nav-link ${isActive('/admin') ? 'active' : ''}`}>
                  Panel
                </Link>
                <Link to="/admin/barberos" className={`nav-link ${isActive('/admin/barberos') ? 'active' : ''}`}>
                  Barberos
                </Link>
              </>
            )}
            {user && isBarber && (
              <Link to="/barbero" className={`nav-link ${isActive('/barbero') ? 'active' : ''}`}>
                Mi panel
              </Link>
            )}
            {user && !isSuperAdmin && !isBarber && (
              <Link to="/cliente" className={`nav-link ${isActive('/cliente') ? 'active' : ''}`}>
                Mi cuenta
              </Link>
            )}
            {user ? (
              <button onClick={handleSignOut} className="btn btn-secondary btn-sm">
                Salir
              </button>
            ) : (
              <>
                <Link to="/login" className="nav-link">Entrar</Link>
                <Link to="/register" className="btn btn-primary btn-sm">
                  Registrarse
                </Link>
              </>
            )}
          </nav>

          <button
            className="mobile-menu-toggle"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Menú"
          >
            {mobileOpen ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>
        </div>

        {mobileOpen && (
          <div className="mobile-nav">
            <Link to="/" className="nav-link" onClick={closeMobile}>Inicio</Link>
            {user && isSuperAdmin && (
              <>
                <Link to="/admin" className="nav-link" onClick={closeMobile}>Panel</Link>
                <Link to="/admin/barberos" className="nav-link" onClick={closeMobile}>Barberos</Link>
              </>
            )}
            {user && isBarber && (
              <Link to="/barbero" className="nav-link" onClick={closeMobile}>Mi panel</Link>
            )}
            {user && !isSuperAdmin && !isBarber && (
              <Link to="/cliente" className="nav-link" onClick={closeMobile}>Mi cuenta</Link>
            )}
            {user ? (
              <button onClick={handleSignOut} className="btn btn-secondary btn-block">
                Cerrar sesión
              </button>
            ) : (
              <>
                <Link to="/login" className="nav-link" onClick={closeMobile}>Entrar</Link>
                <Link
                  to="/register"
                  className="btn btn-primary btn-block"
                  onClick={closeMobile}
                  style={{ marginTop: 'var(--space-2)' }}
                >
                  Crear cuenta
                </Link>
              </>
            )}
          </div>
        )}
      </header>

      <main className="app-main">
        <Outlet />
      </main>

      <footer className="app-footer">
        <div className="container app-footer__inner">
          <div>
            <strong style={{ color: 'var(--color-text-primary)' }}>Barbería Premium</strong>
            <p>Estilo, tradición y precisión desde 2010</p>
          </div>
          <div>
            <p>© {new Date().getFullYear()} Barbería. Todos los derechos reservados.</p>
            <p>📍 Santo Domingo, República Dominicana</p>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Layout;
