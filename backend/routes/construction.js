const router = require('express').Router();
const db = require('../db/database');

function getSolde(callback) {
  db.get('SELECT solde FROM construction_caisse ORDER BY id DESC LIMIT 1', (err, row) => {
    callback(row ? row.solde : 0);
  });
}

// PARAMETRES CONSTRUCTION
router.get('/parametres', (req, res) => {
  db.get('SELECT * FROM construction_parametres WHERE id = 1', (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(row);
  });
});

router.put('/parametres', (req, res) => {
  const { prix_parping, prix_ciment, types_produits } = req.body;
  db.run(
    'UPDATE construction_parametres SET prix_parping=?, prix_ciment=?, types_produits=? WHERE id=1',
    [prix_parping, prix_ciment, types_produits],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    }
  );
});

// RECETTES
router.get('/recettes', (req, res) => {
  db.all('SELECT * FROM construction_recettes ORDER BY date DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

router.post('/recettes', (req, res) => {
  const { date, type_vente, quantite, prix_unitaire, remise, montant, description } = req.body;
  db.run(
    'INSERT INTO construction_recettes (date, type_vente, quantite, prix_unitaire, remise, montant, description) VALUES (?,?,?,?,?,?,?)',
    [date, type_vente, quantite, prix_unitaire, remise || 0, montant, description || ''],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      getSolde(solde => {
        const newSolde = solde + Number(montant);
        db.run(
          'INSERT INTO construction_caisse (date, type, libelle, entree, solde) VALUES (?,?,?,?,?)',
          [date, 'Entree', 'Vente - ' + type_vente + ' (' + quantite + ' unites)', montant, newSolde]
        );
      });

      // Mise a jour stock
      db.get('SELECT * FROM construction_stock WHERE type_produit = ?', [type_vente], (err, stock) => {
        if (stock) {
          db.run('UPDATE construction_stock SET quantite = quantite - ?, updated_at = datetime("now") WHERE type_produit = ?',
            [quantite, type_vente]);
        }
      });

      res.json({ id: this.lastID });
    }
  );
});

router.delete('/recettes/:id', (req, res) => {
  db.run('DELETE FROM construction_recettes WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// CHARGES
router.get('/charges', (req, res) => {
  db.all('SELECT * FROM construction_charges ORDER BY date DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

router.post('/charges', (req, res) => {
  const { date, type_depense, montant, description } = req.body;
  db.run(
    'INSERT INTO construction_charges (date, type_depense, montant, description) VALUES (?,?,?,?)',
    [date, type_depense, montant, description || ''],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      getSolde(solde => {
        const newSolde = solde - Number(montant);
        db.run(
          'INSERT INTO construction_caisse (date, type, libelle, sortie, solde) VALUES (?,?,?,?,?)',
          [date, 'Sortie', 'Charge - ' + type_depense, montant, newSolde]
        );
      });
      res.json({ id: this.lastID });
    }
  );
});

router.delete('/charges/:id', (req, res) => {
  db.run('DELETE FROM construction_charges WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// PRODUCTION
router.get('/production', (req, res) => {
  db.all('SELECT * FROM construction_production ORDER BY date DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

router.post('/production', (req, res) => {
  const { date, type_produit, quantite, description } = req.body;
  db.run(
    'INSERT INTO construction_production (date, type_produit, quantite, description) VALUES (?,?,?,?)',
    [date, type_produit, quantite, description || ''],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });

      // Mise a jour stock automatique
      db.get('SELECT * FROM construction_stock WHERE type_produit = ?', [type_produit], (err, stock) => {
        if (stock) {
          db.run('UPDATE construction_stock SET quantite = quantite + ?, updated_at = datetime("now") WHERE type_produit = ?',
            [quantite, type_produit]);
        } else {
          db.run('INSERT INTO construction_stock (type_produit, quantite) VALUES (?,?)',
            [type_produit, quantite]);
        }
      });

      res.json({ id: this.lastID });
    }
  );
});

router.delete('/production/:id', (req, res) => {
  db.run('DELETE FROM construction_production WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// STOCK
router.get('/stock', (req, res) => {
  db.all('SELECT * FROM construction_stock ORDER BY type_produit ASC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

router.post('/stock/ajuster', (req, res) => {
  const { type_produit, quantite } = req.body;
  db.get('SELECT * FROM construction_stock WHERE type_produit = ?', [type_produit], (err, stock) => {
    if (stock) {
      db.run('UPDATE construction_stock SET quantite = ?, updated_at = datetime("now") WHERE type_produit = ?',
        [quantite, type_produit], () => res.json({ success: true }));
    } else {
      db.run('INSERT INTO construction_stock (type_produit, quantite) VALUES (?,?)',
        [type_produit, quantite], () => res.json({ success: true }));
    }
  });
});

// CAISSE
router.get('/caisse', (req, res) => {
  db.all('SELECT * FROM construction_caisse ORDER BY id ASC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    getSolde(solde => res.json({ journal: rows, solde }));
  });
});

// DASHBOARD
router.get('/dashboard', (req, res) => {
  db.all('SELECT * FROM construction_recettes', [], (err, recettes) => {
    db.all('SELECT * FROM construction_charges', [], (err, charges) => {
      db.all('SELECT * FROM construction_stock', [], (err, stock) => {
        const totalRecettes = recettes.reduce((s, r) => s + (r.montant || 0), 0);
        const totalCharges = charges.reduce((s, c) => s + (c.montant || 0), 0);
        const marge = totalRecettes - totalCharges;
        getSolde(solde => {
          res.json({ totalRecettes, totalCharges, marge, solde, stock, recettes, charges });
        });
      });
    });
  });
});

module.exports = router;