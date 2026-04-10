import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('eraai_user');
    localStorage.removeItem('eraai_token');
    delete axios.defaults.headers.common['Authorization'];
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem('eraai_user');
    const token = localStorage.getItem('eraai_token');
    if (stored && token) {
      setUser(JSON.parse(stored));
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      axios.get('/api/auth/me')
        .then(res => {
          setUser(res.data);
          localStorage.setItem('eraai_user', JSON.stringify(res.data));
        })
        .catch(() => logout())
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [logout]);

  const persist = (data) => {
    setUser(data);
    localStorage.setItem('eraai_user', JSON.stringify(data));
    localStorage.setItem('eraai_token', data.token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
  };

  const login = async (email, password) => {
    const { data } = await axios.post('/api/auth/login', { email, password });
    persist(data);
    return data;
  };

  const googleLogin = async (credential) => {
    const { data } = await axios.post('/api/auth/google', { credential });
    persist(data);
    return data;
  };

  const register = async (userData) => {
    const { data } = await axios.post('/api/auth/register', userData);
    persist(data);
    return data;
  };

  const refreshUser = async () => {
    const { data } = await axios.get('/api/auth/me');
    setUser(data);
    localStorage.setItem('eraai_user', JSON.stringify(data));
    return data;
  };

  const value = useMemo(
    () => ({ user, login, googleLogin, register, logout, loading, refreshUser }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, loading, logout]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
