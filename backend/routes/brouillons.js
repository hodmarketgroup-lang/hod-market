const router = require('express').Router();
const Brouillon = require('../models/Brouillon');

router.get('/', async (req, res) => {
  try {
    const brouillons = await Brouillon.find().sort({ updated_at: -1 });
    res.json(brouillons);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const now = new Date();
    const b = await new Brouillon({ ...req.body, created_at: now, updated_at: now }).save();
    res.json(b);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const b = await Brouillon.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updated_at: new Date() },
      { new: true }
    );
    if (!b) return res.status(404).json({ error: 'Brouillon introuvable' });
    res.json(b);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const b = await Brouillon.findByIdAndDelete(req.params.id);
    if (!b) return res.status(404).json({ error: 'Brouillon introuvable' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
