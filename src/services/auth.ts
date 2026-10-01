import { loadAccountProfile, loginAccount, logoutAccount, registerAccount } from './api';
import { clearAuthSession, getAuthSession, observeAuthSession, saveAuthSession, type AuthSession } from './authSession';

async function startSession(credentialsRequest: Promise<{ token: string }>): Promise<AuthSession> {
  const { token } = await credentialsRequest;
  const user = await loadAccountProfile({ token });
  const session = { token, user };
  saveAuthSession(session);
  return session;
}

export function signInWithEmail(email: string, password: string): Promise<AuthSession> {
  return startSession(loginAccount(email, password));
}

export function registerWithEmail(name: string, email: string, password: string): Promise<AuthSession> {
  return startSession(registerAccount(name, email, password));
}

export async function signOut(): Promise<void> {
  const session = getAuthSession();
  clearAuthSession();
  if (session) await logoutAccount(session).catch(() => undefined);
}

export { getAuthSession, observeAuthSession };