const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configuration stockage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '..', 'uploads', 'clients', String(req.params.clientId));
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const nom = `${Date.now()}_${file.originalname}`;
    cb(null, nom);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    const types = /pdf|jpg|jpeg|png|doc|docx/;
    const ext = types.test(path.extname(file.originalname).toLowerCase());
    if (ext) cb(null, true);
    else cb(new Error('Type de fichier non supporté'));
  }
});

// Upload document
router.post('/:clientId/upload', upload.single('fichier'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Aucun fichier reçu' });
  res.json({
    success: true,
    fichier: {
      nom: req.file.originalname,
      nomServeur: req.file.filename,
      taille: req.file.size,
      date: new Date().toISOString().split('T')[0]
    }
  });
});

// Lister documents d'un client
router.get('/:clientId/documents', (req, res) => {
  const dir = path.join(__dirname, '..', 'uploads', 'clients', String(req.params.clientId));
  if (!fs.existsSync(dir)) return res.json([]);
  const fichiers = fs.readdirSync(dir).map(f => {
    const stats = fs.statSync(path.join(dir, f));
    const parts = f.split('_');
    const nomOriginal = parts.slice(1).join('_');
    return {
      nomServeur: f,
      nom: nomOriginal,
      taille: stats.size,
      date: stats.mtime.toISOString().split('T')[0]
    };
  });
  res.json(fichiers);
});

// Télécharger document
router.get('/:clientId/documents/:fichier', (req, res) => {
  const filePath = path.join(__dirname, '..', 'uploads', 'clients',
    String(req.params.clientId), req.params.fichier);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Fichier introuvable' });
  res.download(filePath);
});

// Supprimer document
router.delete('/:clientId/documents/:fichier', (req, res) => {
  const filePath = path.join(__dirname, '..', 'uploads', 'clients',
    String(req.params.clientId), req.params.fichier);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Fichier introuvable' });
  fs.unlinkSync(filePath);
  res.json({ success: true });
});

module.exports = router;