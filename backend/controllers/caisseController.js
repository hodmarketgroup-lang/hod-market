const db = require('../db/database');

function getSoldeActuel(callback) {
  db.get('SELECT solde FROM caisse ORDER BY id DESC LIMIT 1', (err, row) => {
    if (err || !row) {
      db.get('SELECT solde_initial FROM parametres WHERE id=1', (err2, p) => {
        callback(p ? p.solde_initial : 0);
      });
    } else {
      callback(row.solde);
    }
  });
}

const getAll = (req, res) => {
  db.get('SELECT * FROM parametres WHERE id=1', (err, params) => {
    db.all('SELECT * FROM caisse ORDER BY id ASC', [], (err, journal) => {
      if (err) return res.status(500).json({ error: err.message });
      getSoldeActuel(solde => {
        res.json({ journal, solde, solde_initial: params ? params.solde_initial : 0 });
      });
    });
  });
};

const addOperation = (req, res) => {
  const { date, type, libelle, montant } = req.body;
  if (!montant || isNaN(montant)) return res.status(400).json({ error: 'Montant invalide' });

  getSoldeActuel(solde => {
    const entree = type === 'Entree' ? Number(montant) : 0;
    const sortie = type === 'Sortie' ? Number(montant) : 0;
    const newSolde = solde + entree - sortie;

    db.run(
      'INSERT INTO caisse (date, type, libelle, entree, sortie, solde) VALUES (?,?,?,?,?,?)',
      [date, type, libelle, entree, sortie, newSolde],
      function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, solde: newSolde });
      }
    );
  });
};

const deleteOperation = (req, res) => {
  const { id } = req.params;
  db.get('SELECT * FROM caisse WHERE id = ?', [id], (err, op) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!op) return res.status(404).json({ error: 'Operation introuvable' });
    if (op.facture_id || op.echeance_id) return res.status(400).json({ error: 'Impossible d annuler une operation automatique' });

    db.run('DELETE FROM caisse WHERE id = ?', [id], (err) => {
      if (err) return res.status(500).json({ error: err.message });

      db.all('SELECT * FROM caisse ORDER BY id ASC', [], (err, journal) => {
        if (journal.length === 0) return res.json({ success: true });
        db.get('SELECT solde_initial FROM parametres WHERE id=1', (err, p) => {
          let solde = p ? p.solde_initial : 0;
          const updates = journal.map(j => {
            solde = solde + (j.entree || 0) - (j.sortie || 0);
            return { id: j.id, solde };
          });
          let done = 0;
          updates.forEach(u => {
            db.run('UPDATE caisse SET solde = ? WHERE id = ?', [u.solde, u.id], () => {
              done++;
              if (done === updates.length) res.json({ success: true });
            });
          });
        });
      });
    });
  });
};

module.exports = { getAll, addOperation, deleteOperation };