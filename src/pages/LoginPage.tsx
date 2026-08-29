import { FC } from 'react';
import { Form, Input, Button, Alert } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { signInWithEmail } from '../services/auth.service';

const LoginPage: FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { signInWithEmailAndPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signInWithEmail({ email, password });
      setError(null);
    } catch (e: any) {
      setError(e?.message || 'Error al iniciar sesión');
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <h2 className="login-title">Iniciar sesión</h2>
        <form onSubmit={handleSubmit} className="login-form">
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
          <Button type="submit" className="btn-primary">
            Entrar
          </Button>
        </form>
        {error && <Alert type="error">{error}</Alert>}
        <p className="login-footer">
          ¿No tienes cuenta? <a href="/register">Regístrate aquí</a>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;