const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
  nom: { type: String, required: true },
  telephone: { type: String, default: '' },
  adresse: { type: String, default: '' },
  type_client: { type: String, default: 'Salarie' },
  nom_societe: { type: String, default: '' },
  contact_urgence_nom: { type: String, default: '' },
  contact_urgence_lien: { type: String, default: '' },
  contact_urgence_telephone: { type: String, default: '' },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Client', clientSchema);