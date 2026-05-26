const db = require('../db/database');
const { calculerEcheancier } = require('../services/calcEcheancier');
const { getTauxParDuree } = require('../services/calcTaux');
const { appliquerPenalite } = require('../services/penalites');
const { notifFactureCreee, notifPaiementRecu } = require('../services/twilioService');

function genNumero(count) {
  const now = new Date();
  const mois = String(now.getMonth() + 1).padStart(2, '0');
  const annee = now.getFullYear();
  return String(count).padStart(4,'0') + '/' + mois + '/' + annee + '/HDMKT';
}

function formatMontant(montant) {
  return Math.round(montant || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

function getSoldeActuel(callback) {
  db.get('SELECT solde FROM caisse ORDER BY id DESC LIMIT 1', (err, row) => {
    if (err || !row) {
      db.get('SELECT solde_initial FROM parametres WHERE id=1', (err2, p) => {
        callback(p ? p.solde_initial : 0);
      });
    } else {
      callback(row.solde);
    }
  });
}

const getAll = (req, res) => {
  db.all(`
    SELECT f.*, c.nom as client_nom FROM factures f
    JOIN clients c ON f.client_id = c.id
    ORDER BY f.created_at DESC
  `, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
};

const getOne = (req, res) => {
  db.get(`
    SELECT f.*, c.nom as client_nom, c.telephone FROM factures f
    JOIN clients c ON f.client_id = c.id WHERE f.id = ?
  `, [req.params.id], (err, facture) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!facture) return res.status(404).json({ error: 'Facture introuvable' });
    db.all('SELECT * FROM echeances WHERE facture_id = ? ORDER BY date_echeance ASC, id ASC', [req.params.id], (err, echeances) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ ...facture, echeances });
    });
  });
};

const create = (req, res) => {
  db.get('SELECT * FROM parametres WHERE id = 1', (err, params) => {
    if (err) return res.status(500).json({ error: err.message });

    const { client_id, designation, date_facture, montant_commande, duree, acompte, depot_garantie, remise, frais_dossier_pct } = req.body;

    const taux = getTauxParDuree(Number(duree), params);
    const fraisPct = Number(frais_dossier_pct) || params.frais_dossier_pct || 1;
    const paramsAvecFrais = { ...params, frais_dossier_pct: fraisPct };

    const { marge, frais_dossier, total, echeances } = calculerEcheancier(
      { montant_commande: Number(montant_commande), duree: Number(duree), taux, acompte: Number(acompte || 0), depot_garantie: Number(depot_garantie || 0), remise: Number(remise || 0), date_facture },
      paramsAvecFrais
    );

    db.get('SELECT COUNT(*) as n FROM factures', (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      const numero = genNumero(row.n + 1);

      db.run(`
        INSERT INTO factures (numero, client_id, designation, date_facture, montant_commande, duree, taux, marge, frais_dossier, frais_dossier_pct, acompte, depot_garantie, remise, total)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
      `, [numero, client_id, designation, date_facture, montant_commande, duree, taux, marge, frais_dossier, fraisPct, acompte || 0, depot_garantie || 0, remise || 0, total],
        function(err) {
          if (err) return res.status(500).json({ error: err.message });
          const factureId = this.lastID;

          let done = 0;
          echeances.forEach(e => {
            db.run('INSERT INTO echeances (facture_id, numero_ech, date_echeance, montant) VALUES (?,?,?,?)',
              [factureId, e.numero_ech, e.date_echeance, e.montant],
              () => {
                done++;
                if (done === echeances.length) {
                  getSoldeActuel(solde => {
                    if (params.deduire_commande) {
                      const newSolde = solde - Number(montant_commande);
                      db.run('INSERT INTO caisse (date, type, libelle, sortie, solde, facture_id) VALUES (?,?,?,?,?,?)',
                        [date_facture, 'Sortie', 'Commande (' + numero + ')', montant_commande, newSolde, factureId]);
                      if (Number(acompte) > 0) {
                        db.run('INSERT INTO caisse (date, type, libelle, entree, solde, facture_id) VALUES (?,?,?,?,?,?)',
                          [date_facture, 'Entree', 'Acompte (' + numero + ')', acompte, newSolde + Number(acompte), factureId]);
                      }
                    }
                    db.get('SELECT * FROM clients WHERE id = ?', [client_id], (err, client) => {
                      if (client && client.telephone) {
                        notifFactureCreee(client.nom, client.telephone, numero, formatMontant(total), formatMontant(Math.round(total / Number(duree))), duree);
                      }
                    });
                  });
                  res.json({ id: factureId, numero, total, marge, frais_dossier, frais_dossier_pct: fraisPct, taux, remise: remise || 0, echeances });
                }
              }
            );
          });
        }
      );
    });
  });
};

