require('dotenv').config();
const twilio = require('twilio');

const ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const FROM = process.env.TWILIO_FROM || 'whatsapp:+14155238886';

const client = twilio(ACCOUNT_SID, AUTH_TOKEN);

function formatMontant(montant) {
  return Math.round(montant || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

function envoyerWhatsApp(telephoneClient, message) {
  if (!telephoneClient) return;
  if (!ACCOUNT_SID || !AUTH_TOKEN) {
    console.log('Twilio non configure - message non envoye');
    return;
  }

  let numero = telephoneClient.replace(/\s/g, '').replace(/\./g, '').replace(/-/g, '');
  if (numero.startsWith('00')) {
    numero = numero.substring(2);
  } else if (numero.startsWith('+')) {
    numero = numero.substring(1);
  } else if (numero.startsWith('0')) {
    numero = '242' + numero.substring(1);
  } else if (!numero.startsWith('242') && numero.length <= 9) {
    numero = '242' + numero;
  }

  const to = 'whatsapp:+' + numero;
  console.log('Envoi WhatsApp vers:', to);

  return client.messages.create({
    from: FROM,
    to: to,
    body: message
  }).then(msg => {
    console.log('WhatsApp envoye SID:' + msg.sid);
    return msg;
  }).catch(err => {
    console.error('Erreur WhatsApp:', err.message);
  });
}

function notifFactureCreee(nomClient, telephone, numeroFacture, total, mensualite, duree) {
  if (!telephone) return;
  const message = 'HOD-MARKET - Nouvelle Facture\n\nBonjour ' + nomClient + ',\n\nVotre commande a ete enregistree.\n\nFacture : ' + numeroFacture + '\nTotal : ' + total + ' FCFA\nDuree : ' + duree + ' mois\nMensualite : ' + mensualite + ' FCFA\n\nMerci !\nHOD-MARKET';
  return envoyerWhatsApp(telephone, message);
}

function notifPaiementRecu(nomClient, telephone, numeroFacture, numeroEch, montant, dateEch) {
  if (!telephone) return;
  const message = 'HOD-MARKET - Paiement Recu\n\nBonjour ' + nomClient + ',\n\nPaiement enregistre.\n\nFacture : ' + numeroFacture + '\nEcheance : ' + numeroEch + '\nMontant : ' + montant + ' FCFA\nDate : ' + dateEch + '\n\nMerci !\nHOD-MARKET';
  return envoyerWhatsApp(telephone, message);
}

function notifRappelEcheance(nomClient, telephone, numeroFacture, numeroEch, montant, dateEch) {
  if (!telephone) return;
  const message = 'HOD-MARKET - Rappel\n\nBonjour ' + nomClient + ',\n\nEcheance dans 5 jours.\n\nFacture : ' + numeroFacture + '\nEcheance : ' + numeroEch + '\nMontant : ' + montant + ' FCFA\nDate : ' + dateEch + '\n\nMerci !\nHOD-MARKET';
  return envoyerWhatsApp(telephone, message);
}

function notifRetard(nomClient, telephone, numeroFacture, numeroEch, montant, dateEch) {
  if (!telephone) return;
  const message = 'HOD-MARKET - Retard\n\nBonjour ' + nomClient + ',\n\nEcheance en retard.\n\nFacture : ' + numeroFacture + '\nEcheance : ' + numeroEch + '\nMontant : ' + montant + ' FCFA\nDate : ' + dateEch + '\n\nMerci de regulariser.\nHOD-MARKET';
  return envoyerWhatsApp(telephone, message);
}

module.exports = { notifFactureCreee, notifPaiementRecu, notifRappelEcheance, notifRetard };