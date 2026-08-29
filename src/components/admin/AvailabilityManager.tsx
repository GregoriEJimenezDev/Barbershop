import { FC, ReactNode, useState } from 'react';

/**
 * AvailabilityManager - Manager to configure availability for a date/barber.
 *
 * Props:
 * - isOpen: boolean — whether the manager is open
 * - onClose: () => void — called to close the manager
 * - initialDate: Date | null — initially selected date
 * - existingAvailability: any — existing availability data
 * - barberIdOverride: string | null — barber ID to override
 */
interface AvailabilityManagerProps {
  isOpen: boolean;
  onClose: () => void;
  initialDate?: Date | null;
  existingAvailability?: any;
  barberIdOverride?: string | null;
}

const AvailabilityManager: FC<AvailabilityManagerProps> = ({
  isOpen,
  onClose,
  initialDate,
  existingAvailability,
  barberIdOverride
}) => {
  const [formData, setFormData] = useState({
    date: initialDate || new Date(),
    blocked: false,
    timeSlots: [] as string[]
  });

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <h3 className="modal-title">Gestión de disponibilidad</h3>

        <div className="form-group">
          <label className="form-label">Fecha</label>
          <input
            type="date"
            value={formData.date}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData({ ...formData, date: e.target.value })
            }
          />
        </div>

        <div className="form-group">
          <label className="form-label">Bloquear día completo</label>
          <input
            type="checkbox"
            checked={formData.blocked}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData({ ...formData, blocked: e.target.checked })
            }
          />
        </div>

        <div className="form-group">
          <label className="form-label">Horarios disponibles</label>
          <p className="form-hint">
            Horarios en formato HH:mm separados por coma (ej. 09:00,10:00,11:00)
          </p>
          <input
            type="text"
            value={formData.timeSlots.join(', ')}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData({
                ...formData,
                timeSlots: e.target.value
                  .split(',')
                  .map((s: string) => s.trim())
                  .filter((s: string) => s.length > 0)
              })
            }
          />
        </div>

        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button type="button" className="btn btn-primary">Guardar disponibilidad</button>
        </div>
      </div>
    </div>
  );
};

export default AvailabilityManager;
export type { AvailabilityManagerProps };