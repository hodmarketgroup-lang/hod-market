const Facture = require('../models/Facture');
const { notifRappelEcheance, notifRetard } = require('./twilioService');

function formatMontant(montant) {
  return Math.round(montant || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

async function verifierRappels() {
  try {
    const today = new Date().toISOString().split('T')[0];
    const j5 = new Date();
    j5.setDate(j5.getDate() + 5);
    const j5str = j5.toISOString().split('T')[0];

    console.log('Vérification des rappels - Date:', today);

    const factures = await Facture.find().populate('client_id', 'nom telephone');

    for (const facture of factures) {
      for (const e of facture.echeances) {
        if (e.statut !== 'En attente') continue;
        const client = facture.client_id;

        // Rappel J-5
        if (e.date_echeance === j5str && e.notif_j5 === 0) {
          console.log('Rappel J-5 pour:', client?.nom, '-', facture.numero);
          if (client?.telephone) {
            notifRappelEcheance(client.nom, client.telephone, facture.numero, e.numero_ech, formatMontant(e.montant), e.date_echeance);
          }
          e.notif_j5 = 1;
          await facture.save();
        }

        // Rappel Jour J
        if (e.date_echeance === today && e.notif_j0 === 0) {
          console.log('Rappel Jour J pour:', client?.nom, '-', facture.numero);
          if (client?.telephone) {
            notifRetard(client.nom, client.telephone, facture.numero, e.numero_ech, formatMontant(e.montant), e.date_echeance);
          }
          e.notif_j0 = 1;
          await facture.save();
        }
      }
    }
  } catch (err) {
    console.error('Erreur rappels:', err.message);
  }
}

module.exports = { verifierRappels };