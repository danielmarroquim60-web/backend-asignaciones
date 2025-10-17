// Permite solo si el rol del usuario está dentro de la lista
module.exports.allowRoles = (...rolesAllowed) => (req, res, next) => {
  if (!rolesAllowed.includes(req.role)) {
    return res.status(403).json({ ok: false, msg: 'No tienes permisos' });
  }
  next();
};
