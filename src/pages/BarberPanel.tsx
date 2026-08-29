import { FC } from 'react';
import { useAuth } from '../../context/AuthContext';
import Modal from '../ui/Modal';

const BarberPanel: FC = () => {
  const { profile } = useAuth();

  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">Panel del barbero</h1>
          <p className="page-subtitle">Bienvenido, {profile?.name}</p>
        </div>

        <div className="barber-panel">
          <div className="panel-welcome">
            <h2>Citas de hoy</h2>
            <p>Tu agenda actual está lista abajo.</p>
          </div>

          <div className="panel-agenda">
              {/* Agenda will be rendered here */}
              <p>No hay citas programadas para hoy.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BarberPanel;