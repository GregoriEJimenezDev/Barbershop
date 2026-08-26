import { formatTime } from '../../utils/helpers';

/**
 * TimeSlots - Reusable time slot picker.
 *
 * Props:
 * - slots: string[] — available HH:mm slots
 * - value: string | null — selected time
 * - onChange: (time: string) => void
 * - occupiedSlots: Set<string> — slots already taken
 * - isEmergency: boolean — visual treatment for emergency bookings
 * - disabled: boolean
 */
const TimeSlots = ({
  slots = [],
  value,
  onChange,
  occupiedSlots = new Set(),
  isEmergency = false,
  disabled = false
}) => {
  if (slots.length === 0) {
    return (
      <div className="empty-state" style={{ padding: 'var(--space-6)' }}>
        <p>No hay horarios disponibles para este día.</p>
      </div>
    );
  }

  return (
    <div className="time-slots">
      {slots.map((slot) => {
        const isOccupied = occupiedSlots.has(slot);
        const isSelected = value === slot;
        const classes = ['time-slot'];
        if (isSelected) classes.push('time-slot--selected');
        if (isEmergency) classes.push('time-slot--emergency');

        return (
          <button
            key={slot}
            className={classes.join(' ')}
            disabled={disabled || isOccupied}
            onClick={() => onChange && onChange(slot)}
            type="button"
          >
            {formatTime(slot)}
          </button>
        );
      })}
    </div>
  );
};

export default TimeSlots;
