const router = require('express').Router();
const { getAll, addOperation, deleteOperation, reparerSoldes, corrigerMontant } = require('../controllers/caisseController');

router.get('/', getAll);
router.post('/', addOperation);
router.delete('/:id', deleteOperation);
router.post('/reparer-soldes', reparerSoldes);
router.post('/corriger-montant', corrigerMontant);

module.exports = router;