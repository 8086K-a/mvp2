"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { User, Session, AuthError } from "@supabase/supabase-js";
import { supabase, supabaseOverseas, supabaseChina } from "@/lib/supabase";
import { useGeo } from "@/components/geo-provider";

interface SupabaseAuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (
    email: string,
    password: string
  ) => Promise<{ error: AuthError | null }>;
  signIn: (
    email: string,
    password: string
  ) => Promise<{ error: AuthError | null }>;
  signInWithGoogle: () => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  verifyOtp: (
    email: string,
    token: string,
    type: "signup" | "recovery"
  ) => Promise<{ error: AuthError | null }>;
}

const SupabaseAuthContext = createContext<SupabaseAuthContextType | undefined>(
  undefined
);

export function SupabaseAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { geoInfo } = useGeo();

  // 根据地理位置选择Supabase客户端
  const getSupabaseClient = () => {
    return geoInfo?.regionCategory === "china"
      ? supabaseChina
      : supabaseOverseas;
  };

  useEffect(() => {
    const getSession = async () => {
      const client = getSupabaseClient();
      const {
        data: { session },
        error,
      } = await client.auth.getSession();

      if (error) {
        console.error("Error getting session:", error);
      } else {
        setSession(session);
        setUser(session?.user ?? null);
      }
      setLoading(false);
    };

    getSession();

    const client = getSupabaseClient();
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [geoInfo]);

  const signUp = async (email: string, password: string) => {
    const client = getSupabaseClient();
    const { error } = await client.auth.signUp({
      email,
      password,
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const client = getSupabaseClient();
    const { error } = await client.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signInWithGoogle = async () => {
    const client = getSupabaseClient();
    const { error } = await client.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    return { error };
  };

  const signOut = async () => {
    const client = getSupabaseClient();
    const { error } = await client.auth.signOut();
    return { error };
  };

  const resetPassword = async (email: string) => {
    const client = getSupabaseClient();
    const { error } = await client.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    return { error };
  };

  const verifyOtp = async (
    email: string,
    token: string,
    type: "signup" | "recovery"
  ) => {
    const client = getSupabaseClient();
    const { error } = await client.auth.verifyOtp({
      email,
      token,
      type,
    });
    return { error };
  };

  const value: SupabaseAuthContextType = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    resetPassword,
    verifyOtp,
  };

  return (
    <SupabaseAuthContext.Provider value={value}>
      {children}
    </SupabaseAuthContext.Provider>
  );
}

export function useSupabaseAuth() {
  const context = useContext(SupabaseAuthContext);
  if (context === undefined) {
    throw new Error(
      "useSupabaseAuth must be used within a SupabaseAuthProvider"
    );
  }
  return context;
}
