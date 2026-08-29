import { FC, ReactNode, useState } from 'react';

/**
 * RescheduleModal - Modal to reschedule an appointment.
 *
 * Props:
 * - isOpen: boolean — whether the modal is open
 * - onClose: () => void — called to close the modal
 * - appointment: Appointment — the appointment to reschedule
 */
interface RescheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: {
    id: string;
    clientName: string;
    serviceName: string;
    date: string;
    time: string;
    isEmergency: boolean;
  };
}

const RescheduleModal: FC<RescheduleModalProps> = ({
  isOpen,
  onClose,
  appointment
}) => {
  const [newDate, setNewDate] = useState(appointment.date);
  const [newTime, setNewTime] = useState(appointment.time);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <h3 className="modal-title">Reprogramar cita</h3>

        <div className="form-group">
          <label className="form-label">Nueva fecha</label>
          <input
            type="date"
            value={newDate}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewDate(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Nueva hora</label>
          <input
            type="time"
            value={newTime}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTime(e.target.value)}
          />
        </div>

        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button type="button" className="btn btn-primary">Reprogramar</button>
        </div>
      </div>
    </div>
  );
};

export default RescheduleModal;
export type { RescheduleModalProps };