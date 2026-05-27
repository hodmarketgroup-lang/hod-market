import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const API = axios.create({ baseURL: `${BASE_URL}/api` });

export const getClients = () => API.get('/clients');
export const createClient = (d) => API.post('/clients', d);
export const updateClient = (id, d) => API.put(`/clients/${id}`, d);
export const deleteClient = (id) => API.delete(`/clients/${id}`);
export const getSituationClient = (id) => API.get(`/clients/${id}/situation`);

export const getFactures = () => API.get('/factures');
export const getFacture = (id) => API.get(`/factures/${id}`);
export const createFacture = (d) => API.post('/factures', d);
export const marquerPaye = (echId) => API.put(`/factures/echeances/${echId}/payer`);
export const annulerPaiement = (echId) => API.put(`/factures/echeances/${echId}/annuler`);
export const appliquerPenalite = (id) => API.post(`/factures/${id}/penalite`);

export const getCaisse = () => API.get('/caisse');
export const addOperation = (d) => API.post('/caisse', d);

export const getParams = () => API.get('/parametres');
export const saveParams = (d) => API.put('/parametres', d);

export const getDocuments = (clientId) => API.get(`/documents/${clientId}/documents`);
export const uploadDocument = (clientId, formData) => API.post(`/documents/${clientId}/upload`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const supprimerDocument = (clientId, fichier) => API.delete(`/documents/${clientId}/documents/${fichier}`);
export const getUrlDocument = (clientId, fichier) => `${BASE_URL}/api/documents/${clientId}/documents/${fichier}`;

// HOD LOGISTIC
export const getLogisticRecettes = () => API.get('/logistic/recettes');
export const addLogisticRecette = (d) => API.post('/logistic/recettes', d);
export const deleteLogisticRecette = (id) => API.delete(`/logistic/recettes/${id}`);
export const getLogisticCharges = () => API.get('/logistic/charges');
export const addLogisticCharge = (d) => API.post('/logistic/charges', d);
export const deleteLogisticCharge = (id) => API.delete(`/logistic/charges/${id}`);
export const getLogisticCaisse = () => API.get('/logistic/caisse');
export const getLogisticDashboard = () => API.get('/logistic/dashboard');

// HOD CONSTRUCTION
export const getConstructionParams = () => API.get('/construction/parametres');
export const saveConstructionParams = (d) => API.put('/construction/parametres', d);
export const getConstructionRecettes = () => API.get('/construction/recettes');
export const addConstructionRecette = (d) => API.post('/construction/recettes', d);
export const deleteConstructionRecette = (id) => API.delete(`/construction/recettes/${id}`);
export const getConstructionCharges = () => API.get('/construction/charges');
export const addConstructionCharge = (d) => API.post('/construction/charges', d);
export const deleteConstructionCharge = (id) => API.delete(`/construction/charges/${id}`);
export const getConstructionProduction = () => API.get('/construction/production');
export const addConstructionProduction = (d) => API.post('/construction/production', d);
export const deleteConstructionProduction = (id) => API.delete(`/construction/production/${id}`);
export const getConstructionStock = () => API.get('/construction/stock');
export const ajusterConstructionStock = (d) => API.post('/construction/stock/ajuster', d);
export const getConstructionCaisse = () => API.get('/construction/caisse');
export const getConstructionDashboard = () => API.get('/construction/dashboard');
export const updateFacture = (id, d) => API.put(`/factures/${id}`, d);
export const paiementPartiel = (echId, d) => API.put(`/factures/echeances/${echId}/partiel`, d);