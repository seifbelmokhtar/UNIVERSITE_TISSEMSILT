/**
 * MOCK ADAPTER — Simule les réponses du backend
 * ------------------------------------------------------------------
 * Implémente les routes documentées dans docs/API_CONTRACT.md
 * avec les fixtures locales (marquées A-06 — données de démo).
 *
 * Toutes les vérifications de permissions sont reproduites ici
 * pour tester les règles P1–P4 côté client. EN PRODUCTION,
 * ces vérifications seront faites par le backend PHP.
 */

import * as fixtures from '../fixtures/fixtures.js';

const LATENCY_MIN = 200;
const LATENCY_MAX = 600;

function delay() {
  const ms = LATENCY_MIN + Math.random() * (LATENCY_MAX - LATENCY_MIN);
  return new Promise((r) => setTimeout(r, ms));
}

// Le client attend directement les données (comme fetch.json()), pas { status, data }
function ok(data) {
  return Promise.resolve(data);
}

// Erreurs normalisées en ApiError pour que instanceof fonctionne côté client
function err(status, message, fields = null, code = 'error') {
  class MockApiError extends Error {
    constructor(msg) {
      super(msg);
      this.name = 'ApiError';
      this.status = status;
      this.code = code;
      this.fields = fields;
    }
    isNetwork() { return this.status === 0; }
    isAuth() { return this.status === 401; }
    isForbidden() { return this.status === 403; }
    isValidation() { return this.status === 422 && !!this.fields; }
    isNotFound() { return this.status === 404; }
    isConflict() { return this.status === 409; }
    isRateLimited() { return this.status === 429; }
  }
  const e = new MockApiError(message);
  return Promise.reject(e);
}

function parsePath(path) {
  // Extraction des segments de chemin : /api/xxx/yyy/{id}/zzz
  const segments = path.split('/').filter(Boolean);
  return segments;
}

function localizedNom(item) {
  // Helper pour retourner un nom localisé selon langue courante
  const lang = (document.documentElement.getAttribute('lang') || 'ar');
  const ar = lang === 'ar';
  return {
    nom: item[`nom_${lang}`] || item.nom_ar || item.nom_fr,
    nom_ar: item.nom_ar,
    nom_fr: item.nom_fr
  };
}

// État mutable du mock (compteurs de références, etc.)
const state = {
  demandeSeq: 79,
  docSeq: 2,
  recSeq: 2,
  notifications: [...fixtures.notifications],
  demandes: [...fixtures.demandes],
  documents: [...fixtures.documents],
  reclamations: [
    { id: 100, reference: 'REC-2026-00001', etudiant_id: 47, service_id: 23, description: 'لا أجد محطة النقل المعلنة في المعلومات المسار الصباحي.', statut: 'En cours de traitement', cree_le: '2026-11-10T08:00:00Z', maj_le: '2026-11-10T09:00:00Z', reponses: [
      { id: 1, auteur_id: 42, contenu: 'شكراً على بلاغك. تم تحويل الملاحظة إلى مسؤولية النقل لتداركها هذا الأسبوع.', cree_le: '2026-11-10T09:00:00Z' }
    ] }
  ],
  complements: [],
  failedAttempts: {},
  verificationAttempts: 0
};

// Initialiser fixtures.annonces si absent (stocké dans state local car
// les imports ESM sont en lecture seule)
const annoncesPedagogiques = fixtures.annonces
  ? fixtures.annonces
  : fixtures.actualites.filter((a) => a.type === 'pedagogique');

// Construire un historique à partir d'une demande (simulation)
function buildHistorique(dem) {
  const events = [
    { action: 'soumission', statut: 'Soumise', date: dem.soumise_le, acteur: dem.etudiant_id, note: null },
    { action: 'attribution', statut: 'En attente de traitement', date: addMinutes(dem.soumise_le, 5), acteur: 'systeme', note: null }
  ];
  if (['En cours de vérification', 'En attente de complément', 'Acceptée', 'Refusée', 'Clôturée'].includes(dem.statut)) {
    events.push({ action: 'ouverture', statut: 'En cours de vérification', date: addMinutes(dem.soumise_le, 60), acteur: null, note: null });
  }
  if (dem.statut === 'En attente de complément') {
    events.push({ action: 'complement', statut: 'En attente de complément', date: dem.maj_le, acteur: null, note: 'Document complémentaire requis' });
  }
  if (dem.statut === 'Acceptée' || dem.statut === 'Clôturée') {
    events.push({ action: 'acceptation', statut: 'Acceptée', date: dem.maj_le, acteur: null, note: null });
  }
  if (dem.statut === 'Refusée') {
    events.push({ action: 'refus', statut: 'Refusée', date: dem.maj_le, acteur: null, note: 'Conditions non remplies' });
  }
  if (dem.statut === 'Clôturée' && dem.cloturee_le) {
    events.push({ action: 'cloture', statut: 'Clôturée', date: dem.cloturee_le, acteur: 'systeme', note: null });
  }
  return events;
}

function addMinutes(iso, min) {
  const d = new Date(iso);
  d.setMinutes(d.getMinutes() + min);
  return d.toISOString();
}

// Collecte tous les modules (pour ENS-02)
function collectModules() {
  const out = [];
  for (const f of fixtures.facultes) {
    for (const d of (f.departements || [])) {
      for (const s of (d.specialites || [])) {
        out.push({ id: s.id, nom_ar: s.nom_ar, nom_fr: s.nom_fr, niveau: s.niveau, faculte: f.nom_fr, departement: d.nom_fr });
      }
    }
  }
  return out;
}

