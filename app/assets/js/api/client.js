/**
 * API CLIENT — Couche réseau centralisée
 * ------------------------------------------------------------------
 * Toutes les communications backend passent par ce module.
 * En attendant Agent 02 (backend PHP), le mode MOCK active
 * une couche de fixtures locales clairement marquées.
 *
 * Règles :
 * - Aucune logique métier sensible côté navigateur.
 * - Les permissions sont TOUJOURS vérifiées par le backend.
 * - Gestion centralisée des erreurs HTTP, réseau, sessions expirées.
 *
 * @see docs/API_CONTRACT.md pour le contrat détaillé.
 */

import { mockAdapter } from './mock/index.js';

const API_BASE = (typeof window !== 'undefined' && window.__UT_API_BASE__) || '/api';
const USE_MOCK = (typeof window !== 'undefined' && window.__UT_USE_MOCK__ !== undefined)
  ? window.__UT_USE_MOCK__
  : true; // Agent 02 non livré → mock par défaut

// Timeout par défaut (NF-14)
const DEFAULT_TIMEOUT = 15000;

// Session (jeton opaque en sessionStorage — pas de données sensibles en localStorage)
let sessionToken = null;
let sessionUser = null;
try {
  sessionToken = sessionStorage.getItem('ut_session_token');
  sessionUser = JSON.parse(sessionStorage.getItem('ut_session_user') || 'null');
} catch (_) {}

const authListeners = new Set();

function notifyAuth() {
  authListeners.forEach((fn) => { try { fn(sessionUser); } catch (_) {} });
}

/** Erreur normalisée. */
class ApiError extends Error {
  constructor(message, { status = 0, code = 'unknown', fields = null, raw = null } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.fields = fields;
    this.raw = raw;
  }
  isNetwork() { return this.status === 0; }
  isAuth() { return this.status === 401; }
  isForbidden() { return this.status === 403; }
  isValidation() { return this.status === 422 && !!this.fields; }
  isNotFound() { return this.status === 404; }
  isConflict() { return this.status === 409; }
  isRateLimited() { return this.status === 429; }
}
export { ApiError };

function buildHeaders(extra = {}) {
  const headers = { 'Accept': 'application/json', ...extra };
  if (sessionToken) headers['Authorization'] = `Bearer ${sessionToken}`;
  return headers;
}

function withTimeout(promise, ms) {
  const ctrl = new Promise((_, reject) => {
    setTimeout(() => reject(new ApiError('Délai d\'attente dépassé', { code: 'timeout' })), ms);
  });
  return Promise.race([promise, ctrl]);
}

async function realFetch(method, path, { body = null, params = null, headers = {} } = {}) {
  let url = API_BASE + path;
  if (params && typeof params === 'object') {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v != null && v !== '') qs.append(k, String(v));
    }
    const q = qs.toString();
    if (q) url += (url.includes('?') ? '&' : '?') + q;
  }

  const init = { method, headers: buildHeaders(headers) };
  if (body != null) {
    if (body instanceof FormData) {
      init.body = body;
    } else {
      init.headers['Content-Type'] = 'application/json';
      init.body = JSON.stringify(body);
    }
  }

  try {
    const res = await withTimeout(fetch(url, init), DEFAULT_TIMEOUT);
    const isJson = (res.headers.get('content-type') || '').includes('application/json');
    const payload = isJson ? await res.json().catch(() => null) : null;

    if (res.status === 401) {
      // Session expirée — nettoyer et propager
      clearSession();
      throw new ApiError('Session expirée', { status: 401, code: 'session_expired' });
    }
    if (!res.ok) {
      const msg = (payload && payload.message) || `Erreur HTTP ${res.status}`;
      throw new ApiError(msg, {
        status: res.status,
        code: (payload && payload.code) || 'http_error',
        fields: payload && payload.errors || null,
        raw: payload
      });
    }
    return payload;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    // Erreur réseau
    throw new ApiError('Erreur réseau', { code: 'network', raw: err });
  }
}

async function dispatch(method, path, opts = {}) {
  if (USE_MOCK) {
    return mockAdapter(method, path, opts, { sessionUser, setSession });
  }
  return realFetch(method, path, opts);
}

function setSession(token, user) {
  sessionToken = token;
  sessionUser = user;
  try {
    if (token) sessionStorage.setItem('ut_session_token', token);
    else sessionStorage.removeItem('ut_session_token');
    if (user) sessionStorage.setItem('ut_session_user', JSON.stringify(user));
    else sessionStorage.removeItem('ut_session_user');
  } catch (_) {}
  notifyAuth();
}

function clearSession() {
  setSession(null, null);
}

export const api = {
  /** Mode courant (mock / real). Information only — pas d'action sur la sécurité. */
  mode: USE_MOCK ? 'mock' : 'real',
  ApiError,

  /** Utilisateur courant (objet public : id, identifiant, nom, prenom, role, statut, langue_pref). */
  get currentUser() { return sessionUser; },
  get isAuthenticated() { return !!sessionToken; },

  onAuthChange(fn) {
    authListeners.add(fn);
    return () => authListeners.delete(fn);
  },

  async login(identifier, password) {
    const res = await dispatch('POST', '/auth/login', { body: { identifiant: identifier, mot_de_passe: password } });
    if (res && res.token) setSession(res.token, res.utilisateur);
    return res;
  },

  async logout() {
    try { await dispatch('POST', '/auth/logout', {}); }
    catch (_) {}
    clearSession();
  },

  async activate(matricule, code, newPassword) {
    const res = await dispatch('POST', '/auth/activate', {
      body: { matricule, code, nouveau_mot_de_passe: newPassword }
    });
    if (res && res.token) setSession(res.token, res.utilisateur);
    return res;
  },

  async verifyDocument(reference) {
    return dispatch('GET', '/public/verify', { params: { reference } });
  },

  get(path, params = null) { return dispatch('GET', path, { params }); },
  post(path, body = null, headers = {}) { return dispatch('POST', path, { body, headers }); },
  patch(path, body = null, headers = {}) { return dispatch('PATCH', path, { body, headers }); },
  put(path, body = null, headers = {}) { return dispatch('PUT', path, { body, headers }); },
  delete(path, body = null, headers = {}) { return dispatch('DELETE', path, { body, headers }); },

  /** Forcer le mode mock pour tests hors-ligne. */
  _setMockMode(enabled) {
    // Override local uniquement — ne modifie pas window.__UT_USE_MOCK__
  }
};

export function requireAuth(redirect = '/pages/public/login.html') {
  if (!api.isAuthenticated) {
    const next = encodeURIComponent(window.location.pathname + window.location.search);
    window.location.href = `${redirect}?next=${next}`;
    return false;
  }
  return true;
}

export function requireRole(roles, redirect = '/pages/public/login.html') {
  if (!requireAuth(redirect)) return false;
  if (!roles.includes(sessionUser?.role)) {
    // Rediriger vers le bon dashboard
    const dashboards = {
      etudiant: '/pages/student/dashboard.html',
      enseignant: '/pages/teacher/dashboard.html',
      employe: '/pages/employee/dashboard.html',
      admin: '/pages/admin/dashboard.html'
    };
    const target = dashboards[sessionUser.role] || redirect;
    window.location.href = target;
    return false;
  }
  return true;
}
