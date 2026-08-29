import { FC } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const NotFoundPage: FC = () => {
  const location = useLocation();

  return (
    <div className="not-found-page">
      <h2 className="not-found-title">404 - Página no encontrada</h2>
      <p className="not-found-description">
        La página {location.pathname} no existe.
      </p>
      <nav className="not-found-nav">
        <a href="/" className="btn btn-primary">Volver al inicio</a>
      </nav>
    </div>
  );
};

export default NotFoundPage;