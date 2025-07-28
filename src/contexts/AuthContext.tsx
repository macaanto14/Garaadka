import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI, getToken, removeToken } from '../services/api';

interface User {
  personalId: string;
  fname: string;
  username: string;
  position: string;
  city?: string;
  phoneNo?: string;
  image?: string;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  refreshToken: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in with valid token
    const initializeAuth = async () => {
      const token = getToken();
      const savedUser = localStorage.getItem('user');
      
      if (token && savedUser) {
        try {
          // Verify token is still valid by fetching fresh user data
          const response = await authAPI.getProfile();
          const userData: User = {
            personalId: response['PERSONAL ID'],
            fname: response.fname,
            username: response.USERNAME,
            position: response.POSITION,
            city: response.CITY,
            phoneNo: response.PHONENO,
            image: response.IMAGE
          };
          
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
        } catch (error) {
          // Token is invalid, clear everything
          console.error('Token validation failed:', error);
          removeToken();
          localStorage.removeItem('user');
          setUser(null);
        }
      }
      
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const response = await authAPI.login(username, password);
      
      if (response.success && response.token) {
        const userData: User = {
          personalId: response.user['PERSONAL ID'],
          fname: response.user.fname,
          username: response.user.USERNAME,
          position: response.user.POSITION,
          city: response.user.CITY,
          phoneNo: response.user.PHONENO,
          image: response.user.IMAGE
        };
        
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      localStorage.removeItem('user');
    }
  };

  const refreshToken = async (): Promise<boolean> => {
    try {
      const response = await authAPI.refreshToken();
      
      if (response.success && response.token) {
        const userData: User = {
          personalId: response.user['PERSONAL ID'],
          fname: response.user.fname,
          username: response.user.USERNAME,
          position: response.user.POSITION,
          city: response.user.CITY,
          phoneNo: response.user.PHONENO,
          image: response.user.IMAGE
        };
        
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Token refresh failed:', error);
      logout();
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading, refreshToken }}>
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