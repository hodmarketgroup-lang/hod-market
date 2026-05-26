const router = require('express').Router();
const { getAll, addOperation, deleteOperation } = require('../controllers/caisseController');

router.get('/', getAll);
router.post('/', addOperation);
router.delete('/:id', deleteOperation);

module.exports = router;