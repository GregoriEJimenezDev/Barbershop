import { useState, useEffect } from 'react';
import { useAsyncAction } from '../../hooks/useAsyncAction';
import { createService, updateService } from '../../services/services.service';
import Modal from '../ui/Modal';
import Loader from '../ui/Loader';
import Alert from '../ui/Alert';

/**
 * ServiceFormModal - Create or edit a service.
 * Used by AdminDashboard.
 */
const ServiceFormModal = ({ isOpen, onClose, service = null }) => {
  const isEdit = !!service;
  const [form, setForm] = useState({
    name: '',
    price: '',
    durationMinutes: '30',
    description: ''
  });

  useEffect(() => {
    if (service) {
      setForm({
        name: service.name || '',
        price: String(service.price || ''),
        durationMinutes: String(service.durationMinutes || 30),
        description: service.description || ''
      });
    } else {
      setForm({ name: '', price: '', durationMinutes: '30', description: '' });
    }
  }, [service, isOpen]);

  const { run: handleSave, loading, errorMessage } = useAsyncAction(
    async (data) => {
      const payload = {
        ...data,
        price: Number(data.price),
        durationMinutes: Number(data.durationMinutes)
      };
      if (isEdit) {
        await updateService(service.id, payload);
      } else {
        await createService(payload);
      }
      onClose();
    }
  );

  const onChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const onSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.price || !form.durationMinutes) return;
    handleSave(form);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Editar servicio' : 'Nuevo servicio'}
    >
      {errorMessage && (
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <Alert type="error">{errorMessage}</Alert>
        </div>
      )}
      <form onSubmit={onSubmit} noValidate>
        <div className="field">
          <label htmlFor="name">Nombre *</label>
          <input
            id="name"
            name="name"
            className="input"
            value={form.name}
            onChange={onChange}
            placeholder="Ej: Corte clásico"
            required
          />
        </div>
        <div className="field">
          <label htmlFor="description">Descripción</label>
          <textarea
            id="description"
            name="description"
            className="textarea"
            value={form.description}
            onChange={onChange}
            placeholder="Describe brevemente el servicio..."
            rows="3"
          />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
          <div className="field">
            <label htmlFor="price">Precio (RD$) *</label>
            <input
              id="price"
              name="price"
              type="number"
              min="0"
              step="50"
              className="input"
              value={form.price}
              onChange={onChange}
              placeholder="500"
              required
            />
          </div>
          <div className="field">
            <label htmlFor="durationMinutes">Duración (min) *</label>
            <input
              id="durationMinutes"
              name="durationMinutes"
              type="number"
              min="5"
              step="5"
              className="input"
              value={form.durationMinutes}
              onChange={onChange}
              required
            />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end', marginTop: 'var(--space-4)' }}>
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? <Loader size="sm" /> : isEdit ? 'Guardar cambios' : 'Crear servicio'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ServiceFormModal;
