const db = require('../db/database');

function getAlertes() {
  return new Promise((resolve, reject) => {
    const today = new Date().toISOString().split('T')[0];
    const j5 = new Date();
    j5.setDate(j5.getDate() + 5);
    const j5str = j5.toISOString().split('T')[0];

    db.all(`
      SELECT e.*, f.numero, c.nom as client_nom
      FROM echeances e
      JOIN factures f ON e.facture_id = f.id
      JOIN clients c ON f.client_id = c.id
      WHERE e.statut = 'En attente' AND e.date_echeance < ?
    `, [today], (err, enRetard) => {
      if (err) return reject(err);

      db.all(`
        SELECT e.*, f.numero, c.nom as client_nom
        FROM echeances e
        JOIN factures f ON e.facture_id = f.id
        JOIN clients c ON f.client_id = c.id
        WHERE e.statut = 'En attente'
        AND e.date_echeance BETWEEN ? AND ?
      `, [today, j5str], (err, bientot) => {
        if (err) return reject(err);
        resolve({ enRetard, bientot });
      });
    });
  });
}

module.exports = { getAlertes };