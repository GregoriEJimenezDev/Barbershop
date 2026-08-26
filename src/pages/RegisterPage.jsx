import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerWithEmail, signInWithGoogle } from '../services/auth.service';
import { useAsyncAction } from '../hooks/useAsyncAction';
import Alert from '../components/ui/Alert';
import Loader from '../components/ui/Loader';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [formError, setFormError] = useState('');

  const { run: handleRegister, loading, errorMessage } = useAsyncAction(
    async (data) => {
      const user = await registerWithEmail(data);
      navigate('/cliente');
      return user;
    }
  );

  const { run: handleGoogle, loading: loadingGoogle, errorMessage: googleError } =
    useAsyncAction(async () => {
      const user = await signInWithGoogle();
      navigate('/cliente');
      return user;
    });

  const onChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setFormError('');
  };

  const validate = () => {
    if (!form.name || !form.email || !form.password) {
      return 'Completa los campos obligatorios.';
    }
    if (form.password.length < 6) {
      return 'La contraseña debe tener al menos 6 caracteres.';
    }
    if (form.password !== form.confirmPassword) {
      return 'Las contraseñas no coinciden.';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      return 'Ingresa un correo válido.';
    }
    return null;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    const validationError = validate();
    if (validationError) {
      setFormError(validationError);
      return;
    }
    const { confirmPassword, ...data } = form;
    await handleRegister(data);
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card__header">
          <h1 className="auth-card__title">Crear cuenta</h1>
          <p className="auth-card__subtitle">Reserva tus citas en segundos</p>
        </div>

        {(errorMessage || formError || googleError) && (
          <Alert type="error">
            {formError || errorMessage || googleError}
          </Alert>
        )}

        <form onSubmit={onSubmit} noValidate style={{ marginTop: 'var(--space-5)' }}>
          <div className="field">
            <label htmlFor="name">Nombre completo *</label>
            <input
              id="name"
              name="name"
              type="text"
              className="input"
              placeholder="Juan Pérez"
              value={form.name}
              onChange={onChange}
              autoComplete="name"
              required
            />
          </div>

          <div className="field">
            <label htmlFor="email">Correo electrónico *</label>
            <input
              id="email"
              name="email"
              type="email"
              className="input"
              placeholder="tu@correo.com"
              value={form.email}
              onChange={onChange}
              autoComplete="email"
              required
            />
          </div>

          <div className="field">
            <label htmlFor="phone">Teléfono (opcional)</label>
            <input
              id="phone"
              name="phone"
              type="tel"
              className="input"
              placeholder="+1 809 000 0000"
              value={form.phone}
              onChange={onChange}
              autoComplete="tel"
            />
          </div>

          <div className="field">
            <label htmlFor="password">Contraseña *</label>
            <input
              id="password"
              name="password"
              type="password"
              className="input"
              placeholder="Mínimo 6 caracteres"
              value={form.password}
              onChange={onChange}
              autoComplete="new-password"
              required
            />
          </div>

          <div className="field">
            <label htmlFor="confirmPassword">Confirmar contraseña *</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              className="input"
              placeholder="Repite tu contraseña"
              value={form.confirmPassword}
              onChange={onChange}
              autoComplete="new-password"
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block btn-lg"
            disabled={loading}
          >
            {loading ? <Loader size="sm" /> : 'Crear cuenta'}
          </button>
        </form>

        <div className="auth-card__divider">o</div>

        <button
          onClick={handleGoogle}
          className="btn-google"
          disabled={loadingGoogle}
          type="button"
        >
          {loadingGoogle ? (
            <Loader size="sm" />
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Registrarme con Google
            </>
          )}
        </button>

        <div className="auth-card__footer">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" style={{ fontWeight: 600 }}>
            Inicia sesión
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
