const Classroom = require('../models/classroom');

exports.create = async (req, res) => {
  try {
    const room = await Classroom.create(req.body);
    res.status(201).json({ ok: true, classroom: room });
  } catch (e) {
    res.status(400).json({ ok: false, msg: 'Error creando salón', err: e.message });
  }
};

exports.list = async (_req, res) => {
  const rooms = await Classroom.find().sort({ name: 1 });
  res.json({ ok: true, classrooms: rooms });
};

exports.update = async (req,res)=>{
  try {
    const room = await Classroom.findByIdAndUpdate(req.params.id, req.body, { new:true, runValidators:true });
    res.json({ ok:true, classroom: room });
  } catch(e){ res.status(400).json({ ok:false, msg:'Error actualizando salón', err:e.message }); }
};
exports.remove = async (req,res)=>{
  await Classroom.findByIdAndDelete(req.params.id);
  res.json({ ok:true });
};
