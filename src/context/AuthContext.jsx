import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';

const AuthContext = createContext(null);

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/contacts.readonly',
].join(' ');

export function AuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState(() => sessionStorage.getItem('gtoken') || null);
  const [userInfo, setUserInfo] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('guserinfo') || 'null'); } catch { return null; }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const tokenClientRef = useRef(null);
  const tokenExpiryRef = useRef(null);

  const initTokenClient = useCallback(() => {
    if (!window.google || !CLIENT_ID) return;
    tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: async (resp) => {
        setLoading(false);
        if (resp.error) {
          setError(resp.error);
          return;
        }
        const token = resp.access_token;
        const expiry = Date.now() + (resp.expires_in || 3600) * 1000;
        tokenExpiryRef.current = expiry;
        setAccessToken(token);
        sessionStorage.setItem('gtoken', token);

        // Fetch basic user info
        try {
          const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${token}` },
          });
          const info = await res.json();
          setUserInfo(info);
          sessionStorage.setItem('guserinfo', JSON.stringify(info));
        } catch {}
      },
    });
  }, []);

  useEffect(() => {
    // Wait for GIS script to load
    if (window.google) {
      initTokenClient();
    } else {
      const interval = setInterval(() => {
        if (window.google) {
          clearInterval(interval);
          initTokenClient();
        }
      }, 200);
      return () => clearInterval(interval);
    }
  }, [initTokenClient]);

  const signIn = useCallback(() => {
    if (!tokenClientRef.current) {
      setError('Google API not ready. Make sure VITE_GOOGLE_CLIENT_ID is set.');
      return;
    }
    setLoading(true);
    setError(null);
    tokenClientRef.current.requestAccessToken({ prompt: 'consent' });
  }, []);

  const signOut = useCallback(() => {
    if (accessToken && window.google) {
      window.google.accounts.oauth2.revoke(accessToken, () => {});
    }
    setAccessToken(null);
    setUserInfo(null);
    sessionStorage.removeItem('gtoken');
    sessionStorage.removeItem('guserinfo');
  }, [accessToken]);

  const refreshToken = useCallback(() => {
    if (!tokenClientRef.current) return;
    tokenClientRef.current.requestAccessToken({ prompt: '' });
  }, []);

  return (
    <AuthContext.Provider value={{ accessToken, userInfo, loading, error, signIn, signOut, refreshToken, CLIENT_ID }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
