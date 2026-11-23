import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [userId, setUserId] = useState(undefined);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUserId(data.session?.user.id ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user.id ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (userId === undefined) return;
    if (userId === null) {
      setIsAuthenticated(false);
      setIsLoading(false);
      return;
    }

    let active = true;
    supabase.rpc('is_kabung_admin').then(({ data, error }) => {
      if (!active) return;
      setIsAuthenticated(!error && data === true);
      setIsLoading(false);
    });
    return () => { active = false; };
  }, [userId]);

  const login = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return false;

    const { data: isAdmin, error: adminError } = await supabase.rpc('is_kabung_admin');
    if (adminError || isAdmin !== true) {
      await supabase.auth.signOut();
      return false;
    }

    setIsAuthenticated(true);
    navigate('/admin/dashboard');
    return true;
  };

  const logout = async () => {
    await supabase.auth.signOut();
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
