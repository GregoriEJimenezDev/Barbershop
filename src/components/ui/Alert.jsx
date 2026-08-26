const Alert = ({ type = 'info', children, onClose }) => {
  return (
    <div className={`alert alert-${type}`} role="alert">
      <span style={{ flex: 1 }}>{children}</span>
      {onClose && (
        <button
          onClick={onClose}
          style={{ color: 'inherit', padding: 0, lineHeight: 1 }}
          aria-label="Cerrar"
        >
          ×
        </button>
      )}
    </div>
  );
};

export default Alert;
