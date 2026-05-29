const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mongoose = require('mongoose');

async function recalculer() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connecté à MongoDB');

  const Caisse = require('./models/Caisse');
  const Parametres = require('./models/Parametres');

  const params = await Parametres.findOne();
  const soldeInitial = params ? params.solde_initial : 0;

  const operations = await Caisse.find().sort({ date: 1, _id: 1 });
  console.log('Operations trouvées:', operations.length);

  let solde = soldeInitial;
  for (const op of operations) {
    solde = solde + (op.entree || 0) - (op.sortie || 0);
    await Caisse.findByIdAndUpdate(op._id, { solde });
    console.log(`${op.date} | ${op.libelle} | +${op.entree || 0} -${op.sortie || 0} = ${solde}`);
  }

  console.log('\n✅ Recalcul terminé ! Solde final:', solde);
  process.exit(0);
}

recalculer().catch(err => { console.error(err); process.exit(1); });
