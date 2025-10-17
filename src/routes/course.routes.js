// src/routes/course.routes.js
const express = require('express');
const router = express.Router();

const ctrl = require('../controllers/course.controller');
// Si quieres proteger con auth, importa tu middleware y descomenta donde quieras:
// const { authMiddleware } = require('../middleware/authMiddleware');

// GET /api/courses?semester=1
router.get('/', ctrl.listCourses);

// POST /api/courses
router.post('/', /* authMiddleware, */ ctrl.createCourse);

// PUT /api/courses/:id
router.put('/:id', /* authMiddleware, */ ctrl.updateCourse);

// DELETE /api/courses/:id
router.delete('/:id', /* authMiddleware, */ ctrl.deleteCourse);

module.exports = router;
