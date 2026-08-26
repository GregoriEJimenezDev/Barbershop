import { useState, useEffect } from 'react';
import { useAsyncAction } from '../../hooks/useAsyncAction';
import { setAvailability, blockDay, unblockDay } from '../../services/availability.service';
import Calendar from '../ui/Calendar';
import Modal from '../ui/Modal';
import Loader from '../ui/Loader';
import Alert from '../ui/Alert';
import { toDateId, formatDate } from '../../utils/helpers';

/**
 * AvailabilityManager - Configure slots and capacity for a specific date.
 * Used by AdminDashboard.
 */
const AvailabilityManager = ({ isOpen, onClose, initialDate = null, existingAvailability = null }) => {
  const [date, setDate] = useState(initialDate || new Date());
  const [maxAppointments, setMaxAppointments] = useState(8);
  const [timeSlotsText, setTimeSlotsText] = useState('09:00, 10:00, 11:00, 14:00, 15:00, 16:00');
  const [isBlocked, setIsBlocked] = useState(false);

  useEffect(() => {
    if (existingAvailability) {
      setMaxAppointments(existingAvailability.maxAppointments || 8);
      setTimeSlotsText((existingAvailability.timeSlots || []).join(', '));
      setIsBlocked(Boolean(existingAvailability.blocked));
    } else if (initialDate) {
      setMaxAppointments(8);
      setTimeSlotsText('09:00, 10:00, 11:00, 14:00, 15:00, 16:00');
      setIsBlocked(false);
    }
  }, [existingAvailability, initialDate, isOpen]);

  const { run: handleSave, loading, errorMessage } = useAsyncAction(
    async () => {
      const slots = timeSlotsText
        .split(',')
        .map((s) => s.trim())
        .filter((s) => /^\d{2}:\d{2}$/.test(s));

      if (!isBlocked && slots.length === 0) {
        throw new Error('Agrega al menos un horario o marca el día como bloqueado.');
      }

      await setAvailability(date, {
        maxAppointments: isBlocked ? 0 : Number(maxAppointments),
        timeSlots: isBlocked ? [] : slots,
        blocked: isBlocked
      });
      onClose();
    }
  );

  const { run: handleBlock, loading: blocking } = useAsyncAction(
    async () => {
      await blockDay(date);
      onClose();
    }
  );

  const { run: handleUnblock, loading: unblocking } = useAsyncAction(
    async () => {
      await unblockDay(date);
      onClose();
    }
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Configurar disponibilidad — ${formatDate(date, { weekday: 'short', day: 'numeric', month: 'short' })}`}
    >
      {errorMessage && (
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <Alert type="error">{errorMessage}</Alert>
        </div>
      )}

      <div className="field">
        <label>Fecha</label>
        <Calendar value={date} onChange={setDate} minDate={new Date()} />
      </div>

      <div className="field">
        <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <input
            type="checkbox"
            checked={isBlocked}
            onChange={(e) => setIsBlocked(e.target.checked)}
            style={{ accentColor: 'var(--color-primary)' }}
          />
          Bloquear este día (feriado / ausencia)
        </label>
      </div>

      {!isBlocked && (
        <>
          <div className="field">
            <label htmlFor="maxAppointments">Máximo de citas por día *</label>
            <input
              id="maxAppointments"
              type="number"
              min="0"
              max="100"
              className="input"
              value={maxAppointments}
              onChange={(e) => setMaxAppointments(e.target.value)}
            />
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 'var(--space-1)' }}>
              Cuando se alcance este número, el día se mostrará como "sin cupos".
            </p>
          </div>
          <div className="field">
            <label htmlFor="timeSlots">Horarios disponibles *</label>
            <input
              id="timeSlots"
              className="input"
              value={timeSlotsText}
              onChange={(e) => setTimeSlotsText(e.target.value)}
              placeholder="09:00, 10:00, 11:00"
            />
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 'var(--space-1)' }}>
              Separa los horarios con comas. Formato 24h (HH:mm).
            </p>
          </div>
        </>
      )}

      <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          {existingAvailability?.blocked ? (
            <button
              type="button"
              onClick={handleUnblock}
              className="btn btn-secondary"
              disabled={unblocking}
            >
              {unblocking ? <Loader size="sm" /> : 'Desbloquear día'}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleBlock}
              className="btn btn-ghost"
              style={{ color: 'var(--color-danger)' }}
              disabled={blocking}
            >
              {blocking ? <Loader size="sm" /> : 'Bloquear día'}
            </button>
          )}
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? <Loader size="sm" /> : 'Guardar'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default AvailabilityManager;
