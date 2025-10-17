const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ ok: false, msg: 'Token requerido' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.uid = payload.uid;
    req.role = payload.role;
    req.userName = payload.name;
    next();
  } catch {
    return res.status(401).json({ ok: false, msg: 'Token inválido o expirado' });
  }
};
