import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const COLORS = {
  primary: [13, 27, 42],
  accent: [41, 121, 255],
  success: [0, 180, 90],
  warning: [220, 120, 0],
  white: [255, 255, 255],
  gray: [139, 163, 193],
  lightGray: [240, 244, 248],
  black: [20, 20, 20],
  headerGray: [200, 205, 210],
  rowAlt: [245, 247, 250],
  orange: [255, 152, 0]
};

function formatMontant(montant) {
  return Math.round(montant || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

function entete(doc, titre, numero, couleurTitre) {
  couleurTitre = couleurTitre || COLORS.white;
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, 210, 40, 'F');
  doc.setTextColor(...COLORS.accent);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('HOD GROUPE', 14, 18);
  doc.setTextColor(...COLORS.gray);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('HOD MARKET - Centrale d achat', 14, 26);
  doc.text('Pointe-Noire, Republique du Congo', 14, 32);
  doc.setTextColor(...couleurTitre);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(titre, 196, 18, { align: 'right' });
  doc.setTextColor(...COLORS.accent);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(numero, 196, 27, { align: 'right' });
  doc.setDrawColor(...COLORS.accent);
  doc.setLineWidth(0.5);
  doc.line(0, 40, 210, 40);
}

function pied(doc) {
  var pageH = doc.internal.pageSize.height;
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, pageH - 18, 210, 18, 'F');
  doc.setTextColor(...COLORS.gray);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('HOD GROUPE - HOD MARKET - Centrale d achat - Pointe-Noire, Republique du Congo', 105, pageH - 10, { align: 'center' });
  doc.text('Document genere le ' + new Date().toLocaleDateString('fr-FR'), 105, pageH - 5, { align: 'center' });
}

function infoBox(doc, label, value, x, y, w) {
  w = w || 85;
  doc.setFillColor(...COLORS.lightGray);
  doc.roundedRect(x, y, w, 18, 2, 2, 'F');
  doc.setTextColor(...COLORS.gray);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(label, x + 4, y + 7);
  doc.setTextColor(...COLORS.black);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(String(value || '-'), x + 4, y + 14);
}

function tableauEcheances(doc, echeances, startY, acompte, dateFacture) {
  var rows = [];
  if (acompte && Number(acompte) > 0) {
    rows.push(['Acompte', dateFacture || '-', formatMontant(acompte) + ' FCFA', 'Paye']);
  }
  (echeances || []).forEach(function(e) {
    rows.push([e.numero_ech, e.date_echeance, formatMontant(e.montant) + ' FCFA', e.statut]);
  });

  autoTable(doc, {
    startY: startY,
    head: [['Echeance', 'Date', 'Montant', 'Statut']],
    body: rows,
    headStyles: { fillColor: COLORS.headerGray, textColor: COLORS.black, fontStyle: 'bold', fontSize: 10 },
    bodyStyles: { fontSize: 9, textColor: COLORS.black },
    alternateRowStyles: { fillColor: COLORS.rowAlt },
    columnStyles: { 0: { cellWidth: 35 }, 1: { cellWidth: 45 }, 2: { cellWidth: 60 }, 3: { cellWidth: 40 } },
    margin: { left: 14, right: 14 },
    willDrawCell: function(data) {
      if (data.section === 'body' && data.column.index === 3) {
        var statut = data.cell.raw;
        if (statut === 'Paye' || statut === 'Payé') {
          data.cell.styles.textColor = COLORS.success;
        } else if (statut === 'En attente') {
          data.cell.styles.textColor = COLORS.warning;
        } else if (statut === 'Reste a regler') {
          data.cell.styles.textColor = [200, 100, 0];
        }
      }
      if (data.section === 'body' && data.row.index === 0 && acompte && Number(acompte) > 0) {
        data.cell.styles.textColor = COLORS.success;
      }
    }
  });
}

