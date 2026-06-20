import React, { useEffect, useState, useRef } from 'react';
import { getClients, getFactures, getFacture, createFacture, updateFacture,
         marquerPaye, paiementPartiel, annulerPaiement, appliquerPenalite, getParams,
         getBrouillons, saveBrouillon, updateBrouillon, deleteBrouillon } from '../../services/api';
import BadgeStatut from '../../components/BadgeStatut';
import { imprimerFacture, imprimerRecu, imprimerProforma } from '../../services/pdfService';

const designations = [
  'Electromenager', 'Telephonie', 'Informatique', 'Mobilier',
  'Materiel de construction', 'Accompagnement scolaire', 'Pieces voitures',
  'Habillement', 'Decoration', 'Festivite', 'Dedouanement marchandise', 'Autre'
];

function formatMontant(montant) {
  return Math.round(montant || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

function formatSaisie(valeur) {
  if (!valeur && valeur !== 0) return '';
  const chiffres = String(valeur).replace(/\s/g, '');
  if (isNaN(chiffres)) return valeur;
  return chiffres.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

function parseSaisie(valeur) {
  return String(valeur).replace(/\s/g, '');
}

function getId(obj) {
  return obj?._id || obj?.id;
}

function ClientAutocomplete({ clients, value, onChange }) {
  const [texte, setTexte] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSugg, setShowSugg] = useState(false);
  const ref = useRef();

  useEffect(() => {
    if (value) {
      const c = clients.find(c => String(getId(c)) === String(value));
      if (c) setTexte(c.nom);
    } else {
      setTexte('');
    }
  }, [value, clients]);

  const handleChange = (e) => {
    const val = e.target.value;
    setTexte(val);
    if (val.length >= 1) {
      setSuggestions(clients.filter(c => c.nom.toLowerCase().includes(val.toLowerCase())));
      setShowSugg(true);
    } else {
      setSuggestions([]);
      setShowSugg(false);
      onChange('');
    }
  };

  const handleSelect = (c) => {
    setTexte(c.nom);
    onChange(String(getId(c)));
    setShowSugg(false);
  };

  useEffect(() => {
    const handleClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setShowSugg(false); };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <input
        type="text"
        placeholder="Tapez le nom du client..."
        value={texte}
        onChange={handleChange}
        onFocus={() => { if (texte.length >= 1) setShowSugg(true); }}
        style={inputStyle}
      />
      {showSugg && suggestions.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 1000,
          background: '#0d1b2a', border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: 8, maxHeight: 200, overflowY: 'auto', boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
        }}>
          {suggestions.map(c => (
            <div key={getId(c)} onClick={() => handleSelect(c)} style={{
              padding: '10px 14px', cursor: 'pointer', color: '#e8f0fe', fontSize: 13,
              borderBottom: '1px solid rgba(255,255,255,0.05)'
            }}
            onMouseEnter={e => e.target.style.background = '#162436'}
            onMouseLeave={e => e.target.style.background = 'transparent'}
            >
              {c.nom} {c.telephone ? <span style={{ color: '#8ba3c1', fontSize: 11 }}>— {c.telephone}</span> : ''}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Facturation() {
  const [clients, setClients] = useState([]);
  const [factures, setFactures] = useState([]);
  const [params, setParams] = useState(null);
  const [selected, setSelected] = useState(null);
  const [modeEdit, setModeEdit] = useState(false);
  const [editId, setEditId] = useState(null);
  const [showPartiel, setShowPartiel] = useState(null);
  const [montantPartiel, setMontantPartiel] = useState('');
  const [payingId, setPayingId] = useState(null);
  const [brouillons, setBrouillons] = useState([]);
  const [brouillonActif, setBrouillonActif] = useState(null);
  const [loading, setLoading] = useState(false);
  const [onglet, setOnglet] = useState('formulaire');

  const [filtreEncours, setFiltreEncours] = useState({ client: '', numero: '', designation: '', statut: '' });
  const [filtreSoldees, setFiltreSoldees] = useState({ client: '', numero: '', designation: '' });

  const [form, setForm] = useState({
    client_id: '',
    designations_selectionnees: [],
    date_facture: new Date().toISOString().split('T')[0],
    montant_commande: '',
    duree: '1',
    acompte: '0',
    depot_garantie: '0',
    remise: '0',
    frais_dossier_pct: ''
  });
  const [calcul, setCalcul] = useState({ taux: 0, marge: 0, frais: 0, total: 0, mensualite: 0 });

  const load = () => {
    setLoading(true);
    Promise.all([
      getClients().then(r => setClients(r.data)),
      getFactures().then(r => setFactures(r.data)),
      getParams().then(r => setParams(r.data)),
      getBrouillons().then(r => setBrouillons(r.data))
    ]).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!params || !form.montant_commande || !form.duree) return;
    const tauxMap = { 1: 'taux_1m', 2: 'taux_2m', 3: 'taux_3m', 4: 'taux_4m', 5: 'taux_5m', 6: 'taux_6m' };
    const taux = params[tauxMap[Number(form.duree)]] || 0;
    const mt = Number(parseSaisie(form.montant_commande));
    const remise = Number(parseSaisie(form.remise || '0'));
    const marge = mt * (taux / 100);
    const fraisPct = Number(form.frais_dossier_pct) || params.frais_dossier_pct || 1;
    const frais = mt * (fraisPct / 100);
    const total = mt + marge + frais - remise + Number(parseSaisie(form.depot_garantie || '0')) - Number(parseSaisie(form.acompte || '0'));
    setCalcul({ taux, marge, frais, fraisPct, total, mensualite: Math.round(total / Number(form.duree)) });
  }, [form.montant_commande, form.duree, form.acompte, form.depot_garantie, form.remise, form.frais_dossier_pct, params]);

  const resetForm = () => {
    setForm({
      client_id: '',
      designations_selectionnees: [],
      date_facture: new Date().toISOString().split('T')[0],
      montant_commande: '',
      duree: '1',
      acompte: '0',
      depot_garantie: '0',
      remise: '0',
      frais_dossier_pct: ''
    });
    setModeEdit(false);
    setEditId(null);
    setBrouillonActif(null);
  };

  const handleMontantChange = (field, valeur) => {
    const chiffres = valeur.replace(/\s/g, '').replace(/[^0-9]/g, '');
    const formate = chiffres ? chiffres.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') : '';
    setForm(f => ({ ...f, [field]: formate }));
  };

  const toggleDesignation = (d) => {
    setForm(f => {
      const sel = f.designations_selectionnees || [];
      if (sel.includes(d)) return { ...f, designations_selectionnees: sel.filter(x => x !== d) };
      return { ...f, designations_selectionnees: [...sel, d] };
    });
  };

  const getDesignationLabel = () => (form.designations_selectionnees || []).join(', ');

  const handleCreate = () => {
    if (!form.client_id || !form.montant_commande) return alert('Client et montant requis');
    if ((form.designations_selectionnees || []).length === 0) return alert('Choisissez au moins une designation');
    const client = clients.find(c => String(getId(c)) === String(form.client_id));
    const dataToSend = {
      ...form,
      montant_commande: parseSaisie(form.montant_commande),
      acompte: parseSaisie(form.acompte || '0'),
      depot_garantie: parseSaisie(form.depot_garantie || '0'),
      remise: parseSaisie(form.remise || '0'),
      designation: getDesignationLabel(),
      frais_dossier_pct: Number(form.frais_dossier_pct) || params.frais_dossier_pct || 1
    };
    if (!window.confirm('Confirmer la creation ?\n\nClient : ' + (client ? client.nom : '') + '\nMontant : ' + formatMontant(parseSaisie(form.montant_commande)) + ' FCFA\nDuree : ' + form.duree + ' mois\nTotal : ' + formatMontant(calcul.total) + ' FCFA')) return;
    setLoading(true);
    createFacture(dataToSend).then(() => {
      if (brouillonActif) {
        deleteBrouillon(brouillonActif).catch(() => {});
        setBrouillonActif(null);
      }
      load();
      resetForm();
      setOnglet('factures');
    }).finally(() => setLoading(false));
  };

  const handleUpdate = () => {
    if (!form.client_id || !form.montant_commande) return alert('Client et montant requis');
    if (!window.confirm('Confirmer la modification ?\n\nAttention : les echeances non payees seront recalculees.')) return;
    const dataToSend = {
      ...form,
      montant_commande: parseSaisie(form.montant_commande),
      acompte: parseSaisie(form.acompte || '0'),
      depot_garantie: parseSaisie(form.depot_garantie || '0'),
      remise: parseSaisie(form.remise || '0'),
      designation: getDesignationLabel(),
      frais_dossier_pct: Number(form.frais_dossier_pct) || params.frais_dossier_pct || 1
    };
    setLoading(true);
    updateFacture(editId, dataToSend).then(() => {
      load();
      getFacture(editId).then(r => setSelected(r.data));
      resetForm();
      alert('Facture modifiee !');
    }).finally(() => setLoading(false));
  };

  const handleEditFacture = (f) => {
    setForm({
      client_id: String(getId(f.client_id) || f.client_id),
      designations_selectionnees: f.designation ? f.designation.split(', ') : [],
      date_facture: f.date_facture || new Date().toISOString().split('T')[0],
      montant_commande: formatSaisie(f.montant_commande || ''),
      duree: String(f.duree || '1'),
      acompte: formatSaisie(f.acompte || '0'),
      depot_garantie: formatSaisie(f.depot_garantie || '0'),
      remise: formatSaisie(f.remise || '0'),
      frais_dossier_pct: String(f.frais_dossier_pct || '')
    });
    setModeEdit(true);
    setEditId(getId(f));
    setBrouillonActif(null);
    setOnglet('formulaire');
    window.scrollTo(0, 0);
  };

  const handleProforma = () => {
    if (!form.montant_commande) return alert('Entrez un montant pour generer la proforma');
    const client = clients.find(c => String(getId(c)) === String(form.client_id));
    const formWithDesignation = {
      ...form,
      montant_commande: parseSaisie(form.montant_commande),
      acompte: parseSaisie(form.acompte || '0'),
      depot_garantie: parseSaisie(form.depot_garantie || '0'),
      remise: parseSaisie(form.remise || '0'),
      designation: getDesignationLabel()
    };
    imprimerProforma(formWithDesignation, calcul, client ? client.nom : 'Client', params);
  };

  const handleSauverBrouillon = () => {
    if (!form.client_id || !form.montant_commande) return alert('Client et montant requis pour sauvegarder');
    const client = clients.find(c => String(getId(c)) === String(form.client_id));
    const data = {
      client_id: form.client_id,
      client_nom: client ? client.nom : '',
      designation: getDesignationLabel(),
      designations_selectionnees: JSON.stringify(form.designations_selectionnees || []),
      date_facture: form.date_facture,
      montant_commande: Number(parseSaisie(form.montant_commande)),
      duree: Number(form.duree),
      acompte: Number(parseSaisie(form.acompte || '0')),
      depot_garantie: Number(parseSaisie(form.depot_garantie || '0')),
      remise: Number(parseSaisie(form.remise || '0')),
      frais_dossier_pct: Number(form.frais_dossier_pct) || (params ? params.frais_dossier_pct : 1) || 1
    };
    setLoading(true);
    const action = brouillonActif ? updateBrouillon(brouillonActif, data) : saveBrouillon(data);
    action.then(r => {
      setBrouillonActif(r.data._id || r.data.id);
      getBrouillons().then(r2 => setBrouillons(r2.data));
      alert('Brouillon sauvegarde !');
    }).finally(() => setLoading(false));
  };

  const handleReprendreBrouillon = (b) => {
    let desigs = [];
    try { desigs = JSON.parse(b.designations_selectionnees || '[]'); } catch {}
    setForm({
      client_id: String(b.client_id || ''),
      designations_selectionnees: desigs,
      date_facture: b.date_facture || new Date().toISOString().split('T')[0],
      montant_commande: formatSaisie(b.montant_commande || ''),
      duree: String(b.duree || '1'),
      acompte: formatSaisie(b.acompte || '0'),
      depot_garantie: formatSaisie(b.depot_garantie || '0'),
      remise: formatSaisie(b.remise || '0'),
      frais_dossier_pct: String(b.frais_dossier_pct || '')
    });
    setBrouillonActif(b._id || b.id);
    setModeEdit(false);
    setEditId(null);
    setOnglet('formulaire');
    window.scrollTo(0, 0);
  };

  const handleCreerDepuisBrouillon = (b) => {
    if (!window.confirm('Creer une facture depuis ce brouillon ?\n\nClient : ' + b.client_nom + '\nMontant : ' + formatMontant(b.montant_commande) + ' FCFA')) return;
    const data = {
      client_id: b.client_id,
      designation: b.designation,
      date_facture: b.date_facture,
      montant_commande: b.montant_commande,
      duree: b.duree,
      acompte: b.acompte,
      depot_garantie: b.depot_garantie,
      remise: b.remise,
      frais_dossier_pct: b.frais_dossier_pct
    };
    setLoading(true);
    createFacture(data).then(() => {
      deleteBrouillon(b._id || b.id).then(() => getBrouillons().then(r => setBrouillons(r.data)));
      if (brouillonActif === (b._id || b.id)) setBrouillonActif(null);
      load();
      setOnglet('factures');
      alert('Facture creee avec succes !');
    }).finally(() => setLoading(false));
  };

  const handleSupprimerBrouillon = (b) => {
    if (!window.confirm('Supprimer ce brouillon ?\n\n' + b.client_nom + ' — ' + formatMontant(b.montant_commande) + ' FCFA')) return;
    setLoading(true);
    deleteBrouillon(b._id || b.id).then(() => {
      if (brouillonActif === (b._id || b.id)) { setBrouillonActif(null); resetForm(); }
      getBrouillons().then(r => setBrouillons(r.data));
    }).finally(() => setLoading(false));
  };

  const handleSelect = (f) => {
    getFacture(getId(f)).then(r => setSelected(r.data));
  };

  const handlePayer = (echId) => {
    const ech = selected.echeances.find(e => String(getId(e)) === String(echId));
    if (!window.confirm('Confirmer le paiement ?\n\nEcheance : ' + (ech ? ech.numero_ech : '') + '\nMontant : ' + formatMontant(ech ? ech.montant : 0) + ' FCFA')) return;
    setPayingId(echId);
    marquerPaye(echId)
      .then(() => { getFacture(getId(selected)).then(r => setSelected(r.data)); load(); })
      .finally(() => setPayingId(null));
  };

  const handlePaiementPartiel = (echId) => {
    if (!montantPartiel || Number(parseSaisie(montantPartiel)) <= 0) return alert('Entrez un montant valide');
    const ech = selected.echeances.find(e => String(getId(e)) === String(echId));
    const montant = Number(parseSaisie(montantPartiel));
    if (montant >= ech.montant) return alert('Le montant partiel doit etre inferieur au montant total');
    if (!window.confirm('Confirmer le paiement partiel ?\n\nMontant paye : ' + formatMontant(montant) + ' FCFA\nReste : ' + formatMontant(ech.montant - montant) + ' FCFA')) return;
    paiementPartiel(echId, { montant_paye: montant }).then(() => {
      setShowPartiel(null); setMontantPartiel('');
      getFacture(getId(selected)).then(r => setSelected(r.data)); load();
    });
  };

  const handleAnnuler = (echId) => {
    if (!window.confirm('Confirmer l annulation ?')) return;
    annulerPaiement(echId).then(() => { getFacture(getId(selected)).then(r => setSelected(r.data)); load(); });
  };

  const handlePenalite = () => {
    if (!window.confirm('Confirmer l application d une penalite ?')) return;
    appliquerPenalite(getId(selected)).then(r => {
      alert('Penalite appliquee !\nNouveau total : ' + formatMontant(r.data.nouveauTotal) + ' FCFA');
      getFacture(getId(selected)).then(r => setSelected(r.data));
    });
  };

  const getStatutColor = (statut) => {
    if (statut === 'Payé' || statut === 'Paye') return '#00e676';
    if (statut === 'Reste a regler') return '#ff9800';
    return '#ff5252';
  };

  const fraisPctAffiche = Number(form.frais_dossier_pct) || (params ? params.frais_dossier_pct : 1) || 1;

  const estSoldee = (statut) => {
    if (!statut) return false;
    const s = statut.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    return s === 'soldee' || s === 'solde';
  };
  const facturesEnCours = factures.filter(f => !estSoldee(f.statut));
  const facturesSoldees = factures.filter(f => estSoldee(f.statut));

  const filteredEnCours = facturesEnCours.filter(f => {
    if (filtreEncours.client && !f.client_nom?.toLowerCase().includes(filtreEncours.client.toLowerCase())) return false;
    if (filtreEncours.numero && !f.numero?.toLowerCase().includes(filtreEncours.numero.toLowerCase())) return false;
    if (filtreEncours.designation && !f.designation?.toLowerCase().includes(filtreEncours.designation.toLowerCase())) return false;
    if (filtreEncours.statut && !f.statut?.toLowerCase().includes(filtreEncours.statut.toLowerCase())) return false;
    return true;
  });

  const filteredSoldees = facturesSoldees.filter(f => {
    if (filtreSoldees.client && !f.client_nom?.toLowerCase().includes(filtreSoldees.client.toLowerCase())) return false;
    if (filtreSoldees.numero && !f.numero?.toLowerCase().includes(filtreSoldees.numero.toLowerCase())) return false;
    if (filtreSoldees.designation && !f.designation?.toLowerCase().includes(filtreSoldees.designation.toLowerCase())) return false;
    return true;
  });

  const totalEnCours = filteredEnCours.reduce((s, f) => s + (f.total || 0), 0);
  const totalSoldees = filteredSoldees.reduce((s, f) => s + (f.total || 0), 0);

  const titreFormulaire = modeEdit ? 'Modifier la facture' : brouillonActif ? 'Brouillon en cours' : 'Formulaire';

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: 12 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0, color: '#1a2332' }}>Facturation</h1>
        {loading && <span style={{ color: '#8ba3c1', fontSize: 13 }}>Chargement...</span>}
      </div>

      {/* ONGLETS */}
      <div style={{ display: 'flex', gap: 8, marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {[
          { key: 'formulaire', label: titreFormulaire },
          { key: 'brouillons', label: `Brouillons (${brouillons.length})` },
          { key: 'factures',   label: `Factures (${factures.length})` }
        ].map(o => (
          <button key={o.key} onClick={() => setOnglet(o.key)} style={{
            padding: '8px 22px', borderRadius: 8, border: 'none', fontWeight: 600, fontSize: 13, cursor: 'pointer',
            background: onglet === o.key ? '#2979ff' : '#162436',
            color: onglet === o.key ? '#fff' : '#8ba3c1',
            transition: 'background 0.15s'
          }}>{o.label}</button>
        ))}
      </div>

      {/* ── ONGLET FORMULAIRE ── */}
      {onglet === 'formulaire' && (
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>

          {/* FORMULAIRE SAISIE */}
          <div style={{
            minWidth: 320,
            background: '#162436',
            borderRadius: 14,
            padding: '1.5rem',
            border: modeEdit ? '2px solid #ff9800' : brouillonActif ? '2px solid #7c4dff' : '1px solid rgba(255,255,255,0.07)'
          }}>
            <h3 style={{ margin: '0 0 1rem', color: modeEdit ? '#ff9800' : brouillonActif ? '#b39ddb' : '#e8f0fe' }}>
              {modeEdit ? 'Modifier la facture' : brouillonActif ? 'Brouillon (non enregistre comme facture)' : 'Creer une facture'}
            </h3>

            <label style={labelStyle}>Client</label>
            <ClientAutocomplete
              clients={clients}
              value={form.client_id}
              onChange={val => setForm(f => ({ ...f, client_id: val }))}
            />

            <label style={labelStyle}>Date facture</label>
            <input type="date" value={form.date_facture} onChange={e => setForm(f => ({ ...f, date_facture: e.target.value }))} style={inputStyle} />

            <label style={labelStyle}>Designations (selection multiple)</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
              {designations.map(d => (
                <span key={d} onClick={() => toggleDesignation(d)} style={{
                  padding: '4px 10px', borderRadius: 20, fontSize: 11, cursor: 'pointer', userSelect: 'none',
                  background: (form.designations_selectionnees || []).includes(d) ? '#2979ff' : '#0d1b2a',
                  color: (form.designations_selectionnees || []).includes(d) ? '#fff' : '#8ba3c1',
                  border: (form.designations_selectionnees || []).includes(d) ? '1px solid #2979ff' : '1px solid rgba(255,255,255,0.12)'
                }}>{d}</span>
              ))}
            </div>
            {(form.designations_selectionnees || []).length > 0 && (
              <div style={{ color: '#2979ff', fontSize: 11, marginBottom: 8 }}>Selectionne : {form.designations_selectionnees.join(', ')}</div>
            )}

            <label style={labelStyle}>Montant commande (FCFA)</label>
            <input type="text" placeholder="Ex: 500 000" value={form.montant_commande} onChange={e => handleMontantChange('montant_commande', e.target.value)} style={inputStyle} />

            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Duree (mois)</label>
                <select value={form.duree} onChange={e => setForm(f => ({ ...f, duree: e.target.value }))} style={inputStyle}>
                  {[1,2,3,4,5,6].map(n => <option key={n}>{n}</option>)}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Taux (auto)</label>
                <input readOnly value={calcul.taux + '%'} style={{ ...inputStyle, background: '#0a1628', color: '#8ba3c1' }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Acompte</label>
                <input type="text" value={form.acompte} onChange={e => handleMontantChange('acompte', e.target.value)} style={inputStyle} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Depot garantie</label>
                <input type="text" value={form.depot_garantie} onChange={e => handleMontantChange('depot_garantie', e.target.value)} style={inputStyle} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Remise (FCFA)</label>
                <input type="text" placeholder="Ex: 5 000" value={form.remise} onChange={e => handleMontantChange('remise', e.target.value)} style={inputStyle} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Frais dossier (%)</label>
                <input type="number" placeholder={'Defaut : ' + (params ? params.frais_dossier_pct : 1) + '%'} value={form.frais_dossier_pct} onChange={e => setForm(f => ({ ...f, frais_dossier_pct: e.target.value }))} style={inputStyle} />
              </div>
            </div>

            {/* RECAPITULATIF */}
            {parseSaisie(form.montant_commande) > 0 && (
              <div style={{ background: '#0d1b2a', borderRadius: 10, padding: '1rem', marginTop: 14, fontSize: 13 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                  <span style={{ color: '#8ba3c1' }}>Marge commerciale ({calcul.taux}%)</span>
                  <span style={{ color: '#00e676' }}>{formatMontant(calcul.marge)} FCFA</span>
                </div>
                {Number(parseSaisie(form.remise)) > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                    <span style={{ color: '#ff5252' }}>Remise</span>
                    <span style={{ color: '#ff5252' }}>- {formatMontant(parseSaisie(form.remise))} FCFA</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                  <span style={{ color: '#8ba3c1' }}>Frais dossier ({fraisPctAffiche}%)</span>
                  <span>{formatMontant(calcul.frais)} FCFA</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: 6, paddingTop: 8 }}>
                  <span style={{ color: '#e8f0fe', fontWeight: 700 }}>TOTAL</span>
                  <span style={{ color: '#00e676', fontWeight: 700 }}>{formatMontant(calcul.total)} FCFA</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                  <span style={{ color: '#8ba3c1' }}>Mensualite estimee</span>
                  <span style={{ color: '#2979ff', fontWeight: 600 }}>{formatMontant(calcul.mensualite)} FCFA</span>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
              {modeEdit ? (
                <>
                  <button onClick={handleUpdate} disabled={loading} style={btnStyle('#ff9800', false, loading)}>Modifier</button>
                  <button onClick={resetForm} style={btnStyle('#333')}>Annuler</button>
                </>
              ) : (
                <>
                  <button onClick={handleCreate} disabled={loading} style={btnStyle('#2979ff', false, loading)}>Creer</button>
                  <button onClick={handleSauverBrouillon} disabled={loading} style={btnStyle('#7c4dff', false, loading)}>
                    {brouillonActif ? 'Mettre a jour brouillon' : 'Sauver brouillon'}
                  </button>
                  <button onClick={handleProforma} style={btnStyle('#e65100')}>Proforma PDF</button>
                  <button onClick={resetForm} style={btnStyle('#333')}>Vider</button>
                </>
              )}
            </div>
          </div>

          {/* DETAIL FACTURE SELECTIONNEE */}
          <div style={{ flex: 1, minWidth: 300, background: '#162436', borderRadius: 14, padding: '1.5rem', border: '1px solid rgba(255,255,255,0.07)' }}>
            <h3 style={{ margin: '0 0 1rem', color: '#e8f0fe' }}>Detail facture</h3>
            {!selected ? (
              <p style={{ color: '#8ba3c1' }}>Cliquez sur une facture dans l'onglet Factures pour voir le detail.</p>
            ) : (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: '1rem' }}>
                  <div>
                    <div style={{ color: '#8ba3c1', fontSize: 12 }}>Facture</div>
                    <div style={{ color: '#2979ff', fontWeight: 700 }}>{selected.numero}</div>
                  </div>
                  <div>
                    <div style={{ color: '#8ba3c1', fontSize: 12 }}>Client</div>
                    <div style={{ color: '#e8f0fe' }}>{selected.client_nom}</div>
                  </div>
                  <div>
                    <div style={{ color: '#8ba3c1', fontSize: 12 }}>Statut</div>
                    <BadgeStatut statut={selected.statut} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: '1rem', fontSize: 13 }}>
                  <div><span style={{ color: '#8ba3c1' }}>Montant : </span>{formatMontant(selected.montant_commande)} FCFA</div>
                  <div><span style={{ color: '#8ba3c1' }}>Marge : </span>{formatMontant(selected.marge)} FCFA</div>
                  <div><span style={{ color: '#8ba3c1' }}>Frais : </span>{formatMontant(selected.frais_dossier)} FCFA</div>
                  {selected.remise > 0 && <div><span style={{ color: '#ff5252' }}>Remise : </span><span style={{ color: '#ff5252' }}>- {formatMontant(selected.remise)} FCFA</span></div>}
                  <div><span style={{ color: '#8ba3c1' }}>Total : </span><strong style={{ color: '#00e676' }}>{formatMontant(selected.total)} FCFA</strong></div>
                </div>
                <div style={{ display: 'flex', gap: 10, marginBottom: '1rem', flexWrap: 'wrap' }}>
                  <button onClick={() => handleEditFacture(selected)} style={{ ...btnStyle('#ff9800'), fontSize: 13 }}>Modifier</button>
                  <button onClick={handlePenalite} style={{ ...btnStyle('#e65100'), fontSize: 13 }}>Penalite</button>
                  <button onClick={() => imprimerFacture(selected)} style={{ ...btnStyle('#1565c0'), fontSize: 13 }}>PDF Facture</button>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ color: '#8ba3c1' }}>
                      <th style={th}>Echeance</th><th style={th}>Date</th><th style={th}>Montant</th><th style={th}>Statut</th><th style={th}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selected.echeances || []).map(e => (
                      <tr key={getId(e)} style={{ background: e.statut === 'Reste a regler' ? 'rgba(255,152,0,0.05)' : 'transparent' }}>
                        <td style={td}><span style={{ color: e.est_partiel ? '#ff9800' : '#e8f0fe' }}>{e.numero_ech}</span></td>
                        <td style={td}>{e.date_echeance}</td>
                        <td style={td}>{formatMontant(e.montant)} FCFA</td>
                        <td style={td}><span style={{ color: getStatutColor(e.statut), fontWeight: 600, fontSize: 12 }}>{e.statut}</span></td>
                        <td style={td}>
                          {(e.statut === 'En attente' || e.statut === 'Reste a regler') && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                              <button onClick={() => handlePayer(getId(e))} disabled={payingId === getId(e)} style={btnStyle('#2e7d32', true, payingId === getId(e))}>
                                {payingId === getId(e) ? '...' : e.statut === 'Reste a regler' ? 'Solder' : 'Payer'}
                              </button>
                              <button onClick={() => setShowPartiel(showPartiel === getId(e) ? null : getId(e))} style={btnStyle('#ff9800', true)}>Partiel</button>
                              {showPartiel === getId(e) && (
                                <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                                  <input type="text" placeholder="Montant" value={montantPartiel}
                                    onChange={ev => { const c = ev.target.value.replace(/\s/g, '').replace(/[^0-9]/g, ''); setMontantPartiel(c ? c.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') : ''); }}
                                    style={{ ...inputStyle, width: 100, padding: '4px 8px', fontSize: 12 }} />
                                  <button onClick={() => handlePaiementPartiel(getId(e))} disabled={payingId === getId(e)} style={btnStyle('#2e7d32', true, payingId === getId(e))}>OK</button>
                                </div>
                              )}
                            </div>
                          )}
                          {(e.statut === 'Payé' || e.statut === 'Paye') && (
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button onClick={() => imprimerRecu(selected, e)} style={btnStyle('#1565c0', true)}>Recu</button>
                              <button onClick={() => handleAnnuler(getId(e))} style={btnStyle('#555', true)}>Annuler</button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── ONGLET BROUILLONS ── */}
      {onglet === 'brouillons' && (
        <div style={{ background: '#162436', borderRadius: 14, padding: '1.5rem', border: '1px solid rgba(124,77,255,0.25)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: 10 }}>
            <h3 style={{ margin: 0, color: '#b39ddb' }}>Brouillons sauvegardes ({brouillons.length})</h3>
            <button onClick={() => { resetForm(); setOnglet('formulaire'); }} style={btnStyle('#7c4dff', true)}>+ Nouveau brouillon</button>
          </div>
          {brouillons.length === 0 ? (
            <p style={{ color: '#8ba3c1', textAlign: 'center', padding: '2rem 0' }}>
              Aucun brouillon. Remplissez le formulaire et cliquez sur "Sauver brouillon".
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {brouillons.map(b => {
                const bId = b._id || b.id;
                const estActif = brouillonActif === bId;
                return (
                  <div key={bId} style={{
                    background: estActif ? '#1a1040' : '#0d1b2a',
                    borderRadius: 10, padding: '1rem 1.2rem',
                    border: estActif ? '1px solid #7c4dff' : '1px solid rgba(255,255,255,0.07)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12
                  }}>
                    <div>
                      <div style={{ color: '#e8f0fe', fontWeight: 600, fontSize: 14 }}>
                        {b.client_nom || '(sans client)'}
                        {estActif && <span style={{ color: '#7c4dff', fontSize: 11, marginLeft: 8 }}>EN COURS</span>}
                      </div>
                      <div style={{ color: '#8ba3c1', fontSize: 12, marginTop: 2 }}>
                        {b.designation || '(sans designation)'} — {b.duree} mois
                      </div>
                      <div style={{ color: '#2979ff', fontSize: 13, marginTop: 4, fontWeight: 600 }}>
                        {formatMontant(b.montant_commande)} FCFA
                      </div>
                      <div style={{ color: '#4a5568', fontSize: 11, marginTop: 2 }}>
                        Cree le {b.created_at ? new Date(b.created_at).toLocaleDateString('fr-FR') : '—'}
                        {' · '}Modifie le {b.updated_at ? new Date(b.updated_at).toLocaleDateString('fr-FR') : '—'}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <button onClick={() => handleReprendreBrouillon(b)} style={btnStyle('#7c4dff', true)}>Reprendre</button>
                      <button onClick={() => handleCreerDepuisBrouillon(b)} disabled={loading} style={btnStyle('#2979ff', true, loading)}>Creer facture</button>
                      <button onClick={() => handleSupprimerBrouillon(b)} disabled={loading} style={btnStyle('#c62828', true, loading)}>Supprimer</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── ONGLET FACTURES ── */}
      {onglet === 'factures' && (
        <div>
          {/* FACTURES EN COURS */}
          <div style={{ marginBottom: '2rem', background: '#162436', borderRadius: 14, padding: '1.5rem', border: '1px solid rgba(255,152,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: 10 }}>
              <h3 style={{ margin: 0, color: '#ff9800' }}>Factures en cours ({filteredEnCours.length})</h3>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <span style={{ color: '#ff9800', fontWeight: 700 }}>Total : {formatMontant(totalEnCours)} FCFA</span>
                <button onClick={load} disabled={loading} style={btnStyle('#333', true, loading)}>Rafraichir</button>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: '1rem', flexWrap: 'wrap' }}>
              <input placeholder="Numero" value={filtreEncours.numero} onChange={e => setFiltreEncours(f => ({ ...f, numero: e.target.value }))} style={{ ...filtreStyle, width: 130 }} />
              <input placeholder="Client" value={filtreEncours.client} onChange={e => setFiltreEncours(f => ({ ...f, client: e.target.value }))} style={{ ...filtreStyle, width: 160 }} />
              <input placeholder="Designation" value={filtreEncours.designation} onChange={e => setFiltreEncours(f => ({ ...f, designation: e.target.value }))} style={{ ...filtreStyle, width: 160 }} />
              <select value={filtreEncours.statut} onChange={e => setFiltreEncours(f => ({ ...f, statut: e.target.value }))} style={{ ...filtreStyle, width: 140 }}>
                <option value="">Tous statuts</option>
                <option value="En attente">En attente</option>
                <option value="Partiel">Partiel</option>
              </select>
              <button onClick={() => setFiltreEncours({ client: '', numero: '', designation: '', statut: '' })} style={btnStyle('#333', true)}>Reinitialiser</button>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ color: '#8ba3c1' }}>
                  <th style={th}>Numero</th><th style={th}>Client</th><th style={th}>Designation</th><th style={th}>Total</th><th style={th}>Statut</th><th style={th}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredEnCours.length === 0 ? (
                  <tr><td colSpan={6} style={{ ...td, textAlign: 'center', color: '#8ba3c1' }}>Aucune facture en cours</td></tr>
                ) : filteredEnCours.map(f => (
                  <tr key={getId(f)} style={{ cursor: 'pointer' }}>
                    <td style={{ ...td, color: '#2979ff' }} onClick={() => { handleSelect(f); setOnglet('formulaire'); }}>{f.numero}</td>
                    <td style={td} onClick={() => { handleSelect(f); setOnglet('formulaire'); }}>{f.client_nom}</td>
                    <td style={td} onClick={() => { handleSelect(f); setOnglet('formulaire'); }}>{f.designation}</td>
                    <td style={td} onClick={() => { handleSelect(f); setOnglet('formulaire'); }}>{formatMontant(f.total)} FCFA</td>
                    <td style={td} onClick={() => { handleSelect(f); setOnglet('formulaire'); }}><BadgeStatut statut={f.statut} /></td>
                    <td style={td}><button onClick={() => handleEditFacture(f)} style={btnStyle('#ff9800', true)}>Modifier</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* FACTURES SOLDÉES */}
          <div style={{ background: '#162436', borderRadius: 14, padding: '1.5rem', border: '1px solid rgba(0,230,118,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: 10 }}>
              <h3 style={{ margin: 0, color: '#00e676' }}>Factures soldees ({filteredSoldees.length})</h3>
              <span style={{ color: '#00e676', fontWeight: 700 }}>Total : {formatMontant(totalSoldees)} FCFA</span>
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: '1rem', flexWrap: 'wrap' }}>
              <input placeholder="Numero" value={filtreSoldees.numero} onChange={e => setFiltreSoldees(f => ({ ...f, numero: e.target.value }))} style={{ ...filtreStyle, width: 130 }} />
              <input placeholder="Client" value={filtreSoldees.client} onChange={e => setFiltreSoldees(f => ({ ...f, client: e.target.value }))} style={{ ...filtreStyle, width: 160 }} />
              <input placeholder="Designation" value={filtreSoldees.designation} onChange={e => setFiltreSoldees(f => ({ ...f, designation: e.target.value }))} style={{ ...filtreStyle, width: 160 }} />
              <button onClick={() => setFiltreSoldees({ client: '', numero: '', designation: '' })} style={btnStyle('#333', true)}>Reinitialiser</button>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ color: '#8ba3c1' }}>
                  <th style={th}>Numero</th><th style={th}>Client</th><th style={th}>Designation</th><th style={th}>Total</th><th style={th}>Statut</th><th style={th}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredSoldees.length === 0 ? (
                  <tr><td colSpan={6} style={{ ...td, textAlign: 'center', color: '#8ba3c1' }}>Aucune facture soldee</td></tr>
                ) : filteredSoldees.map(f => (
                  <tr key={getId(f)} style={{ cursor: 'pointer' }}>
                    <td style={{ ...td, color: '#2979ff' }} onClick={() => { handleSelect(f); setOnglet('formulaire'); }}>{f.numero}</td>
                    <td style={td} onClick={() => { handleSelect(f); setOnglet('formulaire'); }}>{f.client_nom}</td>
                    <td style={td} onClick={() => { handleSelect(f); setOnglet('formulaire'); }}>{f.designation}</td>
                    <td style={td} onClick={() => { handleSelect(f); setOnglet('formulaire'); }}>{formatMontant(f.total)} FCFA</td>
                    <td style={td} onClick={() => { handleSelect(f); setOnglet('formulaire'); }}><BadgeStatut statut={f.statut} /></td>
                    <td style={td}><button onClick={() => handleEditFacture(f)} style={btnStyle('#00e676', true)}>Voir</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

const labelStyle = { display: 'block', color: '#8ba3c1', fontSize: 12, marginTop: 10, marginBottom: 4 };
const inputStyle = { width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.12)', background: '#0d1b2a', color: '#e8f0fe', fontSize: 14, boxSizing: 'border-box', outline: 'none' };
const filtreStyle = { padding: '7px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: '#0d1b2a', color: '#e8f0fe', fontSize: 12, outline: 'none' };
const th = { padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.07)' };
const td = { padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.05)', color: '#e8f0fe' };
const btnStyle = (bg, small, disabled) => ({ background: bg, color: bg === '#00e676' ? '#0d1b2a' : '#fff', border: 'none', borderRadius: 8, padding: small ? '5px 12px' : '9px 20px', cursor: disabled ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: small ? 12 : 14, opacity: disabled ? 0.5 : 1 });
