import { useState, useEffect, useMemo } from 'react';
import Calendar from '../ui/Calendar';
import TimeSlots from '../ui/TimeSlots';
import PriceBoard from '../ui/PriceBoard';
import Alert from '../ui/Alert';
import Loader from '../ui/Loader';
import { useAuth } from '../../context/AuthContext';
import { useAsyncAction } from '../../hooks/useAsyncAction';
import { useFirestoreSubscription } from '../../hooks/useFirestoreSubscription';
import { subscribeToServices } from '../../services/services.service';
import { subscribeToAvailability } from '../../services/availability.service';
import { subscribeToDateAppointments, createAppointment } from '../../services/appointments.service';
import { toDateId, formatDate, formatCurrency, calculateTotalPrice } from '../../utils/helpers';
import { EMERGENCY_FEE } from '../../utils/constants';

/**
 * BookingForm - 3-step booking flow: service → date/time → confirm.
 * Implements real-time slot availability using Firestore subscriptions.
 */
const BookingForm = ({ onSuccess }) => {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [isEmergency, setIsEmergency] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Available services (real-time)
  const { data: services, loading: loadingServices } = useFirestoreSubscription(
    (cb, err) => subscribeToServices(cb, err),
    []
  );

  // Availability for selected date
  const { data: availability } = useFirestoreSubscription(
    (cb, err) => selectedDate
      ? subscribeToAvailability(selectedDate, cb, err)
      : (() => { cb(null); return () => {}; })(),
    [selectedDate ? toDateId(selectedDate) : null]
  );

  // Existing appointments for selected date (to compute occupied slots)
  const { data: dateAppointments } = useFirestoreSubscription(
    (cb, err) => selectedDate
      ? subscribeToDateAppointments(selectedDate, cb, err)
      : (() => { cb([]); return () => {}; })(),
    [selectedDate ? toDateId(selectedDate) : null]
  );

  // Occupied slots calculation
  const occupiedSlots = useMemo(() => {
    if (!dateAppointments) return new Set();
    return new Set(
      dateAppointments
        .filter((a) => ['pendiente', 'aceptada'].includes(a.status))
        .map((a) => a.time)
    );
  }, [dateAppointments]);

  // Available time slots for the date
  const availableTimeSlots = useMemo(() => {
    if (!availability) return [];
    return availability.timeSlots || [];
  }, [availability]);

  // Determine if the day is full
  const isDayFull = useMemo(() => {
    if (!availability || !dateAppointments) return false;
    const activeCount = dateAppointments.filter((a) =>
      ['pendiente', 'aceptada'].includes(a.status)
    ).length;
    return activeCount >= (availability.maxAppointments || 0);
  }, [availability, dateAppointments]);

  const isDayBlocked = availability?.blocked === true;

  const { run: handleSubmit, loading: submitting, errorMessage, reset } = useAsyncAction(
    async () => {
      const result = await createAppointment({
        serviceId: selectedService.id,
        date: selectedDate,
        time: selectedTime,
        isEmergency
      });
      setSuccessMessage(
        isEmergency
          ? '¡Solicitud de emergencia enviada! El barbero la confirmará pronto.'
          : '¡Cita agendada con éxito!'
      );
      // Reset flow
      setStep(1);
      setSelectedService(null);
      setSelectedDate(null);
      setSelectedTime(null);
      setIsEmergency(false);
      onSuccess && onSuccess(result);
      return result;
    }
  );

  // Reset time when date changes
  useEffect(() => {
    setSelectedTime(null);
  }, [selectedDate]);

  const totalPrice = selectedService
    ? calculateTotalPrice(selectedService.price, isEmergency)
    : 0;

  const next = () => setStep((s) => Math.min(3, s + 1));
  const prev = () => setStep((s) => Math.max(1, s - 1));

  const canProceedStep1 = !!selectedService;
  const canProceedStep2 = !!selectedDate && !!selectedTime;

  if (successMessage) {
    return (
      <Alert type="success" onClose={() => setSuccessMessage('')}>
        {successMessage}
      </Alert>
    );
  }

  return (
    <div>
      {/* Stepper */}
      <div className="booking-stepper">
        <div className={`step ${step >= 1 ? 'step--active' : ''} ${step > 1 ? 'step--completed' : ''}`}>
          <div className="step__number">1</div>
          <div className="step__label">Servicio</div>
        </div>
        <div className={`step ${step >= 2 ? 'step--active' : ''} ${step > 2 ? 'step--completed' : ''}`}>
          <div className="step__number">2</div>
          <div className="step__label">Fecha y hora</div>
        </div>
        <div className={`step ${step >= 3 ? 'step--active' : ''}`}>
          <div className="step__number">3</div>
          <div className="step__label">Confirmar</div>
        </div>
      </div>

      {errorMessage && (
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <Alert type="error" onClose={reset}>
            {errorMessage}
          </Alert>
        </div>
      )}

      {/* Step 1: Service */}
      {step === 1 && (
        <div>
          <h3 style={{ marginBottom: 'var(--space-4)' }}>Elige tu servicio</h3>
          {loadingServices ? (
            <Loader text="Cargando servicios..." />
          ) : (
            <PriceBoard
              services={services || []}
              onSelect={(s) => setSelectedService(s)}
              selectedId={selectedService?.id}
            />
          )}
          <div style={{ marginTop: 'var(--space-6)', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={next}
              className="btn btn-primary"
              disabled={!canProceedStep1}
            >
              Continuar →
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Date & Time */}
      {step === 2 && (
        <div>
          <h3 style={{ marginBottom: 'var(--space-4)' }}>Elige fecha y hora</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--space-5)' }}>
            <Calendar
              value={selectedDate}
              onChange={setSelectedDate}
              blockedDates={new Set()}
            />

            {selectedDate && (
              <div>
                <h4 style={{ marginBottom: 'var(--space-3)' }}>
                  Horarios disponibles — {formatDate(selectedDate, { weekday: 'long', day: 'numeric', month: 'long' })}
                </h4>
                {isDayBlocked ? (
                  <Alert type="warning">
                    El barbero no atenderá este día. Elige otra fecha.
                  </Alert>
                ) : isDayFull ? (
                  <Alert type="warning">
                    No quedan cupos para este día. Elige otra fecha.
                  </Alert>
                ) : availableTimeSlots.length === 0 ? (
                  <Alert type="info">
                    El barbero aún no ha configurado horarios para este día.
                  </Alert>
                ) : (
                  <TimeSlots
                    slots={availableTimeSlots}
                    value={selectedTime}
                    onChange={setSelectedTime}
                    occupiedSlots={occupiedSlots}
                  />
                )}
              </div>
            )}
          </div>

          <div style={{ marginTop: 'var(--space-6)', display: 'flex', justifyContent: 'space-between', gap: 'var(--space-3)' }}>
            <button onClick={prev} className="btn btn-secondary">
              ← Atrás
            </button>
            <button
              onClick={next}
              className="btn btn-primary"
              disabled={!canProceedStep2}
            >
              Continuar →
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Confirm */}
      {step === 3 && (
        <div>
          <h3 style={{ marginBottom: 'var(--space-4)' }}>Confirma tu cita</h3>

          <div className="booking-summary">
            <div className="booking-summary__row">
              <span>Cliente</span>
              <strong>{user?.displayName || '—'}</strong>
            </div>
            <div className="booking-summary__row">
              <span>Servicio</span>
              <strong>{selectedService.name}</strong>
            </div>
            <div className="booking-summary__row">
              <span>Fecha</span>
              <strong>{formatDate(selectedDate)}</strong>
            </div>
            <div className="booking-summary__row">
              <span>Hora</span>
              <strong>{selectedTime}</strong>
            </div>
            <div className="booking-summary__row">
              <span>Duración</span>
              <span>{selectedService.durationMinutes} min</span>
            </div>
            <div className="booking-summary__row">
              <span>Precio base</span>
              <span>{formatCurrency(selectedService.price)}</span>
            </div>
            {isEmergency && (
              <div className="booking-summary__row">
                <span>Recargo emergencia</span>
                <span>{formatCurrency(EMERGENCY_FEE)}</span>
              </div>
            )}
            <div className="booking-summary__row booking-summary__row--total">
              <span>Total</span>
              <span>{formatCurrency(totalPrice)}</span>
            </div>
          </div>

          <label className="emergency-toggle">
            <input
              type="checkbox"
              checked={isEmergency}
              onChange={(e) => setIsEmergency(e.target.checked)}
            />
            <div>
              <div className="emergency-toggle__title">
                ⚡ Cita de emergencia
              </div>
              <div className="emergency-toggle__description">
                Solicita atención prioritaria por un recargo de {formatCurrency(EMERGENCY_FEE)}.
                Quedará en estado <strong>pendiente</strong> hasta que el barbero la apruebe.
              </div>
            </div>
          </label>

          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-3)' }}>
            <button onClick={prev} className="btn btn-secondary" disabled={submitting}>
              ← Atrás
            </button>
            <button
              onClick={handleSubmit}
              className="btn btn-primary btn-lg"
              disabled={submitting}
            >
              {submitting ? <Loader size="sm" /> : `Confirmar cita — ${formatCurrency(totalPrice)}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingForm;
