// src/controllers/schedule.controller.js
const Schedule = require('../models/schedule');
const Course = require('../models/course');
const User = require('../models/user');
const Classroom = require('../models/classroom');

/** Utilidad: solapamiento de horarios */
function overlaps(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && bStart < aEnd;
}

/**
 * GET /api/schedules
 * Filtros opcionales: professor, classroom, day, year, cycle, semester, section
 */
exports.getSchedules = async (req, res) => {
  try {
    const { professor, classroom, day, year, cycle, semester, section } = req.query;

    const q = {};
    if (professor) q.professor = professor;
    if (classroom) q.classroom = classroom;
    if (day !== undefined) q.day = Number(day);
    if (year !== undefined) q.year = Number(year);
    if (cycle !== undefined) q.cycle = Number(cycle);
    if (semester !== undefined) q.semester = Number(semester);
    if (section) q.section = section.trim();

    const schedules = await Schedule.find(q)
      .populate('course')
      .populate('professor')
      .populate('classroom')
      .sort({ day: 1, startMinutes: 1, createdAt: -1 });

    return res.json(schedules);
  } catch (err) {
    console.error('getSchedules error:', err);
    return res.status(500).json({ message: 'Error al obtener horarios' });
  }
};

/**
 * POST /api/schedules
 * body: { course, professor, classroom, day, startMinutes, endMinutes, year, cycle, semester, section }
 */
exports.createSchedule = async (req, res) => {
  try {
    const {
      course,
      professor,
      classroom,
      day,
      startMinutes,
      endMinutes,
      year,
      cycle,
      semester,
      section,
    } = req.body;

    if (!section || section.trim() === '') {
      return res.status(400).json({ message: 'Debe especificar la sección' });
    }

    // Validaciones rápidas de existencia
    const [c, p, r] = await Promise.all([
      Course.findById(course),
      User.findById(professor),
      Classroom.findById(classroom),
    ]);
    if (!c) return res.status(400).json({ message: 'Curso inválido' });
    if (!p) return res.status(400).json({ message: 'Profesor inválido' });
    if (!r) return res.status(400).json({ message: 'Salón inválido' });

    // Validación: fin mayor que inicio
    if (endMinutes <= startMinutes) {
      return res.status(400).json({ message: 'La hora de fin debe ser mayor a la de inicio.' });
    }

    // Conflictos:
    // a) profesor ocupado
    const profConflicts = await Schedule.find({
      professor,
      day,
      year,
      cycle,
      semester,
    });

    if (profConflicts.some(s => overlaps(startMinutes, endMinutes, s.startMinutes, s.endMinutes))) {
      return res
        .status(400)
        .json({ message: 'Conflicto: el profesor ya tiene un horario en ese rango.' });
    }

    // b) salón ocupado
    const roomConflicts = await Schedule.find({
      classroom,
      day,
      year,
      cycle,
      semester,
    });

    if (roomConflicts.some(s => overlaps(startMinutes, endMinutes, s.startMinutes, s.endMinutes))) {
      return res
        .status(400)
        .json({ message: 'Conflicto: el salón ya está ocupado en ese rango.' });
    }

    // c) sección ocupada (no puede tener dos cursos a la misma hora)
    const sectionConflicts = await Schedule.find({
      section: section.trim(),
      day,
      year,
      cycle,
      semester,
    });

    if (sectionConflicts.some(s => overlaps(startMinutes, endMinutes, s.startMinutes, s.endMinutes))) {
      return res
        .status(400)
        .json({ message: 'Conflicto: la sección ya tiene un curso en ese horario.' });
    }

    const newSchedule = await Schedule.create({
      course,
      professor,
      classroom,
      day,
      startMinutes,
      endMinutes,
      year,
      cycle,
      semester,
      section: section.trim(),
    });

    const populated = await Schedule.findById(newSchedule._id)
      .populate('course')
      .populate('professor')
      .populate('classroom');

    return res.status(201).json(populated);
  } catch (err) {
    console.error('createSchedule error:', err);
    return res.status(400).json({ message: err.message || 'Error al crear horario' });
  }
};

/**
 * PUT /api/schedules/:id
 * body: campos parciales
 */
exports.updateSchedule = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await Schedule.findById(id);
    if (!existing) return res.status(404).json({ message: 'Horario no encontrado' });

    // Preparamos los nuevos valores sobre el doc actual (sin guardar todavía)
    const nextValues = {
      course: req.body.course ?? existing.course,
      professor: req.body.professor ?? existing.professor,
      classroom: req.body.classroom ?? existing.classroom,
      day: req.body.day ?? existing.day,
      startMinutes: req.body.startMinutes ?? existing.startMinutes,
      endMinutes: req.body.endMinutes ?? existing.endMinutes,
      year: req.body.year ?? existing.year,
      cycle: req.body.cycle ?? existing.cycle,
      semester: req.body.semester ?? existing.semester,
      section: req.body.section?.trim() ?? existing.section,
    };

    if (nextValues.endMinutes <= nextValues.startMinutes) {
      return res.status(400).json({ message: 'La hora de fin debe ser mayor a la de inicio.' });
    }

    // Conflictos profesor
    const profConflicts = await Schedule.find({
      _id: { $ne: id },
      professor: nextValues.professor,
      day: nextValues.day,
      year: nextValues.year,
      cycle: nextValues.cycle,
      semester: nextValues.semester,
    });

    if (profConflicts.some(s => overlaps(nextValues.startMinutes, nextValues.endMinutes, s.startMinutes, s.endMinutes))) {
      return res
        .status(400)
        .json({ message: 'Conflicto: el profesor ya tiene un horario en ese rango.' });
    }

    // Conflictos salón
    const roomConflicts = await Schedule.find({
      _id: { $ne: id },
      classroom: nextValues.classroom,
      day: nextValues.day,
      year: nextValues.year,
      cycle: nextValues.cycle,
      semester: nextValues.semester,
    });

    if (roomConflicts.some(s => overlaps(nextValues.startMinutes, nextValues.endMinutes, s.startMinutes, s.endMinutes))) {
      return res
        .status(400)
        .json({ message: 'Conflicto: el salón ya está ocupado en ese rango.' });
    }

    // Conflictos sección
    const sectionConflicts = await Schedule.find({
      _id: { $ne: id },
      section: nextValues.section,
      day: nextValues.day,
      year: nextValues.year,
      cycle: nextValues.cycle,
      semester: nextValues.semester,
    });

    if (sectionConflicts.some(s => overlaps(nextValues.startMinutes, nextValues.endMinutes, s.startMinutes, s.endMinutes))) {
      return res
        .status(400)
        .json({ message: 'Conflicto: la sección ya tiene un curso en ese horario.' });
    }

    // Actualizamos (dejamos que el schema valide coherencia)
    Object.assign(existing, nextValues);
    await existing.validate();
    await existing.save();

    const populated = await Schedule.findById(id)
      .populate('course')
      .populate('professor')
      .populate('classroom');

    return res.json(populated);
  } catch (err) {
    console.error('updateSchedule error:', err);
    return res.status(400).json({ message: err.message || 'Error al actualizar horario' });
  }
};

/**
 * DELETE /api/schedules/:id
 */
exports.deleteSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    await Schedule.findByIdAndDelete(id);
    return res.json({ ok: true });
  } catch (err) {
    console.error('deleteSchedule error:', err);
    return res.status(500).json({ message: 'Error al eliminar horario' });
  }
};
