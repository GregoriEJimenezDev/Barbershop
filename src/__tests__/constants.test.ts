import { ROLES, ROLE_LABELS, APPOINTMENT_STATUS, APPOINTMENT_STATUS_LABELS, APPOINTMENT_STATUS_COLORS, COLLECTIONS, EMERGENCY_FEE } from '../utils/constants';

describe('ROLES', () => {
  it('tiene los roles definidos', () => {
    expect(ROLES).toHaveProperty('SUPERADMIN');
    expect(ROLES).toHaveProperty('BARBER');
    expect(ROLES).toHaveProperty('CLIENT');
    expect(ROLES.SUPERADMIN).toBe('superadmin');
    expect(ROLES.BARBER).toBe('barber');
    expect(ROLES.CLIENT).toBe('client');
  });
});

describe('ROLE_LABELS', () => {
  it('tiene etiquetas de roles en español', () => {
    expect(ROLE_LABELS.superadmin).toBe('Dueño');
    expect(ROLE_LABELS.barber).toBe('Barbero');
    expect(ROLE_LABELS.client).toBe('Cliente');
  });
});

describe('APPOINTMENT_STATUS', () => {
  it('tiene todos los estados de cita', () => {
    expect(APPOINTMENT_STATUS).toHaveProperty('PENDIENTE');
    expect(APPOINTMENT_STATUS).toHaveProperty('ACEPTADA');
    expect(APPOINTMENT_STATUS).toHaveProperty('RECHAZADA');
    expect(APPOINTMENT_STATUS).toHaveProperty('REPROGRAMADA');
    expect(APPOINTMENT_STATUS).toHaveProperty('COMPLETADA');
    expect(APPOINTMENT_STATUS).toHaveProperty('CANCELADA');
  });
});

describe('APPOINTMENT_STATUS_LABELS', () => {
  it('tiene etiquetas en español', () => {
    expect(APPOINTMENT_STATUS_LABELS.pendiente).toBe('Pendiente');
    expect(APPOINTMENT_STATUS_LABELS.aceptada).toBe('Aceptada');
    expect(APPOINTMENT_STATUS_LABELS.rechazada).toBe('Rechazada');
  });
});

describe('APPOINTMENT_STATUS_COLORS', () => {
  it('tiene colores por estado', () => {
    expect(APPOINTMENT_STATUS_COLORS.pendiente).toBe('#f59e0b');
    expect(APPOINTMENT_STATUS_COLORS.aceptada).toBe('#10b981');
    expect(APPOINTMENT_STATUS_COLORS.rechazada).toBe('#ef4444');
  });
});

describe('COLLECTIONS', () => {
  it('tiene todas las colecciones de Firestore', () => {
    expect(COLLECTIONS).toHaveProperty('USERS');
    expect(COLLECTIONS).toHaveProperty('BARBERS');
    expect(COLLECTIONS).toHaveProperty('SERVICES');
    expect(COLLECTIONS).toHaveProperty('APPOINTMENTS');
    expect(COLLECTIONS.USERS).toBe('users');
  });
});

describe('EMERGENCY_FEE', () => {
  it('es 50', () => {
    expect(EMERGENCY_FEE).toBe(50);
  });
});