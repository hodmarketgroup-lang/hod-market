const db = require('../db/database');

function addMonths(dateStr, months) {
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().split('T')[0];
}

function appliquerPenalite(factureId) {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM parametres WHERE id = 1', (err, params) => {
      if (err) return reject(err);

      db.all(`
        SELECT * FROM echeances
        WHERE facture_id = ? AND statut = 'En attente'
        ORDER BY date_echeance ASC
      `, [factureId], (err, echeances) => {
        if (err) return reject(err);
        if (!echeances.length) return reject(new Error('Aucune échéance en attente'));

        const restantDu = echeances.reduce((s, e) => s + e.montant, 0);
        const nouveauTotal = restantDu * (1 + params.penalite_pct / 100);
        const nouvelleMensualite = Math.round(nouveauTotal / echeances.length);
        const today = new Date().toISOString().split('T')[0];

        let done = 0;
        echeances.forEach((e, i) => {
          const newDate = addMonths(today, i + params.decalage_mois);
          db.run(
            'UPDATE echeances SET montant = ?, date_echeance = ? WHERE id = ?',
            [nouvelleMensualite, newDate, e.id],
            (err) => {
              if (err) return reject(err);
              done++;
              if (done === echeances.length) {
                resolve({
                  restantDu,
                  nouveauTotal,
                  nouvelleMensualite,
                  penalitePct: params.penalite_pct,
                  nbEcheances: echeances.length
                });
              }
            }
          );
        });
      });
    });
  });
}

module.exports = { appliquerPenalite };