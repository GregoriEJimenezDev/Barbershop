import { ROLES } from '../../utils/constants';
import { formatDate } from '../../utils/helpers';

/**
 * BarberCard - Displays a barber with photo, name, specialties, rating.
 * Used in both admin (list) and client (selector) contexts.
 *
 * Props:
 * - barber: object
 * - onClick: function
 * - onEdit, onDeactivate, onReactivate (admin only)
 * - selected: boolean (when used as selector)
 * - showActions: boolean
 */
const BarberCard = ({
  barber,
  onClick,
  onEdit,
  onDeactivate,
  onReactivate,
  selected = false,
  showActions = true,
  variant = 'default'
}) => {
  const handleClick = (e) => {
    if (onClick) onClick(barber);
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    if (onEdit) onEdit(barber);
  };

  const handleDeactivate = (e) => {
    e.stopPropagation();
    if (onDeactivate) onDeactivate(barber);
  };

  const handleReactivate = (e) => {
    e.stopPropagation();
    if (onReactivate) onReactivate(barber);
  };

  const renderStars = (rating) => {
    const stars = [];
    const full = Math.floor(rating || 0);
    const half = (rating || 0) - full >= 0.5;
    for (let i = 0; i < 5; i++) {
      if (i < full) {
        stars.push(<span key={i} style={{ color: '#fbbf24' }}>★</span>);
      } else if (i === full && half) {
        stars.push(<span key={i} style={{ color: '#fbbf24' }}>★</span>);
      } else {
        stars.push(<span key={i} style={{ color: '#4a4a50' }}>★</span>);
      }
    }
    return stars;
  };

  return (
    <div
      className={`barber-card ${selected ? 'barber-card--selected' : ''} ${!barber.active ? 'barber-card--inactive' : ''}`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
    >
      <div className="barber-card__photo-wrapper">
        {barber.photoURL ? (
          <img src={barber.photoURL} alt={barber.name} className="barber-card__photo" />
        ) : (
          <div className="barber-card__photo barber-card__photo--placeholder">
            {(barber.name || '?').charAt(0).toUpperCase()}
          </div>
        )}
        {!barber.active && (
          <span className="badge badge-neutral barber-card__inactive-badge">Inactivo</span>
        )}
      </div>

      <div className="barber-card__body">
        <h3 className="barber-card__name">{barber.name}</h3>

        {barber.yearsOfExperience > 0 && (
          <p className="barber-card__experience">
            {barber.yearsOfExperience} {barber.yearsOfExperience === 1 ? 'año' : 'años'} de experiencia
          </p>
        )}

        {barber.bio && variant !== 'compact' && (
          <p className="barber-card__bio">{barber.bio}</p>
        )}

        {barber.specialties && barber.specialties.length > 0 && (
          <div className="barber-card__specialties">
            {barber.specialties.slice(0, 4).map((s) => (
              <span key={s} className="barber-card__specialty">{s}</span>
            ))}
          </div>
        )}

        {variant !== 'compact' && (
          <div className="barber-card__rating">
            <div className="barber-card__stars">
              {renderStars(barber.averageRating)}
            </div>
            <span className="barber-card__rating-text">
              {barber.averageRating > 0
                ? `${barber.averageRating.toFixed(1)} (${barber.reviewCount || 0})`
                : 'Sin reseñas'}
            </span>
          </div>
        )}
      </div>

      {showActions && (
        <div className="barber-card__actions" onClick={(e) => e.stopPropagation()}>
          {onEdit && (
            <button onClick={handleEdit} className="btn btn-secondary btn-sm">
              Editar
            </button>
          )}
          {barber.active && onDeactivate && (
            <button onClick={handleDeactivate} className="btn btn-ghost btn-sm" style={{ color: 'var(--color-warning)' }}>
              Desactivar
            </button>
          )}
          {!barber.active && onReactivate && (
            <button onClick={handleReactivate} className="btn btn-ghost btn-sm" style={{ color: 'var(--color-success)' }}>
              Reactivar
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default BarberCard;