// Matrice rôles × actions (ADM-03, lecture seule)
function getRolesPermissions() {
  return [
    { role: 'etudiant', action: 'consulter_profil', allowed: true },
    { role: 'etudiant', action: 'deposer_demande', allowed: true },
    { role: 'etudiant', action: 'consulter_ressources', allowed: true },
    { role: 'etudiant', action: 'traiter_demande', allowed: false },
    { role: 'etudiant', action: 'gerer_utilisateurs', allowed: false },
    { role: 'enseignant', action: 'publier_ressource', allowed: true },
    { role: 'enseignant', action: 'publier_annonce_pedagogique', allowed: true },
    { role: 'enseignant', action: 'traiter_demande', allowed: false },
    { role: 'employe', action: 'traiter_demande_service', allowed: true },
    { role: 'employe', action: 'gerer_utilisateurs', allowed: false },
    { role: 'admin', action: 'gerer_utilisateurs', allowed: true },
    { role: 'admin', action: 'gerer_services', allowed: true },
    { role: 'admin', action: 'gerer_contenu', allowed: true },
    { role: 'admin', action: 'superviser_demandes', allowed: true },
    { role: 'admin', action: 'consulter_journal', allowed: true }
  ];
}

export async function mockAdapter(method, path, opts, ctx) {
  await delay();
  const segs = parsePath(path);
  // segs[0] == 'auth' | 'public' | 'etudiant' | 'employe' | 'admin' etc.

  try {
    // === AUTH ===
    if (segs[0] === 'auth') {
      if (segs[1] === 'login' && method === 'POST') {
        return handleLogin(opts.body, ctx);
      }
      if (segs[1] === 'logout' && method === 'POST') {
        return ok({ success: true });
      }
      if (segs[1] === 'activate' && method === 'POST') {
        return handleActivate(opts.body, ctx);
      }
    }

    // === PUBLIC (sans auth) ===
    if (segs[0] === 'public') {
      if (segs[1] === 'institution' && method === 'GET') {
        return ok({ data: fixtures.institution });
      }
      if (segs[1] === 'facultes' && method === 'GET') {
        return ok({ data: fixtures.facultes });
      }
      if (segs[1] === 'services' && method === 'GET') {
        const list = fixtures.services.filter((s) => s.actif || opts.params?.include_inactive);
        return ok({ data: list });
      }
      if (segs[1] === 'actualites' && method === 'GET') {
        let list = fixtures.actualites.filter((a) => a.type === 'officielle');
        if (opts.params?.categorie) list = list.filter((a) => a.categorie === opts.params.categorie);
        list = [...list].sort((a, b) => new Date(b.publie_le) - new Date(a.publie_le));
        return ok({ data: list });
      }
      if (segs[1] === 'liens' && method === 'GET') {
        return ok({ data: fixtures.liensExternes.filter((l) => l.actif).sort((a, b) => a.ordre - b.ordre) });
      }
      if (segs[1] === 'verify' && method === 'GET') {
        return handleVerify(opts.params?.reference);
      }
    }

    // === Routes authentifiées ===
    if (!ctx.sessionUser) {
      return err(401, 'Authentification requise', null, 'unauthenticated');
    }
    const user = ctx.sessionUser;

    // === ETUDIANT (etudiant/* ) ===
    if (segs[0] === 'etudiant') {
      if (user.role !== 'etudiant') return err(403, 'Accès étudiant requis', null, 'forbidden');
      if (segs[1] === 'profile' && method === 'GET') {
        return ok({ data: getEtudiantProfile(user.id) });
      }
      if (segs[1] === 'profile' && method === 'PATCH') {
        // A-13 : seuls email, telephone, langue_pref modifiables
        if (opts.body?.email != null) user.email = opts.body.email;
        if (opts.body?.langue_pref != null) user.langue_pref = opts.body.langue_pref;
        return ok({ data: getEtudiantProfile(user.id) });
      }
      if (segs[1] === 'password' && method === 'POST') {
        if (!opts.body?.nouveau_mot_de_passe || opts.body.nouveau_mot_de_passe.length < 8) {
          return err(422, 'Mot de passe invalide', { nouveau_mot_de_passe: 'min_length' }, 'validation');
        }
        return ok({ success: true });
      }
      if (segs[1] === 'demandes' && !segs[2] && method === 'GET') {
        let list = state.demandes.filter((d) => d.etudiant_id === user.id);
        if (opts.params?.statut) list = list.filter((d) => d.statut === opts.params.statut);
        if (opts.params?.service_id) list = list.filter((d) => d.service_id === Number(opts.params.service_id));
        return ok({ data: list });
      }
      if (segs[1] === 'demandes' && method === 'POST') {
        // Création d'une demande (ETU-04)
        const id = ++state.demandeSeq;
        const year = new Date().getFullYear();
        const ref = `DEM-${year}-${String(id).padStart(5, '0')}`;
        const newDem = {
          id, reference: ref,
          type: opts.body?.type || 'service',
          service_id: opts.body?.service_id ? Number(opts.body.service_id) : null,
          document_type_id: opts.body?.document_type_id ? Number(opts.body.document_type_id) : null,
          etudiant_id: user.id,
          etudiant_nom_ar: user.nom_ar, etudiant_prenom_ar: user.prenom_ar,
          etudiant_nom: user.nom, etudiant_prenom: user.prenom,
          statut: 'Soumise',
          soumise_le: new Date().toISOString(),
          maj_le: new Date().toISOString(),
          cloturee_le: null
        };
        const svc = fixtures.services.find((s) => s.id === newDem.service_id);
        if (svc) { newDem.service_nom_ar = svc.nom_ar; newDem.service_nom_fr = svc.nom_fr; }
        const dt = fixtures.documentTypes.find((d) => d.id === newDem.document_type_id);
        if (dt) { newDem.document_type_ar = dt.libelle_ar; newDem.document_type_fr = dt.libelle_fr; }
        state.demandes.push(newDem);
        return ok({ data: newDem }, 201);
      }
      // Détail d'une demande
      if (segs[1] === 'demandes' && segs[2] && method === 'GET') {
        const id = Number(segs[2]);
        const dem = state.demandes.find((d) => d.id === id);
        if (!dem) return err(404, 'Demande introuvable', null, 'not_found');
        if (dem.etudiant_id !== user.id) return err(403, 'Accès refusé', null, 'forbidden');
        // Construire l'historique
        const historique = buildHistorique(dem);
        const complements = state.complements?.filter((c) => c.demande_id === id) || [];
        return ok({ data: { ...dem, historique, complements } });
      }
      // Complément (ETU-06)
      if (segs[1] === 'demandes' && segs[2] === 'complement' && method === 'POST') {
        const id = Number(segs[3] || opts.body?.demande_id);
        const dem = state.demandes.find((d) => d.id === id);
        if (!dem) return err(404, 'Demande introuvable', null, 'not_found');
        if (dem.etudiant_id !== user.id) return err(403, 'Accès refusé', null, 'forbidden');
        if (dem.statut !== 'En attente de complément') {
          return err(409, 'La demande n\'est pas en attente de complément', null, 'invalid_state');
        }
        dem.statut = 'En cours de vérification';
        dem.maj_le = new Date().toISOString();
        return ok({ data: dem });
      }
      if (segs[1] === 'notifications' && method === 'GET') {
        return ok({ data: state.notifications.filter((n) => n.utilisateur_id === user.id) });
      }
      if (segs[1] === 'notifications' && segs[2] && method === 'PATCH') {
        const id = Number(segs[2]);
        const n = state.notifications.find((x) => x.id === id && x.utilisateur_id === user.id);
        if (!n) return err(404, 'Notification introuvable', null, 'not_found');
        if (opts.body?.lu != null) n.lu = opts.body.lu;
        return ok({ data: n });
      }
      if (segs[1] === 'notifications' && segs[2] === 'read-all' && method === 'POST') {
        state.notifications.forEach((n) => { if (n.utilisateur_id === user.id) n.lu = true; });
        return ok({ success: true });
      }
      if (segs[1] === 'documents' && method === 'GET') {
        const docs = state.documents.filter((d) => {
          const dem = state.demandes.find((x) => x.id === d.demande_id);
          return dem && dem.etudiant_id === user.id;
        });
        return ok({ data: docs });
      }
      // Ressources pédagogiques accessibles (ETU-08, A-12, P4)
      if (segs[1] === 'ressources' && method === 'GET') {
        const list = fixtures.ressources.filter((r) => r.actif);
        return ok({ data: list });
      }
      // Réclamations (ETU-10, ETU-11)
      if (segs[1] === 'reclamations' && !segs[2] && method === 'GET') {
        return ok({ data: state.reclamations.filter((r) => r.etudiant_id === user.id) });
      }
      if (segs[1] === 'reclamations' && method === 'POST') {
        const id = ++state.recSeq;
        const year = new Date().getFullYear();
        const ref = `REC-${year}-${String(id).padStart(5, '0')}`;
        const newRec = {
          id, reference: ref,
          etudiant_id: user.id,
          service_id: Number(opts.body?.service_id),
          description: opts.body?.description || '',
          statut: 'Soumise',
          cree_le: new Date().toISOString(),
          maj_le: new Date().toISOString(),
          reponses: []
        };
        state.reclamations.push(newRec);
        return ok({ data: newRec }, 201);
      }
      if (segs[1] === 'reclamations' && segs[2] && method === 'GET') {
        const id = Number(segs[2]);
        const rec = state.reclamations.find((r) => r.id === id);
        if (!rec) return err(404, 'Réclamation introuvable', null, 'not_found');
        if (rec.etudiant_id !== user.id) return err(403, 'Accès refusé', null, 'forbidden');
        return ok({ data: rec });
      }
      // Types de documents (ETU-07)
      if (segs[1] === 'document-types' && method === 'GET') {
        return ok({ data: fixtures.documentTypes.filter((d) => d.actif) });
      }
      // Services disponibles (ETU-02)
      if (segs[1] === 'services' && method === 'GET') {
        return ok({ data: fixtures.services.filter((s) => s.actif) });
      }
    }

    // === EMPLOYE (employe/*) ===
    if (segs[0] === 'employe') {
      if (user.role !== 'employe') return err(403, 'Accès employé requis', null, 'forbidden');
      if (segs[1] === 'demandes' && !segs[2] && method === 'GET') {
        // P2 : uniquement les demandes du service de l'employé
        let list = state.demandes.filter((d) => d.service_id === user.service_id);
        if (opts.params?.statut) list = list.filter((d) => d.statut === opts.params.statut);
        return ok({ data: list });
      }
      // Détail demande (EMP-01)
      if (segs[1] === 'demandes' && segs[2] && method === 'GET') {
        const id = Number(segs[2]);
        const dem = state.demandes.find((d) => d.id === id);
        if (!dem) return err(404, 'Demande introuvable', null, 'not_found');
        // P2 : vérifier que la demande appartient au service de l'employé
        if (dem.service_id !== user.service_id) return err(403, 'Hors périmètre', null, 'forbidden');
        const historique = buildHistorique(dem);
        return ok({ data: { ...dem, historique } });
      }
      // Action sur une demande (EMP-01)
      if (segs[1] === 'demandes' && segs[2] === 'action' && segs[3] && method === 'PATCH') {
        const id = Number(segs[3]);
        const dem = state.demandes.find((d) => d.id === id);
        if (!dem) return err(404, 'Demande introuvable', null, 'not_found');
        if (dem.service_id !== user.service_id) return err(403, 'Hors périmètre', null, 'forbidden');
        const action = opts.body?.action;
        const transitions = {
          'ouverture': { from: ['En attente de traitement'], to: 'En cours de vérification' },
          'complement': { from: ['En attente de traitement', 'En cours de vérification'], to: 'En attente de complément' },
          'acceptation': { from: ['En cours de vérification'], to: 'Acceptée' },
          'refus': { from: ['En cours de vérification'], to: 'Refusée' },
          'transfert': { from: ['En attente de traitement', 'En cours de vérification'], to: null },
          'observation': { from: ['En attente de traitement', 'En cours de vérification', 'En attente de complément'], to: null },
          'cloture': { from: ['Acceptée', 'Refusée'], to: 'Clôturée' }
        };
        const t = transitions[action];
        if (!t) return err(422, 'Action inconnue', null, 'invalid_action');
        if (!t.from.includes(dem.statut)) {
          return err(409, `Transition non valide depuis ${dem.statut}`, null, 'invalid_transition');
        }
        if (action === 'refus' && !opts.body?.motif) {
          return err(422, 'Motif requis pour un refus', { motif: 'required' }, 'validation');
        }
        if (action === 'transfert') {
          const target = Number(opts.body?.service_cible_id);
          const svc = fixtures.services.find((s) => s.id === target && s.actif);
          if (!svc) return err(422, 'Service cible invalide', null, 'invalid_target');
          dem.service_id = target;
          dem.service_nom_ar = svc.nom_ar;
          dem.service_nom_fr = svc.nom_fr;
        } else if (t.to) {
          dem.statut = t.to;
        }
        dem.maj_le = new Date().toISOString();
        if (['Acceptée', 'Refusée', 'Clôturée'].includes(dem.statut)) {
          dem.cloturee_le = dem.statut === 'Clôturée' ? new Date().toISOString() : dem.cloturee_le;
          if (dem.statut === 'Acceptée' && !state.documents.find((d) => d.demande_id === dem.id) && dem.type === 'document') {
            // Générer un document (A-03)
            const docId = ++state.docSeq;
            const docRef = `DOC-${new Date().getFullYear()}-${String(docId).padStart(5, '0')}`;
            const dt = fixtures.documentTypes.find((d) => d.id === dem.document_type_id);
            state.documents.push({
              reference: docRef, demande_id: dem.id,
              type_ar: dt?.libelle_ar || '', type_fr: dt?.libelle_fr || '', type_en: dt?.libelle_en || '',
              genere_le: new Date().toISOString(),
              etablissement_ar: fixtures.institution.nom_ar, etablissement_fr: fixtures.institution.nom
            });
          }
        }
        return ok({ data: dem });
      }
      if (segs[1] === 'stats' && method === 'GET') {
        const list = state.demandes.filter((d) => d.service_id === user.service_id);
        const stats = {
          pending: list.filter((d) => d.statut === 'Soumise' || d.statut === 'En attente de traitement').length,
          in_progress: list.filter((d) => d.statut === 'En cours de vérification').length,
          complement: list.filter((d) => d.statut === 'En attente de complément').length,
          processed_today: 3
        };
        return ok({ data: stats });
      }
      // Journal actions (EMP-02)
      if (segs[1] === 'journal' && method === 'GET') {
        return ok({ data: fixtures.journal.filter((j) => j.utilisateur_id === user.id) });
      }
      // Réclamations du service (EMP-03)
      if (segs[1] === 'reclamations' && !segs[2] && method === 'GET') {
        return ok({ data: state.reclamations.filter((r) => r.service_id === user.service_id) });
      }
      if (segs[1] === 'reclamations' && segs[2] && method === 'GET') {
        const id = Number(segs[2]);
        const rec = state.reclamations.find((r) => r.id === id);
        if (!rec) return err(404, 'Réclamation introuvable', null, 'not_found');
        if (rec.service_id !== user.service_id) return err(403, 'Hors périmètre', null, 'forbidden');
        return ok({ data: rec });
      }
      if (segs[1] === 'reclamations' && segs[2] === 'reponses' && segs[3] && method === 'POST') {
        const id = Number(segs[3]);
        const rec = state.reclamations.find((r) => r.id === id);
        if (!rec) return err(404, 'Réclamation introuvable', null, 'not_found');
        if (rec.service_id !== user.service_id) return err(403, 'Hors périmètre', null, 'forbidden');
        if (!opts.body?.contenu?.trim()) return err(422, 'Contenu requis', { contenu: 'required' }, 'validation');
        rec.reponses = rec.reponses || [];
        rec.reponses.push({
          id: rec.reponses.length + 1,
          auteur_id: user.id,
          contenu: opts.body.contenu,
          cree_le: new Date().toISOString()
        });
        rec.statut = 'En cours de traitement';
        rec.maj_le = new Date().toISOString();
        return ok({ data: rec });
      }
      if (segs[1] === 'reclamations' && segs[2] && method === 'PATCH') {
        const id = Number(segs[2]);
        const rec = state.reclamations.find((r) => r.id === id);
        if (!rec) return err(404, 'Réclamation introuvable', null, 'not_found');
        if (rec.service_id !== user.service_id) return err(403, 'Hors périmètre', null, 'forbidden');
        if (!rec.reponses?.length) return err(409, 'Une réponse est requise avant clôture', null, 'no_response');
        rec.statut = opts.body?.statut === 'Rejetée' ? 'Rejetée' : 'Résolue';
        rec.maj_le = new Date().toISOString();
        return ok({ data: rec });
      }
      // Santé - RDV (EMP-04)
      if (segs[1] === 'sante' && segs[2] === 'rendez-vous' && method === 'POST') {
        if (user.service_id !== 25) return err(403, 'Accès unité santé requis', null, 'forbidden');
        const demId = Number(opts.body?.demande_id);
        const dem = state.demandes.find((d) => d.id === demId);
        if (!dem) return err(404, 'Demande introuvable', null, 'not_found');
        return ok({ data: { demande_id: demId, date_rdv: opts.body.date_rdv, heure_rdv: opts.body.heure_rdv, confirme_par: user.id } });
      }
    }

    // === ENSEIGNANT ===
    if (segs[0] === 'enseignant') {
      if (user.role !== 'enseignant') return err(403, 'Accès enseignant requis', null, 'forbidden');
      if (segs[1] === 'ressources' && method === 'GET') {
        return ok({ data: fixtures.ressources.filter((r) => r.enseignant_id === user.id && r.actif) });
      }
      if (segs[1] === 'ressources' && method === 'POST') {
        const id = (fixtures.ressources.reduce((m, r) => Math.max(m, r.id), 0) + 1);
        const newR = {
          id, titre: opts.body?.titre, titre_fr: opts.body?.titre,
          description: opts.body?.description || '',
          type: opts.body?.type || 'cours',
          module_id: Number(opts.body?.module_id) || null,
          enseignant_id: user.id,
          taille_octets: opts.body?.taille || 0,
          cree_le: new Date().toISOString(),
          actif: true
        };
        fixtures.ressources.push(newR);
        return ok({ data: newR }, 201);
      }
      if (segs[1] === 'ressources' && segs[2] && method === 'PATCH') {
        const id = Number(segs[2]);
        const r = fixtures.ressources.find((x) => x.id === id && x.enseignant_id === user.id);
        if (!r) return err(404, 'Ressource introuvable', null, 'not_found');
        if (opts.body?.titre) r.titre = opts.body.titre;
        if (opts.body?.description != null) r.description = opts.body.description;
        r.maj_le = new Date().toISOString();
        return ok({ data: r });
      }
      if (segs[1] === 'ressources' && segs[2] && method === 'DELETE') {
        const id = Number(segs[2]);
        const r = fixtures.ressources.find((x) => x.id === id && x.enseignant_id === user.id);
        if (!r) return err(404, 'Ressource introuvable', null, 'not_found');
        r.actif = false; // suppression logique
        return ok({ success: true });
      }
      if (segs[1] === 'annonces' && method === 'GET') {
        // P4 : l'enseignant ne voit que SES annonces
        const list = (fixtures.annonces || []).filter((a) => a.enseignant_id === user.id);
        return ok({ data: list });
      }
      if (segs[1] === 'annonces' && method === 'POST') {
        const newA = {
          id: (fixtures.annonces?.length || 0) + 1,
          type: 'pedagogique',
          titre_ar: opts.body?.titre_ar, titre_fr: opts.body?.titre_fr, titre_en: opts.body?.titre_en,
          contenu_ar: opts.body?.contenu_ar, contenu_fr: opts.body?.contenu_fr,
          module_id: Number(opts.body?.module_id),
          enseignant_id: user.id,
          publie_le: new Date().toISOString(),
          actif: true
        };
        fixtures.annonces = fixtures.annonces || [];
        fixtures.annonces.push(newA);
        return ok({ data: newA }, 201);
      }
      if (segs[1] === 'stats' && method === 'GET') {
        const list = fixtures.ressources.filter((r) => r.enseignant_id === user.id);
        return ok({ data: { ressources: list.length, annonces: fixtures.annonces?.filter((a) => a.enseignant_id === user.id).length || 0 } });
      }
      // Hiérarchie (pour ENS-02 publication)
      if (segs[1] === 'modules' && method === 'GET') {
        return ok({ data: collectModules() });
      }
    }

    // === ADMIN ===
    if (segs[0] === 'admin') {
      if (user.role !== 'admin') return err(403, 'Accès administrateur requis', null, 'forbidden');
      if (segs[1] === 'stats' && method === 'GET') {
        const stats = {
          total_demandes: state.demandes.length,
          active_accounts: fixtures.utilisateurs.filter((u) => u.statut === 'actif').length,
          pending_requests: state.demandes.filter((d) => !['Acceptée', 'Refusée', 'Clôturée'].includes(d.statut)).length,
          processed_today: 7,
          by_service: groupBy(fixtures.services.map((s) => ({
            service: s.nom_fr, code: s.code,
            count: state.demandes.filter((d) => d.service_id === s.id).length
          })).filter((x) => x.count > 0), 'code'),
          by_status: groupBy(state.demandes.map((d) => ({ statut: d.statut })), 'statut')
        };
        return ok({ data: stats });
      }
      if (segs[1] === 'utilisateurs' && method === 'GET') {
        let list = [...fixtures.utilisateurs];
        if (opts.params?.role) list = list.filter((u) => u.role === opts.params.role);
        if (opts.params?.q) {
          const q = String(opts.params.q).toLowerCase();
          list = list.filter((u) => (u.identifiant || '').toLowerCase().includes(q) || (u.nom || '').toLowerCase().includes(q));
        }
        return ok({ data: list });
      }
      if (segs[1] === 'utilisateurs' && method === 'POST') {
        const id = (fixtures.utilisateurs.reduce((m, u) => Math.max(m, u.id), 0) + 1);
        const newU = {
          id, identifiant: opts.body?.identifiant,
          nom_ar: opts.body?.nom_ar || '', prenom_ar: opts.body?.prenom_ar || '',
          nom: opts.body?.nom || '', prenom: opts.body?.prenom || '',
          email: opts.body?.email || null,
          role: opts.body?.role || 'employe',
          statut: 'actif',
          langue_pref: opts.body?.langue_pref || 'ar',
          service_id: opts.body?.service_id ? Number(opts.body.service_id) : null
        };
        fixtures.utilisateurs.push(newU);
        return ok({ data: newU }, 201);
      }
      if (segs[1] === 'utilisateurs' && segs[2] && method === 'PATCH') {
        const id = Number(segs[2]);
        const u = fixtures.utilisateurs.find((x) => x.id === id);
        if (!u) return err(404, 'Utilisateur introuvable', null, 'not_found');
        if (opts.body?.statut) u.statut = opts.body.statut;
        if (opts.body?.email != null) u.email = opts.body.email;
        if (opts.body?.langue_pref) u.langue_pref = opts.body.langue_pref;
        return ok({ data: u });
      }
      if (segs[1] === 'utilisateurs' && segs[2] === 'reset-password' && method === 'POST') {
        const id = Number(segs[2]);
        const u = fixtures.utilisateurs.find((x) => x.id === id);
        if (!u) return err(404, 'Utilisateur introuvable', null, 'not_found');
        if (u.statut === 'desactive') return err(403, 'Compte désactivé', null, 'account_disabled');
        const tempPwd = 'TMP' + Math.random().toString(36).slice(2, 10).toUpperCase();
        return ok({ data: { mot_de_passe_temporaire: tempPwd } });
      }
      if (segs[1] === 'etudiants' && segs[2] === 'import' && method === 'POST') {
        // Simule l'import CSV (ADM-02)
        const total = opts.body?.total || 8;
        const echecs = opts.body?.echecs || 0;
        const codes = [];
        for (let i = 0; i < total - echecs; i++) {
          codes.push({ matricule: `20260${String(100 + i).padStart(3, '0')}`, code: `ACT-${Math.random().toString(36).slice(2, 8).toUpperCase()}` });
        }
        return ok({ data: { total, echecs, imported: total - echecs, codes } });
      }
      if (segs[1] === 'journal' && method === 'GET') {
        let list = [...fixtures.journal];
        if (opts.params?.utilisateur_id) list = list.filter((j) => j.utilisateur_id === Number(opts.params.utilisateur_id));
        if (opts.params?.entite) list = list.filter((j) => j.entite === opts.params.entite);
        return ok({ data: list });
      }
      if (segs[1] === 'demandes' && !segs[2] && method === 'GET') {
        let list = [...state.demandes];
        if (opts.params?.service_id) list = list.filter((d) => d.service_id === Number(opts.params.service_id));
        if (opts.params?.statut) list = list.filter((d) => d.statut === opts.params.statut);
        return ok({ data: list });
      }
      if (segs[1] === 'demandes' && segs[2] && method === 'GET') {
        const id = Number(segs[2]);
        const dem = state.demandes.find((d) => d.id === id);
        if (!dem) return err(404, 'Demande introuvable', null, 'not_found');
        return ok({ data: { ...dem, historique: buildHistorique(dem) } });
      }
      // Configuration des services (ADM-05)
      if (segs[1] === 'services' && method === 'GET') {
        return ok({ data: fixtures.services });
      }
      if (segs[1] === 'services' && segs[2] && method === 'PATCH') {
        const id = Number(segs[2]);
        const s = fixtures.services.find((x) => x.id === id);
        if (!s) return err(404, 'Service introuvable', null, 'not_found');
        if (opts.body?.actif != null) s.actif = opts.body.actif;
        if (opts.body?.description_ar != null) s.description_ar = opts.body.description_ar;
        if (opts.body?.description_fr != null) s.description_fr = opts.body.description_fr;
        return ok({ data: s });
      }
      // Hiérarchie (ADM-04)
      if (segs[1] === 'facultes' && method === 'GET') {
        return ok({ data: fixtures.facultes });
      }
      if (segs[1] === 'facultes' && method === 'POST') {
        const id = (fixtures.facultes.reduce((m, f) => Math.max(m, f.id), 0) + 1);
        const newF = {
          id, nom_ar: opts.body?.nom_ar, nom_fr: opts.body?.nom_fr,
          nom_en: opts.body?.nom_en, type: opts.body?.type || 'faculte', actif: true, departements: []
        };
        fixtures.facultes.push(newF);
        return ok({ data: newF }, 201);
      }
      if (segs[1] === 'facultes' && segs[2] && method === 'PATCH') {
        const id = Number(segs[2]);
        const f = fixtures.facultes.find((x) => x.id === id);
        if (!f) return err(404, 'Faculté introuvable', null, 'not_found');
        if (opts.body?.nom_ar) f.nom_ar = opts.body.nom_ar;
        if (opts.body?.nom_fr) f.nom_fr = opts.body.nom_fr;
        return ok({ data: f });
      }
      // Rôles & permissions (ADM-03) - lecture seule
      if (segs[1] === 'roles-permissions' && method === 'GET') {
        return ok({ data: getRolesPermissions() });
      }
      // Contenu (ADM-06)
      if (segs[1] === 'actualites' && method === 'GET') {
        return ok({ data: fixtures.actualites });
      }
      if (segs[1] === 'actualites' && method === 'POST') {
        const id = (fixtures.actualites.reduce((m, a) => Math.max(m, a.id), 0) + 1);
        const newA = {
          id, type: 'officielle',
          categorie: opts.body?.categorie || 'annonce',
          titre_ar: opts.body?.titre_ar, titre_fr: opts.body?.titre_fr, titre_en: opts.body?.titre_en,
          contenu_ar: opts.body?.contenu_ar, contenu_fr: opts.body?.contenu_fr, contenu_en: opts.body?.contenu_en,
          publie_le: new Date().toISOString(),
          date_evenement: opts.body?.date_evenement || null,
          actif: opts.body?.actif !== false
        };
        fixtures.actualites.push(newA);
        return ok({ data: newA }, 201);
      }
      if (segs[1] === 'actualites' && segs[2] && method === 'PATCH') {
        const id = Number(segs[2]);
        const a = fixtures.actualites.find((x) => x.id === id);
        if (!a) return err(404, 'Actualité introuvable', null, 'not_found');
        if (opts.body?.actif != null) a.actif = opts.body.actif;
        return ok({ data: a });
      }
      // Liens externes (ADM-06)
      if (segs[1] === 'liens' && method === 'GET') {
        return ok({ data: fixtures.liensExternes });
      }
      if (segs[1] === 'liens' && method === 'POST') {
        const id = (fixtures.liensExternes.reduce((m, l) => Math.max(m, l.id), 0) + 1);
        const newL = {
          id, libelle_ar: opts.body?.libelle_ar, libelle_fr: opts.body?.libelle_fr,
          url: opts.body?.url, actif: true, ordre: opts.body?.ordre || 1
        };
        fixtures.liensExternes.push(newL);
        return ok({ data: newL }, 201);
      }
      if (segs[1] === 'liens' && segs[2] && method === 'DELETE') {
        const id = Number(segs[2]);
        const idx = fixtures.liensExternes.findIndex((x) => x.id === id);
        if (idx === -1) return err(404, 'Lien introuvable', null, 'not_found');
        fixtures.liensExternes.splice(idx, 1);
        return ok({ success: true });
      }
      // Paramètres (ADM-09)
      if (segs[1] === 'parametres' && method === 'GET') {
        return ok({ data: {
          nom_institution: fixtures.institution.nom,
          nom_institution_ar: fixtures.institution.nom_ar,
          langue_defaut: 'ar',
          upload_max_mb: 10,
          notifications_email: 'off'
        } });
      }
      if (segs[1] === 'parametres' && method === 'PATCH') {
        return ok({ data: { ...opts.body, updated: true } });
      }
      // Types de documents (ADM-05)
      if (segs[1] === 'document-types' && method === 'GET') {
        return ok({ data: fixtures.documentTypes });
      }
    }

    // Route non trouvée
    return err(404, 'Route non implémentée (mock)', null, 'not_found');
  } catch (e) {
    if (e.status) return Promise.reject(e);
    return err(500, 'Erreur interne du mock', null, 'mock_error');
  }
}

