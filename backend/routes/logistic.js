const router = require('express').Router();
const { LogisticRecette, LogisticCharge, LogisticCaisse } = require('../models/Autres');

async function getSolde() {
  const last = await LogisticCaisse.findOne().sort({ _id: -1 });
  return last ? last.solde : 0;
}

router.get('/recettes', async (req, res) => {
  try {
    const rows = await LogisticRecette.find().sort({ date: -1 });
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/recettes', async (req, res) => {
  try {
    const { date, id_camion, type_service, montant, description } = req.body;
    const rec = await new LogisticRecette({ date, id_camion, type_service, montant, description }).save();
    const solde = await getSolde();
    const newSolde = solde + Number(montant);
    await new LogisticCaisse({ date, type: 'Entree', libelle: `Recette - ${type_service} (${id_camion})`, entree: montant, solde: newSolde }).save();
    res.json({ id: rec._id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/recettes/:id', async (req, res) => {
  try {
    await LogisticRecette.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/charges', async (req, res) => {
  try {
    const rows = await LogisticCharge.find().sort({ date: -1 });
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/charges', async (req, res) => {
  try {
    const { date, type_depense, montant, description } = req.body;
    const charge = await new LogisticCharge({ date, type_depense, montant, description }).save();
    const solde = await getSolde();
    const newSolde = solde - Number(montant);
    await new LogisticCaisse({ date, type: 'Sortie', libelle: `Charge - ${type_depense}`, sortie: montant, solde: newSolde }).save();
    res.json({ id: charge._id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/charges/:id', async (req, res) => {
  try {
    await LogisticCharge.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/caisse', async (req, res) => {
  try {
    const journal = await LogisticCaisse.find().sort({ _id: 1 });
    const solde = await getSolde();
    res.json({ journal, solde });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/dashboard', async (req, res) => {
  try {
    const recettes = await LogisticRecette.find();
    const charges = await LogisticCharge.find();
    const totalRecettes = recettes.reduce((s, r) => s + (r.montant || 0), 0);
    const totalCharges = charges.reduce((s, c) => s + (c.montant || 0), 0);
    const marge = totalRecettes - totalCharges;
    const solde = await getSolde();
    res.json({ totalRecettes, totalCharges, marge, solde, recettes, charges });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;