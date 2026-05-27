const mongoose = require('mongoose');

// LOGISTIC
const logisticRecetteSchema = new mongoose.Schema({
  date: String,
  id_camion: String,
  type_service: String,
  montant: { type: Number, default: 0 },
  description: String,
  created_at: { type: Date, default: Date.now }
});

const logisticChargeSchema = new mongoose.Schema({
  date: String,
  type_depense: String,
  montant: { type: Number, default: 0 },
  description: String,
  created_at: { type: Date, default: Date.now }
});

const logisticCaisseSchema = new mongoose.Schema({
  date: String,
  type: String,
  libelle: String,
  entree: { type: Number, default: 0 },
  sortie: { type: Number, default: 0 },
  solde: { type: Number, default: 0 },
  created_at: { type: Date, default: Date.now }
});

// CONSTRUCTION
const constructionRecetteSchema = new mongoose.Schema({
  date: String,
  type_vente: String,
  quantite: { type: Number, default: 0 },
  prix_unitaire: { type: Number, default: 0 },
  remise: { type: Number, default: 0 },
  montant: { type: Number, default: 0 },
  description: String,
  created_at: { type: Date, default: Date.now }
});

const constructionChargeSchema = new mongoose.Schema({
  date: String,
  type_depense: String,
  montant: { type: Number, default: 0 },
  description: String,
  created_at: { type: Date, default: Date.now }
});

const constructionProductionSchema = new mongoose.Schema({
  date: String,
  type_produit: String,
  quantite: { type: Number, default: 0 },
  description: String,
  created_at: { type: Date, default: Date.now }
});

const constructionStockSchema = new mongoose.Schema({
  type_produit: { type: String, unique: true },
  quantite: { type: Number, default: 0 },
  updated_at: { type: Date, default: Date.now }
});

const constructionCaisseSchema = new mongoose.Schema({
  date: String,
  type: String,
  libelle: String,
  entree: { type: Number, default: 0 },
  sortie: { type: Number, default: 0 },
  solde: { type: Number, default: 0 },
  created_at: { type: Date, default: Date.now }
});

const constructionParametresSchema = new mongoose.Schema({
  prix_parping: { type: Number, default: 0 },
  prix_ciment: { type: Number, default: 0 },
  types_produits: { type: String, default: 'Parping,Ciment Depot' }
});

module.exports = {
  LogisticRecette: mongoose.model('LogisticRecette', logisticRecetteSchema),
  LogisticCharge: mongoose.model('LogisticCharge', logisticChargeSchema),
  LogisticCaisse: mongoose.model('LogisticCaisse', logisticCaisseSchema),
  ConstructionRecette: mongoose.model('ConstructionRecette', constructionRecetteSchema),
  ConstructionCharge: mongoose.model('ConstructionCharge', constructionChargeSchema),
  ConstructionProduction: mongoose.model('ConstructionProduction', constructionProductionSchema),
  ConstructionStock: mongoose.model('ConstructionStock', constructionStockSchema),
  ConstructionCaisse: mongoose.model('ConstructionCaisse', constructionCaisseSchema),
  ConstructionParametres: mongoose.model('ConstructionParametres', constructionParametresSchema)
};