function getEtudiantProfile(id) {
  const u = fixtures.utilisateurs.find((x) => x.id === id);
  if (!u) return null;
  return {
    id: u.id,
    identifiant: u.identifiant,
    nom_ar: u.nom_ar, prenom_ar: u.prenom_ar,
    nom: u.nom, prenom: u.prenom,
    email: u.email,
    role: u.role,
    langue_pref: u.langue_pref,
    faculte_ar: u.faculte_ar, faculte_fr: u.faculte_fr,
    departement_ar: u.departement_ar, departement_fr: u.departement_fr,
    specialite_ar: u.specialite_ar, specialite_fr: u.specialite_fr,
    annee_etude: u.annee_etude
  };
}

function handleLogin(body, ctx) {
  const { identifiant, mot_de_passe } = body || {};
  if (!identifiant || !mot_de_passe) {
    return err(422, 'Identifiant et mot de passe requis', {
      identifiant: !identifiant ? 'required' : null,
      mot_de_passe: !mot_de_passe ? 'required' : null
    }, 'validation');
  }

  // Rate limit (EC-01)
  const attempts = state.failedAttempts[identifiant] || 0;
  if (attempts >= 5) {
    const wait = Math.min(60, Math.pow(2, attempts - 4));
    return err(429, `Trop de tentatives. Attendez ${wait} secondes`, null, 'rate_limited');
  }

  const user = fixtures.utilisateurs.find((u) => u.identifiant === identifiant);
  const expected = fixtures.mockPasswords[identifiant];

  if (!user || expected !== mot_de_passe) {
    state.failedAttempts[identifiant] = attempts + 1;
    // Message générique (EC-01) — ne distingue pas quel champ est faux
    return err(401, 'Identifiant ou mot de passe incorrect', null, 'invalid_credentials');
  }

  // Vérifier statut (EC-02, EC-03)
  if (user.statut === 'non_active') {
    return err(403, 'Ce compte n\'est pas encore activé', { redirect: '/pages/public/activate.html' }, 'account_not_active');
  }
  if (user.statut === 'desactive') {
    return err(403, 'Ce compte est désactivé. Contactez l\'administration', null, 'account_disabled');
  }

  state.failedAttempts[identifiant] = 0;
  const token = `mock-jwt-${user.id}-${Date.now()}`;
  ctx.setSession(token, sanitizeUser(user));
  return ok({ token, utilisateur: sanitizeUser(user) });
}

