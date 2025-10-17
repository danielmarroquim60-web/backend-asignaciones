// src/models/schedule.js
const mongoose = require('mongoose');

/**
 * day: 0..6  (0=Dom, 1=Lun, ... 6=Sáb)
 * startMinutes/endMinutes: minutos desde 00:00 (ej 8:00 => 480)
 * year: 2000..2100 (razonable)
 * cycle: 1 ó 2
 * semester: 1..10
 */

const scheduleSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    professor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    classroom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Classroom',
      required: true,
      index: true,
    },

    // 0=Dom, 1=Lun, ... 6=Sáb
    day: { type: Number, min: 0, max: 6, required: true },

    // En minutos desde 00:00
    startMinutes: { type: Number, min: 0, max: 24 * 60, required: true },
    endMinutes: { type: Number, min: 0, max: 24 * 60, required: true },

    // Contexto académico
    year: { type: Number, min: 2000, max: 2100, required: true, index: true },
    cycle: { type: Number, enum: [1, 2], required: true, index: true },
    semester: { type: Number, min: 1, max: 10, required: true, index: true },
     section: { type: String, required: true, trim: true }
  },
  { timestamps: true }
);

/** Validaciones de consistencia */
scheduleSchema.pre('validate', function (next) {
  // Tiempo coherente
  if (this.startMinutes >= this.endMinutes) {
    return next(new Error('La hora de inicio debe ser menor que la hora de fin.'));
  }

  // Ciclo ↔ semestre
  // Ciclo 1 ⇒ semestres impares (1,3,5,7,9)
  // Ciclo 2 ⇒ semestres pares   (2,4,6,8,10)
  const isOdd = this.semester % 2 === 1;
  if (this.cycle === 1 && !isOdd) {
    return next(new Error('En ciclo 1 sólo se permiten semestres 1,3,5,7,9.'));
  }
  if (this.cycle === 2 && isOdd) {
    return next(new Error('En ciclo 2 sólo se permiten semestres 2,4,6,8,10.'));
  }

  next();
});

module.exports = mongoose.models.Schedule || mongoose.model('Schedule', scheduleSchema);
