import { useState, useEffect, useCallback } from "react";
import type { User as SupabaseUser, Session } from "@supabase/supabase-js";
import type { User } from "@shared/models/auth";
import { supabase } from "@/lib/supabase";

interface AuthState {
  user: User | null;
  supabaseUser: SupabaseUser | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

async function fetchDbUser(supabaseUser: SupabaseUser): Promise<User> {

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", supabaseUser.id)
    .single();

  if (data && !error) {
    return {
      id: data.id,
      email: data.email ?? supabaseUser.email ?? "",
      firstName: data.first_name ?? null,
      lastName: data.last_name ?? null,
      profileImageUrl: data.profile_image_url ?? (supabaseUser.user_metadata?.avatar_url as string | undefined) ?? null,
      role: data.role ?? "tourist",
      businessName: data.business_name ?? null,
      businessDescription: data.business_description ?? null,
      level: data.level ?? 1,
      points: data.points ?? 0,
      createdAt: data.created_at ? new Date(data.created_at) : null,
      updatedAt: data.updated_at ? new Date(data.updated_at) : null,
    } as User;
  }

  const fullName = (supabaseUser.user_metadata?.full_name as string | undefined) ?? "";
  return {
    id: supabaseUser.id,
    email: supabaseUser.email ?? "",
    firstName: (supabaseUser.user_metadata?.first_name as string | undefined) ?? fullName.split(" ")[0] ?? null,
    lastName: (supabaseUser.user_metadata?.last_name as string | undefined) ?? (fullName.split(" ").slice(1).join(" ") || null),
    profileImageUrl: (supabaseUser.user_metadata?.avatar_url as string | undefined) ?? null,
    role: "tourist",
    businessName: null,
    businessDescription: null,
    level: 1,
    points: 0,
    createdAt: null,
    updatedAt: null,
  } as User;
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
    let unsub: (() => void) | null = null;

    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        const dbUser = await fetchDbUser(session.user);
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

      const { data } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          const dbUser = await fetchDbUser(session.user);
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
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  };

  const signInWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    return { data, error };
  };

  const signInWithGithub = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    return { data, error };
  };

  const signOut = async () => {
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
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    return { data, error };
  };

  const refreshUser = useCallback(async () => {
    if (!state.supabaseUser) return;
    const dbUser = await fetchDbUser(state.supabaseUser);
    setState((prev) => ({ ...prev, user: dbUser }));
  }, [state.supabaseUser]);

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
    refreshUser,
  };
}