const update = (req, res) => {
  db.get('SELECT * FROM parametres WHERE id = 1', (err, params) => {
    if (err) return res.status(500).json({ error: err.message });

    const { client_id, designation, date_facture, montant_commande, duree, acompte, depot_garantie, remise, frais_dossier_pct } = req.body;
    const factureId = req.params.id;

    db.get('SELECT * FROM factures WHERE id = ?', [factureId], (err, facture) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!facture) return res.status(404).json({ error: 'Facture introuvable' });

      const taux = getTauxParDuree(Number(duree), params);
      const fraisPct = Number(frais_dossier_pct) || params.frais_dossier_pct || 1;
      const paramsAvecFrais = { ...params, frais_dossier_pct: fraisPct };

      const { marge, frais_dossier, total, echeances } = calculerEcheancier(
        { montant_commande: Number(montant_commande), duree: Number(duree), taux, acompte: Number(acompte || 0), depot_garantie: Number(depot_garantie || 0), remise: Number(remise || 0), date_facture },
        paramsAvecFrais
      );

      db.run(`
        UPDATE factures SET client_id=?, designation=?, date_facture=?, montant_commande=?, duree=?, taux=?, marge=?, frais_dossier=?, frais_dossier_pct=?, acompte=?, depot_garantie=?, remise=?, total=? WHERE id=?
      `, [client_id, designation, date_facture, montant_commande, duree, taux, marge, frais_dossier, fraisPct, acompte || 0, depot_garantie || 0, remise || 0, total, factureId],
        (err) => {
          if (err) return res.status(500).json({ error: err.message });
          db.run('DELETE FROM echeances WHERE facture_id = ? AND statut = "En attente"', [factureId], () => {
            let done = 0;
            if (echeances.length === 0) return res.json({ success: true, total, marge, taux });
            echeances.forEach(e => {
              db.run('INSERT INTO echeances (facture_id, numero_ech, date_echeance, montant) VALUES (?,?,?,?)',
                [factureId, e.numero_ech, e.date_echeance, e.montant],
                () => { done++; if (done === echeances.length) res.json({ success: true, total, marge, taux, echeances }); }
              );
            });
          });
        }
      );
    });
  });
};

const marquerPaye = (req, res) => {
  db.get('SELECT * FROM echeances WHERE id = ?', [req.params.echId], (err, ech) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!ech) return res.status(404).json({ error: 'Echeance introuvable' });
    const today = new Date().toISOString().split('T')[0];
    db.run("UPDATE echeances SET statut = 'Payé', date_paiement = ? WHERE id = ?", [today, ech.id], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      db.get('SELECT f.*, c.nom as client_nom, c.telephone FROM factures f JOIN clients c ON f.client_id = c.id WHERE f.id = ?', [ech.facture_id], (err, facture) => {
        getSoldeActuel(solde => {
          const newSolde = solde + ech.montant;
          db.run('INSERT INTO caisse (date, type, libelle, entree, solde, facture_id, echeance_id) VALUES (?,?,?,?,?,?,?)',
            [today, 'Entree', 'Paiement ' + ech.numero_ech + ' (' + facture.numero + ')', ech.montant, newSolde, facture.id, ech.id]);
          if (facture && facture.telephone) {
            notifPaiementRecu(facture.client_nom, facture.telephone, facture.numero, ech.numero_ech, formatMontant(ech.montant), today);
          }
          db.get("SELECT COUNT(*) as n FROM echeances WHERE facture_id = ? AND statut = 'En attente'", [ech.facture_id], (err, r1) => {
            db.get("SELECT COUNT(*) as total FROM echeances WHERE facture_id = ?", [ech.facture_id], (err, r2) => {
              db.get("SELECT COUNT(*) as payees FROM echeances WHERE facture_id = ? AND statut = 'Payé'", [ech.facture_id], (err, r3) => {
                const statut = r1.n === 0 ? 'Soldée' : r3.payees > 0 ? 'Partiel (' + r3.payees + '/' + r2.total + ')' : 'En attente';
                db.run('UPDATE factures SET statut = ? WHERE id = ?', [statut, ech.facture_id], () => {
                  res.json({ success: true, nouveauSolde: newSolde });
                });
              });
            });
          });
        });
      });
    });
  });
};

