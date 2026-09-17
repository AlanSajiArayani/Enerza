import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginUser, registerUser, getMe, updateProfile as updateProfileApi } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('access_token') || null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    try {
      const userData = await getMe();
      setUser(userData);
    } catch (err) {
      console.error('Failed to fetch current user:', err);
      logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (username, password) => {
    const data = await loginUser(username, password);
    localStorage.setItem('access_token', data.access);
    localStorage.setItem('refresh_token', data.refresh);
    setToken(data.access);
    setUser(data.user);
    return data.user;
  };

  const register = async (userData) => {
    const data = await registerUser(userData);
    localStorage.setItem('access_token', data.access);
    localStorage.setItem('refresh_token', data.refresh);
    setToken(data.access);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setToken(null);
    setUser(null);
  };

  const updateProfileData = async (profileData) => {
    const updatedUser = await updateProfileApi(profileData);
    setUser(updatedUser);
    return updatedUser;
  };

  return (
    <AuthContext.Provider value={{
      user,
      profile: user?.profile || null,
      token,
      loading,
      isAuthenticated: !!user,
      isAdmin: user?.role === 'admin' || user?.is_staff || user?.is_superuser,
      login,
      register,
      logout,
      updateProfile: updateProfileData,
      refreshUser: fetchUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
