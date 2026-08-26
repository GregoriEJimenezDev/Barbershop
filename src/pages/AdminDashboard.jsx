import { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useFirestoreSubscription } from '../hooks/useFirestoreSubscription';
import { useAsyncAction } from '../hooks/useAsyncAction';
import {
  subscribeToDateAppointments,
  subscribeToEmergencyQueue,
  updateAppointmentStatus
} from '../services/appointments.service';
import {
  subscribeToServices,
  deleteService
} from '../services/services.service';
import { subscribeToAllAvailability } from '../services/availability.service';
import AppointmentCard from '../components/ui/AppointmentCard';
import PriceBoard from '../components/ui/PriceBoard';
import ServiceFormModal from '../components/admin/ServiceFormModal';
import AvailabilityManager from '../components/admin/AvailabilityManager';
import RescheduleModal from '../components/admin/RescheduleModal';
import Modal from '../components/ui/Modal';
import Loader from '../components/ui/Loader';
import Alert from '../components/ui/Alert';
import { toDateId, formatDate } from '../utils/helpers';
import { APPOINTMENT_STATUS, EMERGENCY_FEE } from '../utils/constants';

const TABS = [
  { id: 'today', label: 'Hoy' },
  { id: 'emergency', label: 'Emergencias' },
  { id: 'services', label: 'Servicios' },
  { id: 'availability', label: 'Disponibilidad' }
];

