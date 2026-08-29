import { formatCurrency, formatDate, formatTime, toDateId, calculateTotalPrice, getErrorMessage } from '../utils/helpers';
import { EMERGENCY_FEE } from '../utils/constants';

describe('formatCurrency', () => {
  it('formatea un número como moneda DOP', () => {
    expect(formatCurrency(100)).toBe('RD$100');
    expect(formatCurrency(0)).toBe('RD$0');
    expect(formatCurrency(550.5)).toBe('RD$550.5');
  });

  it('maneja valores nulos y undefined', () => {
    expect(formatCurrency(null)).toBe('RD$0');
    expect(formatCurrency(undefined)).toBe('RD$0');
  });
});

describe('formatDate', () => {
  it('formatea una fecha', () => {
    const result = formatDate(new Date('2024-01-15'));
    expect(typeof result).toBe('string');
  });

  it('maneja strings de fecha', () => {
    const result = formatDate('2024-06-20');
    expect(typeof result).toBe('string');
  });

  it('maneja valores nulos', () => {
    expect(formatDate(null)).toBe('');
    expect(formatDate(undefined)).toBe('');
  });
});

describe('formatTime', () => {
  it('formatea hora en formato 12h', () => {
    expect(formatTime('09:30')).toBe('9:30 AM');
    expect(formatTime('14:45')).toBe('2:45 PM');
    expect(formatTime('00:00')).toBe('12:00 AM');
    expect(formatTime('12:00')).toBe('12:00 PM');
  });

  it('maneja vacíos', () => {
    expect(formatTime('')).toBe('');
    expect(formatTime(null)).toBe('');
  });
});

describe('toDateId', () => {
  it('convierte una fecha a formato YYYY-MM-DD', () => {
    const result = toDateId(new Date());
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('formatea strings de fecha en el formato correcto', () => {
    const result = toDateId('2024-01-15');
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('maneja objetos Date', () => {
    const date = new Date(Date.UTC(2024, 2, 15));
    expect(toDateId(date)).toBe('2024-03-15');
  });
});

describe('calculateTotalPrice', () => {
  it('calcula precio total con emergencia', () => {
    expect(calculateTotalPrice(200, true)).toBe(250);
    expect(calculateTotalPrice(200, false)).toBe(200);
  });

  it('maneja valores por defecto', () => {
    expect(calculateTotalPrice(0, false)).toBe(0);
    expect(calculateTotalPrice(null, true)).toBe(50);
  });
});

describe('getErrorMessage', () => {
  it('devuelve mensaje en español para códigos conocidos', () => {
    expect(getErrorMessage({ code: 'auth/email-already-in-use' })).toBe('Este correo ya está registrado.');
    expect(getErrorMessage({ code: 'auth/invalid-email' })).toBe('El correo electrónico no es válido.');
    expect(getErrorMessage({ code: 'auth/weak-password' })).toBe('La contraseña debe tener al menos 6 caracteres.');
  });

  it('devuelve mensaje personalizado para códigos desconocidos', () => {
    expect(getErrorMessage({ message: 'Error personalizado' })).toBe('Error personalizado');
    expect(getErrorMessage({ code: 'unknown-code' })).toBe('Ha ocurrido un error inesperado.');
  });

  it('maneja objeto vacío', () => {
    expect(getErrorMessage({})).toBe('Ha ocurrido un error inesperado.');
  });
});

describe('EMERGENCY_FEE', () => {
  it('es 50', () => {
    expect(EMERGENCY_FEE).toBe(50);
  });
});