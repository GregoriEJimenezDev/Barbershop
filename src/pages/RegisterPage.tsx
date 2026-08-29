import { FC } from 'react';
import { Form, Input, Button, Alert } from '../components/ui';
import { registerWithEmail } from '../services/auth.service';

const RegisterPage: FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await registerWithEmail({ name, email, password, phone });
      setError(null);
    } catch (e: any) {
      setError(e?.message || 'Error al registrarse');
    }
  };

  return (
    <div className="register-page">
      <div className="register-container">
        <h2 className="register-title">Crear cuenta</h2>
        <form onSubmit={handleSubmit} className="register-form">
          <Input
            type="text"
            placeholder="Nombre completo"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input
            type="email"
            placeholder="Correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Input
            type="tel"
            placeholder="Teléfono (opcional)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <Button type="submit" className="btn-primary">
            Registrarse
          </Button>
        </form>
        {error && <Alert type="error">{error}</Alert>}
        <p className="register-login">
            Ya tienes cuenta? <a href="/login">Inicia sesión</a>
          </p>
      </div>
    </div>
  );
};

export default RegisterPage;