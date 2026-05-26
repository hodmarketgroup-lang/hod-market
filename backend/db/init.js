const db = require('./database');

function initDB() {
  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nom TEXT NOT NULL,
      telephone TEXT,
      adresse TEXT,
      type_client TEXT DEFAULT 'Salarie',
      nom_societe TEXT,
      contact_urgence_nom TEXT,
      contact_urgence_lien TEXT,
      contact_urgence_telephone TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )`);

    db.run(`ALTER TABLE clients ADD COLUMN adresse TEXT`, () => {});
    db.run(`ALTER TABLE clients ADD COLUMN type_client TEXT DEFAULT 'Salarie'`, () => {});
    db.run(`ALTER TABLE clients ADD COLUMN nom_societe TEXT`, () => {});
    db.run(`ALTER TABLE clients ADD COLUMN contact_urgence_nom TEXT`, () => {});
    db.run(`ALTER TABLE clients ADD COLUMN contact_urgence_lien TEXT`, () => {});
    db.run(`ALTER TABLE clients ADD COLUMN contact_urgence_telephone TEXT`, () => {});

    db.run(`CREATE TABLE IF NOT EXISTS factures (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      numero TEXT UNIQUE NOT NULL,
      client_id INTEGER NOT NULL,
      designation TEXT,
      date_facture TEXT,
      montant_commande REAL DEFAULT 0,
      duree INTEGER DEFAULT 1,
      taux REAL DEFAULT 0,
      marge REAL DEFAULT 0,
      frais_dossier REAL DEFAULT 0,
      acompte REAL DEFAULT 0,
      depot_garantie REAL DEFAULT 0,
      remise REAL DEFAULT 0,
      total REAL DEFAULT 0,
      statut TEXT DEFAULT 'En attente',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (client_id) REFERENCES clients(id)
    )`);

    db.run(`ALTER TABLE factures ADD COLUMN remise REAL DEFAULT 0`, () => {});

    db.run(`CREATE TABLE IF NOT EXISTS echeances (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      facture_id INTEGER NOT NULL,
      numero_ech TEXT,
      date_echeance TEXT,
      montant REAL,
      statut TEXT DEFAULT 'En attente',
      date_paiement TEXT,
      notif_j5 INTEGER DEFAULT 0,
      notif_j0 INTEGER DEFAULT 0,
      est_partiel INTEGER DEFAULT 0,
      echeance_parent_id INTEGER DEFAULT NULL,
      FOREIGN KEY (facture_id) REFERENCES factures(id)
    )`);

    db.run(`ALTER TABLE echeances ADD COLUMN notif_j5 INTEGER DEFAULT 0`, () => {});
    db.run(`ALTER TABLE echeances ADD COLUMN notif_j0 INTEGER DEFAULT 0`, () => {});
    db.run(`ALTER TABLE echeances ADD COLUMN est_partiel INTEGER DEFAULT 0`, () => {});
    db.run(`ALTER TABLE echeances ADD COLUMN echeance_parent_id INTEGER DEFAULT NULL`, () => {});
    db.run(`ALTER TABLE factures ADD COLUMN frais_dossier_pct REAL DEFAULT 1`, () => {});

    db.run(`CREATE TABLE IF NOT EXISTS caisse (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      type TEXT NOT NULL,
      libelle TEXT,
      entree REAL DEFAULT 0,
      sortie REAL DEFAULT 0,
      solde REAL DEFAULT 0,
      facture_id INTEGER,
      echeance_id INTEGER
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS parametres (
      id INTEGER PRIMARY KEY DEFAULT 1,
      devise TEXT DEFAULT 'XAF',
      frais_dossier_pct REAL DEFAULT 1,
      solde_initial REAL DEFAULT 0,
      date_solde_initial TEXT DEFAULT (date('now')),
      deduire_commande INTEGER DEFAULT 1,
      penalite_pct REAL DEFAULT 10,
      decalage_mois INTEGER DEFAULT 1,
      taux_1m REAL DEFAULT 10,
      taux_2m REAL DEFAULT 18,
      taux_3m REAL DEFAULT 25,
      taux_4m REAL DEFAULT 30,
      taux_5m REAL DEFAULT 35,
      taux_6m REAL DEFAULT 35
    )`);

    db.run(`INSERT OR IGNORE INTO parametres (id) VALUES (1)`, () => {});

    db.run(`CREATE TABLE IF NOT EXISTS logistic_recettes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      id_camion TEXT,
      type_service TEXT,
      montant REAL DEFAULT 0,
      description TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS logistic_charges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      type_depense TEXT,
      montant REAL DEFAULT 0,
      description TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS logistic_caisse (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      type TEXT NOT NULL,
      libelle TEXT,
      entree REAL DEFAULT 0,
      sortie REAL DEFAULT 0,
      solde REAL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS construction_recettes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      type_vente TEXT,
      quantite REAL DEFAULT 0,
      prix_unitaire REAL DEFAULT 0,
      remise REAL DEFAULT 0,
      montant REAL DEFAULT 0,
      description TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS construction_charges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      type_depense TEXT,
      montant REAL DEFAULT 0,
      description TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS construction_production (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      type_produit TEXT,
      quantite REAL DEFAULT 0,
      description TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS construction_stock (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type_produit TEXT UNIQUE NOT NULL,
      quantite REAL DEFAULT 0,
      updated_at TEXT DEFAULT (datetime('now'))
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS construction_caisse (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      type TEXT NOT NULL,
      libelle TEXT,
      entree REAL DEFAULT 0,
      sortie REAL DEFAULT 0,
      solde REAL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS construction_parametres (
      id INTEGER PRIMARY KEY DEFAULT 1,
      prix_parping REAL DEFAULT 0,
      prix_ciment REAL DEFAULT 0,
      types_produits TEXT DEFAULT 'Parping,Ciment Depot'
    )`);

    db.run(`INSERT OR IGNORE INTO construction_parametres (id) VALUES (1)`, () => {
      console.log('Base de donnees initialisee');
    });
  });
}

module.exports = initDB;