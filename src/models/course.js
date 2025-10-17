const mongoose = require('mongoose');

// Evita recompilar en hot-reload
module.exports =
  mongoose.models.Course ||
  mongoose.model(
    'Course',
    new mongoose.Schema(
      {
        code: { type: String, required: true, trim: true, unique: true },
        name: { type: String, required: true, trim: true },
        credits: { type: Number, required: true, min: 1, max: 10 },

        // NUEVO: semestre al que pertenece el curso (1..10)
        // Lo dejo no-requerido para no romper datos existentes.
        semester: { type: Number, min: 1, max: 10, index: true },

        description: { type: String, default: '' },
      },
      { timestamps: true }
    )
  );
