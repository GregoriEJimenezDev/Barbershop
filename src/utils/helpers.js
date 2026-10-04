import { EMERGENCY_FEE } from './constants';

/**
 * Format a number as Dominican Peso (DOP) currency
 */
export const formatCurrency = (amount) => {
  const value = Number(amount) || 0;
  return new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency: 'DOP',
    minimumFractionDigits: 0
  }).format(value);
};

/**
 * Format a date string or Date object as a localized date in Spanish
 */
export const formatDate = (date, options = {}) => {
  if (!date) return '';
  const dateObj = date instanceof Date ? date : new Date(date);
  return new Intl.DateTimeFormat('es-DO', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options
  }).format(dateObj);
};

/**
 * Format time string (HH:mm) to 12h format
 */
export const formatTime = (time) => {
  if (!time) return '';
  const [h, m] = time.split(':');
  const hour = parseInt(h, 10);
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${m} ${period}`;
};

/**
 * Get YYYY-MM-DD from a Date
 */
export const toDateId = (date) => {
  const d = date instanceof Date ? date : new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Calculate total price including emergency fee if applicable
 */
export const calculateTotalPrice = (basePrice, isEmergency) => {
  const base = Number(basePrice) || 0;
  const fee = isEmergency ? EMERGENCY_FEE : 0;
  return base + fee;
};

/**
 * Get friendly error message in Spanish from Firebase error code
 */
export const getErrorMessage = (error) => {
  if (!error) return 'Ha ocurrido un error inesperado.';
  const code = error.code || String(error.message || '').match(/\((auth|functions|firestore)\/[a-z-]+\)/)?.[0]?.replace(/[()]/g, '') || '';
  const messages = {
    'auth/email-already-in-use': 'Este correo ya está registrado.',
    'auth/invalid-email': 'El correo electrónico no es válido.',
    'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
    'auth/user-not-found': 'No existe una cuenta con este correo.',
    'auth/wrong-password': 'Contraseña incorrecta.',
    'auth/invalid-credential': 'Correo o contraseña incorrectos.',
    'auth/invalid-login-credentials': 'Correo o contraseña incorrectos.',
    'auth/user-disabled': 'Esta cuenta está deshabilitada.',
    'auth/too-many-requests': 'Demasiados intentos. Intenta más tarde.',
    'auth/network-request-failed': 'Error de red. Verifica tu conexión.',
    'auth/operation-not-allowed':
      'El método de inicio de sesión está deshabilitado. Actívalo en Firebase Console → Authentication → Sign-in method.',
    'auth/configuration-not-found':
      'Firebase Auth no está habilitado en la consola. Ve a Firebase Console → Authentication → Sign-in method y activa Email/Password.',
    'functions/not-found':
      'La Cloud Function no está desplegada. Ejecuta: npm run deploy:functions',
    'functions/internal': 'Error interno de las Cloud Functions. Revisa su log en la consola.',
    'permission-denied': 'No tienes permisos para realizar esta acción.',
    'not-found': 'Recurso no encontrado.',
    'already-exists': 'El recurso ya existe.',
    'unavailable': 'Servicio no disponible. Intenta más tarde.'
  };
  return messages[code] || error.message || 'Ha ocurrido un error inesperado.';
};
