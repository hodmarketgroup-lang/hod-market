const router = require('express').Router();
const { ConstructionRecette, ConstructionCharge, ConstructionProduction, ConstructionStock, ConstructionCaisse, ConstructionParametres } = require('../models/Autres');

async function getSolde() {
  const last = await ConstructionCaisse.findOne().sort({ _id: -1 });
  return last ? last.solde : 0;
}

router.get('/parametres', async (req, res) => {
  try {
    const row = await ConstructionParametres.findOne();
    res.json(row);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/parametres', async (req, res) => {
  try {
    await ConstructionParametres.findOneAndUpdate({}, req.body, { upsert: true });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/recettes', async (req, res) => {
  try { res.json(await ConstructionRecette.find().sort({ date: -1 })); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/recettes', async (req, res) => {
  try {
    const { date, type_vente, quantite, prix_unitaire, remise, montant, description } = req.body;
    const rec = await new ConstructionRecette({ date, type_vente, quantite, prix_unitaire, remise: remise || 0, montant, description }).save();
    const solde = await getSolde();
    await new ConstructionCaisse({ date, type: 'Entree', libelle: `Vente - ${type_vente} (${quantite} unites)`, entree: montant, solde: solde + Number(montant) }).save();
    const stock = await ConstructionStock.findOne({ type_produit: type_vente });
    if (stock) await ConstructionStock.updateOne({ type_produit: type_vente }, { $inc: { quantite: -quantite }, updated_at: new Date() });
    res.json({ id: rec._id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/recettes/:id', async (req, res) => {
  try { await ConstructionRecette.findByIdAndDelete(req.params.id); res.json({ success: true }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/charges', async (req, res) => {
  try { res.json(await ConstructionCharge.find().sort({ date: -1 })); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/charges', async (req, res) => {
  try {
    const { date, type_depense, montant, description } = req.body;
    const charge = await new ConstructionCharge({ date, type_depense, montant, description }).save();
    const solde = await getSolde();
    await new ConstructionCaisse({ date, type: 'Sortie', libelle: `Charge - ${type_depense}`, sortie: montant, solde: solde - Number(montant) }).save();
    res.json({ id: charge._id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/charges/:id', async (req, res) => {
  try { await ConstructionCharge.findByIdAndDelete(req.params.id); res.json({ success: true }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/production', async (req, res) => {
  try { res.json(await ConstructionProduction.find().sort({ date: -1 })); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/production', async (req, res) => {
  try {
    const { date, type_produit, quantite, description } = req.body;
    const prod = await new ConstructionProduction({ date, type_produit, quantite, description }).save();
    const stock = await ConstructionStock.findOne({ type_produit });
    if (stock) await ConstructionStock.updateOne({ type_produit }, { $inc: { quantite }, updated_at: new Date() });
    else await new ConstructionStock({ type_produit, quantite }).save();
    res.json({ id: prod._id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/production/:id', async (req, res) => {
  try { await ConstructionProduction.findByIdAndDelete(req.params.id); res.json({ success: true }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/stock', async (req, res) => {
  try { res.json(await ConstructionStock.find().sort({ type_produit: 1 })); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/stock/ajuster', async (req, res) => {
  try {
    const { type_produit, quantite } = req.body;
    await ConstructionStock.findOneAndUpdate({ type_produit }, { quantite, updated_at: new Date() }, { upsert: true });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/caisse', async (req, res) => {
  try {
    const journal = await ConstructionCaisse.find().sort({ _id: 1 });
    const solde = await getSolde();
    res.json({ journal, solde });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/dashboard', async (req, res) => {
  try {
    const recettes = await ConstructionRecette.find();
    const charges = await ConstructionCharge.find();
    const stock = await ConstructionStock.find();
    const totalRecettes = recettes.reduce((s, r) => s + (r.montant || 0), 0);
    const totalCharges = charges.reduce((s, c) => s + (c.montant || 0), 0);
    const solde = await getSolde();
    res.json({ totalRecettes, totalCharges, marge: totalRecettes - totalCharges, solde, stock, recettes, charges });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;