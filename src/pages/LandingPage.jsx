import { lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useFirestoreSubscription } from '../hooks/useFirestoreSubscription';
import { subscribeToServices } from '../services/services.service';
import { formatCurrency } from '../utils/helpers';

const BarberScene3D = lazy(() => import('../components/three/BarberScene3D'));

const features = [
  {
    icon: '✂️',
    title: 'Maestros barberos',
    description: 'Más de 15 años de experiencia en cortes clásicos y modernos.'
  },
  {
    icon: '📅',
    title: 'Reserva en línea',
    description: 'Agenda tu cita 24/7 desde tu celular, en menos de 1 minuto.'
  },
  {
    icon: '⚡',
    title: 'Servicio express',
    description: '¿Prisa? Solicita tu cita de emergencia y te atendemos hoy mismo.'
  },
  {
    icon: '💈',
    title: 'Productos premium',
    description: 'Trabajamos con las mejores marcas para tu cabello y barba.'
  },
  {
    icon: '🪒',
    title: 'Higiene impecable',
    description: 'Herramientas esterilizadas y un ambiente sanitizado siempre.'
  },
  {
    icon: '🎯',
    title: 'Atención personalizada',
    description: 'Cada cliente recibe un servicio a la medida de su estilo.'
  }
];

const LandingPage = () => {
  const { isAuthenticated } = useAuth();

  const { data: services } = useFirestoreSubscription(
    (cb, err) => subscribeToServices(cb, err),
    []
  );

  const topServices = (services || []).slice(0, 3);

  return (
    <div className="landing">
      {/* ============ HERO ============ */}
      <section className="hero">
        <div className="hero__3d-canvas">
          <Suspense fallback={<div className="three-loader"><div className="loader" /></div>}>
            <BarberScene3D />
          </Suspense>
        </div>
        <div className="container">
          <div className="hero__content">
            <span className="hero__badge">
              <span style={{
                width: 6, height: 6, borderRadius: '50%',
                background: 'var(--color-primary)',
                display: 'inline-block',
                boxShadow: '0 0 8px var(--color-primary)'
              }} />
              Disponible hoy — Reserva tu hora
            </span>
            <h1 className="hero__title">
              Estilo que <span className="hero__title-accent">define</span> tu carácter.
            </h1>
            <p className="hero__subtitle">
              Cortes clásicos, modernos y de tendencia. Reserva tu cita en segundos
              y deja que nuestros barberos cuiden tu imagen.
            </p>
            <div className="hero__actions">
              <Link
                to={isAuthenticated ? '/cliente' : '/register'}
                className="btn btn-primary btn-lg"
              >
                Reservar cita
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </Link>
              <a href="#servicios" className="btn btn-outline btn-lg">
                Ver precios
              </a>
            </div>
            <div className="hero__stats">
              <div className="stat">
                <div className="stat__value">15+</div>
                <div className="stat__label">Años</div>
              </div>
              <div className="stat">
                <div className="stat__value">5K+</div>
                <div className="stat__label">Clientes</div>
              </div>
              <div className="stat">
                <div className="stat__value">4.9★</div>
                <div className="stat__label">Rating</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ PRICE BOARD PREVIEW ============ */}
      <section className="section" id="servicios">
        <div className="container">
          <div className="section__header">
            <span className="section__eyebrow">Nuestros servicios</span>
            <h2 className="section__title">Cartelera de precios</h2>
            <p className="section__subtitle">
              Cortes profesionales para caballeros. Calidad y tradición en cada visita.
            </p>
          </div>

          <div className="price-board">
            {topServices.length === 0 && (
              <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
                <div className="empty-state__icon">💈</div>
                <p className="empty-state__title">Próximamente</p>
                <p>Estamos preparando nuestra cartelera de servicios.</p>
              </div>
            )}
            {topServices.map((service) => (
              <div key={service.id} className="price-card">
                <h3 className="price-card__name">{service.name}</h3>
                {service.description && (
                  <p className="price-card__description">{service.description}</p>
                )}
                <div className="price-card__footer">
                  <span className="price-card__price">
                    {formatCurrency(service.price)}
                  </span>
                  <span className="price-card__duration">
                    {service.durationMinutes} min
                  </span>
                </div>
              </div>
            ))}
          </div>

          {topServices.length > 0 && (
            <div className="text-center" style={{ marginTop: 'var(--space-8)' }}>
              <Link
                to={isAuthenticated ? '/cliente' : '/register'}
                className="btn btn-outline"
              >
                Ver todos y reservar
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ============ FEATURES ============ */}
      <section className="section" style={{ background: 'var(--color-bg-elevated)' }}>
        <div className="container">
          <div className="section__header">
            <span className="section__eyebrow">¿Por qué elegirnos?</span>
            <h2 className="section__title">La experiencia completa</h2>
            <p className="section__subtitle">
              No es solo un corte. Es un momento para ti.
            </p>
          </div>

          <div className="features">
            {features.map((feature) => (
              <div key={feature.title} className="feature">
                <div className="feature__icon">{feature.icon}</div>
                <h3 className="feature__title">{feature.title}</h3>
                <p className="feature__description">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ CTA ============ */}
      <section className="section">
        <div className="container">
          <div className="cta">
            <div className="cta__inner">
              <h2 className="cta__title">¿Listo para tu próximo corte?</h2>
              <p className="cta__description">
                Crea tu cuenta gratis y reserva en menos de 1 minuto.
                También puedes visitarnos directamente — te esperamos.
              </p>
              <div className="hero__actions" style={{ justifyContent: 'center' }}>
                <Link
                  to={isAuthenticated ? '/cliente' : '/register'}
                  className="btn btn-primary btn-lg"
                >
                  {isAuthenticated ? 'Ir a mi cuenta' : 'Crear cuenta gratis'}
                </Link>
                {!isAuthenticated && (
                  <Link to="/login" className="btn btn-ghost btn-lg">
                    Ya tengo cuenta
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
