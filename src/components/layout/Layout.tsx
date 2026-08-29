import { FC } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../utils/constants';

const Layout: FC<{ children: ReactNode }> = ({ children }) => {
  const { isSuperAdmin, isBarber, isClient } = useAuth();

  return (
    <div className="app-layout">
      <header className="app-header">
        <div className="header-left">
          <h1 className="header-title">Barbería Premium</h1>
        </div>
        <div className="header-right">
          {isSuperAdmin && (
            <span className="header-badge">Dueño</span>
          )}
          {isBarber && (
            <span className="header-badge">Barbero</span>
          )}
          {isClient && (
            <span className="header-badge">Cliente</span>
          )}
          <button
            onClick={() => {}}
            className="header-btn"
            aria-label="Cerrar sesión"
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      <main className="app-main">{children}</main>

      <footer className="app-footer">
        <p>© {new Date().getFullYear()} Barbería Premium. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
};

export default Layout;