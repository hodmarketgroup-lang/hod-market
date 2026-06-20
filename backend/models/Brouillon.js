const mongoose = require('mongoose');

const brouillonSchema = new mongoose.Schema({
  client_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', default: null },
  client_nom: { type: String, default: '' },
  designation: { type: String, default: '' },
  designations_selectionnees: { type: String, default: '[]' },
  date_facture: { type: String, default: '' },
  montant_commande: { type: Number, default: 0 },
  duree: { type: Number, default: 1 },
  acompte: { type: Number, default: 0 },
  depot_garantie: { type: Number, default: 0 },
  remise: { type: Number, default: 0 },
  frais_dossier_pct: { type: Number, default: 1 },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Brouillon', brouillonSchema);
