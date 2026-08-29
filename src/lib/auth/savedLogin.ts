const EMAIL_KEY = 'fb-remembered-email';
const LEGACY_KEY = 'fb-staff-logins';

/** Remember email only — never store passwords in localStorage. */
export function loadRememberedEmail(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    localStorage.removeItem(LEGACY_KEY);
    return localStorage.getItem(EMAIL_KEY);
  } catch {
    return null;
  }
}

export function saveRememberedEmail(email: string) {
  localStorage.setItem(EMAIL_KEY, email.trim());
}

export function clearRememberedEmail() {
  localStorage.removeItem(EMAIL_KEY);
  localStorage.removeItem(LEGACY_KEY);
}