function mentionsLegales(doc, facture) {
  var echeances = facture.echeances || [];
  var montantDu = echeances
    .filter(function(e) { return e.statut !== 'Paye' && e.statut !== 'Payé'; })
    .reduce(function(s, e) { return s + (e.montant || 0); }, 0);

  var finalY = doc.lastAutoTable.finalY + 15;

  doc.setDrawColor(...COLORS.accent);
  doc.setLineWidth(0.5);
  doc.line(14, finalY, 196, finalY);

  doc.setTextColor(...COLORS.black);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('ENGAGEMENT DE PAIEMENT', 14, finalY + 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  var texte = 'Je soussigne ' + (facture.client_nom || '') +
    ' reconnais devoir la somme de ' + formatMontant(montantDu) +
    ' FCFA que je m engage a payer suivant l echeancier ci-dessus.' +
    ' Le retard de paiement d une echeance entraine les penalites de retard de 10%' +
    ' sur le montant restant du marge commercial y compris.' +
    ' Les marchandises vendues ne sont ni echangees, ni reprises.';

  var lignes = doc.splitTextToSize(texte, 182);
  doc.text(lignes, 14, finalY + 18);

  var signY = finalY + 18 + (lignes.length * 5) + 15;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Signature du client precedee de la mention "Lu et approuve"', 14, signY);

  doc.setDrawColor(...COLORS.gray);
  doc.setLineWidth(0.3);
  doc.line(14, signY + 20, 100, signY + 20);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.gray);
  doc.text('Signature', 14, signY + 26);
}

function addMonths(dateStr, months) {
  var d = new Date(dateStr);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().split('T')[0];
}

export function imprimerProforma(form, calcul, clientNom, params) {
  var doc = new jsPDF();
  var today = new Date().toISOString().split('T')[0];
  var refProforma = 'PRO-' + Date.now().toString().slice(-6);

  entete(doc, 'PROFORMA', refProforma, COLORS.orange);

  doc.setFillColor(255, 243, 224);
  doc.roundedRect(14, 43, 182, 10, 2, 2, 'F');
  doc.setTextColor(...COLORS.orange);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('DOCUMENT NON CONTRACTUEL - PROFORMA SOUMIS A ACCEPTATION DU CLIENT', 105, 50, { align: 'center' });

  doc.setFillColor(...COLORS.lightGray);
  doc.roundedRect(14, 56, 182, 28, 3, 3, 'F');
  doc.setTextColor(...COLORS.gray);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('CLIENT', 20, 64);
  doc.setTextColor(...COLORS.black);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(clientNom || '-', 20, 72);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.gray);
  doc.text('DATE PROFORMA', 130, 64);
  doc.setTextColor(...COLORS.black);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(today, 130, 72);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.gray);
  doc.setFontSize(8);
  doc.text('DESIGNATION', 130, 79);
  doc.setTextColor(...COLORS.black);
  doc.setFontSize(9);
  doc.text(form.designation || '-', 130, 85);

  infoBox(doc, 'Montant commande', formatMontant(form.montant_commande) + ' FCFA', 14, 93);
  infoBox(doc, 'Marge (' + calcul.taux + '%)', formatMontant(calcul.marge_brute) + ' FCFA', 111, 93);
  infoBox(doc, 'Frais de dossier (1%)', formatMontant(calcul.frais) + ' FCFA', 14, 116);

  if (Number(form.remise) > 0) {
    infoBox(doc, 'Remise sur marge', '- ' + formatMontant(form.remise) + ' FCFA', 111, 116);
  }

  var totalBrut = Number(form.montant_commande) + calcul.marge_brute + calcul.frais - Number(form.remise || 0);
  var totalY = 139;

  doc.setFillColor(...COLORS.orange);
  doc.roundedRect(14, totalY, 182, 20, 3, 3, 'F');
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('TOTAL PROFORMA', 20, totalY + 13);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(formatMontant(totalBrut) + ' FCFA', 196, totalY + 13, { align: 'right' });

  if (Number(form.acompte) > 0) {
    doc.setTextColor(...COLORS.black);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Acompte verse : ' + formatMontant(form.acompte) + ' FCFA  |  Reste a payer : ' + formatMontant(totalBrut - Number(form.acompte)) + ' FCFA', 14, totalY + 28);
  }

  doc.setTextColor(...COLORS.black);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Duree : ' + form.duree + ' mois  |  Mensualite estimee : ' + formatMontant(calcul.mensualite) + ' FCFA', 14, totalY + (Number(form.acompte) > 0 ? 36 : 28));

  var echY = totalY + (Number(form.acompte) > 0 ? 44 : 40);
  doc.setTextColor(...COLORS.black);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('ECHEANCIER PREVISIONNEL', 14, echY);

  var echeancesProforma = [];
  for (var i = 1; i <= Number(form.duree); i++) {
    echeancesProforma.push({
      numero_ech: 'ECH' + i,
      date_echeance: addMonths(form.date_facture || today, i),
      montant: calcul.mensualite,
      statut: 'Previsionnel'
    });
  }

  autoTable(doc, {
    startY: echY + 4,
    head: [['Echeance', 'Date previsionnelle', 'Montant', 'Statut']],
    body: echeancesProforma.map(function(e) {
      return [e.numero_ech, e.date_echeance, formatMontant(e.montant) + ' FCFA', e.statut];
    }),
    headStyles: { fillColor: COLORS.headerGray, textColor: COLORS.black, fontStyle: 'bold', fontSize: 10 },
    bodyStyles: { fontSize: 9, textColor: COLORS.black },
    alternateRowStyles: { fillColor: COLORS.rowAlt },
    columnStyles: { 0: { cellWidth: 35 }, 1: { cellWidth: 55 }, 2: { cellWidth: 55 }, 3: { cellWidth: 45 } },
    margin: { left: 14, right: 14 }
  });

  var noteY = doc.lastAutoTable.finalY + 15;
  doc.setDrawColor(...COLORS.orange);
  doc.setLineWidth(0.5);
  doc.line(14, noteY, 196, noteY);
  doc.setTextColor(...COLORS.orange);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('NOTE IMPORTANTE', 14, noteY + 8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.black);
  var note = 'Ce document est une proforma et ne constitue pas une facture officielle. ' +
    'Les montants et echeances sont donnes a titre indicatif et peuvent etre sujets a modification. ' +
    'La facture officielle sera emise apres acceptation et signature du client.';
  var lignesNote = doc.splitTextToSize(note, 182);
  doc.text(lignesNote, 14, noteY + 15);

  pied(doc);
  doc.save('Proforma_' + (clientNom || 'client').replace(/\s/g, '_') + '_' + today + '.pdf');
}

