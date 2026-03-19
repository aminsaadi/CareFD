import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('session_token');
      if (token) {
        const response = await api.get('/auth/me');
        setUser(response.data);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('session_token');
      localStorage.removeItem('user');
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const { user: userData, session_token } = response.data;
    
    localStorage.setItem('session_token', session_token);
    localStorage.setItem('user', JSON.stringify(userData));
    
    setUser(userData);
    setIsAuthenticated(true);
    
    return userData;
  };

  const register = async (userData) => {
    const response = await api.post('/auth/register', userData);
    const { email_verification_required } = response.data;
    
    if (email_verification_required) {
      return { email_verification_required: true, email: userData.email };
    }
    
    const { user: newUser, session_token } = response.data;
    localStorage.setItem('session_token', session_token);
    localStorage.setItem('user', JSON.stringify(newUser));
    setUser(newUser);
    setIsAuthenticated(true);
    return newUser;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    }
    
    localStorage.removeItem('session_token');
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
  };

  const value = {
    user,
    setUser,
    isAuthenticated,
    loading,
    login,
    register,
    logout,
    checkAuth
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};