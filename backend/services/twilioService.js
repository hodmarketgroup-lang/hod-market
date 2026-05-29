const twilio = require('twilio');

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const FROM = 'whatsapp:+15559665541';

async function sendWhatsApp(to, message) {
  try {
    const msg = await client.messages.create({
      from: FROM,
      to: `whatsapp:${to}`,
      body: message,
    });
    console.log('WhatsApp envoyé:', msg.sid);
    return msg;
  } catch (err) {
    console.error('Erreur Twilio:', err.message);
    throw err;
  }
}

async function notifFactureCreee(client_nom, telephone, numero, total, montant_echeance, duree) {
  const msg = `📄 *Nouvelle facture - HOD Groupe*\n\nBonjour ${client_nom},\nVotre facture *${numero}* d'un montant de *${total} FCFA* a été créée.\nEchéances : *${duree} x ${montant_echeance} FCFA*\n\nMerci de votre confiance.`;
  return sendWhatsApp(telephone, msg);
}

async function notifPaiementRecu(client_nom, telephone, numero, numero_ech, montant, date_paiement) {
  const msg = `✅ *Paiement enregistré - HOD Groupe*\n\nBonjour ${client_nom},\nVotre paiement de *${montant} FCFA* sur l'échéance *${numero_ech}* de la facture *${numero}* a bien été comptabilisé le ${date_paiement}.\n\nMerci !`;
  return sendWhatsApp(telephone, msg);
}

async function rappelCinqJours(client_nom, telephone, numero_ech, montant, date_echeance) {
  const msg = `⏰ *Rappel échéance - HOD Groupe*\n\nBonjour ${client_nom},\nVotre échéance *${numero_ech}* de *${montant} FCFA* arrive dans *5 jours* (${date_echeance}).\n\nMerci de prévoir le règlement.`;
  return sendWhatsApp(telephone, msg);
}

async function rappelJourJ(client_nom, telephone, numero_ech, montant) {
  const msg = `🔔 *Échéance aujourd'hui - HOD Groupe*\n\nBonjour ${client_nom},\nVotre échéance *${numero_ech}* de *${montant} FCFA* est due *aujourd'hui*.\n\nContactez-nous pour tout renseignement.`;
  return sendWhatsApp(telephone, msg);
}

async function rappelRetard(client_nom, telephone, numero_ech, montant, jours_retard) {
  const msg = `🚨 *Échéance dépassée - HOD Groupe*\n\nBonjour ${client_nom},\nVotre échéance *${numero_ech}* de *${montant} FCFA* est en retard de *${jours_retard} jours*.\n\nMerci de régulariser votre situation rapidement.`;
  return sendWhatsApp(telephone, msg);
  