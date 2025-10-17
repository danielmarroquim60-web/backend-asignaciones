// src/routes/schedule.routes.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/schedule.controller');

// Intentamos cargar el middleware de auth si existe.
// Ruta según lo que comentaste: src/middleware/authMiddleware.js
let authMiddleware = null;
try {
  const m = require('../middleware/authMiddleware');
  // Acepta varias formas de export:
  // module.exports = fn
  // module.exports.default = fn
  // module.exports.authMiddleware = fn
  authMiddleware = m.authMiddleware || m.default || m;
  if (typeof authMiddleware !== 'function') {
    authMiddleware = null;
  }
} catch (_) {
  // Si no existe el archivo, seguimos sin auth
  authMiddleware = null;
}

// Helper para aplicar condicionalmente el middleware
const protect = authMiddleware ? [authMiddleware] : [];

// Rutas
router.get('/', ...protect, ctrl.getSchedules);
router.post('/', ...protect, ctrl.createSchedule);
router.put('/:id', ...protect, ctrl.updateSchedule);
router.delete('/:id', ...protect, ctrl.deleteSchedule);

module.exports = router;
