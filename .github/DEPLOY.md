# 🚀 CI/CD con GitHub Actions

Este repositorio incluye dos workflows automatizados en `.github/workflows/`:

## 📋 Workflows

### 1. `deploy.yml` — Despliegue a Firebase (producción)
Se ejecuta automáticamente en cada `push` a `main` o manualmente desde la pestaña **Actions**.

Pasos:
1. Instala dependencias (raíz + functions)
2. Verifica TypeScript de las Cloud Functions
3. Compila las Cloud Functions → `functions/lib`
4. Compila el frontend con Vite → `dist`
5. Despliega reglas e índices de Firestore
6. Despliega las Cloud Functions
7. Despliega el Hosting

### 2. `ci.yml` — Build & Test en Pull Requests
Se ejecuta en cada PR hacia `main`. Verifica que el código compile sin errores sin desplegar nada.

## ⚙️ Configuración necesaria en GitHub

### Paso 1: Generar el token de Firebase

```bash
# Instala Firebase CLI si no la tienes
npm install -g firebase-tools

# Inicia sesión
firebase login

# Genera el token (CI token)
firebase login:ci
```

Copia el token que aparece (es un string largo tipo `1//0abc...`).

### Paso 2: Agregar los secrets en GitHub

Ve a tu repositorio en GitHub:
**Settings → Secrets and variables → Actions → New repository secret**

Agrega estos dos secrets:

| Secret | Valor |
|--------|-------|
| `FIREBASE_TOKEN` | El token generado en el paso 1 |
| `FIREBASE_PROJECT_ID` | Tu Project ID de Firebase (ej: `barbershop-12345`) |

### Paso 3: Actualizar `.firebaserc`

Edita el archivo `.firebaserc` en la raíz del proyecto:

```json
{
  "projects": {
    "default": "TU-PROJECT-ID-AQUI"
  }
}
```

Reemplaza con tu Project ID real.

### Paso 4: Hacer push

```bash
git add .
git commit -m "ci: agregar GitHub Actions workflows"
git push origin main
```

Ve a la pestaña **Actions** de tu repo y verás el deploy ejecutándose. ✅

## 🎯 Resultado

Cada vez que hagas `git push` a `main`:
- ✅ Se ejecutan lint + typecheck + build
- ✅ Se despliegan reglas, funciones y hosting automáticamente
- ✅ Tu sitio queda actualizado en `https://TU-PROYECTO.web.app`

## 🔄 Deploy manual desde GitHub

También puedes disparar el deploy sin hacer push:
1. Ve a la pestaña **Actions**
2. Selecciona **"Deploy to Firebase Hosting"**
3. Click en **"Run workflow"** → **"Run workflow"**

## 🛡️ Seguridad

- Los secrets **nunca** se suben al repo (`.gitignore` ya excluye `.env`).
- El token de Firebase solo permite despliegues, no acceso a datos de usuarios.
- Si el token se filtra, puedes revocarlo y regenerarlo en cualquier momento:
  ```bash
  firebase login:ci --reauth
  ```

## 🐛 Troubleshooting

**Error: "Failed to authenticate, have you run firebase login?"**
→ El secret `FIREBASE_TOKEN` no está configurado o es incorrecto.

**Error: "HTTP Error: 403, The caller does not have permission"**
→ Tu cuenta de Firebase no tiene permisos de Owner/Editor en el proyecto.

**Error: "Project ID mismatch"**
→ Verifica que `.firebaserc` tenga el mismo Project ID que el secret `FIREBASE_PROJECT_ID`.
