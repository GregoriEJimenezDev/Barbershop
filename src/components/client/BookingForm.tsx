import { FC, ReactNode } from 'react';
import { useState } from 'react';

/**
 * BookingForm - Form to book a new appointment.
 *
 * Props:
 * - onSuccess?: () => void — called when appointment is successfully booked
 */
interface BookingFormProps {
  onSuccess?: () => void;
}

const BookingForm: FC<BookingFormProps> = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    serviceId: '',
    date: '',
    time: '',
    clientName: '',
    clientEmail: '',
    clientPhone: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement actual appointment creation
    if (onSuccess) onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="booking-form">
      <h3 className="booking-form__title">Reserva una cita</h3>

      <div className="form-group">
        <label className="form-label">Servicio</label>
        <select name="serviceId" className="form-select" onChange={handleChange} required>
          <option value="">Seleccionar servicio</option>
          {/* Services will be populated dynamically */}
        </select>
      </div>

      <div className="form-group">
        <label className="form-label">Fecha</label>
        <input
          type="date"
          name="date"
          className="form-input"
          onChange={handleChange}
          required
        />
      </div>

      <div className="form-group">
        <label className="form-label">Hora</label>
        <select name="time" className="form-select" onChange={handleChange} required>
          <option value="">Seleccionar hora</option>
          {/* Times will be populated dynamically */}
        </select>
      </div>

      <div className="form-group">
        <label className="form-label">Nombre</label>
        <input
          type="text"
          name="clientName"
          className="form-input"
          onChange={handleChange}
          placeholder="Nombre completo"
          required
        />
      </div>

      <div className="form-group">
        <label className="form-label">Teléfono</label>
        <input
          type="tel"
          name="clientPhone"
          className="form-input"
          onChange={handleChange}
          placeholder="+1 555-123-4567"
        />
      </div>

      <div className="form-group">
        <label className="form-label">Email</label>
        <input
          type="email"
          name="clientEmail"
          className="form-input"
          onChange={handleChange}
          placeholder="ejemplo@email.com"
        />
      </div>

      <button type="submit" className="btn btn-primary w-full">
        Reservar cita
      </button>
    </form>
  );
};

export default BookingForm;
export type { BookingFormProps };