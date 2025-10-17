const jwt = require('jsonwebtoken');
const User = require('../models/User');

const signToken = (user) =>
  jwt.sign(
    { uid: user._id, role: user.role, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

exports.register = async (req, res) => {
  try {
    const { name, email, password, role, coursesCanTeach } = req.body;

    // Solo admin puede crear admin / coordinator desde API protegida (veremos el middleware luego)
    // Permitir definir los cursos que el profesor puede impartir. Si coursesCanTeach
    // no está presente, el esquema lo inicializa como un arreglo vacío.
    const user = await User.create({ name, email, password, role, coursesCanTeach });
    const token = signToken(user);
    res.status(201).json({
      ok: true,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      token
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ ok: false, msg: 'Email ya está en uso' });
    }
    res.status(500).json({ ok: false, msg: 'Error creando usuario', err: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    // aceptar alias comunes del frontend
    const rawEmail = req.body?.email ?? req.body?.username ?? req.body?.usuario ?? '';
    const rawPassword = req.body?.password ?? '';

    // normalizar
    const email = String(rawEmail).trim().toLowerCase();
    const password = String(rawPassword); // no trim aquí por si la pass tiene espacios intencionales

    if (!email || !password) {
      return res.status(400).json({ ok: false, msg: 'Email y contraseña son requeridos' });
    }

    const User = require('../models/User');
    const user = await User.findOne({ email, isActive: true });
    if (!user) return res.status(400).json({ ok: false, msg: 'Credenciales inválidas' });

    const valid = await user.comparePassword(password);
    if (!valid) return res.status(400).json({ ok: false, msg: 'Credenciales inválidas' });

    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { uid: user._id, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      ok: true,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      token,
    });
  } catch (err) {
    console.error('LOGIN ERROR:', err);
    return res.status(500).json({ ok: false, msg: 'Error en login' });
  }
};

exports.me = async (req, res) => {
  const user = await User.findById(req.uid).select('-password');
  res.json({ ok: true, user });
};

exports.listUsers = async (req, res) => {
  try {
    const { role } = req.query; // opcional: ?role=professor
    const filter = {};
    if (role) filter.role = role;
    const users = await require('../models/User').find(filter).select('-password').sort({ name: 1 });
    res.json({ ok: true, users });
  } catch (e) {
    res.status(500).json({ ok: false, msg: 'Error listando usuarios', err: e.message });
  }
};

/**
 * Actualiza los datos de un usuario existente. Solo pueden hacerlo los roles autorizados.
 * Permite modificar nombre, email, role, cursos que puede impartir y contraseña (opcional).
 */
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, coursesCanTeach, password } = req.body;
    const user = await require('../models/User').findById(id);
    if (!user) {
      return res.status(404).json({ ok: false, msg: 'Usuario no encontrado' });
    }
    if (name !== undefined) user.name = name;
    if (email !== undefined) user.email = email;
    if (role !== undefined) user.role = role;
    if (Array.isArray(coursesCanTeach)) user.coursesCanTeach = coursesCanTeach;
    // Si se envía una contraseña nueva, actualizarla; el hook pre('save') la encriptará
    if (password) user.password = password;
    await user.save();
    // No devolver la contraseña
    const { password: _pw, ...plain } = user.toObject();
    return res.json({ ok: true, user: plain });
  } catch (err) {
    console.error('UPDATE USER ERROR:', err);
    return res.status(500).json({ ok: false, msg: 'Error actualizando usuario', err: err.message });
  }
};

/**
 * Elimina (desactiva) un usuario existente. En lugar de borrar definitivamente, se marca como inactivo.
 */
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    // Eliminación física del usuario. Si deseas una eliminación lógica, sustituye findByIdAndDelete por un flag.
    const user = await require('../models/User').findByIdAndDelete(id);
    if (!user) {
      return res.status(404).json({ ok: false, msg: 'Usuario no encontrado' });
    }
    return res.json({ ok: true, msg: 'Usuario eliminado' });
  } catch (err) {
    console.error('DELETE USER ERROR:', err);
    return res.status(500).json({ ok: false, msg: 'Error eliminando usuario', err: err.message });
  }
};
