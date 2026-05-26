const router = require('express').Router();
const { getAll, create, update, getSituation, remove } = require('../controllers/clientController');

router.get('/', getAll);
router.post('/', create);
router.put('/:id', update);
router.get('/:id/situation', getSituation);
router.delete('/:id', remove);

module.exports = router;