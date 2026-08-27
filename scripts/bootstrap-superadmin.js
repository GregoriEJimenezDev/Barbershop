/**
 * bootstrap-superadmin.js
 *
 * Creates the FIRST superadmin user in Firebase Auth + Firestore.
 * This should be run ONCE when setting up the project.
 *
 * Usage:
 *   node scripts/bootstrap-superadmin.js <email> <password> <name>
 *
 * Example:
 *   node scripts/bootstrap-superadmin.js admin@barberia.com secret123 "Admin Barberia"
 *
 * Requirements:
 *   - Service account credentials JSON in scripts/service-account.json
 *   - The project must have NO existing superadmin (otherwise security check fails)
 */

import { existsSync, readFileSync } from 'fs';
import { resolve, join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Try to load firebase-admin
let admin;
try {
  admin = await import('firebase-admin');
} catch (e) {
  console.error('firebase-admin no está instalado. Ejecuta: npm install firebase-admin');
  process.exit(1);
}

const args = process.argv.slice(2);
if (args.length < 3) {
  console.error('Uso: node scripts/bootstrap-superadmin.js <email> <password> <name>');
  console.error('Ejemplo: node scripts/bootstrap-superadmin.js admin@barberia.com secret123 "Admin"');
  process.exit(1);
}

const [email, password, name] = args;
const serviceAccountPath = join(__dirname, 'service-account.json');

if (!existsSync(serviceAccountPath)) {
  console.error('');
  console.error('❌ No se encontró scripts/service-account.json');
  console.error('');
  console.error('Para obtenerlo:');
  console.error('1. Ve a Firebase Console → ⚙️ Configuración del proyecto → Cuentas de servicio');
  console.error('2. Click en "Generar nueva clave privada"');
  console.error('3. Se descargará un archivo JSON. Renómbralo a service-account.json');
  console.error('4. Colócalo en la carpeta scripts/');
  console.error('');
  process.exit(1);
}

const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf-8'));

if (!admin.default.apps.length) {
  admin.default.initializeApp({
    credential: admin.default.credential.cert(serviceAccount)
  });
}

const db = admin.default.firestore();
const auth = admin.default.auth();

async function bootstrap() {
  try {
    // Check if there is already a superadmin
    const superadmins = await db.collection('users').where('role', '==', 'superadmin').get();
    if (!superadmins.empty) {
      console.error('❌ Ya existe al menos un superadmin. Aborta por seguridad.');
      console.error('   Para promover otro usuario, usa la función setUserRole desde un superadmin existente.');
      process.exit(1);
    }

    console.log('→ Creando usuario en Firebase Auth...');
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: name,
      emailVerified: true
    });
    console.log(`  ✓ Usuario creado: ${userRecord.uid}`);

    console.log('→ Creando perfil en Firestore...');
    const now = admin.default.firestore.FieldValue.serverTimestamp();
    await db.collection('users').doc(userRecord.uid).set({
      uid: userRecord.uid,
      name,
      email,
      phone: '',
      photoURL: '',
      role: 'superadmin',
      createdAt: now,
      updatedAt: now
    });
    console.log('  ✓ Perfil creado');

    console.log('→ Asignando custom claims...');
    await auth.setCustomUserClaims(userRecord.uid, { role: 'superadmin' });
    console.log('  ✓ Claims asignados');

    console.log('');
    console.log('✅ Superadmin creado con éxito');
    console.log(`   Email: ${email}`);
    console.log(`   UID:   ${userRecord.uid}`);
    console.log('');
    console.log('Ahora puedes iniciar sesión en la app y crear barberos desde el panel admin.');
  } catch (e) {
    console.error('❌ Error:', e.message);
    process.exit(1);
  }
}

bootstrap();
