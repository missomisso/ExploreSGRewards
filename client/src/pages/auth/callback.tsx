import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { createClient } from "@supabase/supabase-js";
import { Loader2 } from "lucide-react";

export default function AuthCallback() {
  const [, setLocation] = useLocation();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const response = await fetch("/api/config/supabase");
        const config = await response.json();
        const supabase = createClient(config.url, config.anonKey);
        
        const { error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Auth callback error:", error);
          setError(error.message);
          setTimeout(() => setLocation("/auth/login"), 2000);
        } else {
          setLocation("/");
        }
      } catch (err) {
        console.error("Auth callback error:", err);
        setError("Failed to complete authentication");
        setTimeout(() => setLocation("/auth/login"), 2000);
      }
    };

    handleCallback();
  }, [setLocation]);

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
