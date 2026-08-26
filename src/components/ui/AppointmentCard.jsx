import StatusBadge from './StatusBadge';
import { formatDate, formatTime, formatCurrency } from '../../utils/helpers';
import { APPOINTMENT_STATUS } from '../../utils/constants';

/**
 * AppointmentCard - Reusable appointment display.
 * Used in both admin and client views.
 *
 * Props:
 * - appointment: object
 * - variant: 'admin' | 'client'
 * - onAccept, onReject, onReschedule, onComplete, onCancel
 */
const AppointmentCard = ({ appointment, variant = 'client', onAction }) => {
  const a = appointment;
  const canClientCancel =
    variant === 'client' &&
    [APPOINTMENT_STATUS.PENDIENTE, APPOINTMENT_STATUS.ACEPTADA].includes(a.status);

  return (
    <div className="appointment-card">
      <div className="appointment-card__header">
        <div>
          <h4 className="appointment-card__title">
            {a.serviceName}
            {a.isEmergency && (
              <span className="badge badge-warning" style={{ marginLeft: 'var(--space-2)' }}>
                ⚡ Emergencia
              </span>
            )}
          </h4>
          {variant === 'admin' && a.clientName && (
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginTop: 4 }}>
              {a.clientName}
            </p>
          )}
        </div>
        <StatusBadge status={a.status} />
      </div>

      <div className="appointment-card__date">
        <div className="appointment-card__date-item">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <span>{formatDate(a.date, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
        </div>
        <div className="appointment-card__date-item">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <span>{formatTime(a.time)}</span>
        </div>
      </div>

      {a.previousDate && (
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
          Antes: {formatDate(a.previousDate)} {formatTime(a.previousTime)}
        </p>
      )}

      <div className="appointment-card__footer">
        <div>
          <div className="appointment-card__price">
            {formatCurrency(a.totalPrice)}
          </div>
          {a.extraFee > 0 && (
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
              Incluye RD$50 de emergencia
            </div>
          )}
        </div>
        <div className="appointment-card__actions">
          {variant === 'admin' && a.status === APPOINTMENT_STATUS.PENDIENTE && (
            <>
              <button
                onClick={() => onAction && onAction('accept', a)}
                className="btn btn-primary btn-sm"
              >
                Aceptar
              </button>
              <button
                onClick={() => onAction && onAction('reject', a)}
                className="btn btn-secondary btn-sm"
              >
                Rechazar
              </button>
            </>
          )}
          {variant === 'admin' && a.status === APPOINTMENT_STATUS.ACEPTADA && (
            <>
              <button
                onClick={() => onAction && onAction('reschedule', a)}
                className="btn btn-secondary btn-sm"
              >
                Reprogramar
              </button>
              <button
                onClick={() => onAction && onAction('complete', a)}
                className="btn btn-primary btn-sm"
              >
                Completar
              </button>
            </>
          )}
          {canClientCancel && (
            <button
              onClick={() => onAction && onAction('cancel', a)}
              className="btn btn-secondary btn-sm"
            >
              Cancelar
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AppointmentCard;
