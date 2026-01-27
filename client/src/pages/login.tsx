import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { login, loginStatus } = useAuth();
  const [formValues, setFormValues] = useState({
    email: "",
    password: "",
  });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      await login({
        email: formValues.email.trim(),
        password: formValues.password,
      });
      setLocation("/explore");
    } catch (error) {
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Welcome back</CardTitle>
          <CardDescription>Log in to continue your missions.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={formValues.email}
                onChange={(event) => setFormValues((prev) => ({ ...prev, email: event.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formValues.password}
                onChange={(event) => setFormValues((prev) => ({ ...prev, password: event.target.value }))}
                required
              />
            </div>
            <Button className="w-full" type="submit" disabled={loginStatus === "pending"}>
              {loginStatus === "pending" ? "Logging in..." : "Log In"}
            </Button>
          </form>
          <p className="mt-4 text-sm text-muted-foreground">
            New here?{" "}
            <Link href="/register">
              <a className="font-medium text-primary hover:underline">Create an account</a>
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
