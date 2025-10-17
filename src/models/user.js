// src/models/user.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const ROLES = ['admin', 'coordinator', 'professor'];

const userSchema = new mongoose.Schema(
  {
    name:     { type: String, required: true, trim: true },
    email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    role:     { type: String, enum: ROLES, default: 'professor', index: true },
    isActive: { type: Boolean, default: true },

    // ✅ NUEVO: cursos que el profesor puede impartir
    // (ids de Course)
    coursesCanTeach: [
      { type: mongoose.Schema.Types.ObjectId, ref: 'Course' }
    ],
  },
  { timestamps: true }
);

// Hash automático antes de guardar
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Método para comparar contraseña
userSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

// (Opcional) Remover password al serializar
if (!userSchema.options.toJSON) userSchema.options.toJSON = {};
userSchema.options.toJSON.transform = function (_doc, ret) {
  delete ret.password;
  return ret;
};

// ✅ Evita OverwriteModelError en recargas
const User = mongoose.models.User || mongoose.model('User', userSchema);

module.exports = User;
// Mantén disponible el arreglo de roles
module.exports.ROLES = ROLES;
