import { FC, ReactNode } from 'react';

/**
 * PriceBoard - Render a board of service prices.
 *
 * Props:
 * - services: Service[] — list of services to display
 * - editable?: boolean — whether services can be edited/deleted
 * - onEdit?: (service: Service) => void — called when editing a service
 * - onDelete?: (serviceId: string) => void — called when deleting a service
 */
interface PriceBoardProps {
  services: { id: string; name: string; description: string | null; price: number; durationMinutes: number }[];
  editable?: boolean;
  onEdit?: (service: { id: string; name: string; description: string | null; price: number; durationMinutes: number }) => void;
  onDelete?: (serviceId: string) => void;
}

const PriceBoard: FC<PriceBoardProps> = ({
  services,
  editable = false,
  onEdit,
  onDelete
}) => {
  return (
    <div className="price-board">
      {services.length === 0 && (
        <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
          <div className="empty-state__icon">💈</div>
          <p className="empty-state__title">Próximamente</p>
          <p>Estamos preparando nuestra cartelera de servicios.</p>
        </div>
      )}
      {services.map((service) => (
        <div key={service.id} className="price-card">
          <h3 className="price-card__name">{service.name}</h3>
          {service.description && (
            <p className="price-card__description">{service.description}</p>
          )}
          <div className="price-card__footer">
            <span className="price-card__price">
              RD$ {service.price.toLocaleString()}
            </span>
            <span className="price-card__duration">
              {service.durationMinutes} min
            </span>
          </div>
        </div>
      ))}

      {editable && services.length > 0 && (
        <div className="text-center" style={{ marginTop: 'var(--space-8)' }}>
          <button
            onClick={() => {}}
            className="btn btn-primary"
            style={{ display: 'none' }}
          >
            Agregar servicio
          </button>
        </div>
      )}
    </div>
  );
};

export default PriceBoard;
export type { PriceBoardProps };