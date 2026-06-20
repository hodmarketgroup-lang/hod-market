const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mongoose = require('mongoose');

// Supprime le doublon ECH1 GAMBOU Blenny (0012/05/2026/HDMKT) du 2026-05-29
// et recalcule tous les soldes de caisse en cascade.
// Usage : MONGODB_URI=<uri> node backend/fixDoublon.js

async function run() {
  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI manquant. Exemple :');
    console.error('  MONGODB_URI=mongodb+srv://... node backend/fixDoublon.js');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connecte a MongoDB');

  const Caisse = require('./models/Caisse');
  const Parametres = require('./models/Parametres');

  // Chercher toutes les entrees correspondant au libelle du doublon
  const pattern = /ECH1.*GAMBOU.*0012\/05\/2026\/HDMKT/;
  const candidats = await Caisse.find({ libelle: pattern }).sort({ date: 1, _id: 1 });

  console.log(`\nEntrees trouvees (${candidats.length}) :`);
  candidats.forEach(d =>
    console.log(`  _id=${d._id}  date=${d.date}  entree=${d.entree}  solde=${d.solde}  libelle="${d.libelle}"`)
  );

  if (candidats.length === 0) {
    console.log('\nAucune entree trouvee. Verifier le libelle dans la base.');
    await mongoose.disconnect();
    return;
  }

  if (candidats.length === 1) {
    console.log('\nUne seule entree trouvee — pas de doublon visible. Recalcul quand meme...');
  }

  if (candidats.length >= 2) {
    // Garder le premier (_id le plus ancien), supprimer tous les suivants
    const [original, ...doublons] = candidats;
    console.log(`\nOriginal conserve : ${original._id}`);
    for (const d of doublons) {
      await Caisse.findByIdAndDelete(d._id);
      console.log(`Doublon supprime  : ${d._id}`);
    }
  }

  // Recalculer tous les soldes du journal en cascade
  const params = await Parametres.findOne();
  const soldeInitial = params ? params.solde_initial : 0;
  const journal = await Caisse.find().sort({ date: 1, _id: 1 });

  console.log(`\nRecalcul sur ${journal.length} operations (solde initial : ${soldeInitial}) :`);
  let solde = soldeInitial;
  for (const op of journal) {
    solde = solde + (op.entree || 0) - (op.sortie || 0);
    await Caisse.findByIdAndUpdate(op._id, { solde });
    console.log(`  ${op.date} | +${op.entree || 0} -${op.sortie || 0} => ${solde} | ${op.libelle}`);
  }

  console.log(`\nTermine. Solde final : ${solde} FCFA`);
  await mongoose.disconnect();
}

run().catch(err => { console.error(err); process.exit(1); });
