const Facture = require('../models/Facture');
const Client = require('../models/Client');
const Caisse = require('../models/Caisse');
const Parametres = require('../models/Parametres');
const { calculerEcheancier } = require('../services/calcEcheancier');
const { getTauxParDuree } = require('../services/calcTaux');
const { notifFactureCreee, notifPaiementRecu } = require('../services/twilioService');

function genNumero(count) {
  const now = new Date();
  const mois = String(now.getMonth() + 1).padStart(2, '0');
  const annee = now.getFullYear();
  return String(count).padStart(4, '0') + '/' + mois + '/' + annee + '/HDMKT';
}

function formatMontant(montant) {
  return Math.round(montant || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

async function getSoldeActuel() {
  const last = await Caisse.findOne().sort({ _id: -1 });
  if (last) return last.solde;
  const params = await Parametres.findOne();
  return params ? params.solde_initial : 0;
}

const getAll = async (req, res) => {
  try {
    const factures = await Facture.find().populate('client_id', 'nom').sort({ created_at: -1 });
    const result = factures.map(f => ({
      ...f.toObject(),
      id: f._id,
      client_nom: f.client_id?.nom
    }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getOne = async (req, res) => {
  try {
    const facture = await Facture.findById(req.params.id).populate('client_id', 'nom telephone');
    if (!facture) return res.status(404).json({ error: 'Facture introuvable' });
    res.json({
      ...facture.toObject(),
      id: facture._id,
      client_nom: facture.client_id?.nom,
      telephone: facture.client_id?.telephone
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const create = async (req, res) => {
  try {
    const params = await Parametres.findOne();
    const { client_id, designation, date_facture, montant_commande, duree, acompte, depot_garantie, remise, frais_dossier_pct } = req.body;

    const taux = getTauxParDuree(Number(duree), params);
    const fraisPct = Number(frais_dossier_pct) || params.frais_dossier_pct || 1;
    const paramsAvecFrais = { ...params.toObject(), frais_dossier_pct: fraisPct };

    const { marge, frais_dossier, total, echeances } = calculerEcheancier(
      { montant_commande: Number(montant_commande), duree: Number(duree), taux, acompte: Number(acompte || 0), depot_garantie: Number(depot_garantie || 0), remise: Number(remise || 0), date_facture },
      paramsAvecFrais
    );

    const count = await Facture.countDocuments();
    const numero = genNumero(count + 1);

    const facture = await new Facture({
      numero, client_id, designation, date_facture,
      montant_commande, duree, taux, marge, frais_dossier,
      frais_dossier_pct: fraisPct, acompte: acompte || 0,
      depot_garantie: depot_garantie || 0, remise: remise || 0,
      total, echeances
    }).save();

    const solde = await getSoldeActuel();
    if (params.deduire_commande) {
      const newSolde = solde - Number(montant_commande);
      await new Caisse({ date: date_facture, type: 'Sortie', libelle: 'Commande (' + numero + ')', sortie: montant_commande, solde: newSolde, facture_id: facture._id }).save();
      if (Number(acompte) > 0) {
        await new Caisse({ date: date_facture, type: 'Entree', libelle: 'Acompte (' + numero + ')', entree: acompte, solde: newSolde + Number(acompte), facture_id: facture._id }).save();
      }
    }

    const client = await Client.findById(client_id);
    if (client?.telephone) {
      notifFactureCreee(client.nom, client.telephone, numero, formatMontant(total), formatMontant(Math.round(total / Number(duree))), duree);
    }

    res.json({ id: facture._id, numero, total, marge, frais_dossier, frais_dossier_pct: fraisPct, taux, remise: remise || 0, echeances });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const update = async (req, res) => {
  try {
    const params = await Parametres.findOne();
    const { client_id, designation, date_facture, montant_commande, duree, acompte, depot_garantie, remise, frais_dossier_pct } = req.body;

    const taux = getTauxParDuree(Number(duree), params);
    const fraisPct = Number(frais_dossier_pct) || params.frais_dossier_pct || 1;
    const paramsAvecFrais = { ...params.toObject(), frais_dossier_pct: fraisPct };

    const { marge, frais_dossier, total, echeances: nouvellesEcheances } = calculerEcheancier(
      { montant_commande: Number(montant_commande), duree: Number(duree), taux, acompte: Number(acompte || 0), depot_garantie: Number(depot_garantie || 0), remise: Number(remise || 0), date_facture },
      paramsAvecFrais
    );

    const facture = await Facture.findById(req.params.id);
    if (!facture) return res.status(404).json({ error: 'Facture introuvable' });

    // Séparer les écheances payées et en attente
    const echeancesPayees = facture.echeances.filter(e =>
      e.statut === 'Payé' || e.statut === 'Paye' || e.statut === 'Reste a regler'
    );
    const echeancesEnAttente = facture.echeances.filter(e =>
      e.statut === 'En attente'
    );

    let echeancesFinales;

    // Si toutes les échéances sont payées → garder uniquement les payées, ne pas ajouter de nouvelles
    if (echeancesEnAttente.length === 0 && echeancesPayees.length > 0) {
      echeancesFinales = echeancesPayees;
    } else {
      // Sinon garder les payées + nouvelles échéances en attente
      echeancesFinales = [...echeancesPayees, ...nouvellesEcheances];
    }

    facture.set({
      client_id, designation, date_facture, montant_commande, duree,
      taux, marge, frais_dossier, frais_dossier_pct: fraisPct,
      acompte: acompte || 0, depot_garantie: depot_garantie || 0,
      remise: remise || 0, total,
      echeances: echeancesFinales
    });

    // Recalculer le statut
    const nbPayees = echeancesFinales.filter(e => e.statut === 'Payé' || e.statut === 'Paye').length;
    const nbEnAttente = echeancesFinales.filter(e => e.statut === 'En attente').length;
    const nbTotal = echeancesFinales.length;

    if (nbEnAttente === 0 && nbPayees > 0) {
      facture.statut = 'Soldée';
    } else if (nbPayees > 0) {
      facture.statut = `Partiel (${nbPayees}/${nbTotal})`;
    } else {
      facture.statut = 'En attente';
    }

    await facture.save();

    res.json({ success: true, total, marge, taux, echeances: echeancesFinales });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const marquerPaye = async (req, res) => {
  try {
    const facture = await Facture.findOne({ 'echeances._id': req.params.echId }).populate('client_id', 'nom telephone');
    if (!facture) return res.status(404).json({ error: 'Echeance introuvable' });

    const ech = facture.echeances.id(req.params.echId);
    const today = new Date().toISOString().split('T')[0];
    ech.statut = 'Payé';
    ech.date_paiement = today;

    const enAttente = facture.echeances.filter(e => e.statut === 'En attente').length;
    const payees = facture.echeances.filter(e => e.statut === 'Payé').length;
    const total = facture.echeances.length;
    facture.statut = enAttente === 0 ? 'Soldée' : payees > 0 ? `Partiel (${payees}/${total})` : 'En attente';
    await facture.save();

    const solde = await getSoldeActuel();
    const newSolde = solde + ech.montant;
    await new Caisse({ date: today, type: 'Entree', libelle: `Paiement ${ech.numero_ech} (${facture.numero})`, entree: ech.montant, solde: newSolde, facture_id: facture._id, echeance_id: ech._id }).save();

    if (facture.client_id?.telephone) {
      notifPaiementRecu(facture.client_id.nom, facture.client_id.telephone, facture.numero, ech.numero_ech, formatMontant(ech.montant), today);
    }

    res.json({ success: true, nouveauSolde: newSolde });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const paiementPartiel = async (req, res) => {
  try {
    const { montant_paye } = req.body;
    if (!montant_paye || Number(montant_paye) <= 0) return res.status(400).json({ error: 'Montant invalide' });

    const facture = await Facture.findOne({ 'echeances._id': req.params.echId });
    if (!facture) return res.status(404).json({ error: 'Echeance introuvable' });

    const ech = facture.echeances.id(req.params.echId);
    const montantPaye = Number(montant_paye);
    const resteAPayer = ech.montant - montantPaye;

    if (montantPaye >= ech.montant) return res.status(400).json({ error: 'Le montant partiel doit être inférieur au montant total' });

    const today = new Date().toISOString().split('T')[0];
    ech.statut = 'Payé';
    ech.date_paiement = today;
    ech.montant = montantPaye;
    ech.est_partiel = 1;

    facture.echeances.push({ numero_ech: ech.numero_ech + 'A', date_echeance: ech.date_echeance, montant: resteAPayer, statut: 'Reste a regler', est_partiel: 1, echeance_parent_id: ech._id });
    facture.statut = 'Partiel';
    await facture.save();

    const solde = await getSoldeActuel();
    const newSolde = solde + montantPaye;
    await new Caisse({ date: today, type: 'Entree', libelle: `Paiement partiel ${ech.numero_ech} (${facture.numero})`, entree: montantPaye, solde: newSolde, facture_id: facture._id, echeance_id: ech._id }).save();

    res.json({ success: true, montant_paye: montantPaye, reste: resteAPayer, numero_reste: ech.numero_ech + 'A' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const annulerPaiement = async (req, res) => {
  try {
    const facture = await Facture.findOne({ 'echeances._id': req.params.echId });
    if (!facture) return res.status(404).json({ error: 'Echeance introuvable' });

    const ech = facture.echeances.id(req.params.echId);
    ech.statut = 'En attente';
    ech.date_paiement = null;
    ech.est_partiel = 0;

    facture.echeances = facture.echeances.filter(e => !e.echeance_parent_id?.equals(ech._id));
    await facture.save();

    await Caisse.deleteMany({ echeance_id: ech._id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const penalite = async (req, res) => {
  try {
    const { appliquerPenalite } = require('../services/penalites');
    const result = await appliquerPenalite(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getAll, getOne, create, update, marquerPaye, paiementPartiel, annulerPaiement, penalite };