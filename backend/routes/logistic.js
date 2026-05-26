const router = require('express').Router();
const db = require('../db/database');

function getSolde(callback) {
  db.get('SELECT solde FROM logistic_caisse ORDER BY id DESC LIMIT 1', (err, row) => {
    callback(row ? row.solde : 0);
  });
}

function fmt(m) {
  return Math.round(m || 0);
}

// RECETTES
router.get('/recettes', (req, res) => {
  db.all('SELECT * FROM logistic_recettes ORDER BY date DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

router.post('/recettes', (req, res) => {
  const { date, id_camion, type_service, montant, description } = req.body;
  db.run(
    'INSERT INTO logistic_recettes (date, id_camion, type_service, montant, description) VALUES (?,?,?,?,?)',
    [date, id_camion, type_service, montant, description || ''],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      getSolde(solde => {
        const newSolde = solde + Number(montant);
        db.run(
          'INSERT INTO logistic_caisse (date, type, libelle, entree, solde) VALUES (?,?,?,?,?)',
          [date, 'Entree', 'Recette - ' + type_service + ' (' + id_camion + ')', montant, newSolde]
        );
      });
      res.json({ id: this.lastID });
    }
  );
});

router.delete('/recettes/:id', (req, res) => {
  db.run('DELETE FROM logistic_recettes WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// CHARGES
router.get('/charges', (req, res) => {
  db.all('SELECT * FROM logistic_charges ORDER BY date DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

router.post('/charges', (req, res) => {
  const { date, type_depense, montant, description } = req.body;
  db.run(
    'INSERT INTO logistic_charges (date, type_depense, montant, description) VALUES (?,?,?,?)',
    [date, type_depense, montant, description || ''],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      getSolde(solde => {
        const newSolde = solde - Number(montant);
        db.run(
          'INSERT INTO logistic_caisse (date, type, libelle, sortie, solde) VALUES (?,?,?,?,?)',
          [date, 'Sortie', 'Charge - ' + type_depense, montant, newSolde]
        );
      });
      res.json({ id: this.lastID });
    }
  );
});

router.delete('/charges/:id', (req, res) => {
  db.run('DELETE FROM logistic_charges WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// CAISSE
router.get('/caisse', (req, res) => {
  db.all('SELECT * FROM logistic_caisse ORDER BY id ASC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    getSolde(solde => res.json({ journal: rows, solde }));
  });
});

// DASHBOARD
router.get('/dashboard', (req, res) => {
  db.all('SELECT * FROM logistic_recettes', [], (err, recettes) => {
    db.all('SELECT * FROM logistic_charges', [], (err, charges) => {
      const totalRecettes = recettes.reduce((s, r) => s + (r.montant || 0), 0);
      const totalCharges = charges.reduce((s, c) => s + (c.montant || 0), 0);
      const marge = totalRecettes - totalCharges;
      getSolde(solde => {
        res.json({ totalRecettes, totalCharges, marge, solde, recettes, charges });
      });
    });
  });
});

module.exports = router;