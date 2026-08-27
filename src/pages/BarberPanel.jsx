import { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useFirestoreSubscription } from '../hooks/useFirestoreSubscription';
import { useAsyncAction } from '../hooks/useAsyncAction';
import {
  subscribeToBarberAppointments,
  subscribeToBarberDateAppointments,
  updateAppointmentStatus,
  subscribeToEmergencyQueue
} from '../services/appointments.service';
import { subscribeToBarber } from '../services/barbers.service';
import { subscribeToBarberAvailability } from '../services/availability.service';
import AppointmentCard from '../components/ui/AppointmentCard';
import AvailabilityManager from '../components/admin/AvailabilityManager';
import RescheduleModal from '../components/admin/RescheduleModal';
import Modal from '../components/ui/Modal';
import Loader from '../components/ui/Loader';
import Alert from '../components/ui/Alert';
import { APPOINTMENT_STATUS, EMERGENCY_FEE } from '../utils/constants';
import { formatDate, formatTime } from '../utils/helpers';

const TABS = [
  { id: 'today', label: 'Hoy' },
  { id: 'upcoming', label: 'Próximas' },
  { id: 'history', label: 'Historial' },
  { id: 'availability', label: 'Mi disponibilidad' }
];

const BarberPanel = () => {
  const { user, profile } = useAuth();
  const [tab, setTab] = useState('today');
  const today = useMemo(() => new Date(), []);
  const [availModal, setAvailModal] = useState({ open: false, date: null, data: null });
  const [rescheduleModal, setRescheduleModal] = useState({ open: false, appointment: null });
  const [confirmAction, setConfirmAction] = useState(null);
  const [toast, setToast] = useState(null);

  // My own profile (barber doc) — to know my photo/name in cards
  const { data: myBarber } = useFirestoreSubscription(
    (cb, err) => user ? subscribeToBarber(user.uid, cb, err) : (() => { cb(null); return () => {}; })(),
    [user?.uid]
  );

  const { data: todayAppointments, loading } = useFirestoreSubscription(
    (cb, err) => subscribeToBarberDateAppointments(user.uid, today, cb, err),
    [user?.uid, today.toDateString()]
  );

  const { data: allAppointments } = useFirestoreSubscription(
    (cb, err) => subscribeToBarberAppointments(user.uid, cb, err),
    [user?.uid]
  );

  const { data: myAvailability } = useFirestoreSubscription(
    (cb, err) => subscribeToBarberAvailability(user.uid, cb, err),
    [user?.uid]
  );

  const { run: handleStatusUpdate, loading: updating } = useAsyncAction(
    async ({ appointmentId, status }) => {
      await updateAppointmentStatus({ appointmentId, status });
      setConfirmAction(null);
      setToast({ type: 'success', text: 'Cita actualizada.' });
    }
  );

  const upcoming = useMemo(() => {
    if (!allAppointments) return [];
    return allAppointments.filter((a) =>
      ['pendiente', 'aceptada', 'reprogramada'].includes(a.status) &&
      new Date(a.date) >= new Date(today.toDateString())
    );
  }, [allAppointments, today]);

  const history = useMemo(() => {
    if (!allAppointments) return [];
    return allAppointments.filter((a) =>
      ['completada', 'rechazada', 'cancelada'].includes(a.status)
    );
  }, [allAppointments]);

  const stats = useMemo(() => {
    const all = todayAppointments || [];
    return {
      total: all.length,
      pending: all.filter((a) => a.status === APPOINTMENT_STATUS.PENDIENTE).length,
      accepted: all.filter((a) => a.status === APPOINTMENT_STATUS.ACEPTADA).length,
      completed: all.filter((a) => a.status === APPOINTMENT_STATUS.COMPLETADA).length
    };
  }, [todayAppointments]);

  const onAction = (actionType, appointment) => {
    if (actionType === 'reschedule') {
      setRescheduleModal({ open: true, appointment });
    } else if (actionType === 'accept') {
      handleStatusUpdate({ appointmentId: appointment.id, status: APPOINTMENT_STATUS.ACEPTADA });
    } else if (actionType === 'reject') {
      setConfirmAction({ type: 'reject', appointment });
    } else if (actionType === 'complete') {
      handleStatusUpdate({ appointmentId: appointment.id, status: APPOINTMENT_STATUS.COMPLETADA });
    }
  };

  const handleAvailDayClick = (date) => {
    const dateId = date.toISOString().split('T')[0];
    const existing = (myAvailability || []).find((a) => a.date === dateId) || null;
    setAvailModal({ open: true, date, data: existing });
  };

  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'center' }}>
            {myBarber?.photoURL && (
              <img
                src={myBarber.photoURL}
                alt={profile?.name}
                style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover' }}
              />
            )}
            <div>
              <h1 className="page-title">Hola, {profile?.name?.split(' ')[0] || 'barbero'} 💈</h1>
              <p className="page-subtitle">
                Gestiona tus citas y disponibilidad
              </p>
            </div>
          </div>
        </div>

        {toast && (
          <div style={{ marginBottom: 'var(--space-4)' }}>
            <Alert type={toast.type} onClose={() => setToast(null)}>{toast.text}</Alert>
          </div>
        )}

        <div className="dashboard-stats">
          <div className="stat-card">
            <div className="stat-card__label">Citas hoy</div>
            <div className="stat-card__value">{stats.total}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card__label">Pendientes</div>
            <div className="stat-card__value" style={{ color: 'var(--color-warning)' }}>{stats.pending}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card__label">Aceptadas</div>
            <div className="stat-card__value" style={{ color: 'var(--color-success)' }}>{stats.accepted}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card__label">Mi rating</div>
            <div className="stat-card__value" style={{ color: 'var(--color-primary)' }}>
              {myBarber?.averageRating > 0 ? `⭐ ${myBarber.averageRating.toFixed(1)}` : '—'}
            </div>
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

        {tab === 'today' && (
          <div>
            <h2 style={{ marginBottom: 'var(--space-4)' }}>
              Citas de hoy — {formatDate(today, { weekday: 'long', day: 'numeric', month: 'long' })}
            </h2>
            {loading ? (
              <Loader text="Cargando..." />
            ) : !todayAppointments || todayAppointments.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state__icon">📅</div>
                <p className="empty-state__title">Sin citas hoy</p>
                <p>Aprovecha el día libre.</p>
              </div>
            ) : (
              <div className="appointment-history">
                {todayAppointments.map((appt) => (
                  <AppointmentCard
                    key={appt.id}
                    appointment={appt}
                    variant="barber"
                    onAction={onAction}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'upcoming' && (
          <div>
            <h2 style={{ marginBottom: 'var(--space-4)' }}>Próximas citas</h2>
            {upcoming.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state__icon">📆</div>
                <p className="empty-state__title">Sin citas próximas</p>
              </div>
            ) : (
              <div className="appointment-history">
                {upcoming.map((appt) => (
                  <AppointmentCard
                    key={appt.id}
                    appointment={appt}
                    variant="barber"
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
            {history.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state__icon">📋</div>
                <p className="empty-state__title">Sin historial</p>
                <p>Tus citas completadas aparecerán aquí.</p>
              </div>
            ) : (
              <div className="appointment-history">
                {history.map((appt) => (
                  <AppointmentCard
                    key={appt.id}
                    appointment={appt}
                    variant="barber"
                    onAction={() => {}}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'availability' && (
          <div>
            <h2 style={{ marginBottom: 'var(--space-4)' }}>Configura tu disponibilidad</h2>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-4)', fontSize: 'var(--text-sm)' }}>
              Haz clic en cualquier día para definir tus horarios y cupos.
            </p>
            <div style={{ maxWidth: 500 }}>
              <BarberAvailabilityCalendar
                onDayClick={handleAvailDayClick}
                myAvailability={myAvailability || []}
              />
            </div>
          </div>
        )}
      </div>

      <AvailabilityManager
        isOpen={availModal.open}
        onClose={() => setAvailModal({ open: false, date: null, data: null })}
        initialDate={availModal.date}
        existingAvailability={availModal.data}
        barberIdOverride={user?.uid}
      />

      <RescheduleModal
        isOpen={rescheduleModal.open}
        onClose={() => setRescheduleModal({ open: false, appointment: null })}
        appointment={rescheduleModal.appointment}
      />

      <Modal
        isOpen={!!confirmAction && confirmAction.type === 'reject'}
        onClose={() => !updating && setConfirmAction(null)}
        title="¿Rechazar cita?"
        footer={
          <>
            <button
              className="btn btn-secondary"
              onClick={() => setConfirmAction(null)}
              disabled={updating}
            >
              No, mantener
            </button>
            <button
              className="btn btn-danger"
              onClick={() => handleStatusUpdate({
                appointmentId: confirmAction.appointment.id,
                status: APPOINTMENT_STATUS.RECHAZADA
              })}
              disabled={updating}
            >
              {updating ? <Loader size="sm" /> : 'Sí, rechazar'}
            </button>
          </>
        }
      >
        <p>Vas a rechazar la cita de <strong>{confirmAction?.appointment?.clientName}</strong>.</p>
      </Modal>
    </div>
  );
};

// Mini-calendar that highlights days with availability configured
const BarberAvailabilityCalendar = ({ onDayClick, myAvailability }) => {
  const [viewDate, setViewDate] = useState(new Date());

  const monthStart = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
  const monthEnd = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0);
  const startDayOfWeek = monthStart.getDay();
  const daysInMonth = monthEnd.getDate();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const monthName = monthStart.toLocaleDateString('es-DO', { month: 'long', year: 'numeric' });

  const dayCells = [];
  for (let i = 0; i < startDayOfWeek; i++) {
    dayCells.push({ key: `e-${i}`, empty: true });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(viewDate.getFullYear(), viewDate.getMonth(), d);
    const dateId = date.toISOString().split('T')[0];
    const av = myAvailability.find((a) => a.date === dateId);
    dayCells.push({
      key: dateId,
      date,
      disabled: date < today,
      hasAvailability: !!av && !av.blocked,
      blocked: !!av?.blocked,
      today: date.toDateString() === today.toDateString()
    });
  }

  return (
    <div className="calendar">
      <div className="calendar__header">
        <div className="calendar__nav">
          <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}>‹</button>
        </div>
        <div className="calendar__month">{monthName}</div>
        <div className="calendar__nav">
          <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}>›</button>
        </div>
      </div>
      <div className="calendar__weekdays">
        {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((w) => (
          <div key={w} className="calendar__weekday">{w}</div>
        ))}
      </div>
      <div className="calendar__grid">
        {dayCells.map((cell) => {
          if (cell.empty) {
            return <div key={cell.key} className="calendar__day calendar__day--empty" />;
          }
          const classes = ['calendar__day'];
          if (cell.disabled) classes.push('calendar__day--disabled');
          if (cell.blocked) classes.push('calendar__day--blocked');
          if (cell.hasAvailability) classes.push('calendar__day--today');
          return (
            <button
              key={cell.key}
              className={classes.join(' ')}
              disabled={cell.disabled}
              onClick={() => onDayClick(cell.date)}
            >
              {cell.date.getDate()}
              {cell.hasAvailability && <span className="calendar__day-dot" />}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BarberPanel;
