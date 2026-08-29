import { FC, ReactNode, useState } from 'react';

/**
 * ServiceFormModal - Modal to create or edit a service.
 *
 * Props:
 * - isOpen: boolean — whether the modal is open
 * - onClose: () => void — called to close the modal
 * - service?: Service — optional existing service to edit
 */
interface ServiceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  service?: { id: string; name: string; description: string; price: number; durationMinutes: number };
}

const ServiceFormModal: FC<ServiceFormModalProps> = ({ isOpen, onClose, service }) => {
  const [formData, setFormData] = useState({
    name: service?.name || '',
    description: service?.description || '',
    price: service?.price ?? 0,
    durationMinutes: service?.durationMinutes ?? 30
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSave = () => {
    // TODO: Implement service creation/editing
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <h3 className="modal-title">
          {service ? 'Editar servicio' : 'Nuevo servicio'}
        </h3>
        <form
          onSubmit={(e: React.FormEvent) => {
            e.preventDefault();
            handleSave();
          }}
        >
          <div className="form-group">
            <label className="form-label">Nombre del servicio</label>
            <input
              type="text"
              name="name"
              className="form-input"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Descripción</label>
            <input
              type="text"
              name="description"
              className="form-input"
              value={formData.description}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Precio (RD$)</label>
            <input
              type="number"
              name="price"
              className="form-input"
              value={formData.price}
              onChange={handleChange}
              min="0"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Duración (minutos)</label>
            <input
              type="number"
              name="durationMinutes"
              className="form-input"
              value={formData.durationMinutes}
              onChange={handleChange}
              min="1"
              required
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ServiceFormModal;
export type { ServiceFormModalProps };