function handleActivate(body, ctx) {
  const { matricule, code, nouveau_mot_de_passe } = body || {};
  if (!matricule || !code || !nouveau_mot_de_passe) {
    return err(422, 'Tous les champs sont requis', {
      matricule: !matricule ? 'required' : null,
      code: !code ? 'required' : null,
      nouveau_mot_de_passe: !nouveau_mot_de_passe ? 'required' : null
    }, 'validation');
  }

  const user = fixtures.utilisateurs.find((u) => u.identifiant === matricule);
  if (!user) return err(404, 'Matricule introuvable', { matricule: 'invalid' }, 'not_found');

  if (user.statut === 'actif') {
    return err(409, 'Ce compte est déjà activé', null, 'already_active');
  }
  if (user.statut === 'desactive') {
    return err(403, 'Ce compte est désactivé. Contactez l\'administration', null, 'account_disabled');
  }

  const record = fixtures.activationCodes.find((c) => c.code === code && c.utilisateur_id === user.id);
  if (!record) return err(404, 'Code invalide', { code: 'invalid' }, 'invalid_code');
  if (record.statut === 'utilise') return err(409, 'Ce code a déjà été utilisé', { code: 'used' }, 'code_used');
  if (new Date(record.expire_le) < new Date()) return err(410, 'Ce code a expiré', { code: 'expired' }, 'code_expired');

  // Validation mot de passe (règle simple)
  if (nouveau_mot_de_passe.length < 8) {
    return err(422, 'Le mot de passe doit comporter au moins 8 caractères', { nouveau_mot_de_passe: 'min_length' }, 'validation');
  }

  // Activer compte + consommer code
  user.statut = 'actif';
  record.statut = 'utilise';

  const token = `mock-jwt-${user.id}-${Date.now()}`;
  ctx.setSession(token, sanitizeUser(user));
  return ok({ token, utilisateur: sanitizeUser(user) });
}

