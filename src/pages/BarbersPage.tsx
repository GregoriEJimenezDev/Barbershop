import { FC } from 'react';
import { useAuth } from '../../context/AuthContext';
import { subscribeToBarbers } from '../../services/barbers.service';
import Modal from '../ui/Modal';

const BarbersPage: FC = () => {
  const { profile } = useAuth();
  const [barbers, setBarbers] = useState<any[]>([]);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: string; text: string } | null>(null);

  const { data: barbersData, loading } = useFirestoreSubscription(
    (cb, err) => subscribeToBarbers('', cb, err),
    []
  );

  useEffect(() => {
    if (barbersData) {
      setBarbers(barbersData);
    }
  }, [barbersData]);

  const handleDelete = (barberId: string) => {
    setConfirmDelete(barberId);
  };

  const confirmDeleteAction = () => {
    // TODO: Implement barber deletion
    setConfirmDelete(null);
    setToast({ type: 'success', text: 'Barbero eliminado.' });
  };

  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">Gestionar barberos</h1>
          <p className="page-subtitle">Profesionales de la barbería</p>
        </div>

        <div className="barbers-grid">
          {loading ? (
            <p>Cargando barberos...</p>
          ) : barbers.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state__icon">💈</div>
              <p className="empty-state__title">Aún no hay barberos</p>
              <p>El primer usuario con rol de admin se convertirá en barbero.</p>
            </div>
          ) : (
            <div>
              {barbers.map((barber) => (
                <div key={barber.id} className="barber-card">
                  <img
                    src={barber.photoURL || '/placeholder-barber.svg'}
                    alt={barber.name}
                    className="barber-card__photo"
                  />
                  <div className="barber-card__info">
                    <h3 className="barber-card__name">{barber.name}</h3>
                    <p className="barber-card__specialty">
                      {barber.specialties?.length > 0
                        ? barber.specialties.join(', ')
                        : 'Sin especialidades'}
                    </p>
                    <p className="barber-card__rating">
                      {barber.averageRating > 0
                        ? `${barber.averageRating.toFixed(1)} ★`
                        : 'Sin reseñas'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {confirmDelete && (
          <Modal
            isOpen={true}
            onClose={() => setConfirmDelete(null)}
            title="Eliminar barbero"
            footer={
              <>
                <button className="btn btn-secondary" onClick={() => setConfirmDelete(null)}>
                  Cancelar
                </button>
                <button className="btn btn-danger" onClick={() => confirmDeleteAction()}>
                  Eliminar
                </button>
              </>
            }
          >
            <p>¿Estás seguro que deseas eliminar este barbero?</p>
            <p style={{ marginTop: 'var(--space-3)', color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
              Las citas existentes no se verán afectadas.
            </p>
          </Modal>
        )}
      </div>
    </div>
  );
};

export default BarbersPage;