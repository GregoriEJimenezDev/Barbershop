import { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAsyncAction } from '../hooks/useAsyncAction';
import { useFirestoreSubscription } from '../hooks/useFirestoreSubscription';
import { subscribeToClientAppointments, cancelAppointment } from '../services/appointments.service';
import { subscribeToServices } from '../services/services.service';
import AppointmentCard from '../components/ui/AppointmentCard';
import BookingForm from '../components/client/BookingForm';
import PriceBoard from '../components/ui/PriceBoard';
import Loader from '../components/ui/Loader';
import Alert from '../components/ui/Alert';
import Modal from '../components/ui/Modal';
import { APPOINTMENT_STATUS } from '../utils/constants';

const TABS = [
  { id: 'book', label: 'Reservar' },
  { id: 'upcoming', label: 'Próximas' },
  { id: 'history', label: 'Historial' }
];

const ClientDashboard = () => {
  const { user, profile } = useAuth();
  const [tab, setTab] = useState('book');
  const [confirmAction, setConfirmAction] = useState(null);

  const { data: appointments, loading } = useFirestoreSubscription(
    (cb, err) => user ? subscribeToClientAppointments(user.uid, cb, err) : (() => { cb([]); return () => {}; })(),
    [user?.uid]
  );

  const { data: services } = useFirestoreSubscription(
    (cb, err) => subscribeToServices(cb, err),
    []
  );

  const { run: handleCancel, loading: cancelling } = useAsyncAction(
    async (appointmentId) => {
      await cancelAppointment(appointmentId);
      setConfirmAction(null);
    }
  );

  const upcoming = useMemo(() => {
    if (!appointments) return [];
    return appointments.filter((a) =>
      ['pendiente', 'aceptada', 'reprogramada'].includes(a.status)
    );
  }, [appointments]);

  const history = useMemo(() => {
    if (!appointments) return [];
    return appointments.filter((a) =>
      ['completada', 'rechazada', 'cancelada'].includes(a.status)
    );
  }, [appointments]);

  const onAction = (actionType, appointment) => {
    if (actionType === 'cancel') {
      setConfirmAction(appointment);
    }
  };

  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <div>
            <h1 className="page-title">
              Hola, {profile?.name?.split(' ')[0] || 'cliente'} 👋
            </h1>
            <p className="page-subtitle">
              Reserva tu próxima cita o revisa tu historial
            </p>
          </div>
        </div>

        <div className="tabs" style={{ marginBottom: 'var(--space-6)' }}>
          {TABS.map((t) => (
            <button
              key={t.id}
              className={`tab ${tab === t.id ? 'active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
              {t.id === 'upcoming' && upcoming.length > 0 && (
                <span style={{
                  marginLeft: 'var(--space-2)',
                  background: 'rgba(0,0,0,0.2)',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: 'var(--text-xs)'
                }}>
                  {upcoming.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* TAB: BOOK */}
        {tab === 'book' && (
          <div className="card">
            <BookingForm onSuccess={() => setTab('upcoming')} />
          </div>
        )}

        {/* TAB: UPCOMING */}
        {tab === 'upcoming' && (
          <div>
            <h2 style={{ marginBottom: 'var(--space-4)' }}>Tus próximas citas</h2>
            {loading ? (
              <Loader text="Cargando..." />
            ) : upcoming.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state__icon">📅</div>
                <p className="empty-state__title">No tienes citas próximas</p>
                <p>Ve a la pestaña "Reservar" para agendar una.</p>
                <button
                  onClick={() => setTab('book')}
                  className="btn btn-primary"
                  style={{ marginTop: 'var(--space-4)' }}
                >
                  Reservar ahora
                </button>
              </div>
            ) : (
              <div className="appointment-history">
                {upcoming.map((appt) => (
                  <AppointmentCard
                    key={appt.id}
                    appointment={appt}
                    variant="client"
                    onAction={onAction}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB: HISTORY */}
        {tab === 'history' && (
          <div>
            <h2 style={{ marginBottom: 'var(--space-4)' }}>Historial</h2>
            {loading ? (
              <Loader text="Cargando..." />
            ) : history.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state__icon">📋</div>
                <p className="empty-state__title">Sin historial aún</p>
                <p>Tus citas completadas aparecerán aquí.</p>
              </div>
            ) : (
              <div className="appointment-history">
                {history.map((appt) => (
                  <AppointmentCard
                    key={appt.id}
                    appointment={appt}
                    variant="client"
                    onAction={onAction}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Services preview */}
        {tab === 'book' && services && services.length > 0 && (
          <div style={{ marginTop: 'var(--space-12)' }}>
            <h2 style={{ marginBottom: 'var(--space-4)' }}>Nuestros servicios</h2>
            <PriceBoard services={services} />
          </div>
        )}
      </div>

      <Modal
        isOpen={!!confirmAction}
        onClose={() => !cancelling && setConfirmAction(null)}
        title="¿Cancelar cita?"
        footer={
          <>
            <button
              className="btn btn-secondary"
              onClick={() => setConfirmAction(null)}
              disabled={cancelling}
            >
              No, mantener
            </button>
            <button
              className="btn btn-danger"
              onClick={() => handleCancel(confirmAction.id)}
              disabled={cancelling}
            >
              {cancelling ? <Loader size="sm" /> : 'Sí, cancelar'}
            </button>
          </>
        }
      >
        <p>¿Estás seguro que deseas cancelar la cita de <strong>{confirmAction?.serviceName}</strong>?</p>
        <p style={{ marginTop: 'var(--space-3)', color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
          Esta acción no se puede deshacer.
        </p>
      </Modal>
    </div>
  );
};

export default ClientDashboard;
