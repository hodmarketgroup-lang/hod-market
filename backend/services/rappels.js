const cron = require('node-cron');
const Facture = require('../models/Facture');
const Client = require('../models/Client');
const {
  rappelCinqJours,
  rappelJourJ,
  rappelRetard,
} = require('./twilioService');

function demarrerCronRappels() {
  cron.schedule('0 9 * * *', async () => {
    console.log('Cron rappels lancé:', new Date().toISOString());
    try {
      const aujourd_hui = new Date();
      aujourd_hui.setHours(0, 0, 0, 0);

      const dans5Jours = new Date(aujourd_hui);
      dans5Jours.setDate(dans5Jours.getDate() + 5);

      const formatDate = (date) => date.toISOString().split('T')[0];
      const dateJ0 = formatDate(aujourd_hui);
      const dateJ5 = formatDate(dans5Jours);

      const factures = await Facture.find({
        'echeances.statut': 'En attente'
      });

      for (const facture of factures) {
        const client = await Client.findById(facture.client_id);
        if (!client || !client.telephone) continue;

        let factureModifiee = false;

        for (const ech of facture.echeances) {
          if (ech.statut !== 'En attente') continue;

          // Rappel J-5
          if (ech.date_echeance === dateJ5 && ech.notif_j5 === 0) {
            try {
              await rappelCinqJours(
                client.nom,
                client.telephone,
                ech.numero_ech,
                ech.montant,
                ech.date_echeance
              );
              ech.notif_j5 = 1;
              factureModifiee = true;
              console.log(`Rappel J-5 envoyé: ${client.nom} - ${ech.numero_ech}`);
            } catch (e) {
              console.error(`Erreur rappel J-5 ${ech.numero_ech}:`, e.message);
            }
          }

          // Rappel jour J
          if (ech.date_echeance === dateJ0 && ech.notif_j0 === 0) {
            try {
              await rappelJourJ(
                client.nom,
                client.telephone,
                ech.numero_ech,
                ech.montant
              );
              ech.notif_j0 = 1;
              factureModifiee = true;
              console.log(`Rappel jour J envoyé: ${client.nom} - ${ech.numero_ech}`);
            } catch (e) {
              console.error(`Erreur rappel jour J ${ech.numero_ech}:`, e.message);
            }
          }

          // Rappel retard tous les 3 jours après échéance
          if (ech.date_echeance < dateJ0) {
            const dateEch = new Date(ech.date_echeance);
            const diffJours = Math.floor(
              (aujourd_hui - dateEch) / (1000 * 60 * 60 * 24)
            );
            if (diffJours > 0 && diffJours % 3 === 0) {
              try {
                await rappelRetard(
                  client.nom,
                  client.telephone,
                  ech.numero_ech,
                  ech.montant,
                  diffJours
                );
                console.log(`Rappel retard ${diffJours}j envoyé: ${client.nom} - ${ech.numero_ech}`);
              } catch (e) {
                console.error(`Erreur rappel retard ${ech.numero_ech}:`, e.message);
              }
            }
          }
        }

        if (factureModifiee) {
          await facture.save();
        }
      }

      console.log('Cron rappels terminé');
    } catch (err) {
      console.error('Erreur cron rappels:', err);
    }
  });

  console.log('Cron rappels activé (tous les jours à 9h)');
}

module.exports = { demarrerCronRappels };
