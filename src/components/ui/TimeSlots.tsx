import { useState, useMemo, ReactNode } from 'react';

/**
 * TimeSlots - Render time slots for a given date.
 *
 * Props:
 * - date: Date — the date to show slots for
 * - availableSlots: string[] — available time slots (HH:mm)
 * - blockedSlots: string[] — blocked time slots (HH:mm)
 * - onSelect: (time: string) => void — called when a slot is selected
 * - minTime: string — minimum allowed time (HH:mm), default '09:00'
 * - maxTime: string — maximum allowed time (HH:mm), default '18:00'
 * - slotDuration: number — duration in minutes per slot, default 30
 */
interface TimeSlotsProps {
  date: Date;
  availableSlots: string[];
  blockedSlots: string[];
  onSelect: (time: string) => void;
  minTime?: string;
  maxTime?: string;
  slotDuration?: number;
}

const getDefaultMinTime = (): string => '09:00';
const getDefaultMaxTime = (): string => '18:00';
const defaultSlotDuration = 30;

const TimeSlots = ({
  date,
  availableSlots,
  blockedSlots,
  onSelect,
  minTime = getDefaultMinTime(),
  maxTime = getDefaultMaxTime(),
  slotDuration = defaultSlotDuration
}: TimeSlotsProps) => {
  const [localMinTime, setLocalMinTime] = useState<string>(minTime);
  const [localMaxTime, setLocalMaxTime] = useState<string>(maxTime);

  const handleSelect = (time: string) => {
    onSelect(time);
  };

  // Generate slot times between min and max
  const slotTimes = useMemo(() => {
    const times: string[] = [];
    const [startH, startM] = minTime.split(':').map(Number);
    const [endH, endM] = maxTime.split(':').map(Number);
    let currentH = startH;
    let currentM = startM;

    const endMinutes = endH * 60 + endM;
    const startMinutes = startH * 60 + startM;
    const durationMs = slotDuration * 60 * 1000;

    const totalMinutes = Math.floor((endMinutes - startMinutes) / slotDuration);
    for (let i = 0; i <= totalMinutes; i++) {
      const minute = startMinutes + i * slotDuration;
      const h = String(Math.floor(minute / 60)).padStart(2, '0');
      const m = String(minute % 60).padStart(2, '0');
      times.push(`${h}:${m}`);
    }
    return times;
  }, [minTime, maxTime, slotDuration]);

  const isSlotAvailable = (time: string) => availableSlots.includes(time);
  const isSlotBlocked = (time: string) => blockedSlots.includes(time);

  return (
    <div className="time-slots">
      {slotTimes.map((time) => {
        const isAvailable = isSlotAvailable(time);
        const isBlocked = isSlotBlocked(time);
        const classes = ['time-slot'];
        if (!isAvailable) classes.push('time-slot--unavailable');
        if (isBlocked) classes.push('time-slot--blocked');

        return (
          <button
            key={time}
            className={classes.join(' ')}
            disabled={!isAvailable || isBlocked}
            onClick={() => isAvailable && handleSelect(time)}
          >
            {time}
          </button>
        );
      })}
    </div>
  );
};

export default TimeSlots;