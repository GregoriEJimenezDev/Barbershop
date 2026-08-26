# Barbería App — Sistema de Gestión de Citas

Aplicación web full-stack para gestión de citas de una peluquería/barbería con
un único barbero/administrador. Los clientes se registran, consultan precios
y reservan citas con cupos limitados. Las citas de emergencia tienen un
recargo de **RD$50** y requieren aprobación manual del barbero.

## ✨ Características

- **Landing page** con escena 3D interactiva (Three.js / React Three Fiber)
  de la silla de barbero y tijeras flotantes animadas.
- **Sistema de autenticación** con Firebase Auth (email/password y Google).
- **Dos roles**: `admin` (barbero) y `client`.
- **Cartelera de precios** dinámica y editable.
- **Agenda de citas** con control de cupos por día, validación en backend.
- **Citas de emergencia** con recargo automático de RD$50.
- **Reprogramación** de citas por parte del barbero.
- **Bloqueo de días** (feriados / ausencias).
- **Reglas de seguridad Firestore** que refuerzan las reglas de negocio.
- **Cloud Functions** que aplican toda la lógica crítica del lado servidor.
- **Diseño responsive** mobile-first con sistema de tokens (color, tipografía,
  espaciado, radios, sombras).
- **Notificaciones in-app** + push (FCM) opcionales.

## 🛠️ Stack

| Capa | Tecnología |
| --- | --- |
| Frontend | React 18, JavaScript, Vite, React Router 6 |
| 3D | Three.js, @react-three/fiber, @react-three/drei |
| Auth + DB | Firebase Authentication, Cloud Firestore |
| Backend | Firebase Cloud Functions (TypeScript) |
| Hosting | Firebase Hosting |
| Fechas | date-fns |

## 📁 Estructura del proyecto

```
barberia-app/
├── firebase.json
├── firestore.rules
├── firestore.indexes.json
├── .firebaserc
├── package.json
├── vite.config.js
├── index.html
├── public/
│   └── favicon.svg
├── functions/
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       └── index.ts          # Cloud Functions (lógica de negocio)
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── components/
    │   ├── layout/Layout.jsx
    │   ├── ui/                # Componentes reutilizables
    │   │   ├── Calendar.jsx
    │   │   ├── TimeSlots.jsx
    │   │   ├── AppointmentCard.jsx
    │   │   ├── PriceBoard.jsx
    │   │   ├── StatusBadge.jsx
    │   │   ├── Modal.jsx
    │   │   ├── Loader.jsx
    │   │   └── Alert.jsx
    │   ├── three/             # Escena 3D
    │   │   ├── BarberScene3D.jsx
    │   │   ├── BarberChair.jsx
    │   │   └── FloatingScissors.jsx
    │   ├── auth/
    │   ├── client/
    │   │   └── BookingForm.jsx
    │   └── admin/
    │       ├── ServiceFormModal.jsx
    │       ├── AvailabilityManager.jsx
    │       └── RescheduleModal.jsx
    ├── context/
    │   └── AuthContext.jsx
    ├── hooks/
    │   ├── useAsyncAction.js
    │   └── useFirestoreSubscription.js
    ├── pages/
    │   ├── LandingPage.jsx
    │   ├── LoginPage.jsx
    │   ├── RegisterPage.jsx
    │   ├── ClientDashboard.jsx
    │   ├── AdminDashboard.jsx
    │   └── NotFoundPage.jsx
    ├── services/              # Capa de datos (Firebase)
    │   ├── firebase.config.js
    │   ├── auth.service.js
    │   ├── services.service.js
    │   ├── availability.service.js
    │   └── appointments.service.js
    ├── utils/
    │   ├── constants.js
    │   └── helpers.js
    └── styles/
        ├── index.css
        ├── globals.css       # Tokens + reset
        ├── components.css    # Botones, inputs, cards, etc.
        ├── layout.css        # Header, footer, page
        ├── landing.css       # Estilos del hero / secciones
        ├── auth.css          # Login / register
        ├── admin.css         # Dashboard admin
        ├── client.css        # Dashboard cliente
        └── three.css         # Wrapper 3D
```

## 🚀 Instalación

### 1. Clonar e instalar dependencias

```bash
cd barberia-app
npm install
cd functions
npm install
cd ..
```

### 2. Configurar Firebase

