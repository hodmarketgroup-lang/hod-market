const router = require('express').Router();
const { getAll, addOperation, deleteOperation, reparerSoldes } = require('../controllers/caisseController');

router.get('/', getAll);
router.post('/', addOperation);
router.delete('/:id', deleteOperation);
router.post('/reparer-soldes', reparerSoldes);

module.exports = router;