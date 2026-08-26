/**
 * Constants used across the application
 * Identifiers in English, UI labels in Spanish
 */

export const ROLES = {
  ADMIN: 'admin',
  CLIENT: 'client'
};

export const APPOINTMENT_STATUS = {
  PENDIENTE: 'pendiente',
  ACEPTADA: 'aceptada',
  RECHAZADA: 'rechazada',
  REPROGRAMADA: 'reprogramada',
  COMPLETADA: 'completada',
  CANCELADA: 'cancelada'
};

export const APPOINTMENT_STATUS_LABELS = {
  pendiente: 'Pendiente',
  aceptada: 'Aceptada',
  rechazada: 'Rechazada',
  reprogramada: 'Reprogramada',
  completada: 'Completada',
  cancelada: 'Cancelada'
};

export const APPOINTMENT_STATUS_COLORS = {
  pendiente: '#f59e0b',
  aceptada: '#10b981',
  rechazada: '#ef4444',
  reprogramada: '#3b82f6',
  completada: '#6b7280',
  cancelada: '#9ca3af'
};

export const EMERGENCY_FEE = 50;

export const COLLECTIONS = {
  USERS: 'users',
  SERVICES: 'services',
  AVAILABILITY: 'availability',
  APPOINTMENTS: 'appointments',
  NOTIFICATIONS: 'notifications'
};

export const CLOUD_FUNCTIONS = {
  CREATE_APPOINTMENT: 'createAppointment',
  RESCHEDULE_APPOINTMENT: 'rescheduleAppointment',
  UPDATE_APPOINTMENT_STATUS: 'updateAppointmentStatus',
  CANCEL_APPOINTMENT: 'cancelAppointment',
  CREATE_SERVICE: 'createService',
  UPDATE_SERVICE: 'updateService',
  DELETE_SERVICE: 'deleteService',
  SET_AVAILABILITY: 'setAvailability',
  BLOCK_DAY: 'blockDay',
  SET_USER_ROLE: 'setUserRole'
};
