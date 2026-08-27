import { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAsyncAction } from '../hooks/useAsyncAction';
import { useFirestoreSubscription } from '../hooks/useFirestoreSubscription';
import { subscribeToClientAppointments, cancelAppointment } from '../services/appointments.service';
import { subscribeToServices } from '../services/services.service';
import { subscribeToBarbers } from '../services/barbers.service';
import AppointmentCard from '../components/ui/AppointmentCard';
import BarberCard from '../components/ui/BarberCard';
import BookingForm from '../components/client/BookingForm';
import ReviewModal from '../components/client/ReviewModal';
import PriceBoard from '../components/ui/PriceBoard';
import Loader from '../components/ui/Loader';
import Alert from '../components/ui/Alert';
import Modal from '../components/ui/Modal';

const TABS = [
  { id: 'book', label: 'Reservar' },
  { id: 'upcoming', label: 'Próximas' },
  { id: 'history', label: 'Historial' },
  { id: 'barbers', label: 'Barberos' }
];

const ClientDashboard = () => {
  const { user, profile } = useAuth();
  const [tab, setTab] = useState('book');
  const [confirmAction, setConfirmAction] = useState(null);
  const [reviewAppointment, setReviewAppointment] = useState(null);
  const [profileBarber, setProfileBarber] = useState(null);

  const { data: appointments, loading } = useFirestoreSubscription(
    (cb, err) => user ? subscribeToClientAppointments(user.uid, cb, err) : (() => { cb([]); return () => {}; })(),
    [user?.uid]
  );

  const { data: services } = useFirestoreSubscription(
    (cb, err) => subscribeToServices(cb, err),
    []
  );

  const { data: barbers } = useFirestoreSubscription(
    (cb, err) => subscribeToBarbers(cb, err),
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
    } else if (actionType === 'review') {
      setReviewAppointment(appointment);
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

        {tab === 'book' && (
          <div className="card">
            <BookingForm onSuccess={() => setTab('upcoming')} />
          </div>
        )}

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

        {tab === 'barbers' && (
          <div>
            <h2 style={{ marginBottom: 'var(--space-4)' }}>Conoce a nuestros barberos</h2>
            {!barbers || barbers.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state__icon">💈</div>
                <p className="empty-state__title">Aún no hay barberos</p>
                <p>Pronto agregaremos más profesionales.</p>
              </div>
            ) : (
              <div className="barbers-grid">
                {barbers.map((barber) => (
                  <BarberCard
                    key={barber.id}
                    barber={barber}
                    onClick={(b) => setProfileBarber(b)}
                    showActions={false}
                  />
                ))}
              </div>
            )}

            {services && services.length > 0 && (
              <div style={{ marginTop: 'var(--space-12)' }}>
                <h2 style={{ marginBottom: 'var(--space-4)' }}>Nuestros servicios</h2>
                <PriceBoard services={services} />
              </div>
            )}
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

      <ReviewModal
        isOpen={!!reviewAppointment}
        onClose={() => setReviewAppointment(null)}
        appointment={reviewAppointment}
        onSuccess={() => {
          setReviewAppointment(null);
          setTab('history');
        }}
      />

      <Modal
        isOpen={!!profileBarber}
        onClose={() => setProfileBarber(null)}
        title={profileBarber?.name}
      >
        {profileBarber && (
          <div style={{ textAlign: 'center' }}>
            {profileBarber.photoURL ? (
              <img
                src={profileBarber.photoURL}
                alt={profileBarber.name}
                style={{ width: 120, height: 120, borderRadius: '50%', objectFit: 'cover', margin: '0 auto var(--space-4)' }}
              />
            ) : (
              <div style={{ width: 120, height: 120, borderRadius: '50%', background: 'var(--color-primary-soft)', color: 'var(--color-primary)', display: 'grid', placeItems: 'center', fontSize: '3rem', margin: '0 auto var(--space-4)', fontFamily: 'var(--font-display)' }}>
                {profileBarber.name?.charAt(0).toUpperCase()}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-1)', fontSize: '1.25rem', marginBottom: 'var(--space-2)' }}>
              {[1, 2, 3, 4, 5].map((s) => (
                <span key={s} style={{ color: s <= Math.round(profileBarber.averageRating || 0) ? '#fbbf24' : '#4a4a50' }}>★</span>
              ))}
            </div>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-4)' }}>
              {profileBarber.averageRating > 0
                ? `${profileBarber.averageRating.toFixed(1)} • ${profileBarber.reviewCount || 0} reseñas`
                : 'Sin reseñas aún'}
            </p>

            {profileBarber.yearsOfExperience > 0 && (
              <p style={{ marginBottom: 'var(--space-3)' }}>
                <strong>{profileBarber.yearsOfExperience}</strong> {profileBarber.yearsOfExperience === 1 ? 'año' : 'años'} de experiencia
              </p>
            )}

            {profileBarber.bio && (
              <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)', lineHeight: 'var(--leading-relaxed)' }}>
                {profileBarber.bio}
              </p>
            )}

            {profileBarber.specialties && profileBarber.specialties.length > 0 && (
              <div style={{ marginBottom: 'var(--space-4)' }}>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-2)' }}>
                  Especialidades:
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', justifyContent: 'center' }}>
                  {profileBarber.specialties.map((s) => (
                    <span key={s} className="badge badge-gold">{s}</span>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => {
                setProfileBarber(null);
                setTab('book');
              }}
              className="btn btn-primary btn-block"
            >
              Reservar con {profileBarber.name.split(' ')[0]}
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ClientDashboard;
