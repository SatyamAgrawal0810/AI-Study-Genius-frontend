import { createContext, useContext, useState, useEffect } from 'react';
import API from '../api/config';

const AuthContext = createContext();

const ADMIN_EMAILS = ['satyamagar903@gmail.com']; // apna email yahan

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (token && savedUser) {
      const parsed = JSON.parse(savedUser);
      parsed.is_admin = ADMIN_EMAILS.includes(parsed.email);
      setUser(parsed);
      // Always refresh from backend on load
      refreshUser(token);
    } else {
      setLoading(false);
    }
  }, []);

  // Fetch latest user data from backend
  const refreshUser = async (token) => {
    try {
      const res = await API.get('/auth/me');
      const fresh = {
        ...res.data,
        is_admin: ADMIN_EMAILS.includes(res.data.email),
      };
      localStorage.setItem('user', JSON.stringify(fresh));
      setUser(fresh);
    } catch {
      // token expired – clear
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const res = await API.post('/auth/login', { email, password });
    const userData = { ...res.data.user, is_admin: ADMIN_EMAILS.includes(res.data.user.email) };
    localStorage.setItem('token', res.data.token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    return res.data;
  };

  const signup = async (name, email, password) => {
    const res = await API.post('/auth/signup', { name, email, password });
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  // Call this after any action that changes points/level
  const syncUser = async () => {
    const token = localStorage.getItem('token');
    if (token) await refreshUser(token);
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#FFFBF5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, #BA7517, #EF9F27)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', animation: 'spin 1s linear infinite' }}>
            <span style={{ fontSize: '20px', color: 'white', fontWeight: 900 }}>✦</span>
          </div>
          <p style={{ color: '#8A7055', fontSize: '13px', fontWeight: 500 }}>Loading...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, loading, syncUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);