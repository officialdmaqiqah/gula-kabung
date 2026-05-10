import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkAuth = () => {
      const authState = localStorage.getItem('kabungmart_admin_auth');
      if (authState === 'true') {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
        if (location.pathname.startsWith('/admin') && location.pathname !== '/admin/login') {
          navigate('/admin/login');
        }
      }
      setIsLoading(false);
    };
    checkAuth();
  }, [location.pathname, navigate]);

  const login = (username, password) => {
    if (username === 'detti' && password === 'salfanun') {
      localStorage.setItem('kabungmart_admin_auth', 'true');
      setIsAuthenticated(true);
      navigate('/admin/dashboard');
      return true;
    }
    return false;
  };

  const logout = () => {
    localStorage.removeItem('kabungmart_admin_auth');
    setIsAuthenticated(false);
    navigate('/admin/login');
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-cream">Loading...</div>;
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