export function imprimerFacture(facture) {
  var doc = new jsPDF();
  var totalBrut = Number(facture.montant_commande || 0) + Number(facture.marge || 0) + Number(facture.frais_dossier || 0) - Number(facture.remise || 0);

  entete(doc, 'FACTURE', facture.numero);

  doc.setFillColor(...COLORS.lightGray);
  doc.roundedRect(14, 48, 182, 28, 3, 3, 'F');
  doc.setTextColor(...COLORS.gray);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('CLIENT', 20, 56);
  doc.setTextColor(...COLORS.black);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(facture.client_nom || '-', 20, 64);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.gray);
  doc.text(facture.telephone || '', 20, 71);
  doc.setFontSize(8);
  doc.text('DATE FACTURE', 130, 56);
  doc.setTextColor(...COLORS.black);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(facture.date_facture || '-', 130, 64);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.gray);
  doc.setFontSize(8);
  doc.text('DESIGNATION', 130, 71);
  doc.setTextColor(...COLORS.black);
  doc.setFontSize(9);
  doc.text(facture.designation || '-', 130, 77);

  infoBox(doc, 'Montant commande', formatMontant(facture.montant_commande) + ' FCFA', 14, 85);
  infoBox(doc, 'Marge (' + (facture.taux || 0) + '%)', formatMontant(facture.marge) + ' FCFA', 111, 85);
  infoBox(doc, 'Frais de dossier (' + (facture.frais_dossier_pct || 1) + '%)', formatMontant(facture.frais_dossier) + ' FCFA', 14, 108);

  if (Number(facture.remise) > 0) {
    infoBox(doc, 'Remise sur marge', '- ' + formatMontant(facture.remise) + ' FCFA', 111, 108);
  } else if (Number(facture.acompte) > 0) {
    infoBox(doc, 'Acompte verse', formatMontant(facture.acompte) + ' FCFA', 111, 108);
  }

  doc.setFillColor(...COLORS.primary);
  doc.roundedRect(14, 131, 182, 20, 3, 3, 'F');
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('TOTAL GENERAL', 20, 144);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(formatMontant(totalBrut) + ' FCFA', 196, 144, { align: 'right' });

  if (Number(facture.acompte) > 0) {
    doc.setFillColor(...COLORS.lightGray);
    doc.roundedRect(14, 155, 182, 12, 2, 2, 'F');
    doc.setTextColor(...COLORS.black);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Acompte verse : ' + formatMontant(facture.acompte) + ' FCFA', 20, 163);
    doc.setFont('helvetica', 'bold');
    doc.text('Reste a payer : ' + formatMontant(totalBrut - Number(facture.acompte)) + ' FCFA', 130, 163);
  }

  var statutY = Number(facture.acompte) > 0 ? 175 : 160;
  doc.setTextColor(...COLORS.warning);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Statut : ' + (facture.statut || '-'), 14, statutY);

  doc.setTextColor(...COLORS.black);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('ECHEANCIER DE PAIEMENT', 14, statutY + 10);

  tableauEcheances(doc, facture.echeances, statutY + 14, facture.acompte, facture.date_facture);
  mentionsLegales(doc, facture);
  pied(doc);
  doc.save('Facture_' + (facture.numero ? facture.numero.replace(/\//g, '-') : '') + '.pdf');
}

export function imprimerRecu(facture, echeance) {
  var doc = new jsPDF();
  var totalBrut = Number(facture.montant_commande || 0) + Number(facture.marge || 0) + Number(facture.frais_dossier || 0) - Number(facture.remise || 0);

  entete(doc, 'RECU DE PAIEMENT', 'Ref: ' + facture.numero);

  doc.setFillColor(...COLORS.lightGray);
  doc.roundedRect(14, 48, 182, 28, 3, 3, 'F');
  doc.setTextColor(...COLORS.gray);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('CLIENT', 20, 56);
  doc.setTextColor(...COLORS.black);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(facture.client_nom || '-', 20, 64);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.gray);
  doc.text(facture.telephone || '', 20, 71);
  doc.setFontSize(8);
  doc.text('DATE PAIEMENT', 130, 56);
  doc.setTextColor(...COLORS.black);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(echeance.date_paiement || new Date().toISOString().split('T')[0], 130, 64);

  infoBox(doc, 'Echeance', echeance.numero_ech, 14, 85);
  infoBox(doc, 'Designation', facture.designation, 111, 85);
  infoBox(doc, 'Duree totale', (facture.duree || '') + ' mois', 14, 108);
  infoBox(doc, 'Statut facture', facture.statut, 111, 108);

  doc.setFillColor(0, 150, 80);
  doc.roundedRect(14, 131, 182, 20, 3, 3, 'F');
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('MONTANT RECU', 20, 144);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(formatMontant(echeance.montant) + ' FCFA', 196, 144, { align: 'right' });

  doc.setTextColor(...COLORS.black);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('RECAPITULATIF FACTURE', 14, 165);

  var bodyRecu = [
    ['Montant commande', formatMontant(facture.montant_commande) + ' FCFA'],
    ['Marge (' + (facture.taux || 0) + '%)', formatMontant(facture.marge) + ' FCFA'],
    ['Frais de dossier (' + (facture.frais_dossier_pct || 1) + '%)', formatMontant(facture.frais_dossier) + ' FCFA']
  ];

  if (Number(facture.remise) > 0) {
    bodyRecu.push(['Remise sur marge', '- ' + formatMontant(facture.remise) + ' FCFA']);
  }

  bodyRecu.push(['Total facture', formatMontant(totalBrut) + ' FCFA']);

  autoTable(doc, {
    startY: 169,
    head: [['Designation', 'Montant']],
    body: bodyRecu,
    headStyles: { fillColor: COLORS.headerGray, textColor: COLORS.black, fontStyle: 'bold', fontSize: 10 },
    bodyStyles: { fontSize: 9, textColor: COLORS.black },
    alternateRowStyles: { fillColor: COLORS.rowAlt },
    margin: { left: 14, right: 14 },
    didParseCell: function(data) {
      if (data.section === 'body' && data.column.index === 1) {
        var val = data.cell.raw ? data.cell.raw.toString() : '';
        if (val.startsWith('-')) {
          data.cell.styles.textColor = [200, 50, 50];
        }
        if (data.row.index === bodyRecu.length - 1) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.textColor = COLORS.black;
        }
      }
      if (data.section === 'body' && data.row.index === bodyRecu.length - 1) {
        data.cell.styles.fontStyle = 'bold';
      }
    }
  });

  var finalY = doc.lastAutoTable.finalY + 10;
  doc.setTextColor(...COLORS.black);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('ECHEANCIER COMPLET', 14, finalY);

  tableauEcheances(doc, facture.echeances, finalY + 4, facture.acompte, facture.date_facture);
  pied(doc);
  doc.save('Recu_' + (facture.numero ? facture.numero.replace(/\//g, '-') : '') + '_' + (echeance.numero_ech || '') + '.pdf');
}