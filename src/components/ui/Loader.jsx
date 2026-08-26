const Loader = ({ size = 'md', text }) => {
  const sizes = {
    sm: { width: '1rem', height: '1rem', borderWidth: '2px' },
    md: { width: '1.5rem', height: '1.5rem', borderWidth: '2px' },
    lg: { width: '2.5rem', height: '2.5rem', borderWidth: '3px' }
  };
  const s = sizes[size] || sizes.md;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-3)' }}>
      <div
        className="loader"
        style={{
          width: s.width,
          height: s.height,
          borderWidth: s.borderWidth
        }}
      />
      {text && <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>{text}</p>}
    </div>
  );
};

export default Loader;
