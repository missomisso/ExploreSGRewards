import { useState, useEffect, useCallback, useRef } from "react";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { User as SupabaseUser, Session } from "@supabase/supabase-js";
import type { User } from "@shared/models/auth";

interface AuthState {
  user: User | null;
  supabaseUser: SupabaseUser | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

let cachedClient: SupabaseClient | null = null;

async function getSupabaseClient(): Promise<SupabaseClient> {
  if (cachedClient) return cachedClient;
  
  const response = await fetch("/api/config/supabase");
  const config = await response.json();
  
  cachedClient = createClient(config.url, config.anonKey);
  return cachedClient;
}

export function useSupabaseAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    supabaseUser: null,
    session: null,
    isLoading: true,
    isAuthenticated: false,
  });
  
  const supabaseRef = useRef<SupabaseClient | null>(null);

  const syncUserToDatabase = useCallback(async (supabaseUser: SupabaseUser, accessToken: string) => {
    try {
      const response = await fetch("/api/auth/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          firstName: supabaseUser.user_metadata?.first_name || supabaseUser.user_metadata?.full_name?.split(" ")[0] || null,
          lastName: supabaseUser.user_metadata?.last_name || supabaseUser.user_metadata?.full_name?.split(" ").slice(1).join(" ") || null,
          profileImageUrl: supabaseUser.user_metadata?.avatar_url || null,
        }),
      });

      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error("Failed to sync user:", error);
    }
    return null;
  }, []);

  useEffect(() => {
    let subscription: { unsubscribe: () => void } | null = null;
    
    const init = async () => {
      const supabase = await getSupabaseClient();
      supabaseRef.current = supabase;
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user && session.access_token) {
        const dbUser = await syncUserToDatabase(session.user, session.access_token);
        setState({
          user: dbUser,
          supabaseUser: session.user,
          session,
          isLoading: false,
          isAuthenticated: true,
        });
      } else {
        setState({
          user: null,
          supabaseUser: null,
          session: null,
          isLoading: false,
          isAuthenticated: false,
        });
      }

      const { data } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          if (session?.user && session.access_token) {
            const dbUser = await syncUserToDatabase(session.user, session.access_token);
            setState({
              user: dbUser,
              supabaseUser: session.user,
              session,
              isLoading: false,
              isAuthenticated: true,
            });
          } else {
            setState({
              user: null,
              supabaseUser: null,
              session: null,
              isLoading: false,
              isAuthenticated: false,
            });
          }
        }
      );
      
      subscription = data.subscription;
    };
    
    init();

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [syncUserToDatabase]);

  const signUp = async (email: string, password: string, metadata?: { firstName?: string; lastName?: string }) => {
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: metadata?.firstName,
          last_name: metadata?.lastName,
        },
      },
    });
    return { data, error };
  };

  const signIn = async (email: string, password: string) => {
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  };

  const signInWithGoogle = async () => {
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    return { data, error };
  };

  const signInWithGithub = async () => {
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    return { data, error };
  };

  const signOut = async () => {
    const supabase = await getSupabaseClient();
    const { error } = await supabase.auth.signOut();
    if (!error) {
      setState({
        user: null,
        supabaseUser: null,
        session: null,
        isLoading: false,
        isAuthenticated: false,
      });
    }
    return { error };
  };

  const resetPassword = async (email: string) => {
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    return { data, error };
  };

  const getRedirectPath = useCallback(() => {
    if (!state.user) return "/";
    switch (state.user.role) {
      case "admin":
        return "/admin/super";
      case "business":
        return "/admin/business";
      default:
        return "/";
    }
  }, [state.user]);

  return {
    ...state,
    signUp,
    signIn,
    signInWithGoogle,
    signInWithGithub,
    signOut,
    resetPassword,
    logout: signOut,
    getRedirectPath,
  };
}