const AdminDashboard = () => {
  const { profile } = useAuth();
  const [tab, setTab] = useState('today');
  const today = useMemo(() => new Date(), []);
  const [serviceModal, setServiceModal] = useState({ open: false, service: null });
  const [availModal, setAvailModal] = useState({ open: false, date: null, data: null });
  const [rescheduleModal, setRescheduleModal] = useState({ open: false, appointment: null });
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [toast, setToast] = useState(null);

  // Today's appointments
  const { data: todayAppointments, loading: loadingToday } = useFirestoreSubscription(
    (cb, err) => subscribeToDateAppointments(today, cb, err),
    [toDateId(today)]
  );

  // Emergency queue
  const { data: emergencyQueue } = useFirestoreSubscription(
    (cb, err) => subscribeToEmergencyQueue(cb, err),
    []
  );

  // Services
  const { data: services, loading: loadingServices } = useFirestoreSubscription(
    (cb, err) => subscribeToServices(cb, err),
    []
  );

  // All availability (for the calendar view)
  const { data: allAvailability } = useFirestoreSubscription(
    (cb, err) => subscribeToAllAvailability(cb, err),
    []
  );

  // Build maps for the calendar
  const blockedDatesSet = useMemo(() => {
    const s = new Set();
    (allAvailability || []).forEach((a) => { if (a.blocked) s.add(a.id); });
    return s;
  }, [allAvailability]);

  const maxAppointmentsMap = useMemo(() => {
    const m = new Map();
    (allAvailability || []).forEach((a) => m.set(a.id, a.maxAppointments || 0));
    return m;
  }, [allAvailability]);

  // Stats
  const stats = useMemo(() => {
    const all = todayAppointments || [];
    return {
      total: all.length,
      pending: all.filter((a) => a.status === APPOINTMENT_STATUS.PENDIENTE).length,
      accepted: all.filter((a) => a.status === APPOINTMENT_STATUS.ACEPTADA).length,
      completed: all.filter((a) => a.status === APPOINTMENT_STATUS.COMPLETADA).length
    };
  }, [todayAppointments]);

  // Status update
  const { run: handleStatusUpdate, loading: updating } = useAsyncAction(
    async ({ appointmentId, status }) => {
      await updateAppointmentStatus({ appointmentId, status });
      setConfirmAction(null);
      setToast({ type: 'success', text: 'Cita actualizada.' });
    }
  );

  // Delete service
  const { run: handleDeleteService, loading: deleting } = useAsyncAction(
    async (serviceId) => {
      await deleteService(serviceId);
      setConfirmDelete(null);
      setToast({ type: 'success', text: 'Servicio eliminado.' });
    }
  );

  const onAction = (actionType, appointment) => {
    if (actionType === 'reschedule') {
      setRescheduleModal({ open: true, appointment });
    } else if (actionType === 'accept') {
      handleStatusUpdate({ appointmentId: appointment.id, status: APPOINTMENT_STATUS.ACEPTADA });
    } else if (actionType === 'reject') {
      setConfirmAction({ type: 'reject', appointment });
    } else if (actionType === 'complete') {
      handleStatusUpdate({ appointmentId: appointment.id, status: APPOINTMENT_STATUS.COMPLETADA });
    } else if (actionType === 'cancel') {
      setConfirmAction({ type: 'cancel', appointment });
    }
  };

  const onAvailDayClick = (date) => {
    const dateId = toDateId(date);
    const existing = (allAvailability || []).find((a) => a.id === dateId) || null;
    setAvailModal({ open: true, date, data: existing });
  };

  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <div>
            <h1 className="page-title">Panel de administración</h1>
            <p className="page-subtitle">
              Bienvenido, {profile?.name}
            </p>
          </div>
        </div>

        {toast && (
          <div style={{ marginBottom: 'var(--space-4)' }}>
            <Alert type={toast.type} onClose={() => setToast(null)}>
              {toast.text}
            </Alert>
          </div>
        )}

        {/* STATS */}
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
            <div className="stat-card__label">Completadas</div>
            <div className="stat-card__value" style={{ color: 'var(--color-text-secondary)' }}>{stats.completed}</div>
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
              {t.id === 'emergency' && emergencyQueue && emergencyQueue.length > 0 && (
                <span style={{
                  marginLeft: 'var(--space-2)',
                  background: 'var(--color-warning)',
                  color: 'var(--color-text-inverse)',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: 'var(--text-xs)'
                }}>
                  {emergencyQueue.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* TAB: TODAY */}
        {tab === 'today' && (
          <div>
            <h2 style={{ marginBottom: 'var(--space-4)' }}>
              Citas de hoy — {formatDate(today, { weekday: 'long', day: 'numeric', month: 'long' })}
            </h2>
            {loadingToday ? (
              <Loader text="Cargando..." />
            ) : !todayAppointments || todayAppointments.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state__icon">📅</div>
                <p className="empty-state__title">Sin citas para hoy</p>
                <p>Las reservas del día aparecerán aquí.</p>
              </div>
            ) : (
              <div className="appointments-list">
                {todayAppointments.map((appt) => (
                  <div key={appt.id} className="appointment-row">
                    <div className="appointment-row__main">
                      <div className="appointment-row__time">
                        <span className="appointment-row__time-hour">{appt.time}</span>
                        {appt.isEmergency && (
                          <span className="appointment-row__time-emergency">⚡</span>
                        )}
                      </div>
                      <div className="appointment-row__info">
                        <h4>
                          {appt.serviceName}
                          {appt.isEmergency && (
                            <span className="badge badge-warning" style={{ marginLeft: 'var(--space-2)' }}>
                              +RD${EMERGENCY_FEE}
                            </span>
                          )}
                        </h4>
                        <p>{appt.clientName} · {appt.clientId.slice(0, 6)}...</p>
                      </div>
                    </div>
                    <div className="appointment-row__price">
                      RD${appt.totalPrice}
                    </div>
                    <div className="appointment-row__actions">
                      <AppointmentCard
                        appointment={appt}
                        variant="admin"
                        onAction={onAction}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB: EMERGENCY */}
        {tab === 'emergency' && (
          <div>
            <h2 style={{ marginBottom: 'var(--space-4)' }}>
              Cola de emergencias
            </h2>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-4)', fontSize: 'var(--text-sm)' }}>
              Citas con recargo de RD${EMERGENCY_FEE}. Requiere tu aprobación explícita.
            </p>
            {!emergencyQueue || emergencyQueue.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state__icon">⚡</div>
                <p className="empty-state__title">Sin emergencias pendientes</p>
                <p>Las solicitudes urgentes aparecerán aquí.</p>
              </div>
            ) : (
              <div className="appointment-history">
                {emergencyQueue.map((appt) => (
                  <AppointmentCard
                    key={appt.id}
                    appointment={appt}
                    variant="admin"
                    onAction={onAction}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB: SERVICES */}
        {tab === 'services' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
              <h2 style={{ margin: 0 }}>Cartelera de precios</h2>
              <button
                onClick={() => setServiceModal({ open: true, service: null })}
                className="btn btn-primary"
              >
                + Nuevo servicio
              </button>
            </div>
            {loadingServices ? (
              <Loader text="Cargando servicios..." />
            ) : (
              <PriceBoard
                services={services || []}
                editable
                onEdit={(s) => setServiceModal({ open: true, service: s })}
                onDelete={(s) => setConfirmDelete(s)}
              />
            )}
          </div>
        )}

        {/* TAB: AVAILABILITY */}
        {tab === 'availability' && (
          <div>
            <h2 style={{ marginBottom: 'var(--space-4)' }}>Calendario de disponibilidad</h2>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-4)', fontSize: 'var(--text-sm)' }}>
              Haz clic en cualquier día para configurar su disponibilidad o bloquearlo.
            </p>
            <div style={{ maxWidth: 500 }}>
              <Calendar
                value={null}
                onChange={onAvailDayClick}
                blockedDates={blockedDatesSet}
              />
            </div>
          </div>
        )}
      </div>

      {/* MODALS */}
      <ServiceFormModal
        isOpen={serviceModal.open}
        onClose={() => setServiceModal({ open: false, service: null })}
        service={serviceModal.service}
      />

      <AvailabilityManager
        isOpen={availModal.open}
        onClose={() => setAvailModal({ open: false, date: null, data: null })}
        initialDate={availModal.date}
        existingAvailability={availModal.data}
      />

      <RescheduleModal
        isOpen={rescheduleModal.open}
        onClose={() => setRescheduleModal({ open: false, appointment: null })}
        appointment={rescheduleModal.appointment}
      />

      {/* CONFIRM DELETE SERVICE */}
      <Modal
        isOpen={!!confirmDelete}
        onClose={() => !deleting && setConfirmDelete(null)}
        title="¿Eliminar servicio?"
        footer={
          <>
            <button
              className="btn btn-secondary"
              onClick={() => setConfirmDelete(null)}
              disabled={deleting}
            >
              Cancelar
            </button>
            <button
              className="btn btn-danger"
              onClick={() => handleDeleteService(confirmDelete.id)}
              disabled={deleting}
            >
              {deleting ? <Loader size="sm" /> : 'Eliminar'}
            </button>
          </>
        }
      >
        <p>Vas a eliminar <strong>{confirmDelete?.name}</strong>.</p>
        <p style={{ marginTop: 'var(--space-3)', color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
          Las citas existentes que usan este servicio no se verán afectadas.
        </p>
      </Modal>

      {/* CONFIRM REJECT APPOINTMENT */}
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
        <p style={{ marginTop: 'var(--space-3)', color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
          El cliente será notificado.
        </p>
      </Modal>
    </div>
  );
};

export default AdminDashboard;
