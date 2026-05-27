const Facture = require('../models/Facture');
const Parametres = require('../models/Parametres');

function addMonths(dateStr, months) {
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().split('T')[0];
}

async function appliquerPenalite(factureId) {
  const params = await Parametres.findOne();
  const facture = await Facture.findById(factureId);
  if (!facture) throw new Error('Facture introuvable');

  const echeances = facture.echeances.filter(e => e.statut === 'En attente');
  if (!echeances.length) throw new Error('Aucune échéance en attente');

  const restantDu = echeances.reduce((s, e) => s + e.montant, 0);
  const nouveauTotal = restantDu * (1 + params.penalite_pct / 100);
  const nouvelleMensualite = Math.round(nouveauTotal / echeances.length);
  const today = new Date().toISOString().split('T')[0];

  echeances.forEach((e, i) => {
    e.montant = nouvelleMensualite;
    e.date_echeance = addMonths(today, i + params.decalage_mois);
  });

  await facture.save();
  return { restantDu, nouveauTotal, nouvelleMensualite, penalitePct: params.penalite_pct, nbEcheances: echeances.length };
}

module.exports = { appliquerPenalite };