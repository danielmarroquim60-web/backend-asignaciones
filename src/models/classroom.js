const mongoose = require('mongoose');

// Esquema para los salones. Además del nombre y la capacidad,
// incluimos de forma opcional un campo de ubicación (location) y
// un arreglo de equipamiento (equipment). Esto permite guardar
// correctamente estos datos y recuperarlos desde el frontend.
const classroomSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    capacity: { type: Number, required: true, min: 1 },
    // Ubicación opcional del salón; puede ser una cadena vacía si no se especifica
    location: { type: String, trim: true, default: '' },
    // Equipamiento opcional. Se guardan como un arreglo de strings. Si no se
    // especifica nada, será un arreglo vacío.
    equipment: { type: [String], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Classroom || mongoose.model('Classroom', classroomSchema);
