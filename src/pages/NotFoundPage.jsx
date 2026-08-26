import { Link } from 'react-router-dom';

const NotFoundPage = () => {
  return (
    <div className="auth-page" style={{ minHeight: '60vh' }}>
      <div className="auth-card" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '4rem', marginBottom: 'var(--space-4)' }}>✂️</div>
        <h1 className="auth-card__title">Página no encontrada</h1>
        <p className="auth-card__subtitle" style={{ marginBottom: 'var(--space-5)' }}>
          El corte que buscas no está aquí.
        </p>
        <Link to="/" className="btn btn-primary">
          Volver al inicio
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
