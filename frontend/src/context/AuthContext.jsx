import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';

const AuthContext = createContext(null);

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [geminiKey, setLocalGeminiKey] = useState(() => localStorage.getItem('sb_gemini_key') || '');
  const [useLocalOnly, setUseLocalOnly] = useState(false);

  // Sync token to API calls
  const getHeaders = useCallback(() => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    if (geminiKey) {
      headers['x-gemini-key'] = geminiKey;
    }
    return headers;
  }, [token, geminiKey]);

  // Initial authentication check
  useEffect(() => {
    const storedToken = localStorage.getItem('sb_token');
    const storedUser = localStorage.getItem('sb_user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      
      // Verify token viability with server
      fetch(`${BACKEND_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${storedToken}`
        }
      })
      .then(res => {
        if (res.ok) return res.json();
        throw new Error('Token verification failed');
      })
      .then(userData => {
        setUser(userData);
        localStorage.setItem('sb_user', JSON.stringify(userData));
      })
      .catch(err => {
        console.warn('Backend verification failed, using stored session:', err.message);
        // If server is down, we can allow operating in local fallback mode if we want,
        // but for now, we'll keep the session.
        if (err.message.includes('Failed to fetch')) {
          setUseLocalOnly(true);
        }
      })
      .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (username, password) => {
    setError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('sb_token', data.token);
      localStorage.setItem('sb_user', JSON.stringify(data.user));
      setUseLocalOnly(false);
      return data.user;
    } catch (err) {
      setError(err.message);
      // Fallback: If backend is completely offline, allow logging in with a mock offline user
      if (err.message.includes('Failed to fetch')) {
        console.log('Server down. Activating local-only sandbox mode.');
        const mockUser = {
          id: 'u_offline',
          username: username,
          targetCompany: 'Google',
          hoursGoal: 12,
          isOfflineMode: true
        };
        setToken('offline-token');
        setUser(mockUser);
        localStorage.setItem('sb_token', 'offline-token');
        localStorage.setItem('sb_user', JSON.stringify(mockUser));
        setUseLocalOnly(true);
        setError(null);
        return mockUser;
      }
      throw err;
    }
  };

  const register = async (username, password, targetCompany, hoursGoal) => {
    setError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, targetCompany, hoursGoal })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('sb_token', data.token);
      localStorage.setItem('sb_user', JSON.stringify(data.user));
      setUseLocalOnly(false);
      return data.user;
    } catch (err) {
      setError(err.message);
      if (err.message.includes('Failed to fetch')) {
        // Fallback registration
        const mockUser = {
          id: 'u_offline',
          username: username,
          targetCompany: targetCompany || 'FAANG',
          hoursGoal: hoursGoal || 10,
          isOfflineMode: true
        };
        setToken('offline-token');
        setUser(mockUser);
        localStorage.setItem('sb_token', 'offline-token');
        localStorage.setItem('sb_user', JSON.stringify(mockUser));
        setUseLocalOnly(true);
        setError(null);
        return mockUser;
      }
      throw err;
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('sb_token');
    localStorage.removeItem('sb_user');
    setUseLocalOnly(false);
  };

  const updateProfile = async (targetCompany, hoursGoal) => {
    if (useLocalOnly || user?.isOfflineMode) {
      const updatedUser = { ...user, targetCompany, hoursGoal: Number(hoursGoal) };
      setUser(updatedUser);
      localStorage.setItem('sb_user', JSON.stringify(updatedUser));
      return updatedUser;
    }

    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/profile`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ targetCompany, hoursGoal })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      setUser(data);
      localStorage.setItem('sb_user', JSON.stringify(data));
      return data;
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const setGeminiKey = (key) => {
    setLocalGeminiKey(key);
    if (key) {
      localStorage.setItem('sb_gemini_key', key);
    } else {
      localStorage.removeItem('sb_gemini_key');
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      error,
      geminiKey,
      useLocalOnly,
      login,
      register,
      logout,
      updateProfile,
      setGeminiKey,
      getHeaders,
      backendUrl: BACKEND_URL
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
