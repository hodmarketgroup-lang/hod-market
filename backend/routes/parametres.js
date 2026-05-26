const router = require('express').Router();
const { getParams, saveParams } = require('../controllers/paramController');

router.get('/', getParams);
router.put('/', saveParams);

module.exports = router;