import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { RoleName, UserProfile } from '../types/user';
import { authService } from '../services/authService';
import { DEMO_ROLES } from '../data/mockRoles';

interface AuthContextType {
  currentUser: UserProfile;
  roles: { role: RoleName; user: UserProfile }[];
  isLoading: boolean;
  switchRole: (role: RoleName) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile>(DEMO_ROLES[0].user);
  const [roles, setRoles] = useState(DEMO_ROLES);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadAuth() {
      try {
        const [user, roleList] = await Promise.all([
          authService.getCurrentUser(),
          authService.getRoles(),
        ]);
        setCurrentUser(user);
        setRoles(roleList);
      } catch (err) {
        console.error('Failed to load auth user', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadAuth();
  }, []);

  const switchRole = async (role: RoleName) => {
    setIsLoading(true);
    try {
      const user = await authService.switchRole(role);
      setCurrentUser(user);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ currentUser, roles, isLoading, switchRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
