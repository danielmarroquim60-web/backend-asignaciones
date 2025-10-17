const { Router } = require('express');
const auth = require('../middlewares/auth.middleware');
const { allowRoles } = require('../middlewares/roles.middleware');
const ctrl = require('../controllers/auth.controller'); // <-- solo una vez

const router = Router();

// Registro: protegido para admin y coordinator (p.ej. para crear profesores).
router.post('/register', auth, allowRoles('admin', 'coordinator'), ctrl.register);

// Login: público
router.post('/login', ctrl.login);

// Perfil propio: requiere token
router.get('/me', auth, ctrl.me);

// Listar usuarios (opcionalmente por rol: ?role=professor)
router.get('/users', auth, allowRoles('admin', 'coordinator'), ctrl.listUsers);

// Actualiza los datos de un usuario existente (admin o coordinator)
router.put('/users/:id', auth, allowRoles('admin', 'coordinator'), ctrl.updateUser);

// Desactiva un usuario existente (admin o coordinator)
router.delete('/users/:id', auth, allowRoles('admin', 'coordinator'), ctrl.deleteUser);

module.exports = router; // <-- al final, después de definir todas las rutas
