const mongoose = require('mongoose');

const echeanceSchema = new mongoose.Schema({
  numero_ech: String,
  date_echeance: String,
  montant: { type: Number, default: 0 },
  statut: { type: String, default: 'En attente' },
  date_paiement: String,
  notif_j5: { type: Number, default: 0 },
  notif_j0: { type: Number, default: 0 },
  est_partiel: { type: Number, default: 0 },
  echeance_parent_id: { type: mongoose.Schema.Types.ObjectId, default: null }
});

const factureSchema = new mongoose.Schema({
  numero: { type: String, unique: true, required: true },
  client_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  designation: String,
  date_facture: String,
  montant_commande: { type: Number, default: 0 },
  duree: { type: Number, default: 1 },
  taux: { type: Number, default: 0 },
  marge: { type: Number, default: 0 },
  frais_dossier: { type: Number, default: 0 },
  frais_dossier_pct: { type: Number, default: 1 },
  acompte: { type: Number, default: 0 },
  depot_garantie: { type: Number, default: 0 },
  remise: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  statut: { type: String, default: 'En attente' },
  echeances: [echeanceSchema],
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Facture', factureSchema);