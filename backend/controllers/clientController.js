const db = require('../db/database');

const getAll = (req, res) => {
  db.all(`
    SELECT c.*,
      COALESCE((
        SELECT SUM(f.total) - COALESCE(SUM(
          (SELECT SUM(e.montant) FROM echeances e
           WHERE e.facture_id = f.id AND e.statut = 'Payé')
        ),0)
        FROM factures f WHERE f.client_id = c.id AND f.statut != 'Soldée'
      ), 0) as encours
    FROM clients c
    ORDER BY c.nom ASC
  `, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
};

const create = (req, res) => {
  const { nom, telephone, adresse, type_client, nom_societe,
          contact_urgence_nom, contact_urgence_lien, contact_urgence_telephone } = req.body;
  if (!nom) return res.status(400).json({ error: 'Nom requis' });
  db.run(
    `INSERT INTO clients (nom, telephone, adresse, type_client, nom_societe,
      contact_urgence_nom, contact_urgence_lien, contact_urgence_telephone)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [nom, telephone || '', adresse || '', type_client || 'Salarie',
     nom_societe || '', contact_urgence_nom || '',
     contact_urgence_lien || '', contact_urgence_telephone || ''],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, nom, telephone });
    }
  );
};

const update = (req, res) => {
  const { nom, telephone, adresse, type_client, nom_societe,
          contact_urgence_nom, contact_urgence_lien, contact_urgence_telephone } = req.body;
  db.run(
    `UPDATE clients SET nom=?, telephone=?, adresse=?, type_client=?,
      nom_societe=?, contact_urgence_nom=?, contact_urgence_lien=?,
      contact_urgence_telephone=? WHERE id=?`,
    [nom, telephone || '', adresse || '', type_client || 'Salarie',
     nom_societe || '', contact_urgence_nom || '',
     contact_urgence_lien || '', contact_urgence_telephone || '',
     req.params.id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    }
  );
};

const getSituation = (req, res) => {
  const { id } = req.params;
  db.get('SELECT * FROM clients WHERE id = ?', [id], (err, client) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!client) return res.status(404).json({ error: 'Client introuvable' });

    db.all(`
      SELECT f.*,
        COALESCE((SELECT SUM(e.montant) FROM echeances e
          WHERE e.facture_id = f.id AND e.statut = 'Payé'), 0) as deja_paye
      FROM factures f WHERE f.client_id = ?
      ORDER BY f.created_at DESC
    `, [id], (err, factures) => {
      if (err) return res.status(500).json({ error: err.message });

      db.all(`
        SELECT e.*, f.numero FROM echeances e
        JOIN factures f ON e.facture_id = f.id
        WHERE f.client_id = ?
        ORDER BY e.date_echeance ASC
      `, [id], (err, echeances) => {
        if (err) return res.status(500).json({ error: err.message });
        const encours = factures.reduce((s, f) => s + (f.total - f.deja_paye), 0);
        res.json({ client, factures, echeances, encours });
      });
    });
  });
};

const remove = (req, res) => {
  db.run('DELETE FROM clients WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
};

module.exports = { getAll, create, update, getSituation, remove };