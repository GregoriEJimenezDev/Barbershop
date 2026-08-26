import { APPOINTMENT_STATUS_COLORS, APPOINTMENT_STATUS_LABELS } from '../../utils/constants';

const StatusBadge = ({ status }) => {
  const label = APPOINTMENT_STATUS_LABELS[status] || status;
  const color = APPOINTMENT_STATUS_COLORS[status] || '#6b7280';

  return (
    <span
      className="badge"
      style={{
        background: `${color}22`,
        color: color,
        border: `1px solid ${color}44`
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: color
        }}
      />
      {label}
    </span>
  );
};

export default StatusBadge;
