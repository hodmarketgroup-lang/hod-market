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
      const salt = await bcrypt.genSalt(10);
      const adminHash = await bcrypt.hash('admin123', salt);
      const employeHash = await bcrypt.hash('employe123', salt);
      await User.create({ username: 'admin', password: adminHash, role: 'admin' });
      await User.create({ username: 'employe', password: employeHash, role: 'employe' });
      console.log('✅ Comptes créés - admin/admin123 et employe/employe123');
    }

  } catch (err) {
    console.error('❌ Erreur connexion MongoDB:', err.message);
    process.exit(1);
  }
}

module.exports = initDB;