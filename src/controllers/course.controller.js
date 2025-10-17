const Course = require('../models/course');

// GET /api/courses?semester=1
exports.listCourses = async (req, res) => {
  try {
    const { semester } = req.query;
    const filter = {};
    if (semester !== undefined) {
      const sem = parseInt(semester);
      if (!Number.isNaN(sem)) filter.semester = sem;
    }
    const courses = await Course.find(filter).sort({ code: 1 });
    res.json(courses);
  } catch (err) {
    res.status(500).json({ error: 'Error al listar cursos' });
  }
};

// POST /api/courses
exports.createCourse = async (req, res) => {
  try {
    const { code, name, credits, semester, description } = req.body;
    const course = await Course.create({
      code,
      name,
      credits,
      semester,
      description: description || ''
    });
    res.status(201).json(course);
  } catch (err) {
    res.status(400).json({ error: err.message || 'Error al crear curso' });
  }
};

// PUT /api/courses/:id
exports.updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const { code, name, credits, semester, description } = req.body;

    const updated = await Course.findByIdAndUpdate(
      id,
      { code, name, credits, semester, description },
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ error: 'Curso no encontrado' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message || 'Error al actualizar curso' });
  }
};

// DELETE /api/courses/:id
exports.deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;
    await Course.findByIdAndDelete(id);
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: err.message || 'Error al eliminar curso' });
  }
};
