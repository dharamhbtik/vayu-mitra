import { createContext, useContext, useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  signOut,
  updateProfile
} from 'firebase/auth';
import { auth } from '../config/firebase';

const AuthContext = createContext();

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Handle redirect result for custom domain OAuth
    getRedirectResult(auth)
      .then((result) => {
        if (result) {
          setUser(result.user);
        }
      })
      .catch((error) => {
        console.error('Redirect result error:', error);
        setError(getAuthErrorMessage(error.code));
      });
    
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const clearError = () => setError(null);

  const signInWithEmail = async (email, password) => {
    try {
      clearError();
      const result = await signInWithEmailAndPassword(auth, email, password);
      return { success: true, user: result.user };
    } catch (err) {
      const message = getAuthErrorMessage(err.code);
      setError(message);
      return { success: false, error: message };
    }
  };

  const signUpWithEmail = async (email, password, displayName) => {
    try {
      clearError();
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      if (displayName) {
        await updateProfile(result.user, { displayName });
      }
      
      return { success: true, user: result.user };
    } catch (err) {
      const message = getAuthErrorMessage(err.code);
      setError(message);
      return { success: false, error: message };
    }
  };

  const signInWithGoogle = async () => {
    try {
      clearError();
      const provider = new GoogleAuthProvider();
      
      // Add scopes for additional user info if needed
      provider.addScope('profile');
      provider.addScope('email');
      
      // Set custom parameters to force account selection
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      
      const result = await signInWithPopup(auth, provider);
      return { success: true, user: result.user };
    } catch (err) {
      console.error('Google sign-in error:', err.code, err.message);
      const message = getAuthErrorMessage(err.code);
      setError(message);
      return { success: false, error: message, code: err.code };
    }
  };
  
  const signInWithRedirect = async () => {
    try {
      clearError();
      const provider = new GoogleAuthProvider();
      provider.addScope('profile');
      provider.addScope('email');
      await signInWithRedirect(auth, provider);
      return { success: true };
    } catch (err) {
      console.error('Redirect sign-in error:', err.code, err.message);
      const message = getAuthErrorMessage(err.code);
      setError(message);
      return { success: false, error: message, code: err.code };
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      return { success: true };
    } catch (err) {
      const message = getAuthErrorMessage(err.code);
      setError(message);
      return { success: false, error: message };
    }
  };

  const value = {
    user,
    loading,
    error,
    clearError,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signInWithRedirect,
    logout,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

function getAuthErrorMessage(code) {
  const errors = {
    'auth/invalid-email': 'Invalid email address',
    'auth/user-disabled': 'This account has been disabled',
    'auth/user-not-found': 'No account found with this email',
    'auth/wrong-password': 'Incorrect password',
    'auth/email-already-in-use': 'An account already exists with this email',
    'auth/weak-password': 'Password should be at least 6 characters',
    'auth/invalid-credential': 'Invalid email or password',
    'auth/popup-closed-by-user': 'Sign-in popup was closed',
    'auth/popup-blocked': 'Sign-in popup was blocked by the browser',
    'auth/cancelled-popup-request': 'Only one sign-in popup allowed at a time',
    'auth/network-request-failed': 'Network error. Please check your connection',
    'auth/too-many-requests': 'Too many failed attempts. Please try again later',
    'auth/requires-recent-login': 'Please sign in again to complete this action',
    'auth/unauthorized-domain': 'This domain is not authorized for OAuth. Please add it to Firebase Console → Authentication → Settings → Authorized domains',
  };
  
  return errors[code] || `An error occurred (${code}). Please try again.`;
}

export default AuthContext;
