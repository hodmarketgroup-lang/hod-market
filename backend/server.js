const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const initDB = require('./db/init');
const errorHandler = require('./middleware/errorHandler');
const { demarrerCronRappels } = require('./services/rappels');

const app = express();
initDB();

app.use(cors({
  origin: [
    'https://hod-market.vercel.app',
    'http://localhost:3000'
  ],
  credentials: true
}));
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(morgan('dev'));
app.use(express.json());

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', require('./routes/auth'));

const { auth } = require('./middleware/auth');
app.use('/api/clients',      auth, require('./routes/clients'));
app.use('/api/factures',     auth, require('./routes/factures'));
app.use('/api/caisse',       auth, require('./routes/caisse'));
app.use('/api/parametres',   auth, require('./routes/parametres'));
app.use('/api/documents',    auth, require('./routes/documents'));
app.use('/api/logistic',     auth, require('./routes/logistic'));
app.use('/api/construction', auth, require('./routes/construction'));

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log('Serveur HOD-MARKET démarré sur le port ' + PORT);
  demarrerCronRappels();
  console.log('Rappels automatiques programmés chaque jour à 9h00');
});