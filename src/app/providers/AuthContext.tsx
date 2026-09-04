import React, { createContext, useContext, useState, useEffect } from 'react';

type Role = 'consumer' | 'manufacturer' | 'admin' | null;

interface UserDetails {
  email?: string;
  name?: string;
  avatar?: string;
}

interface AuthContextType {
  role: Role;
  token: string | null;
  user: UserDetails | null;
  login: (token: string, role: Role, email?: string, name?: string, avatar?: string) => void;
  logout: () => void;
  setAvatar: (avatar: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<Role>(null);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserDetails | null>(null);

  useEffect(() => {
    const savedToken = localStorage.getItem('jwt_token');
    const savedRole = localStorage.getItem('user_role') as Role;
    const savedEmail = localStorage.getItem('user_email');
    const savedName = localStorage.getItem('user_name');
    const savedAvatar = localStorage.getItem('user_avatar');
    
    if (savedToken && savedRole) {
      setToken(savedToken);
      setRole(savedRole);
      setUser({ email: savedEmail || '', name: savedName || '', avatar: savedAvatar || '' });
    }
  }, []);

  const login = (newToken: string, newRole: Role, email?: string, name?: string, avatar?: string) => {
    setToken(newToken);
    setRole(newRole);
    setUser({ email, name, avatar });
    
    localStorage.setItem('jwt_token', newToken);
    localStorage.setItem('user_role', newRole || '');
    if (email) localStorage.setItem('user_email', email);
    if (name) localStorage.setItem('user_name', name);
    if (avatar) localStorage.setItem('user_avatar', avatar);
  };

  const setAvatar = (newAvatar: string) => {
    setUser(prev => prev ? { ...prev, avatar: newAvatar } : null);
    localStorage.setItem('user_avatar', newAvatar);
  };

  const logout = () => {
    setToken(null);
    setRole(null);
    setUser(null);
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_email');
    localStorage.removeItem('user_name');
    localStorage.removeItem('user_avatar');
  };

  return (
    <AuthContext.Provider value={{ role, token, user, login, logout, setAvatar }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
