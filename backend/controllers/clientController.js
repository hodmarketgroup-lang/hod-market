const Client = require('../models/Client');
const Facture = require('../models/Facture');

const getAll = async (req, res) => {
  try {
    const clients = await Client.find().sort({ nom: 1 });
    const result = await Promise.all(clients.map(async (c) => {
      const factures = await Facture.find({ client_id: c._id, statut: { $ne: 'Soldée' } });
      let encours = 0;
      factures.forEach(f => {
        const paye = f.echeances
          .filter(e => e.statut === 'Payé')
          .reduce((s, e) => s + e.montant, 0);
        encours += f.total - paye;
      });
      return { ...c.toObject(), id: c._id, encours };
    }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const create = async (req, res) => {
  try {
    const { nom, telephone, adresse, type_client, nom_societe,
            contact_urgence_nom, contact_urgence_lien, contact_urgence_telephone } = req.body;
    if (!nom) return res.status(400).json({ error: 'Nom requis' });
    const client = await new Client({
      nom, telephone, adresse, type_client, nom_societe,
      contact_urgence_nom, contact_urgence_lien, contact_urgence_telephone
    }).save();
    res.json({ ...client.toObject(), id: client._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const update = async (req, res) => {
  try {
    await Client.findByIdAndUpdate(req.params.id, req.body);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getSituation = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) return res.status(404).json({ error: 'Client introuvable' });
    const factures = await Facture.find({ client_id: client._id }).sort({ created_at: -1 });
    let encours = 0;
    const facturesAvecPaye = factures.map(f => {
      const deja_paye = f.echeances.filter(e => e.statut === 'Payé').reduce((s, e) => s + e.montant, 0);
      encours += f.total - deja_paye;
      return { ...f.toObject(), deja_paye };
    });
    const echeances = factures.flatMap(f =>
      f.echeances.map(e => ({ ...e.toObject(), numero: f.numero }))
    ).sort((a, b) => a.date_echeance?.localeCompare(b.date_echeance));
    res.json({ client: { ...client.toObject(), id: client._id }, factures: facturesAvecPaye, echeances, encours });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const remove = async (req, res) => {
  try {
    await Client.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getAll, create, update, getSituation, remove };