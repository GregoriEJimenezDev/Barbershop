import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ClientDashboard from './pages/ClientDashboard';
import AdminDashboard from './pages/AdminDashboard';
import NotFoundPage from './pages/NotFoundPage';
import Layout from './components/layout/Layout';
import { ROLES } from './utils/constants';

const ProtectedRoute = ({ children, requiredRole }) => {
  const { isAuthenticated, isAdmin, isClient, loading } = useAuth();

  if (loading) {
    return (
      <div className="loader-page">
        <div className="loader" style={{ width: '2.5rem', height: '2.5rem' }} />
        <p>Cargando...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole === ROLES.ADMIN && !isAdmin) return <Navigate to="/" replace />;
  if (requiredRole === ROLES.CLIENT && !isClient && !isAdmin) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const App = () => {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/cliente"
          element={
            <ProtectedRoute requiredRole={ROLES.CLIENT}>
              <ClientDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRole={ROLES.ADMIN}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
};

export default App;
