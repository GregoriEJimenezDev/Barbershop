# 🔧 Configuración de Firebase — Paso a paso

Esta guía te lleva desde cero hasta poder crear barberos desde el panel admin.

## 1. Crear proyecto Firebase (si no lo tienes)

1. Ve a https://console.firebase.google.com/
2. Click **"Agregar proyecto"** → dale un nombre (ej: `barberia-premium`)
3. Acepta los términos y crea el proyecto (puedes deshabilitar Analytics por ahora)

## 2. Habilitar Authentication

1. En el menú lateral → **Authentication** → **Get started**
2. Pestaña **Sign-in method**
3. Habilita **Email/Password** (click → Enable → Save)
4. Habilita **Google** (click → Enable → ingresa el email de soporte → Save)

## 3. Crear base de datos Firestore

1. En el menú lateral → **Firestore Database** → **Crear base de datos**
2. Elige **Iniciar en modo de producción** (las reglas restrictivas lo requieren)
3. Elige una ubicación:
   - `us-central1` (Iowa, USA)
   - `southamerica-east1` (São Paulo, Brasil — recomendado para RD)
4. Click **Habilitar**

## 4. Habilitar Cloud Functions

1. En el menú lateral → **Functions** → **Get started**
2. Te pedirá **upgrade a plan Blaze** (pay as you go). Es necesario para Cloud Functions.
   - **No te preocupes**, el plan Blaze tiene un tier gratuito generoso.
   - Solo pagarás si excedes los límites (millones de invocaciones).
3. Click **Continue** y acepta

## 5. Obtener credenciales del Frontend

1. En ⚙️ **Configuración del proyecto** (ícono engranaje arriba a la izquierda)
2. Baja hasta **"Tus apps"**
3. Click en el ícono **`</>`** (Web app)
4. Dale un apodo (ej: "Web Barbershop") → **Registrar app**
5. **NO marques** "También configurar Firebase Hosting" (lo haremos después)
6. Copia el objeto `firebaseConfig`:

```js
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "tu-proyecto.firebaseapp.com",
  projectId: "tu-proyecto",
  storageBucket: "tu-proyecto.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123:web:abc"
};
```

## 6. Editar el archivo `.env`

Edita `barberia-app/.env` con tus valores:

```env
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu-proyecto
VITE_FIREBASE_STORAGE_BUCKET=tu-proyecto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123:web:abc
```

## 7. Editar `.firebaserc`

Edita `barberia-app/.firebaserc`:

```json
{
  "projects": {
    "default": "tu-proyecto"
  }
}
```

## 8. Obtener Service Account (para crear el primer superadmin)

1. ⚙️ **Configuración del proyecto** → **Cuentas de servicio**
2. Click en **"Generar nueva clave privada"**
3. Se descargará un archivo JSON
4. Renómbralo a `service-account.json`
5. Muévelo a `barberia-app/scripts/service-account.json`

## 9. Instalar Firebase CLI

```bash
npm install -g firebase-tools
firebase login
```

## 10. Desplegar reglas y Cloud Functions

Desde la carpeta `barberia-app`:

```bash
cd functions && npm install && cd ..

firebase deploy --only firestore:rules,firestore:indexes
firebase deploy --only functions
```

Esto sube las reglas de seguridad y las funciones a Firebase. Tarda 1-2 minutos.

## 11. Crear el primer superadmin

```bash
node scripts/bootstrap-superadmin.js tu@email.com TuPassword123 "Tu Nombre"
```

Reemplaza:
- `tu@email.com` → tu email
- `TuPassword123` → tu contraseña (mínimo 6 caracteres)
- `"Tu Nombre"` → tu nombre

Este script:
1. Crea el usuario en Firebase Auth
2. Crea el documento en Firestore con `role: 'superadmin'`
3. Asigna custom claims para las reglas de seguridad

## 12. Probar la app

```bash
npm run dev
```

Abre http://localhost:5173/, inicia sesión con el email/password del superadmin.

Una vez dentro:
- Ve a `/admin/barberos` (o click "Barberos" en el panel)
- Click **"+ Nuevo barbero"**
- Llena el formulario con email, password, nombre, etc.
- Click **Crear barbero**
- El barbero se crea en Firebase Auth + Firestore

## 13. Verificar en Firebase Console

1. **Authentication** → debería aparecer el barbero
2. **Firestore** → colección `barbers` → debería estar el documento

## 14. (Opcional) Desplegar frontend a Firebase Hosting

```bash
npm run build
firebase deploy --only hosting
```

Tu sitio quedará en `https://tu-proyecto.web.app`

## Troubleshooting

### "Missing or insufficient permissions"
Las reglas de Firestore están bloqueando. Verifica que desplegaste `firestore.rules` con el comando del paso 10.

### "Function not found"
Las Cloud Functions no se desplegaron. Repite el paso 10.

### "auth/email-already-in-use"
El email ya existe. Ve a Authentication → elimina el usuario o usa otro email.

### El barbero se crea pero no puede iniciar sesión
Verifica que el documento en `users/{uid}` tiene `role: 'barber'`. Si no, edítalo manualmente en Firestore.

### "Your project must be on the Blaze plan"
Cloud Functions requieren plan Blaze. Upgrade en Firebase Console → ⚙️ → Plan.
