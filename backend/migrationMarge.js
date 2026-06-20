const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mongoose = require('mongoose');

// Recalcule le champ `marge` de chaque Facture comme marge BRUTE :
//   marge = montant_commande * (taux / 100)   sans deduire la remise
//
// Usage :
//   MONGODB_URI=<uri> node backend/migrationMarge.js
//
// La remise reste dans son propre champ ; seule la valeur de `marge` est corrigee.

async function run() {
  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI manquant. Exemple :');
    console.error('  MONGODB_URI=mongodb+srv://... node backend/migrationMarge.js');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connecte a MongoDB\n');

  const Facture = require('./models/Facture');
  const factures = await Facture.find({});
  console.log(`${factures.length} facture(s) trouvee(s)`);

  let modifiees = 0;
  let inchangees = 0;

  for (const f of factures) {
    const marge_brute = (f.montant_commande || 0) * ((f.taux || 0) / 100);
    const marge_actuelle = f.marge || 0;

    if (Math.abs(marge_brute - marge_actuelle) > 0.01) {
      await Facture.findByIdAndUpdate(f._id, { marge: marge_brute });
      console.log(`  [CORRIGE] ${f.numero} — marge ${Math.round(marge_actuelle)} → ${Math.round(marge_brute)} FCFA (remise : ${f.remise || 0})`);
      modifiees++;
    } else {
      inchangees++;
    }
  }

  console.log(`\nTermine.`);
  console.log(`  ${modifiees} facture(s) corrigee(s)`);
  console.log(`  ${inchangees} facture(s) deja correcte(s)`);
  await mongoose.disconnect();
}

run().catch(err => { console.error(err); process.exit(1); });
