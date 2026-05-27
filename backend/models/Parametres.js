const mongoose = require('mongoose');

const parametresSchema = new mongoose.Schema({
  devise: { type: String, default: 'XAF' },
  frais_dossier_pct: { type: Number, default: 1 },
  solde_initial: { type: Number, default: 0 },
  date_solde_initial: { type: String, default: () => new Date().toISOString().split('T')[0] },
  deduire_commande: { type: Number, default: 1 },
  penalite_pct: { type: Number, default: 10 },
  decalage_mois: { type: Number, default: 1 },
  taux_1m: { type: Number, default: 10 },
  taux_2m: { type: Number, default: 18 },
  taux_3m: { type: Number, default: 25 },
  taux_4m: { type: Number, default: 30 },
  taux_5m: { type: Number, default: 35 },
  taux_6m: { type: Number, default: 35 }
});

module.exports = mongoose.model('Parametres', parametresSchema);