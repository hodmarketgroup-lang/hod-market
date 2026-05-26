const db = require('../db/database');
const { notifRappelEcheance, notifRetard } = require('./twilioService');

function formatMontant(montant) {
  return Math.round(montant || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

function verifierRappels() {
  const today = new Date().toISOString().split('T')[0];
  const j5 = new Date();
  j5.setDate(j5.getDate() + 5);
  const j5str = j5.toISOString().split('T')[0];

  console.log('Verification des rappels - Date:', today);

  // Rappels J-5
  db.all(`
    SELECT e.*, f.numero, c.nom as client_nom, c.telephone
    FROM echeances e
    JOIN factures f ON e.facture_id = f.id
    JOIN clients c ON f.client_id = c.id
    WHERE e.statut = 'En attente'
    AND e.date_echeance = ?
    AND e.notif_j5 = 0
  `, [j5str], (err, echeances) => {
    if (err) return console.error('Erreur rappels J-5:', err.message);

    echeances.forEach(e => {
      console.log('Rappel J-5 pour:', e.client_nom, '-', e.numero);

      if (e.telephone) {
        const message = 'HOD-MARKET - Rappel Echeance J-5\n\n' +
          'Bonjour ' + e.client_nom + ',\n\n' +
          'Votre echeance ' + e.numero_ech + ' de ' + formatMontant(e.montant) + ' FCFA\n' +
          'est prevue dans 5 jours le ' + e.date_echeance + '.\n\n' +
          'Merci de vous assurer du reglement a temps\n' +
          'pour eviter les penalites de retard.\n\n' +
          'HOD-MARKET';

        notifRappelEcheance(
          e.client_nom,
          e.telephone,
          e.numero,
          e.numero_ech,
          formatMontant(e.montant),
          e.date_echeance
        );
      }

      db.run('UPDATE echeances SET notif_j5 = 1 WHERE id = ?', [e.id]);
    });

    console.log('Rappels J-5 envoyes:', echeances.length);
  });

  // Rappels Jour J
  db.all(`
    SELECT e.*, f.numero, c.nom as client_nom, c.telephone
    FROM echeances e
    JOIN factures f ON e.facture_id = f.id
    JOIN clients c ON f.client_id = c.id
    WHERE e.statut = 'En attente'
    AND e.date_echeance = ?
    AND e.notif_j0 = 0
  `, [today], (err, echeances) => {
    if (err) return console.error('Erreur rappels J0:', err.message);

    echeances.forEach(e => {
      console.log('Rappel Jour J pour:', e.client_nom, '-', e.numero);

      if (e.telephone) {
        const message = 'HOD-MARKET - Echeance a Terme\n\n' +
          'Bonjour ' + e.client_nom + ',\n\n' +
          'Votre echeance ' + e.numero_ech + ' de ' + formatMontant(e.montant) + ' FCFA\n' +
          'est a terme AUJOURD\'HUI le ' + e.date_echeance + '.\n\n' +
          'Merci de proceder au paiement ce jour\n' +
          'pour eviter les penalites de retard.\n\n' +
          'HOD-MARKET';

        notifRetard(
          e.client_nom,
          e.telephone,
          e.numero,
          e.numero_ech,
          formatMontant(e.montant),
          e.date_echeance
        );
      }

      db.run('UPDATE echeances SET notif_j0 = 1 WHERE id = ?', [e.id]);
    });

    console.log('Rappels Jour J envoyes:', echeances.length);
  });
}

module.exports = { verifierRappels };