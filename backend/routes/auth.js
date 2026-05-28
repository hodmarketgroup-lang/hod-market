const router = require('express').Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Identifiants requis' });

    const user = await User.findOne({ username });
    if (!user) return res.status(401).json({ error: 'Identifiants incorrects' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Identifiants incorrects' });

    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET || 'hod-secret-key',
      { expiresIn: '24h' }
    );

    res.json({ token, role: user.role, username: user.username });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/changer-mdp', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Token manquant' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'hod-secret-key');
    const { ancienMdp, nouveauMdp } = req.body;

    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });

    const valid = await bcrypt.compare(ancienMdp, user.password);
    if (!valid) return res.status(401).json({ error: 'Ancien mot de passe incorrect' });

    if (nouveauMdp.length < 6) return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 6 caractères' });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(nouveauMdp, salt);
    await user.save();

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;