const paiementPartiel = (req, res) => {
  const { echId } = req.params;
  const { montant_paye } = req.body;
  if (!montant_paye || Number(montant_paye) <= 0) return res.status(400).json({ error: 'Montant invalide' });
  db.get('SELECT * FROM echeances WHERE id = ?', [echId], (err, ech) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!ech) return res.status(404).json({ error: 'Echeance introuvable' });
    const montantPaye = Number(montant_paye);
    const resteAPayer = ech.montant - montantPaye;
    if (montantPaye >= ech.montant) return res.status(400).json({ error: 'Le montant partiel doit etre inferieur au montant total' });
    const today = new Date().toISOString().split('T')[0];
    const numeroReste = ech.numero_ech + 'A';
    db.run("UPDATE echeances SET statut = 'Payé', date_paiement = ?, montant = ?, est_partiel = 1 WHERE id = ?", [today, montantPaye, ech.id], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      db.run("INSERT INTO echeances (facture_id, numero_ech, date_echeance, montant, statut, est_partiel, echeance_parent_id) VALUES (?,?,?,?,?,?,?)",
        [ech.facture_id, numeroReste, ech.date_echeance, resteAPayer, 'Reste a regler', 1, ech.id],
        function(err) {
          if (err) return res.status(500).json({ error: err.message });
          db.get('SELECT f.*, c.nom as client_nom, c.telephone FROM factures f JOIN clients c ON f.client_id = c.id WHERE f.id = ?', [ech.facture_id], (err, facture) => {
            getSoldeActuel(solde => {
              const newSolde = solde + montantPaye;
              db.run('INSERT INTO caisse (date, type, libelle, entree, solde, facture_id, echeance_id) VALUES (?,?,?,?,?,?,?)',
                [today, 'Entree', 'Paiement partiel ' + ech.numero_ech + ' (' + facture.numero + ')', montantPaye, newSolde, facture.id, ech.id]);
            });
            db.run("UPDATE factures SET statut = 'Partiel' WHERE id = ?", [ech.facture_id]);
            res.json({ success: true, montant_paye: montantPaye, reste: resteAPayer, numero_reste: numeroReste });
          });
        }
      );
    });
  });
};

const annulerPaiement = (req, res) => {
  db.get('SELECT * FROM echeances WHERE id = ?', [req.params.echId], (err, ech) => {
    if (err) return res.status(500).json({ error: err.message });
    db.run("UPDATE echeances SET statut = 'En attente', date_paiement = NULL, est_partiel = 0 WHERE id = ?", [ech.id]);
    db.run('DELETE FROM echeances WHERE echeance_parent_id = ?', [ech.id]);
    db.run('DELETE FROM caisse WHERE echeance_id = ?', [ech.id], () => { res.json({ success: true }); });
  });
};

const penalite = (req, res) => {
  appliquerPenalite(Number(req.params.id))
    .then(result => res.json(result))
    .catch(err => res.status(500).json({ error: err.message }));
};

module.exports = { getAll, getOne, create, update, marquerPaye, paiementPartiel, annulerPaiement, penalite };