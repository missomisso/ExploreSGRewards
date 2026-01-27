import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { useAuth, type AuthRole } from "@/hooks/use-auth";

export default function Register() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { register, registerStatus } = useAuth();
  const [formValues, setFormValues] = useState({
    name: "",
    email: "",
    password: "",
    role: "user" as AuthRole,
  });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      await register({
        name: formValues.name.trim(),
        email: formValues.email.trim(),
        password: formValues.password,
        role: formValues.role,
      });
      setLocation(formValues.role === "business" ? "/admin/business" : "/explore");
    } catch (error) {
      toast({
        title: "Registration failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create your account</CardTitle>
          <CardDescription>Choose how you want to explore ExploreSG.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input
                id="name"
                placeholder="Alex Chen"
                value={formValues.name}
                onChange={(event) => setFormValues((prev) => ({ ...prev, name: event.target.value }))}
                required
              />
            </div>
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
                placeholder="Create a password"
                value={formValues.password}
                onChange={(event) => setFormValues((prev) => ({ ...prev, password: event.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Account type</Label>
              <RadioGroup
                value={formValues.role}
                onValueChange={(value) => setFormValues((prev) => ({ ...prev, role: value as AuthRole }))}
                className="grid gap-2"
              >
                <Label className="flex items-center gap-2 border rounded-lg p-3 cursor-pointer">
                  <RadioGroupItem value="user" />
                  <span>
                    <span className="font-medium block">Explorer</span>
                    <span className="text-sm text-muted-foreground">Join missions and earn rewards.</span>
                  </span>
                </Label>
                <Label className="flex items-center gap-2 border rounded-lg p-3 cursor-pointer">
                  <RadioGroupItem value="business" />
                  <span>
                    <span className="font-medium block">Business owner</span>
                    <span className="text-sm text-muted-foreground">Create missions for your venue.</span>
                  </span>
                </Label>
              </RadioGroup>
            </div>
            <Button className="w-full" type="submit" disabled={registerStatus === "pending"}>
              {registerStatus === "pending" ? "Creating account..." : "Create Account"}
            </Button>
          </form>
          <p className="mt-4 text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login">
              <a className="font-medium text-primary hover:underline">Log in</a>
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
