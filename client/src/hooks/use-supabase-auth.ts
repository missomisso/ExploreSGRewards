import { useState, useEffect, useCallback } from "react";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { User as SupabaseUser, Session } from "@supabase/supabase-js";
import type { User } from "@shared/models/auth";

interface AuthState {
  user: User | null;
  supabaseUser: SupabaseUser | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

// ✅ Next.js client env vars (must start with NEXT_PUBLIC_)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;


// ✅ Create client once
let cachedClient: SupabaseClient | null = null;
function getSupabaseClient(): SupabaseClient {
  if (cachedClient) return cachedClient;
  cachedClient = createClient(supabaseUrl, supabaseAnonKey);
  return cachedClient;
}

// ✅ Map Supabase user -> your app User model (adjust fields if needed)
function toAppUser(u: SupabaseUser): User {
  const fullName = (u.user_metadata?.full_name as string | undefined) ?? "";
  const firstName =
    (u.user_metadata?.first_name as string | undefined) ??
    fullName.split(" ")[0] ??
    null;

  const lastName =
    (u.user_metadata?.last_name as string | undefined) ??
    (fullName.split(" ").slice(1).join(" ") || null);

  const profileImageUrl =
    (u.user_metadata?.avatar_url as string | undefined) ?? null;

  const role = (u.user_metadata?.role as User["role"] | undefined) ?? "user";

  // NOTE: Your User type might be different. If so, paste it and I’ll align this.
  return {
    id: u.id,
    email: u.email ?? "",
    firstName,
    lastName,
    profileImageUrl,
    role,
  } as unknown as User;
}

export function useSupabaseAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    supabaseUser: null,
    session: null,
    isLoading: true,
    isAuthenticated: false,
  });

  useEffect(() => {
    const supabase = getSupabaseClient();

    let unsub: (() => void) | null = null;

    const init = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        setState({
          user: toAppUser(session.user),
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

      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          setState({
            user: toAppUser(session.user),
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
      });

      unsub = () => data.subscription.unsubscribe();
    };

    init();

    return () => {
      if (unsub) unsub();
    };
  }, []);

  const signUp = async (
    email: string,
    password: string,
    metadata?: { firstName?: string; lastName?: string }
  ) => {
    const supabase = getSupabaseClient();
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
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  };

  const signInWithGoogle = async () => {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    return { data, error };
  };

  const signInWithGithub = async () => {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    return { data, error };
  };

  const signOut = async () => {
    const supabase = getSupabaseClient();
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  const resetPassword = async (email: string) => {
    const supabase = getSupabaseClient();
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


/*
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
} */
