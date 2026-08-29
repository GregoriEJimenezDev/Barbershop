import { FC, ReactNode } from 'react';

/**
 * AppointmentCard - Card displaying appointment details.
 *
 * Props:
 * - appointment: Appointment — the appointment data
 * - variant: 'client' | 'admin' — UI variant
 * - onAction?: (actionType: 'cancel' | 'reschedule' | 'accept' | 'reject' | 'complete') => void — action handler
 * - showActions?: boolean — whether to show action buttons
 */
interface AppointmentCardProps {
  appointment: {
    id: string;
    clientName: string;
    serviceName: string;
    basePrice: number;
    extraFee: number;
    totalPrice: number;
    date: string;
    time: string;
    isEmergency: boolean;
    status: 'pendiente' | 'aceptada' | 'rechazada' | 'reprogramada' | 'completada' | 'cancelada';
    barberName?: string;
  };
  variant: 'client' | 'admin';
  onAction?: (actionType: 'cancel' | 'reschedule' | 'accept' | 'reject' | 'complete') => void;
  showActions?: boolean;
}

const AppointmentCard: FC<AppointmentCardProps> = ({
  appointment,
  variant,
  onAction,
  showActions = true
}) => {
  const isEmergency = appointment.isEmergency;
  const totalPrice = appointment.totalPrice;
  const status = appointment.status;
  const isPendingOrAccepted = status === 'pendiente' || status === 'aceptada';

  const statusClassMap: Record<'pendiente' | 'aceptada' | 'rechazada' | 'reprogramada' | 'completada' | 'cancelada', string> = {
    pendiente: 'pendiente',
    aceptada: 'aceptada',
    rechazada: 'rechazada',
    reprogramada: 'reprogramada',
    completada: 'completada',
    cancelada: 'cancelada'
  };

  const statusLabelMap: Record<'pendiente' | 'aceptada' | 'rechazada' | 'reprogramada' | 'completada' | 'cancelada', string> = {
    pendiente: 'Pendiente',
    aceptada: 'Aceptada',
    rechazada: 'Rechazada',
    reprogramada: 'Reprogramada',
    completada: 'Completada',
    cancelada: 'Cancelada'
  };

  const handleAction = (actionType: 'cancel' | 'reschedule' | 'accept' | 'reject' | 'complete') => {
    onAction?.(actionType);
  };

  return (
    <div className="appointment-card">
      <div className="appointment-card__header">
        <span className="appointment-card__barber">
          {appointment.barberName || 'Barbero asignado'}
        </span>
        <span className="appointment-card__status status-{statusClassMap[status]}">
          {statusLabelMap[status]}
        </span>
      </div>

      <div className="appointment-card__details">
        <div className="appointment-card__client">
          {appointment.clientName}
        </div>
        <div className="appointment-card__service">
          {appointment.serviceName}
        </div>
      </div>

      <div className="appointment-card__price">
        <span className="appointment-card__price-amount">
          RD$ {totalPrice.toLocaleString()}
        </span>
        {isEmergency && (
          <span className="appointment-card__emergency-badge">
            ⚡ Emergencia
          </span>
        )}
      </div>

      {showActions && onAction && isPendingOrAccepted && (
        <div className="appointment-card__actions">
          {variant === 'admin' && (
            <div className="appointment-card__actions-group">
              <button
                onClick={() => handleAction('accept')}
                title="Aceptar cita"
                disabled={status !== 'pendiente'}
                className="btn btn-sm btn-ghost"
              >
                Aceptar
              </button>
              <button
                onClick={() => handleAction('reject')}
                title="Rechazar cita"
                disabled={status !== 'pendiente'}
                className="btn btn-sm btn-ghost"
              >
                Rechazar
              </button>
              <button
                onClick={() => handleAction('complete')}
                title="Marcar como completada"
                disabled={status !== 'pendiente' && status !== 'aceptada'}
                className="btn btn-sm btn-ghost"
              >
                Completar
              </button>
            </div>
          )}
          {variant === 'client' && (
            <div className="appointment-card__actions-group">
              <button
                onClick={() => handleAction('cancel')}
                title="Cancelar cita"
                disabled={status !== 'pendiente' && status !== 'aceptada'}
                className="btn btn-sm btn-ghost"
              >
                Cancelar
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AppointmentCard;