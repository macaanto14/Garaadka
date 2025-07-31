import { StateCreator } from 'zustand';
import { authAPI, getToken, removeToken } from '../../services/api';

export interface User {
  personalId: string;
  fname: string;
  username: string;
  position: string;
  city?: string;
  phoneNo?: string;
  image?: string;
}

export interface AuthSlice {
  user: User | null;
  isAuthenticated: boolean;
  authLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
  updateUser: (userData: Partial<User>) => void;
  initializeAuth: () => Promise<void>;
}

export const authSlice: StateCreator<
  AuthSlice,
  [["zustand/immer", never]],
  [],
  AuthSlice
> = (set, get) => ({
  user: null,
  isAuthenticated: false,
  authLoading: true,

  initializeAuth: async () => {
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
        
        set((state) => {
          state.user = userData;
          state.isAuthenticated = true;
          state.authLoading = false;
        });
        
        localStorage.setItem('user', JSON.stringify(userData));
      } catch (error) {
        // Token is invalid, clear everything
        console.error('Token validation failed:', error);
        removeToken();
        localStorage.removeItem('user');
        
        set((state) => {
          state.user = null;
          state.isAuthenticated = false;
          state.authLoading = false;
        });
      }
    } else {
      set((state) => {
        state.authLoading = false;
      });
    }
  },

  login: async (username: string, password: string): Promise<boolean> => {
    try {
      set((state) => {
        state.authLoading = true;
      });

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
        
        set((state) => {
          state.user = userData;
          state.isAuthenticated = true;
          state.authLoading = false;
        });
        
        localStorage.setItem('user', JSON.stringify(userData));
        return true;
      }
      
      set((state) => {
        state.authLoading = false;
      });
      return false;
    } catch (error) {
      console.error('Login failed:', error);
      set((state) => {
        state.authLoading = false;
      });
      return false;
    }
  },

  logout: async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      set((state) => {
        state.user = null;
        state.isAuthenticated = false;
      });
      localStorage.removeItem('user');
    }
  },

  refreshToken: async (): Promise<boolean> => {
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
        
        set((state) => {
          state.user = userData;
          state.isAuthenticated = true;
        });
        
        localStorage.setItem('user', JSON.stringify(userData));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Token refresh failed:', error);
      get().logout();
      return false;
    }
  },

  updateUser: (userData: Partial<User>) => {
    set((state) => {
      if (state.user) {
        state.user = { ...state.user, ...userData };
        localStorage.setItem('user', JSON.stringify(state.user));
      }
    });
  },
});