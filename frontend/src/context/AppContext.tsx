import React, { createContext, useContext, useReducer, useCallback, useEffect, ReactNode } from 'react';
import { User, Space, SpaceWithMembers, ApiError } from '../types';
import { authApi, spacesApi } from '../api/services';

// State interface
interface AppState {
  user: User | null;
  spaces: SpaceWithMembers[];
  currentSpace: SpaceWithMembers | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

// Action types
type AppAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_SPACES'; payload: SpaceWithMembers[] }
  | { type: 'SET_CURRENT_SPACE'; payload: SpaceWithMembers | null }
  | { type: 'ADD_SPACE'; payload: SpaceWithMembers }
  | { type: 'UPDATE_SPACE'; payload: SpaceWithMembers }
  | { type: 'REMOVE_SPACE'; payload: string }
  | { type: 'LOGOUT' };

// Initial state
const initialState: AppState = {
  user: null,
  spaces: [],
  currentSpace: null,
  isLoading: false,
  error: null,
  isAuthenticated: false,
};

// Reducer
const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };

    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
        isLoading: false
      };

    case 'SET_SPACES':
      return { ...state, spaces: action.payload, isLoading: false };

    case 'SET_CURRENT_SPACE':
      return { ...state, currentSpace: action.payload };

    case 'ADD_SPACE':
      return {
        ...state,
        spaces: [...state.spaces, action.payload],
        isLoading: false
      };

    case 'UPDATE_SPACE':
      return {
        ...state,
        spaces: state.spaces.map(space =>
          space.id === action.payload.id ? action.payload : space
        ),
        currentSpace: state.currentSpace?.id === action.payload.id
          ? action.payload
          : state.currentSpace,
        isLoading: false
      };

    case 'REMOVE_SPACE':
      return {
        ...state,
        spaces: state.spaces.filter(space => space.id !== action.payload),
        currentSpace: state.currentSpace?.id === action.payload
          ? null
          : state.currentSpace,
        isLoading: false
      };

    case 'LOGOUT':
      return {
        ...initialState,
        isAuthenticated: false
      };

    default:
      return state;
  }
};

// Context interface
interface AppContextType {
  state: AppState;
  // Auth actions
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  loadCurrentUser: () => Promise<void>;
  // Space actions
  loadSpaces: () => Promise<void>;
  setCurrentSpace: (space: SpaceWithMembers | null) => void;
  addSpace: (space: SpaceWithMembers) => void;
  updateSpace: (space: SpaceWithMembers) => void;
  removeSpace: (spaceId: string) => void;
  // Utility actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

// Create context
const AppContext = createContext<AppContextType | undefined>(undefined);

// Provider component
interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Auth actions
  const login = useCallback(async (email: string, password: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      const response = await authApi.login({ email, password });
      localStorage.setItem('auth_token', response.access_token);

      // Load current user after login
      await loadCurrentUser();
    } catch (error) {
      const apiError = error as ApiError;
      dispatch({ type: 'SET_ERROR', payload: apiError.message });
      throw error;
    }
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      const response = await authApi.register({ name, email, password });

      // After successful registration, log them in automatically
      const loginResponse = await authApi.login({ email, password });
      localStorage.setItem('auth_token', loginResponse.access_token);

      // Load current user after registration and login
      await loadCurrentUser();
    } catch (error) {
      const apiError = error as ApiError;
      dispatch({ type: 'SET_ERROR', payload: apiError.message });
      throw error;
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('auth_token');
    dispatch({ type: 'LOGOUT' });
  }, []);

  const loadCurrentUser = useCallback(async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        dispatch({ type: 'SET_USER', payload: null });
        return;
      }

      dispatch({ type: 'SET_LOADING', payload: true });
      const user = await authApi.getCurrentUser();
      dispatch({ type: 'SET_USER', payload: user });
    } catch (error) {
      const apiError = error as ApiError;
      if (apiError.status === 401) {
        logout();
      } else {
        dispatch({ type: 'SET_ERROR', payload: apiError.message });
      }
    }
  }, [logout]);

  // Space actions
  const loadSpaces = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      const spaces = await spacesApi.getSpaces();
      dispatch({ type: 'SET_SPACES', payload: spaces });
    } catch (error) {
      const apiError = error as ApiError;
      dispatch({ type: 'SET_ERROR', payload: apiError.message });
    }
  }, []);

  const setCurrentSpace = useCallback((space: SpaceWithMembers | null) => {
    dispatch({ type: 'SET_CURRENT_SPACE', payload: space });
  }, []);

  const addSpace = useCallback((space: SpaceWithMembers) => {
    dispatch({ type: 'ADD_SPACE', payload: space });
  }, []);

  const updateSpace = useCallback((space: SpaceWithMembers) => {
    dispatch({ type: 'UPDATE_SPACE', payload: space });
  }, []);

  const removeSpace = useCallback((spaceId: string) => {
    dispatch({ type: 'REMOVE_SPACE', payload: spaceId });
  }, []);

  // Utility actions
  const setLoading = useCallback((loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  }, []);

  const setError = useCallback((error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: 'SET_ERROR', payload: null });
  }, []);

  // Initialize user on mount
  useEffect(() => {
    loadCurrentUser();
  }, [loadCurrentUser]);

  // Load spaces when user is authenticated
  useEffect(() => {
    if (state.isAuthenticated && state.user) {
      loadSpaces();
    }
  }, [state.isAuthenticated, state.user, loadSpaces]);

  const contextValue: AppContextType = {
    state,
    login,
    register,
    logout,
    loadCurrentUser,
    loadSpaces,
    setCurrentSpace,
    addSpace,
    updateSpace,
    removeSpace,
    setLoading,
    setError,
    clearError,
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

// Custom hook to use the context
export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export default AppContext;