1. Crea un proyecto en [Firebase Console](https://console.firebase.google.com/).
2. Habilita **Authentication** → Email/Password y Google.
3. Crea una base de datos **Firestore** en modo producción.
4. Habilita **Cloud Functions** (plan Blaze necesario para push notifications).
5. Copia las credenciales de tu proyecto a `.env` (basado en `.env.example`):

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_EMERGENCY_FEE=50
```

6. Actualiza `.firebaserc` con tu `projectId`.

### 3. Desplegar reglas, índices y Cloud Functions

```bash
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
firebase deploy --only functions
```

### 4. Desarrollo local

```bash
npm run dev          # frontend en http://localhost:5173
```

Para ejecutar Firebase emulators (recomendado en desarrollo):

```bash
firebase emulators:start
```

### 5. Compilar y desplegar hosting

```bash
npm run build
firebase deploy --only hosting
```

## 👤 Crear el primer administrador

Por seguridad, los usuarios nuevos se registran como `client`. Para crear el
primer admin hay dos opciones:

### Opción A — Bootstrap automático

1. Despliega las Cloud Functions.
2. Regístrate normalmente en la app.
3. Desde la consola de Firebase, abre **Cloud Functions** logs o usa el shell:

```bash
firebase functions:shell
> setUserRole({ uid: 'TU_UID', role: 'admin' })
```

Como no hay admins aún, la función `setUserRole` se "auto-promueve" y
te permite crear el primer admin.

### Opción B — Manualmente

1. Ve a Firestore → colección `users/{uid}`.
2. Edita el campo `role` a `"admin"`.

## 🧠 Reglas de negocio implementadas

Toda la lógica sensible vive en **Cloud Functions** y se valida también en
**Firestore Rules** (defensa en profundidad).

1. **Cupos por día**: validados en `createAppointment` y `rescheduleAppointment`
   consultando `availability/{dateId}.maxAppointments`.
2. **Recargo por emergencia**: RD$50 se aplica automáticamente si
   `isEmergency=true`. Las reglas de Firestore rechazan citas con
   `extraFee` inconsistente.
3. **Día bloqueado**: la UI lo muestra deshabilitado y el servidor rechaza
   la creación de citas.
4. **Slot ocupado**: el servidor cuenta citas `pendiente|aceptada` y rechaza
   si la hora ya está tomada.
5. **Reprogramación**: reválida disponibilidad y cupo del nuevo día antes
   de guardar.
6. **Transición de estados**: solo el admin puede aceptar/rechazar/completar;
   el cliente solo puede cancelar citas en estado `pendiente` o `aceptada`.

## 🎨 Sistema de diseño

Los tokens están en `src/styles/globals.css` y siguen los principios
**SOLID** del diseño (consistencia, jerarquía, simplicidad):

- **Colores**: paleta oscura con acento dorado cobrizo (#c9a45c).
- **Tipografía**: Inter (UI) + Playfair Display (display/títulos).
- **Espaciado**: escala 4px (`--space-1` a `--space-20`).
- **Radios**: 6px → 24px → full.
- **Sombras**: incluye `--shadow-glow` para elementos destacados.
- **Movimiento**: transiciones de 150ms (fast) a 400ms (slow).
- **Mobile-first**: breakpoints a 640px, 768px y 1024px.

## 📐 Arquitectura

Se sigue **separación de capas** estricta:

- **UI (componentes)**: presentacionales, sin lógica de negocio.
- **Hooks**: estado, suscripciones y acciones async reutilizables.
- **Services**: única capa que habla con Firebase.
- **Cloud Functions**: fuente de verdad para reglas de negocio críticas.
- **Firestore Rules**: enforcement de seguridad adicional.

Principios **SOLID** aplicados:
- **SRP**: cada servicio / componente tiene una única responsabilidad.
- **OCP**: componentes UI reutilizables extensibles sin modificación
  (Calendar, TimeSlots, PriceBoard, AppointmentCard).
- **DIP**: las páginas dependen de hooks / servicios, no de Firebase directo.

## 📦 Modelos de Firestore

### `users/{uid}`
```js
{ uid, name, email, phone, role: 'admin'|'client', createdAt, updatedAt }
```

### `services/{serviceId}`
```js
{ name, description, price, durationMinutes, active, createdAt, updatedAt }
```

### `availability/{YYYY-MM-DD}`
```js
{ date, maxAppointments, timeSlots: ['09:00', ...], blocked: false }
```

### `appointments/{appointmentId}`
```js
{
  clientId, clientName, serviceId, serviceName,
  basePrice, extraFee, totalPrice,
  date, time, isEmergency,
  status: 'pendiente'|'aceptada'|'rechazada'|'reprogramada'|'completada'|'cancelada',
  createdAt, updatedAt
}
```

## 🧪 Scripts útiles

```bash
npm run dev          # Servidor de desarrollo
npm run build        # Build de producción
npm run preview      # Previsualizar build
npm run lint         # ESLint
```

## 📄 Licencia

MIT — Construido con ♥ para una barbería real.
