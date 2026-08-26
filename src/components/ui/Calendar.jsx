import { useState, useMemo } from 'react';
import { toDateId } from '../../utils/helpers';

/**
 * Calendar - Reusable month calendar.
 *
 * Props:
 * - value: Date | null — currently selected date
 * - onChange: (date: Date) => void
 * - minDate: Date — selectable from this date (inclusive)
 * - maxDate: Date — selectable up to this date (inclusive)
 * - disabledDates: Set<string> YYYY-MM-DD — disabled dates
 * - availableCounts: Map<string, number> YYYY-MM-DD -> remaining slots (for dots)
 * - blockedDates: Set<string> — fully blocked days
 */
const Calendar = ({
  value,
  onChange,
  minDate = new Date(),
  maxDate,
  disabledDates = new Set(),
  availableCounts = new Map(),
  blockedDates = new Set()
}) => {
  const [viewDate, setViewDate] = useState(value || new Date());

  const monthStart = useMemo(() => {
    return new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
  }, [viewDate]);

  const monthEnd = useMemo(() => {
    return new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0);
  }, [viewDate]);

  const startDayOfWeek = monthStart.getDay();
  const daysInMonth = monthEnd.getDate();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const monthName = monthStart.toLocaleDateString('es-DO', {
    month: 'long',
    year: 'numeric'
  });

  const handlePrev = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const handleNext = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const isDateDisabled = (date) => {
    const dateId = toDateId(date);
    if (date < today) return true;
    if (minDate && date < new Date(minDate.setHours(0, 0, 0, 0))) return true;
    if (maxDate && date > maxDate) return true;
    if (disabledDates.has(dateId)) return true;
    return false;
  };

  const isFull = (date) => {
    const dateId = toDateId(date);
    const remaining = availableCounts.get(dateId);
    return typeof remaining === 'number' && remaining <= 0;
  };

  const isBlocked = (date) => blockedDates.has(toDateId(date));

  const isToday = (date) => {
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (date) => {
    if (!value) return false;
    return toDateId(value) === toDateId(date);
  };

  // Build day cells with leading empty cells for week alignment
  const dayCells = [];
  for (let i = 0; i < startDayOfWeek; i++) {
    dayCells.push({ key: `empty-${i}`, empty: true });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(viewDate.getFullYear(), viewDate.getMonth(), d);
    const dateId = toDateId(date);
    const remaining = availableCounts.get(dateId);
    dayCells.push({
      key: dateId,
      date,
      disabled: isDateDisabled(date) || isBlocked(date),
      blocked: isBlocked(date),
      full: isFull(date),
      today: isToday(date),
      selected: isSelected(date),
      hasAvailability: typeof remaining === 'number' && remaining > 0
    });
  }

  const weekdays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  return (
    <div className="calendar">
      <div className="calendar__header">
        <div className="calendar__nav">
          <button onClick={handlePrev} aria-label="Mes anterior">‹</button>
        </div>
        <div className="calendar__month">{monthName}</div>
        <div className="calendar__nav">
          <button onClick={handleNext} aria-label="Mes siguiente">›</button>
        </div>
      </div>
      <div className="calendar__weekdays">
        {weekdays.map((w) => (
          <div key={w} className="calendar__weekday">{w}</div>
        ))}
      </div>
      <div className="calendar__grid">
        {dayCells.map((cell) => {
          if (cell.empty) {
            return <div key={cell.key} className="calendar__day calendar__day--empty" />;
          }
          const classes = ['calendar__day'];
          if (cell.selected) classes.push('calendar__day--selected');
          if (cell.disabled) classes.push('calendar__day--disabled');
          if (cell.blocked) classes.push('calendar__day--blocked');
          if (cell.full) classes.push('calendar__day--full');
          if (cell.today) classes.push('calendar__day--today');

          return (
            <button
              key={cell.key}
              className={classes.join(' ')}
              disabled={cell.disabled}
              onClick={() => onChange && onChange(cell.date)}
            >
              {cell.date.getDate()}
              {cell.hasAvailability && !cell.selected && (
                <span className="calendar__day-dot" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Calendar;
