// Utility for managing unique user sessions
const USER_SESSION_KEY = 'ducharkha_user_session';

export interface UserSession {
  userId: string;
  createdAt: number;
  lastActivity: number;
}

// Generate unique user ID for this browser/device
export function generateUserId(): string {
  // Use crypto API for better randomness in browser
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const array = new Uint8Array(16);
    window.crypto.getRandomValues(array);
    const hex = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    return `user_${hex}`;
  }
  
  // Fallback for non-browser environments
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2);
  return `user_${timestamp}_${random}`;
}

// Get or create user session
export function getUserSession(): UserSession {
  // Check if we're in browser environment
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    // Fallback for server-side rendering or non-browser environments
    return {
      userId: generateUserId(),
      createdAt: Date.now(),
      lastActivity: Date.now(),
    };
  }

  try {
    const saved = localStorage.getItem(USER_SESSION_KEY);
    if (saved) {
      const session: UserSession = JSON.parse(saved);
      
      // Check for invalid demo-user sessions and force regenerate
      if (session.userId === 'demo-user' || session.userId.includes('demo-user')) {
        console.log('Found old demo-user session, creating new unique session...');
        localStorage.removeItem(USER_SESSION_KEY);
        // Fall through to create new session
      } else {
        // Update last activity
        session.lastActivity = Date.now();
        localStorage.setItem(USER_SESSION_KEY, JSON.stringify(session));
        return session;
      }
    }
  } catch (error) {
    console.warn('Failed to load user session from localStorage:', error);
    // Clear corrupted data
    try {
      localStorage.removeItem(USER_SESSION_KEY);
    } catch (clearError) {
      console.warn('Failed to clear corrupted session data:', clearError);
    }
  }

  // Create new session
  const newSession: UserSession = {
    userId: generateUserId(),
    createdAt: Date.now(),
    lastActivity: Date.now(),
  };

  // Security: Don't log user IDs in production

  try {
    localStorage.setItem(USER_SESSION_KEY, JSON.stringify(newSession));
  } catch (error) {
    console.warn('Failed to save user session to localStorage:', error);
    // Continue without localStorage - session will be temporary
  }

  return newSession;
}

// Get current user ID with fallback
export function getCurrentUserId(): string {
  try {
    return getUserSession().userId;
  } catch (error) {
    console.error('Failed to get current user ID:', error);
    // Return a temporary fallback ID based on timestamp to avoid sharing data
    const fallbackId = `temp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    console.warn('Using temporary fallback user ID (ID hidden for security)');
    return fallbackId;
  }
}

// Clear user session (for testing or logout)
export function clearUserSession(): void {
  try {
    localStorage.removeItem(USER_SESSION_KEY);
  } catch (error) {
    console.warn('Failed to clear user session:', error);
  }
}

// Check if session is valid (not too old)
export function isSessionValid(maxAge: number = 30 * 24 * 60 * 60 * 1000): boolean { // 30 days default
  try {
    const session = getUserSession();
    return (Date.now() - session.createdAt) < maxAge;
  } catch {
    return false;
  }
}