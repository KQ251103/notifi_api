require('dotenv').config();
const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;


// Verificar si todas las variables esenciales están cargadas correctamente
const requiredEnvVariables = [
  'FIREBASE_API_KEY',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_PRIVATE_KEY_ID',
  'FIREBASE_PRIVATE_KEY',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_CLIENT_ID',
  'FIREBASE_DATABASE_URL',
];

requiredEnvVariables.forEach((varName) => {
  if (!process.env[varName]) {
    console.error(`⚠️  Variable de entorno faltante: ${varName}`);
  } else {
    console.log(`✅ ${varName} cargada correctamente`);
  }
});

// Asegurar que el Private Key está bien formateado
const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
if (!privateKey) {
  console.error('❌ Firebase llave privada no encontrada o mal configurada.');
  process.exit(1);

}
const serviceAccount = {
  type: "service_account",
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: privateKey,
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: process.env.FIREBASE_AUTH_URI,
  token_uri: process.env.FIREBASE_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_CERT_URL,
  client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL,
  universe_domain: process.env.FIREBASE_UNIVERSE_DOMAIN
};

// Inicializar Firebase
try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL,
  });
  console.log('✅ Firebase inicializado correctamente');
} catch (error) {
  console.error('❌ Error al inicializar Firebase:', error);
  process.exit(1);
}

// Middleware
app.use(cors());
app.use(express.json());

// Referencia a la base de datos
const db = admin.database();
const transaccionesRef = db.ref('transacciones');

// Ruta GET

app.get('/api/transacciones', async (req, res) => {
  try {
    const snapshot = await transaccionesRef.once('value');
    const transacciones = snapshot.val();
    res.status(200).json(transacciones || {});
  } catch (error) {
    console.error('Error al obtener las transacciones:', error);
    res.status(500).json({ error: 'Error al obtener las transacciones' });
  }
});

app.post('/api/transacciones', async (req, res) => {
  const { nombreAplicacion, nombreUsuario, dineroTransaccionado } = req.body;
  if (!nombreAplicacion || !nombreUsuario || !dineroTransaccionado) {
    return res.status(400).json({ error: 'Faltan datos obligatorios' });
  }
  try {
    const nuevaTransaccion = {
      nombreAplicacion,
      nombreUsuario,
      dineroTransaccionado,
      fechaTransaccion: new Date().toISOString(),
    };
    const nuevaTransaccionRef = await transaccionesRef.push(nuevaTransaccion);
    res.status(201).json({
      id: nuevaTransaccionRef.key,
      mensaje: 'Transacción guardada correctamente',
      transaccion: nuevaTransaccion,
    });
  } catch (error) {
    console.error('Error al guardar la transacción:', error);
    res.status(500).json({ error: 'Error al guardar la transacción' });
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
