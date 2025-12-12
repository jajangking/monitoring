import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Platform } from 'react-native';
import { supabase } from '../utils/supabaseClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthContextType {
  session: any | null;
  user: any | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [session, setSession] = useState<any | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('AuthContext mounted, setting up listeners');

    // Get initial session from storage
    const getInitialSession = async () => {
      try {
        const sessionData = await AsyncStorage.getItem('user_session');
        if (sessionData) {
          const parsedSession = JSON.parse(sessionData);
          console.log('Found existing session in storage:', parsedSession);
          setSession(parsedSession);
          setUser(parsedSession?.user || null);
        } else {
          console.log('No existing session in storage');
        }
      } catch (error) {
        console.error('Error getting initial session:', error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change event received:', event);
        console.log('Session object:', session);
        setSession(session);
        setUser(session?.user || null);

        if (session) {
          console.log('Saving session to AsyncStorage');
          await AsyncStorage.setItem('user_session', JSON.stringify(session));
        } else {
          console.log('Removing session from AsyncStorage');
          await AsyncStorage.removeItem('user_session');
        }
      }
    );

    console.log('Auth state change subscription created');

    return () => {
      console.log('Unsubscribing from auth state changes');
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    return data;
  };

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    return data;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
    } else {
      setSession(null);
      setUser(null);
      await AsyncStorage.removeItem('user_session');
    }
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) {
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    console.log('signInWithGoogle function called');
    console.log('Attempting to call Supabase Google OAuth');

    try {
      // For now, since we know the correct URL from logs, use the localhost one
      const redirectUrl = 'exp://localhost:19000/--/login-callback';

      console.log('Using redirect URL:', redirectUrl);

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
        }
      });

      console.log('Supabase OAuth call completed');
      if (error) {
        console.log('Supabase OAuth error:', error);
        throw error;
      }
    } catch (error) {
      console.log('signInWithGoogle error:', error);
      throw error;
    }
  };

  const value = {
    session,
    user,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    signInWithGoogle,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};