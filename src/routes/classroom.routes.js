// src/routes/classroom.routes.js
const { Router } = require('express');
const { create, list, update, remove } = require('../controllers/classroom.controller');
const auth = require('../middlewares/auth.middleware');
const { allowRoles } = require('../middlewares/roles.middleware');

const router = Router();

router.get('/', auth, list);
router.post('/', auth, allowRoles('admin', 'coordinator'), create);
router.put('/:id', auth, allowRoles('admin', 'coordinator'), update);
router.delete('/:id', auth, allowRoles('admin', 'coordinator'), remove);

module.exports = router; // <-- siempre al final
