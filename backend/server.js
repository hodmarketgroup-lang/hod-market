const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const initDB = require('./db/init');
const errorHandler = require('./middleware/errorHandler');
const { verifierRappels } = require('./services/rappels');

const app = express();
initDB();

app.use(cors({ origin: 'http://localhost:3000' }));
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(morgan('dev'));
app.use(express.json());

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/clients',      require('./routes/clients'));
app.use('/api/factures',     require('./routes/factures'));
app.use('/api/caisse',       require('./routes/caisse'));
app.use('/api/parametres',   require('./routes/parametres'));
app.use('/api/documents',    require('./routes/documents'));
app.use('/api/logistic',     require('./routes/logistic'));
app.use('/api/construction', require('./routes/construction'));

app.use(errorHandler);

const PORT = 5000;
app.listen(PORT, () => {
  console.log('Serveur HOD-MARKET demarre sur http://localhost:' + PORT);
  verifierRappels();
  const maintenant = new Date();
  const heure8h = new Date();
  heure8h.setHours(8, 0, 0, 0);
  if (maintenant > heure8h) heure8h.setDate(heure8h.getDate() + 1);
  const tempsAvant8h = heure8h - maintenant;
  setTimeout(() => {
    verifierRappels();
    setInterval(verifierRappels, 24 * 60 * 60 * 1000);
  }, tempsAvant8h);
  console.log('Rappels automatiques programmes chaque jour a 8h00');
});