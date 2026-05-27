const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function initDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à MongoDB Atlas');

    // Créer les paramètres par défaut si inexistants
    const Parametres = require('../models/Parametres');
    const count = await Parametres.countDocuments();
    if (count === 0) {
      await new Parametres({}).save();
      console.log('✅ Paramètres par défaut créés');
    }

    // Créer les paramètres construction par défaut
    const { ConstructionParametres } = require('../models/Autres');
    const countCP = await ConstructionParametres.countDocuments();
    if (countCP === 0) {
      await new ConstructionParametres({}).save();
    }

    // Créer les comptes admin et employé par défaut
    const User = require('../models/User');
    const countUsers = await User.countDocuments();
    if (countUsers === 0) {
      await new User({ username: 'admin', password: 'admin123', role: 'admin' }).save();
      await new User({ username: 'employe', password: 'employe123', role: 'employe' }).save();
      console.log('✅ Comptes créés - admin/admin123 et employe/employe123');
    }

  } catch (err) {
    console.error('❌ Erreur connexion MongoDB:', err.message);
    process.exit(1);
  }
}

module.exports = initDB;