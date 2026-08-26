import { useState, useEffect } from 'react';
import { useAsyncAction } from '../../hooks/useAsyncAction';
import { useFirestoreSubscription } from '../../hooks/useFirestoreSubscription';
import { rescheduleAppointment, subscribeToDateAppointments } from '../../services/appointments.service';
import { getAvailabilityByDate } from '../../services/availability.service';
import Calendar from '../ui/Calendar';
import TimeSlots from '../ui/TimeSlots';
import Modal from '../ui/Modal';
import Loader from '../ui/Loader';
import Alert from '../ui/Alert';
import { toDateId, formatDate } from '../../utils/helpers';

/**
 * RescheduleModal - Allows admin to move an appointment to a new date/time.
 * Revalidates availability before saving (server enforces too).
 */
const RescheduleModal = ({ isOpen, onClose, appointment }) => {
  const [newDate, setNewDate] = useState(null);
  const [newTime, setNewTime] = useState(null);
  const [newAvailability, setNewAvailability] = useState(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setNewDate(null);
      setNewTime(null);
      setNewAvailability(null);
    }
  }, [isOpen, appointment]);

  // Subscribe to appointments on the new date to compute occupied slots
  const { data: newDateAppointments } = useFirestoreSubscription(
    (cb, err) => newDate
      ? subscribeToDateAppointments(newDate, cb, err)
      : (() => { cb([]); return () => {}; })(),
    [newDate ? toDateId(newDate) : null]
  );

  // Get availability doc for the new date
  useEffect(() => {
    if (!newDate) {
      setNewAvailability(null);
      return;
    }
    let active = true;
    getAvailabilityByDate(newDate).then((av) => {
      if (active) setNewAvailability(av);
    });
    return () => { active = false; };
  }, [newDate]);

  const occupiedSlots = (() => {
    if (!newDateAppointments) return new Set();
    return new Set(
      newDateAppointments
        .filter((a) =>
          ['pendiente', 'aceptada'].includes(a.status) &&
          a.id !== appointment?.id
        )
        .map((a) => a.time)
    );
  })();

  const { run: handleReschedule, loading, errorMessage } = useAsyncAction(
    async () => {
      await rescheduleAppointment({
        appointmentId: appointment.id,
        newDate,
        newTime
      });
      onClose();
    }
  );

  if (!appointment) return null;

  const slots = (newAvailability && !newAvailability.blocked)
    ? (newAvailability.timeSlots || [])
    : [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Reprogramar cita"
    >
      {errorMessage && (
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <Alert type="error">{errorMessage}</Alert>
        </div>
      )}

      <div className="booking-summary" style={{ marginBottom: 'var(--space-5)' }}>
        <div className="booking-summary__row">
          <span>Cliente</span>
          <strong>{appointment.clientName}</strong>
        </div>
        <div className="booking-summary__row">
          <span>Servicio</span>
          <strong>{appointment.serviceName}</strong>
        </div>
        <div className="booking-summary__row">
          <span>Fecha actual</span>
          <strong>{formatDate(appointment.date)} — {appointment.time}</strong>
        </div>
      </div>

      <div className="field">
        <label>Nueva fecha</label>
        <Calendar value={newDate} onChange={setNewDate} minDate={new Date()} />
      </div>

      {newDate && (
        <div className="field">
          <label>Nueva hora</label>
          {newAvailability?.blocked ? (
            <Alert type="warning">Este día está bloqueado.</Alert>
          ) : slots.length === 0 ? (
            <Alert type="info">No hay horarios configurados para este día.</Alert>
          ) : (
            <TimeSlots
              slots={slots}
              value={newTime}
              onChange={setNewTime}
              occupiedSlots={occupiedSlots}
            />
          )}
        </div>
      )}

      <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end', marginTop: 'var(--space-4)' }}>
        <button onClick={onClose} className="btn btn-secondary" disabled={loading}>
          Cancelar
        </button>
        <button
          onClick={handleReschedule}
          className="btn btn-primary"
          disabled={loading || !newDate || !newTime}
        >
          {loading ? <Loader size="sm" /> : 'Reprogramar'}
        </button>
      </div>
    </Modal>
  );
};

export default RescheduleModal;
