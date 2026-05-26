const router = require('express').Router();
const { getAll, getOne, create, update, marquerPaye, paiementPartiel, annulerPaiement, penalite } = require('../controllers/factureController');

router.get('/', getAll);
router.get('/:id', getOne);
router.post('/', create);
router.put('/:id', update);
router.put('/echeances/:echId/payer', marquerPaye);
router.put('/echeances/:echId/partiel', paiementPartiel);
router.put('/echeances/:echId/annuler', annulerPaiement);
router.post('/:id/penalite', penalite);

module.exports = router;