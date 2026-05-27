const mongoose = require('mongoose');

const caisseSchema = new mongoose.Schema({
  date: { type: String, required: true },
  type: { type: String, required: true },
  libelle: String,
  entree: { type: Number, default: 0 },
  sortie: { type: Number, default: 0 },
  solde: { type: Number, default: 0 },
  facture_id: { type: mongoose.Schema.Types.ObjectId, default: null },
  echeance_id: { type: mongoose.Schema.Types.ObjectId, default: null }
});

module.exports = mongoose.model('Caisse', caisseSchema);