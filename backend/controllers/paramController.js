const Parametres = require('../models/Parametres');

const getParams = async (req, res) => {
  try {
    const params = await Parametres.findOne();
    res.json(params);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const saveParams = async (req, res) => {
  try {
    await Parametres.findOneAndUpdate({}, req.body, { upsert: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getParams, saveParams };