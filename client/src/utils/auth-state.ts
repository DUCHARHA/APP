export interface UserAuthData {
  name: string;
  phone: string;
  isAuthenticated: boolean;
  isGuest: boolean;
}

const AUTH_STATE_KEY = 'user_auth_state';

export function getAuthState(): UserAuthData | null {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return null;
  }

  try {
    const saved = localStorage.getItem(AUTH_STATE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.warn('Failed to load auth state from localStorage:', error);
    try {
      localStorage.removeItem(AUTH_STATE_KEY);
    } catch (clearError) {
      console.warn('Failed to clear corrupted auth data:', clearError);
    }
  }
  
  return null;
}

export function setAuthState(authData: UserAuthData): void {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(AUTH_STATE_KEY, JSON.stringify(authData));
  } catch (error) {
    console.warn('Failed to save auth state to localStorage:', error);
  }
}

export function loginUser(name: string, phone: string): void {
  const authData: UserAuthData = {
    name,
    phone,
    isAuthenticated: true,
    isGuest: false,
  };
  setAuthState(authData);
}

export function continueAsGuest(): void {
  const authData: UserAuthData = {
    name: 'Гость',
    phone: '',
    isAuthenticated: false,
    isGuest: true,
  };
  setAuthState(authData);
}

export function logout(): void {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return;
  }

  try {
    localStorage.removeItem(AUTH_STATE_KEY);
  } catch (error) {
    console.warn('Failed to clear auth state:', error);
  }
}

export function isUserAuthenticated(): boolean {
  const authState = getAuthState();
  return authState?.isAuthenticated === true || authState?.isGuest === true;
}

export function getUserDisplayName(): string {
  const authState = getAuthState();
  if (authState?.isAuthenticated && authState.name) {
    return authState.name;
  }
  if (authState?.isGuest) {
    return 'Гость';
  }
  return 'Пользователь';
}