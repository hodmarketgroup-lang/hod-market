function getTauxParDuree(duree, params) {
  const map = {
    1: params.taux_1m,
    2: params.taux_2m,
    3: params.taux_3m,
    4: params.taux_4m,
    5: params.taux_5m,
    6: params.taux_6m
  };
  return map[duree] || 0;
}

module.exports = { getTauxParDuree };