function handleVerify(reference) {
  if (!reference) return err(422, 'Référence requise', { reference: 'required' }, 'validation');

  state.verificationAttempts++;
  if (state.verificationAttempts > 30) {
    return err(429, 'Trop de requêtes. Réessayez plus tard', null, 'rate_limited');
  }

  // Normaliser : DOC-2026-XXXXX
  const ref = String(reference).trim().toUpperCase();
  const doc = state.documents.find((d) => d.reference.toUpperCase() === ref);

  if (!doc) {
    // (EC-23) : aucune différence entre "inexistant" et "malformé"
    return ok({ data: { valide: false } });
  }

  // (R-38) : données d'authentification uniquement, AUCUNE donnée personnelle
  return ok({
    data: {
      valide: true,
      reference: doc.reference,
      type_ar: doc.type_ar,
      type_fr: doc.type_fr,
      type_en: doc.type_en,
      genere_le: doc.genere_le,
      etablissement_ar: doc.etablissement_ar,
      etablissement_fr: doc.etablissement_fr
    }
  });
}

function sanitizeUser(u) {
  // Retourne uniquement les champs publics nécessaires à l'UI
  return {
    id: u.id,
    identifiant: u.identifiant,
    nom_ar: u.nom_ar,
    prenom_ar: u.prenom_ar,
    nom: u.nom,
    prenom: u.prenom,
    email: u.email,
    role: u.role,
    statut: u.statut,
    langue_pref: u.langue_pref,
    service_id: u.service_id,
    service_nom_ar: u.service_nom_ar,
    service_nom_fr: u.service_nom_fr,
    faculte_id: u.faculte_id,
    departement_id: u.departement_id,
    specialite_id: u.specialite_id,
    annee_etude: u.annee_etude,
    faculte_ar: u.faculte_ar,
    faculte_fr: u.faculte_fr,
    departement_ar: u.departement_ar,
    departement_fr: u.departement_fr,
    specialite_ar: u.specialite_ar,
    specialite_fr: u.specialite_fr
  };
}

function groupBy(arr, key) {
  const out = {};
  for (const item of arr) {
    const k = item[key];
    if (!out[k]) out[k] = { ...item, count: 0 };
    out[k].count++;
  }
  return Object.values(out);
}

// Exposé pour tests/debug
export const _mockState = state;
