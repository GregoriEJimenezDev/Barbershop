import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useFirestoreSubscription } from '../hooks/useFirestoreSubscription';
import { useAsyncAction } from '../hooks/useAsyncAction';
import {
  subscribeToDateAppointments,
  subscribeToEmergencyQueue,
  updateAppointmentStatus
} from '../services/appointments.service';
import { subscribeToServices, deleteService } from '../services/services.service';
import { subscribeToAllAvailability } from '../services/availability.service';
import AppointmentCard from '../components/ui/AppointmentCard';
import PriceBoard from '../components/ui/PriceBoard';
import ServiceFormModal from '../components/admin/ServiceFormModal';
import AvailabilityManager from '../components/admin/AvailabilityManager';
import RescheduleModal from '../components/admin/RescheduleModal';
import { Link } from 'react-router-dom';
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

interface EmergencyQueueItem {
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
}

interface AdminProfile {
  name: string | null;
}

const AdminDashboard = () => {
  const { profile } = useAuth();
  const [tab, setTab] = useState('today');
  const today = useMemo(() => new Date(), []);
  const [serviceModal, setServiceModal] = useState({ open: false, service: null });
  const [availModal, setAvailModal] = useState({ open: false, date: null, data: null, barberId: null });
  const [rescheduleModal, setRescheduleModal] = useState({ open: false, appointment: null });
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ type: 'reject'; appointment: any } | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const { data: todayAppointments, loading: loadingToday } = useFirestoreSubscription(
    (cb, err) => subscribeToDateAppointments(today, cb, err),
    [toDateId(today)]
  );

  const { data: emergencyQueue, loading: loadingEmergency } = useFirestoreSubscription(
    (cb, err) => subscribeToEmergencyQueue(cb, err),
    []
  );

  const { data: services, loading: loadingServices } = useFirestoreSubscription(
    (cb, err) => subscribeToServices(cb, err),
    []
  );

  const { data: allAvailability, loading: loadingAvailability } = useFirestoreSubscription(
    (cb, err) => subscribeToAllAvailability(cb, err),
    []
  );

  const { run: handleStatusUpdate, loading: updating } = useAsyncAction(
    async ({ appointmentId, status }: { appointmentId: string; status: 'pendiente' | 'aceptada' | 'rechazada' | 'reprogramada' | 'completada' | 'cancelada' }) => {
      await updateAppointmentStatus({ appointmentId, status });
      setConfirmAction(null);
      setToast({ type: 'success', text: 'Cita actualizada.' });
    }
  );

  const { run: handleDeleteService, loading: deleting } = useAsyncAction(
    async (serviceId: string) => {
      await deleteService(serviceId);
      setConfirmDelete(null);
      setToast({ type: 'success', text: 'Servicio eliminado.' });
    }
  );

  const stats = useMemo(() => {
    const all = todayAppointments || [];
    return {
      total: all.length,
      pending: all.filter((a) => a.status === APPOINTMENT_STATUS.PENDIENTE).length,
      accepted: all.filter((a) => a.status === APPOINTMENT_STATUS.ACEPTADA).length,
      completed: all.filter((a) => a.status === APPOINTMENT_STATUS.COMPLETADA).length
    };
  }, [todayAppointments]);

  const onAction = (actionType: 'reschedule' | 'accept' | 'reject' | 'complete', appointment: any) => {
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

  // Group appointments by barber
  const byBarber = useMemo(() => {
    const groups = new Map();
    (todayAppointments || []).forEach((a) => {
      if (!groups.has(a.barberId)) groups.set(a.barberId, []);
      groups.get(a.barberId).push(a);
    });
    return groups;
  }, [todayAppointments]);

  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <div>
            <h1 className="page-title">Panel de administración</h1>
            <p className="page-subtitle">Bienvenido, {profile?.name}</p>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <Link to="/admin/barberos" className="btn btn-secondary">
              Gestionar barberos
            </Link>
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
              <div>
                {Array.from(byBarber.entries()).map(([barberId, appts]) => (
                  <div key={barberId} style={{ marginBottom: 'var(--space-6)' }}>
                    <h3 style={{ marginBottom: 'var(--space-3)', fontSize: 'var(--text-base)', color: 'var(--color-primary)' }}>
                      💈 {appts[0].barberName} ({appts.length})
                    </h3>
                    <div className="appointment-history">
                      {appts.map((appt) => (
                        <AppointmentCard
                          key={appt.id}
                          appointment={appt}
                          variant="admin"
                          onAction={(actionType) => onAction(actionType, appt)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'emergency' && (
          <div>
            <h2 style={{ marginBottom: 'var(--space-4)' }}>Cola de emergencias</h2>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-4)', fontSize: 'var(--text-sm)' }}>
              Citas con recargo de RD${EMERGENCY_FEE}. Requiere tu aprobación explícita.
            </p>
            {!emergencyQueue || emergencyQueue.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state__icon">⚡</div>
                <p className="empty-state__title">Sin emergencias pendientes</p>
              </div>
            ) : (
              <div className="appointment-history">
                {emergencyQueue.map((appt) => (
                  <AppointmentCard
                    key={appt.id}
                    appointment={appt}
                    variant="admin"
                    onAction={(actionType) => onAction(actionType, appt)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

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

        {tab === 'availability' && (
          <div>
            <h2 style={{ marginBottom: 'var(--space-4)' }}>Calendario global</h2>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-4)', fontSize: 'var(--text-sm)' }}>
              Vista general de disponibilidad configurada. Para editar la de un barbero, ve a su perfil.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
              {Object.entries(
                (allAvailability || []).reduce((acc: any, a: any) => {
                  if (!acc[a.date]) acc[a.date] = [];
                  acc[a.date].push(a);
                  return acc;
                }, {})
              )
                .sort(([a]: [string, any], [b]: [string, any]) => a.localeCompare(b))
                .slice(0, 14)
                .map(([date, avs]: [string, any[]]) => (
                  <div key={date} className="card">
                    <h4 style={{ marginBottom: 'var(--space-3)', textTransform: 'capitalize' }}>
                      {formatDate(date, { weekday: 'short', day: 'numeric', month: 'short' })}
                    </h4>
                    {avs.map((av: any) => (
                      <div key={av.id} style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-2) 0', borderTop: '1px solid var(--color-border)', fontSize: 'var(--text-sm)' }}>
                        <span>{av.barberName || av.barberId?.slice(0, 8)}</span>
                        <span style={{ color: av.blocked ? 'var(--color-danger)' : 'var(--color-text-secondary)' }}>
                          {av.blocked ? 'Bloqueado' : `${av.timeSlots?.length || 0} horarios`}
                        </span>
                      </div>
                    ))}
                  </div>
                ))}
              {(allAvailability || []).length === 0 && (
                <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
                  <p>Aún no se ha configurado disponibilidad.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <ServiceFormModal
        isOpen={serviceModal.open}
        onClose={() => setServiceModal({ open: false, service: null })}
        service={serviceModal.service}
      />

      <AvailabilityManager
        isOpen={availModal.open}
        onClose={() => setAvailModal({ open: false, date: null, data: null, barberId: null })}
        initialDate={availModal.date}
        existingAvailability={availModal.data}
        barberIdOverride={availModal.barberId}
      />

      <RescheduleModal
        isOpen={rescheduleModal.open}
        onClose={() => setRescheduleModal({ open: false, appointment: null })}
        appointment={rescheduleModal.appointment}
      />

      <Modal
        isOpen={!!confirmDelete}
        onClose={() => !deleting && setConfirmDelete(null)}
        title="¿Eliminar servicio?"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setConfirmDelete(null)} disabled={deleting}>
              Cancelar
            </button>
            <button className="btn btn-danger" onClick={() => handleDeleteService(confirmDelete!)} disabled={deleting}>
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

      <Modal
        isOpen={!!confirmAction && confirmAction.type === 'reject'}
        onClose={() => !updating && setConfirmAction(null)}
        title="¿Rechazar cita?"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setConfirmAction(null)} disabled={updating}>
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
        <p>Vas a rechazar la cita de <strong>{confirmAction?.appointment?.clientName}</strong> con <strong>{confirmAction?.appointment?.barberName}</strong>.</p>
      </Modal>
    </div>
  );
};

export default AdminDashboard;