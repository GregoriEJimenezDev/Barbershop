import { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useFirestoreSubscription } from '../hooks/useFirestoreSubscription';
import { useAsyncAction } from '../hooks/useAsyncAction';
import {
  subscribeToAllBarbers,
  createBarber,
  deactivateBarber,
  reactivateBarber
} from '../services/barbers.service';
import BarberCard from '../components/ui/BarberCard';
import BarberFormModal from '../components/admin/BarberFormModal';
import Modal from '../components/ui/Modal';
import Loader from '../components/ui/Loader';
import Alert from '../components/ui/Alert';

const BarbersPage = () => {
  const { profile } = useAuth();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // 'all' | 'active' | 'inactive'
  const [formModal, setFormModal] = useState({ open: false, barber: null });
  const [confirmAction, setConfirmAction] = useState(null);
  const [toast, setToast] = useState(null);

  const { data: barbers, loading } = useFirestoreSubscription(
    (cb, err) => subscribeToAllBarbers(cb, err),
    []
  );

  const { run: handleDeactivate, loading: deactivating } = useAsyncAction(
    async (barberId) => {
      await deactivateBarber(barberId);
      setConfirmAction(null);
      setToast({ type: 'success', text: 'Barbero desactivado.' });
    }
  );

  const { run: handleReactivate, loading: reactivating } = useAsyncAction(
    async (barberId) => {
      await reactivateBarber(barberId);
      setConfirmAction(null);
      setToast({ type: 'success', text: 'Barbero reactivado.' });
    }
  );

  const filtered = useMemo(() => {
    if (!barbers) return [];
    return barbers.filter((b) => {
      const matchesFilter =
        filter === 'all' ||
        (filter === 'active' && b.active) ||
        (filter === 'inactive' && !b.active);
      const matchesSearch = search
        ? b.name.toLowerCase().includes(search.toLowerCase()) ||
          (b.email || '').toLowerCase().includes(search.toLowerCase())
        : true;
      return matchesFilter && matchesSearch;
    });
  }, [barbers, filter, search]);

  const activeCount = useMemo(() => (barbers || []).filter((b) => b.active).length, [barbers]);
  const inactiveCount = useMemo(() => (barbers || []).filter((b) => !b.active).length, [barbers]);

  const handleConfirm = () => {
    if (!confirmAction) return;
    if (confirmAction.type === 'deactivate') {
      handleDeactivate(confirmAction.barber.id);
    } else if (confirmAction.type === 'reactivate') {
      handleReactivate(confirmAction.barber.id);
    }
  };

  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <div>
            <h1 className="page-title">Barberos</h1>
            <p className="page-subtitle">
              Gestiona los perfiles y cuentas de tu equipo
            </p>
          </div>
          <button
            onClick={() => setFormModal({ open: true, barber: null })}
            className="btn btn-primary"
          >
            + Nuevo barbero
          </button>
        </div>

        {toast && (
          <div style={{ marginBottom: 'var(--space-4)' }}>
            <Alert type={toast.type} onClose={() => setToast(null)}>
              {toast.text}
            </Alert>
          </div>
        )}

        <div className="dashboard-stats">
          <div className="stat-card">
            <div className="stat-card__label">Total</div>
            <div className="stat-card__value">{(barbers || []).length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card__label">Activos</div>
            <div className="stat-card__value" style={{ color: 'var(--color-success)' }}>
              {activeCount}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-card__label">Inactivos</div>
            <div className="stat-card__value" style={{ color: 'var(--color-text-muted)' }}>
              {inactiveCount}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-card__label">Rating promedio</div>
            <div className="stat-card__value" style={{ color: 'var(--color-primary)' }}>
              {barbers && barbers.length > 0
                ? (barbers.reduce((s, b) => s + (b.averageRating || 0), 0) / barbers.length).toFixed(1)
                : '0.0'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-5)', flexWrap: 'wrap' }}>
          <input
            type="search"
            placeholder="Buscar por nombre o email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input"
            style={{ flex: 1, minWidth: '200px' }}
          />
          <div className="tabs" style={{ flex: '0 0 auto' }}>
            <button
              className={`tab ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              Todos ({(barbers || []).length})
            </button>
            <button
              className={`tab ${filter === 'active' ? 'active' : ''}`}
              onClick={() => setFilter('active')}
            >
              Activos ({activeCount})
            </button>
            <button
              className={`tab ${filter === 'inactive' ? 'active' : ''}`}
              onClick={() => setFilter('inactive')}
            >
              Inactivos ({inactiveCount})
            </button>
          </div>
        </div>

        {loading ? (
          <Loader text="Cargando barberos..." />
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon">👤</div>
            <p className="empty-state__title">
              {search || filter !== 'all' ? 'Sin resultados' : 'No hay barberos todavía'}
            </p>
            <p>
              {search || filter !== 'all'
                ? 'Intenta con otro filtro o búsqueda.'
                : 'Crea el primer barbero de tu equipo.'}
            </p>
            {!search && filter === 'all' && (
              <button
                onClick={() => setFormModal({ open: true, barber: null })}
                className="btn btn-primary"
                style={{ marginTop: 'var(--space-4)' }}
              >
                Crear primer barbero
              </button>
            )}
          </div>
        ) : (
          <div className="barbers-grid">
            {filtered.map((barber) => (
              <BarberCard
                key={barber.id}
                barber={barber}
                onEdit={(b) => setFormModal({ open: true, barber: b })}
                onDeactivate={(b) => setConfirmAction({ type: 'deactivate', barber: b })}
                onReactivate={(b) => setConfirmAction({ type: 'reactivate', barber: b })}
              />
            ))}
          </div>
        )}
      </div>

      <BarberFormModal
        isOpen={formModal.open}
        onClose={() => setFormModal({ open: false, barber: null })}
        barber={formModal.barber}
      />

      <Modal
        isOpen={!!confirmAction}
        onClose={() => !deactivating && !reactivating && setConfirmAction(null)}
        title={
          confirmAction?.type === 'deactivate'
            ? '¿Desactivar barbero?'
            : '¿Reactivar barbero?'
        }
        footer={
          <>
            <button
              className="btn btn-secondary"
              onClick={() => setConfirmAction(null)}
              disabled={deactivating || reactivating}
            >
              Cancelar
            </button>
            <button
              className={confirmAction?.type === 'deactivate' ? 'btn btn-warning' : 'btn btn-primary'}
              onClick={handleConfirm}
              disabled={deactivating || reactivating}
            >
              {deactivating || reactivating ? <Loader size="sm" /> :
                confirmAction?.type === 'deactivate' ? 'Desactivar' : 'Reactivar'}
            </button>
          </>
        }
      >
        <p>
          {confirmAction?.type === 'deactivate' ? (
            <>Vas a desactivar a <strong>{confirmAction.barber.name}</strong>. No podrá recibir nuevas citas, pero su historial se mantiene.</>
          ) : (
            <>Vas a reactivar a <strong>{confirmAction.barber.name}</strong>. Volverá a estar disponible para los clientes.</>
          )}
        </p>
      </Modal>
    </div>
  );
};

export default BarbersPage;
