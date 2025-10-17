// src/controllers/auth.controller.js
const User = require('../models/user'); // ✅ corregido: nombre en minúsculas
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// 🔐 Generar token JWT
function generateToken(user) {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
      name: user.name,
    },
    process.env.JWT_SECRET || 'default_secret',
    { expiresIn: '7d' }
  );
}

// 🧩 Registrar nuevo usuario (solo admin o coordinator)
exports.register = async (req, res) => {
  try {
    const { name, email, password, role, coursesCanTeach } = req.body;

    // Validaciones básicas
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Nombre, correo y contraseña son requeridos' });
    }

    // Verificar duplicado
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'El correo ya está registrado' });
    }

    const hashed = await bcrypt.hash(password, 10);

    // Normalizamos el array de cursos. El front puede enviarlos como objetos
    // completos ({ _id, name }) o como strings.  Nos aseguramos de extraer
    // siempre el identificador para que Mongoose pueda castearlo a ObjectId.
    const normalizeCourses = (arr) => {
      if (!Array.isArray(arr)) return [];
      return arr
        .map((c) => {
          if (!c) return null;
          if (typeof c === 'string') return c;
          if (typeof c === 'object') {
            return c._id || c.value || c.id || null;
          }
          return null;
        })
        .filter(Boolean);
    };

    const user = await User.create({
      name,
      email,
      password: hashed,
      role: role || 'professor',
      coursesCanTeach: normalizeCourses(coursesCanTeach),
    });

    res.status(201).json({
      message: 'Usuario registrado correctamente',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        coursesCanTeach: user.coursesCanTeach,
      },
    });
  } catch (error) {
    console.error('Error en register:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// 🔑 Login de usuario
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');

    if (!user) return res.status(400).json({ message: 'Credenciales inválidas' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: 'Credenciales inválidas' });

    const token = generateToken(user);

    res.json({
      message: 'Inicio de sesión exitoso',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        coursesCanTeach: user.coursesCanTeach,
      },
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// 👤 Obtener perfil del usuario autenticado
exports.me = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('coursesCanTeach');
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
    res.json(user);
  } catch (error) {
    console.error('Error en me:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// 📋 Listar usuarios (opcionalmente por rol)
exports.listUsers = async (req, res) => {
  try {
    const { role } = req.query;
    const filter = role ? { role } : {};
    // Obtenemos los usuarios sin popular los cursos para evitar devolver
    // documentos completos de curso.  Lean convierte los documentos a
    // objetos planos, lo que facilita mapear los ObjectId a strings.
    const users = await User.find(filter).select('-password').lean();
    // Normalizamos el arreglo coursesCanTeach a strings
    const mapped = users.map((u) => {
      const courses = Array.isArray(u.coursesCanTeach)
        ? u.coursesCanTeach.map((c) => {
            // si es objeto { _id: ObjectId }
            if (typeof c === 'string') return c;
            if (c && typeof c === 'object') return c.toString ? c.toString() : c._id?.toString?.();
            return null;
          }).filter(Boolean)
        : [];
      return { ...u, coursesCanTeach: courses };
    });
    res.json(mapped);
  } catch (error) {
    console.error('Error en listUsers:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// ✏️ Actualizar usuario existente
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password, role, coursesCanTeach } = req.body;

    const dataToUpdate = { name, email, role };
    if (password) {
      dataToUpdate.password = await bcrypt.hash(password, 10);
    }
    if (Array.isArray(coursesCanTeach)) {
      // Normalizar el array de cursos de la misma manera que en register
      const normalizeCourses = (arr) => {
        return arr
          .map((c) => {
            if (!c) return null;
            if (typeof c === 'string') return c;
            if (typeof c === 'object') {
              return c._id || c.value || c.id || null;
            }
            return null;
          })
          .filter(Boolean);
      };
      dataToUpdate.coursesCanTeach = normalizeCourses(coursesCanTeach);
    }

    const updatedUser = await User.findByIdAndUpdate(id, dataToUpdate, { new: true }).select('-password');
    if (!updatedUser) return res.status(404).json({ message: 'Usuario no encontrado' });

    res.json({
      message: 'Usuario actualizado correctamente',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Error en updateUser:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// 🗑️ Eliminar usuario (borrado físico)
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await User.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: 'Usuario no encontrado' });
    res.json({ message: 'Usuario eliminado correctamente' });
  } catch (error) {
    console.error('Error en deleteUser:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};
