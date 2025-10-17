// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();

/* ====== Configuración base ====== */

// Confiar en proxy (Render/Railway/Vercel) para X-Forwarded-*
app.set('trust proxy', 1);

// CORS: permite tu front en prod y el local de desarrollo
const allowedOrigins = [
  process.env.FRONTEND_URL,         // ej: https://tu-frontend.netlify.app
  'http://localhost:5173',          // Vite dev
].filter(Boolean);

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));

// Body parser
app.use(express.json({ limit: '1mb' }));

/* ====== Rutas API ====== */
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/courses', require('./routes/course.routes'));
app.use('/api/classrooms', require('./routes/classroom.routes'));
app.use('/api/schedules', require('./routes/schedule.routes'));

// Healthcheck simple (útil para Render/Railway)
app.get('/health', (_req, res) => {
  res.status(200).json({ ok: true, env: process.env.NODE_ENV || 'development' });
});

// Ruta de prueba
app.get('/', (_req, res) => {
  res.send('API funcionando');
});

/* ====== Conexión DB ====== */
connectDB();

/* ====== Manejadores de error/404 ====== */
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Ruta no encontrada' });
});

app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Error interno del servidor',
  });
});

/* ====== Arranque servidor ====== */
const PORT = process.env.PORT || 4000;
const server = app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

/* ====== Apagado elegante ====== */
const shutdown = (signal) => {
  console.log(`\nRecibido ${signal}, cerrando servidor...`);
  server.close(() => {
    console.log('Servidor cerrado. Hasta luego 👋');
    process.exit(0);
  });
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
