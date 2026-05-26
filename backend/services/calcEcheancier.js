function addMonths(dateStr, months) {
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().split('T')[0];
}

function calculerEcheancier(data, params) {
  const { montant_commande, duree, taux, acompte = 0, depot_garantie = 0, remise = 0, date_facture } = data;

  const frais_dossier_pct = params.frais_dossier_pct || 1;
  const marge_brute = montant_commande * (taux / 100);
  const marge = marge_brute - Number(remise);
  const frais_dossier = montant_commande * (frais_dossier_pct / 100);
  const total = montant_commande + marge + frais_dossier + Number(depot_garantie) - Number(acompte);
  const mensualite = Math.round(total / duree);

  const echeances = [];
  for (let i = 1; i <= duree; i++) {
    echeances.push({
      numero_ech: 'ECH' + i,
      date_echeance: addMonths(date_facture, i),
      montant: mensualite,
      statut: 'En attente'
    });
  }

  return { marge, frais_dossier, total, mensualite, echeances };
}

module.exports = { calculerEcheancier };