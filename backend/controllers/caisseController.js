const Caisse = require('../models/Caisse');
const Parametres = require('../models/Parametres');

async function getSoldeActuel() {
  const last = await Caisse.findOne().sort({ _id: -1 });
  if (last) return last.solde;
  const params = await Parametres.findOne();
  return params ? params.solde_initial : 0;
}

const getAll = async (req, res) => {
  try {
    const params = await Parametres.findOne();
    const journal = await Caisse.find().sort({ _id: 1 });
    const solde = await getSoldeActuel();
    res.json({ journal, solde, solde_initial: params ? params.solde_initial : 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const addOperation = async (req, res) => {
  try {
    const { date, type, libelle, montant } = req.body;
    if (!montant || isNaN(montant)) return res.status(400).json({ error: 'Montant invalide' });
    const solde = await getSoldeActuel();
    const entree = type === 'Entree' ? Number(montant) : 0;
    const sortie = type === 'Sortie' ? Number(montant) : 0;
    const newSolde = solde + entree - sortie;
    await new Caisse({ date, type, libelle, entree, sortie, solde: newSolde }).save();
    res.json({ success: true, solde: newSolde });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteOperation = async (req, res) => {
  try {
    const op = await Caisse.findById(req.params.id);
    if (!op) return res.status(404).json({ error: 'Opération introuvable' });
    if (op.facture_id || op.echeance_id) return res.status(400).json({ error: 'Impossible d\'annuler une opération automatique' });
    await Caisse.findByIdAndDelete(req.params.id);

    // Recalculer les soldes
    const params = await Parametres.findOne();
    const journal = await Caisse.find().sort({ _id: 1 });
    let solde = params ? params.solde_initial : 0;
    for (const j of journal) {
      solde = solde + (j.entree || 0) - (j.sortie || 0);
      await Caisse.findByIdAndUpdate(j._id, { solde });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getAll, addOperation, deleteOperation, getSoldeActuel };