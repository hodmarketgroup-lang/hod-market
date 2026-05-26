const db = require('../db/database');

const getParams = (req, res) => {
  db.get('SELECT * FROM parametres WHERE id = 1', (err, params) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(params);
  });
};

const saveParams = (req, res) => {
  const p = req.body;
  db.run(`
    UPDATE parametres SET
      devise=?, frais_dossier_pct=?, solde_initial=?, date_solde_initial=?,
      deduire_commande=?, penalite_pct=?, decalage_mois=?,
      taux_1m=?, taux_2m=?, taux_3m=?, taux_4m=?, taux_5m=?, taux_6m=?
    WHERE id=1
  `, [
    p.devise, p.frais_dossier_pct, p.solde_initial, p.date_solde_initial,
    p.deduire_commande ? 1 : 0, p.penalite_pct, p.decalage_mois,
    p.taux_1m, p.taux_2m, p.taux_3m, p.taux_4m, p.taux_5m, p.taux_6m
  ], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
};

module.exports = { getParams, saveParams };