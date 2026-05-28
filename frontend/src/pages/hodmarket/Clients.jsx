import React, { useEffect, useState } from 'react';
import { getClients, createClient, updateClient, deleteClient, getSituationClient,
         getDocuments, uploadDocument, supprimerDocument, getUrlDocument } from '../../services/api';
import BadgeStatut from '../../components/BadgeStatut';

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [form, setForm] = useState({ nom: '', telephone: '', adresse: '', type_client: 'Salarie', nom_societe: '', contact_urgence_nom: '', contact_urgence_lien: '', contact_urgence_telephone: '' });
  const [situation, setSituation] = useState(null);
  const [search, setSearch] = useState('');
  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [modeEdit, setModeEdit] = useState(false);
  const [editId, setEditId] = useState(null);
  const [doublons, setDoublons] = useState([]);

  const load = () => getClients().then(r => setClients(r.data));
  useEffect(() => { load(); }, []);

  // Vérification doublons en temps réel
  const verifierDoublons = (nom, telephone) => {
    if (!nom && !telephone) { setDoublons([]); return; }
    const similaires = clients.filter(c => {
      if (modeEdit && c.id === editId) return false;
      const nomSimilaire = nom && c.nom.toLowerCase().includes(nom.toLowerCase()) && nom.length >= 3;
      const telSimilaire = telephone && telephone.length >= 6 && c.telephone && c.telephone.includes(telephone);
      return nomSimilaire || telSimilaire;
    });
    setDoublons(similaires);
  };

  const handleNomChange = (e) => {
    const val = e.target.value;
    setForm(f => ({ ...f, nom: val }));
    verifierDoublons(val, form.telephone);
  };

  const handleTelChange = (e) => {
    const val = e.target.value;
    setForm(f => ({ ...f, telephone: val }));
    verifierDoublons(form.nom, val);
  };

  const handleCreate = () => {
    if (!form.nom) return alert('Nom requis');
    if (doublons.length > 0) {
      if (!window.confirm(`⚠️ ${doublons.length} client(s) similaire(s) trouvé(s) :\n${doublons.map(d => `- ${d.nom} (${d.telephone || 'sans tél'})`).join('\n')}\n\nVoulez-vous quand même créer ce client ?`)) return;
    }
    if (modeEdit) {
      updateClient(editId, form).then(() => { resetForm(); load(); alert('Client mis a jour !'); });
    } else {
      createClient(form).then(() => { resetForm(); load(); });
    }
  };

  const resetForm = () => {
    setForm({ nom: '', telephone: '', adresse: '', type_client: 'Salarie', nom_societe: '', contact_urgence_nom: '', contact_urgence_lien: '', contact_urgence_telephone: '' });
    setModeEdit(false);
    setEditId(null);
    setDoublons([]);
  };

  const handleEdit = (client) => {
    setForm({
      nom: client.nom || '',
      telephone: client.telephone || '',
      adresse: client.adresse || '',
      type_client: client.type_client || 'Salarie',
      nom_societe: client.nom_societe || '',
      contact_urgence_nom: client.contact_urgence_nom || '',
      contact_urgence_lien: client.contact_urgence_lien || '',
      contact_urgence_telephone: client.contact_urgence_telephone || ''
    });
    setModeEdit(true);
    setEditId(client.id || client._id);
    setDoublons([]);
    window.scrollTo(0, 0);
  };

  const handleSelect = (id) => {
    getSituationClient(id).then(r => { setSituation(r.data); loadDocuments(id); });
  };

  const loadDocuments = (clientId) => {
    getDocuments(clientId).then(r => setDocuments(r.data));
  };

  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('fichier', file);
    uploadDocument(situation.client.id || situation.client._id, formData)
      .then(() => { loadDocuments(situation.client.id || situation.client._id); setUploading(false); })
      .catch(() => setUploading(false));
  };

  const handleSupprimer = (fichier) => {
    if (!window.confirm('Supprimer ce document ?')) return;
    supprimerDocument(situation.client.id || situation.client._id, fichier)
      .then(() => { loadDocuments(situation.client.id || situation.client._id); });
  };

  const formatTaille = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getIcone = (nom) => {
    const ext = nom.split('.').pop().toLowerCase();
    if (ext === 'pdf') return 'PDF';
    if (ext === 'jpg' || ext === 'jpeg' || ext === 'png') return 'IMG';
    if (ext === 'doc' || ext === 'docx') return 'DOC';
    return 'FIC';
  };

  const filtered = clients.filter(c => c.nom.toLowerCase().includes(search.toLowerCase()) || (c.telephone || '').includes(search));

  return (
    <div>
      <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: '1.5rem', color: '#1a2332' }}>👥 Clients</h1>

      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        <div style={{ background: '#162436', borderRadius: 14, padding: '1.5rem', minWidth: 300, border: modeEdit ? '2px solid #ff9800' : '1px solid rgba(255,255,255,0.07)' }}>
          <h3 style={{ margin: '0 0 1rem', color: modeEdit ? '#ff9800' : '#e8f0fe' }}>
            {modeEdit ? 'Modifier le client' : 'Ajouter un client'}
          </h3>

          {/* Alerte doublons */}
          {doublons.length > 0 && (
            <div style={{
              background: 'rgba(255,152,0,0.15)', border: '1px solid rgba(255,152,0,0.4)',
              borderRadius: 8, padding: '10px 14px', marginBottom: 12
            }}>
              <div style={{ color: '#ff9800', fontWeight: 700, fontSize: 13, marginBottom: 6 }}>
                ⚠️ Client(s) similaire(s) trouvé(s) :
              </div>
              {doublons.map(d => (
                <div key={d.id || d._id} style={{ color: '#ffcc80', fontSize: 12, marginBottom: 4 }}>
                  • {d.nom} — {d.telephone || 'sans tél'} — Encours: {Math.round(d.encours || 0).toLocaleString()} FCFA
                </div>
              ))}
            </div>
          )}

          <label style={labelStyle}>Nom *</label>
          <input
            placeholder="Nom du client"
            value={form.nom}
            onChange={handleNomChange}
            style={inputStyle}
          />

          <label style={labelStyle}>Telephone</label>
          <input
            placeholder="Ex: 242XXXXXXXX"
            value={form.telephone}
            onChange={handleTelChange}
            style={inputStyle}
          />

          <label style={labelStyle}>Adresse</label>
          <input placeholder="Adresse du client" value={form.adresse} onChange={e => setForm(f => ({ ...f, adresse: e.target.value }))} style={inputStyle} />

          <label style={labelStyle}>Type de client</label>
          <select value={form.type_client} onChange={e => setForm(f => ({ ...f, type_client: e.target.value }))} style={inputStyle}>
            <option value="Salarie">Salarie</option>
            <option value="Startup">Startup</option>
          </select>

          <label style={labelStyle}>Nom de la societe</label>
          <input placeholder="Optionnel" value={form.nom_societe} onChange={e => setForm(f => ({ ...f, nom_societe: e.target.value }))} style={inputStyle} />

          <div style={{ marginTop: 14, padding: '1rem', background: '#0d1b2a', borderRadius: 10 }}>
            <div style={{ color: '#8ba3c1', fontSize: 13, marginBottom: 8, fontWeight: 600 }}>Contact urgence</div>
            <label style={labelStyle}>Nom</label>
            <input placeholder="Nom et prenom" value={form.contact_urgence_nom} onChange={e => setForm(f => ({ ...f, contact_urgence_nom: e.target.value }))} style={inputStyle} />
            <label style={labelStyle}>Lien</label>
            <input placeholder="Ex: Epouse, Frere" value={form.contact_urgence_lien} onChange={e => setForm(f => ({ ...f, contact_urgence_lien: e.target.value }))} style={inputStyle} />
            <label style={labelStyle}>Telephone</label>
            <input placeholder="Ex: 242XXXXXXXX" value={form.contact_urgence_telephone} onChange={e => setForm(f => ({ ...f, contact_urgence_telephone: e.target.value }))} style={inputStyle} />
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
            <button onClick={handleCreate} style={btnStyle(modeEdit ? '#ff9800' : '#2979ff')}>
              {modeEdit ? 'Modifier' : 'Ajouter'}
            </button>
            <button onClick={resetForm} style={btnStyle('#333')}>Annuler</button>
          </div>
        </div>

        {situation && (
          <div style={{ flex: 1, background: '#162436', borderRadius: 14, padding: '1.5rem', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: 10 }}>
              <div>
                <div style={{ color: '#8ba3c1', fontSize: 13 }}>Client</div>
                <div style={{ color: '#e8f0fe', fontWeight: 700, fontSize: 18 }}>{situation.client.nom}</div>
                <div style={{ color: '#8ba3c1', fontSize: 13 }}>{situation.client.telephone}</div>
                <div style={{ color: '#8ba3c1', fontSize: 13 }}>{situation.client.adresse}</div>
                <div style={{ marginTop: 6 }}>
                  <span style={{ background: '#2979ff', color: '#fff', borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 600 }}>{situation.client.type_client}</span>
                  {situation.client.nom_societe ? <span style={{ color: '#8ba3c1', fontSize: 13, marginLeft: 8 }}>{situation.client.nom_societe}</span> : null}
                </div>
                {situation.client.contact_urgence_nom ? (
                  <div style={{ marginTop: 8, padding: '8px 12px', background: '#0d1b2a', borderRadius: 8, fontSize: 12 }}>
                    <div style={{ color: '#8ba3c1' }}>Contact urgence</div>
                    <div style={{ color: '#e8f0fe' }}>{situation.client.contact_urgence_nom} ({situation.client.contact_urgence_lien})</div>
                    <div style={{ color: '#8ba3c1' }}>{situation.client.contact_urgence_telephone}</div>
                  </div>
                ) : null}
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: '#8ba3c1', fontSize: 13 }}>Encours</div>
                <div style={{ color: '#ff9800', fontWeight: 700, fontSize: 22 }}>{Math.round(situation.encours || 0).toLocaleString()} FCFA</div>
                <div style={{ color: '#8ba3c1', fontSize: 12 }}>Factures : {situation.factures.length}</div>
                <button onClick={() => handleEdit(situation.client)} style={{ ...btnStyle('#ff9800'), marginTop: 10, fontSize: 13 }}>Modifier client</button>
              </div>
            </div>

            {situation.echeances.length > 0 && (
              <table style={tableStyle}>
                <thead>
                  <tr style={{ color: '#8ba3c1', fontSize: 13 }}>
                    <th style={th}>Facture</th>
                    <th style={th}>Echeance</th>
                    <th style={th}>Date</th>
                    <th style={th}>Montant</th>
                    <th style={th}>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {situation.echeances.map((e, i) => (
                    <tr key={e._id || i} style={{ fontSize: 13 }}>
                      <td style={td}>{e.numero}</td>
                      <td style={td}>{e.numero_ech}</td>
                      <td style={td}>{e.date_echeance}</td>
                      <td style={td}>{e.montant && e.montant.toLocaleString()} FCFA</td>
                      <td style={td}><BadgeStatut statut={e.statut} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <div style={{ marginTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0, color: '#e8f0fe', fontSize: 15 }}>Dossier client</h3>
                <label style={{ background: '#2979ff', color: '#fff', borderRadius: 8, padding: '7px 16px', cursor: 'pointer', fontWeight: 600, fontSize: 13, display: 'inline-block' }}>
                  {uploading ? 'Envoi...' : 'Ajouter document'}
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={handleUpload} style={{ display: 'none' }} disabled={uploading} />
                </label>
              </div>

              {documents.length === 0 && <p style={{ color: '#8ba3c1', fontSize: 13 }}>Aucun document</p>}

              {documents.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {documents.map((doc, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0d1b2a', borderRadius: 8, padding: '10px 14px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ background: '#2979ff', color: '#fff', borderRadius: 4, padding: '2px 6px', fontSize: 11, fontWeight: 700 }}>{getIcone(doc.nom)}</span>
                        <div>
                          <div style={{ color: '#e8f0fe', fontSize: 13, fontWeight: 500 }}>{doc.nom}</div>
                          <div style={{ color: '#8ba3c1', fontSize: 11 }}>{formatTaille(doc.taille)} - {doc.date}</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <a href={getUrlDocument(situation.client.id || situation.client._id, doc.nomServeur)} target="_blank" rel="noreferrer" style={{ background: '#1565c0', color: '#fff', borderRadius: 6, padding: '5px 12px', fontWeight: 600, fontSize: 12, textDecoration: 'none' }}>Telecharger</a>
                        <button onClick={() => handleSupprimer(doc.nomServeur)} style={btnStyle('#c62828', true)}>Supprimer</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div style={{ marginTop: '2rem', background: '#162436', borderRadius: 14, padding: '1.5rem', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ margin: 0, color: '#e8f0fe' }}>Liste des clients</h3>
          <input placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} style={{ ...inputStyle, width: 220 }} />
        </div>
        <table style={tableStyle}>
          <thead>
            <tr style={{ color: '#8ba3c1', fontSize: 13 }}>
              <th style={th}>Nom</th>
              <th style={th}>Telephone</th>
              <th style={th}>Type</th>
              <th style={th}>Encours</th>
              <th style={th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => (
              <tr key={c.id || c._id} onClick={() => handleSelect(c.id || c._id)} style={{ cursor: 'pointer', fontSize: 13 }}>
                <td style={td}>{c.nom}</td>
                <td style={td}>{c.telephone || '-'}</td>
                <td style={td}><span style={{ background: '#1c2e44', color: '#8ba3c1', borderRadius: 20, padding: '2px 10px', fontSize: 11 }}>{c.type_client}</span></td>
                <td style={{ ...td, color: c.encours > 0 ? '#ff9800' : '#00e676' }}>{Math.round(c.encours || 0).toLocaleString()} FCFA</td>
                <td style={td}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={e => { e.stopPropagation(); handleEdit(c); }} style={btnStyle('#ff9800', true)}>Modifier</button>
                    <button onClick={e => { e.stopPropagation(); deleteClient(c.id || c._id).then(load); }} style={btnStyle('#c62828', true)}>Supprimer</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const labelStyle = { display: 'block', color: '#8ba3c1', fontSize: 12, marginTop: 10, marginBottom: 4 };
const inputStyle = { width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.12)', background: '#0d1b2a', color: '#e8f0fe', fontSize: 14, boxSizing: 'border-box', outline: 'none' };
const tableStyle = { width: '100%', borderCollapse: 'collapse' };
const th = { padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.07)' };
const td = { padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.05)', color: '#e8f0fe' };
const btnStyle = (bg, small) => ({ background: bg, color: '#fff', border: 'none', borderRadius: 8, padding: small ? '5px 12px' : '9px 20px', cursor: 'pointer', fontWeight: 600, fontSize: small ? 12 : 14 });