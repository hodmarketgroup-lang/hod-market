const Caisse = require('../models/Caisse');
const Parametres = require('../models/Parametres');

async function getSoldeActuel() {
  const last = await Caisse.findOne().sort({ createdAt: -1, _id: -1 });
  if (last) return last.solde;
  const params = await Parametres.findOne();
  return params ? params.solde_initial : 0;
}

async function recalculerSoldes() {
  const params = await Parametres.findOne();
  const journal = await Caisse.find().sort({ createdAt: 1, _id: 1 });
  let solde = params ? params.solde_initial : 0;
  for (const j of journal) {
    solde = solde + (j.entree || 0) - (j.sortie || 0);
    if (j.solde !== solde) {
      await Caisse.findByIdAndUpdate(j._id, { solde });
    }
  }
}

const getAll = async (req, res) => {
  try {
    const params = await Parametres.findOne();
    const journal = await Caisse.find().sort({ createdAt: 1, _id: 1 });
    const solde = await getSoldeActuel();
    res.json({ journal, solde, solde_initial: params ? params.solde_initial : 0 });
  } catch (err) {
    console.error('Erreur getAll caisse:', err);
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
    console.error('Erreur addOperation:', err);
    res.status(500).json({ error: err.message });
  }
};

const deleteOperation = async (req, res) => {
  try {
    const op = await Caisse.findById(req.params.id);
    if (!op) return res.status(404).json({ error: 'Operation introuvable' });

    const aFactureId = op.facture_id !== null && op.facture_id !== undefined;
    const aEcheanceId = op.echeance_id !== null && op.echeance_id !== undefined;

    if (aFactureId || aEcheanceId) {
      return res.status(400).json({ error: 'Impossible d annuler une operation automatique liee a une facture' });
    }

    await Caisse.findByIdAndDelete(req.params.id);
    await recalculerSoldes();

    res.json({ success: true });
  } catch (err) {
    console.error('Erreur deleteOperation:', err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getAll, addOperation, deleteOperation, getSoldeActuel, recalculerSoldes };