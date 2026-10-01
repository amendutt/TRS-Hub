import type { AccountProfile } from './api';

export interface AuthSession {
  token: string;
  user: AccountProfile;
}

const SESSION_KEY = 'havn_database_session_v1';
const SESSION_EVENT = 'havn-database-session';

export function getAuthSession(): AuthSession | null {
  try {
    const value = localStorage.getItem(SESSION_KEY);
    if (!value) return null;
    const session = JSON.parse(value) as AuthSession;
    return typeof session.token === 'string' && session.user ? session : null;
  } catch {
    return null;
  }
}

export function saveAuthSession(session: AuthSession): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  window.dispatchEvent(new Event(SESSION_EVENT));
}

export function updateAuthSessionUser(user: AccountProfile): void {
  const session = getAuthSession();
  if (session) localStorage.setItem(SESSION_KEY, JSON.stringify({ ...session, user }));
}

export function clearAuthSession(): void {
  localStorage.removeItem(SESSION_KEY);
  window.dispatchEvent(new Event(SESSION_EVENT));
}

export function observeAuthSession(callback: (session: AuthSession | null) => void): () => void {
  callback(getAuthSession());
  const notify = () => callback(getAuthSession());
  window.addEventListener(SESSION_EVENT, notify);
  window.addEventListener('storage', notify);
  return () => {
    window.removeEventListener(SESSION_EVENT, notify);
    window.removeEventListener('storage', notify);
  };
}