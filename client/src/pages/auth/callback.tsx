import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useSupabaseAuth } from "@/hooks/use-supabase-auth";
import { Loader2 } from "lucide-react";

export default function AuthCallback() {
  const [, setLocation] = useLocation();
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated, isLoading, user, getRedirectPath } = useSupabaseAuth();

  useEffect(() => {
    if (isLoading) return;
    
    if (isAuthenticated && user) {
      setLocation(getRedirectPath());
    } else if (!isLoading && !isAuthenticated) {
      setError("Authentication failed");
      setTimeout(() => setLocation("/auth/login"), 2000);
    }
  }, [isAuthenticated, isLoading, user, setLocation, getRedirectPath]);

  return (
    <div className="min-h-screen bg-[var(--bg-cream)] flex items-center justify-center">
      <div className="text-center">
        {error ? (
          <>
            <p className="text-red-500 font-medium">{error}</p>
            <p className="mt-2 text-muted-foreground">Redirecting to login...</p>
          </>
        ) : (
          <>
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-[var(--brand)]" />
            <p className="mt-4 text-muted-foreground">Completing sign in...</p>
          </>
        )}
      </div>
    </div>
  );
}
