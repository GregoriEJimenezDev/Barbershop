import { formatCurrency } from '../../utils/helpers';

/**
 * PriceBoard - Public/admin services listing.
 *
 * Props:
 * - services: array
 * - editable: boolean
 * - onEdit, onDelete
 * - onSelect (for booking)
 * - selectedId
 */
const PriceBoard = ({
  services = [],
  editable = false,
  onEdit,
  onDelete,
  onSelect,
  selectedId
}) => {
  if (services.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state__icon">💈</div>
        <p className="empty-state__title">No hay servicios</p>
        <p>
          {editable
            ? 'Crea tu primer servicio para empezar.'
            : 'Pronto verás aquí nuestros servicios.'}
        </p>
      </div>
    );
  }

  return (
    <div className="price-board">
      {services.map((service) => {
        const isSelected = selectedId === service.id;
        return (
          <div
            key={service.id}
            className="price-card"
            style={
              isSelected
                ? {
                    borderColor: 'var(--color-primary)',
                    boxShadow: 'var(--shadow-glow)'
                  }
                : undefined
            }
          >
            <h3 className="price-card__name">{service.name}</h3>
            {service.description && (
              <p className="price-card__description">{service.description}</p>
            )}
            <div className="price-card__footer">
              <span className="price-card__price">
                {formatCurrency(service.price)}
              </span>
              <span className="price-card__duration">
                ⏱ {service.durationMinutes} min
              </span>
            </div>

            {editable && (
              <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-4)' }}>
                <button
                  onClick={() => onEdit && onEdit(service)}
                  className="btn btn-secondary btn-sm"
                  style={{ flex: 1 }}
                >
                  Editar
                </button>
                <button
                  onClick={() => onDelete && onDelete(service)}
                  className="btn btn-ghost btn-sm"
                  style={{ color: 'var(--color-danger)' }}
                >
                  Eliminar
                </button>
              </div>
            )}

            {onSelect && !editable && (
              <button
                onClick={() => onSelect(service)}
                className={isSelected ? 'btn btn-primary btn-block' : 'btn btn-outline btn-block'}
                style={{ marginTop: 'var(--space-4)' }}
              >
                {isSelected ? '✓ Seleccionado' : 'Elegir'}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default PriceBoard;
