import { Link, useLocation } from "wouter";
import { MapPin, Gift, Building2, Trophy, Menu, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

export function Navbar() {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();
  const { toast } = useToast();

  const navItems = [
    { href: "/", label: "Home", icon: MapPin },
    { href: "/explore", label: "Explore", icon: MapPin },
    { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
    { href: "/rewards", label: "Rewards", icon: Gift },
    { href: "/business", label: "For Business", icon: Building2 },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md dark:bg-gray-950/80">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Link href="/">
            <a className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-secondary text-white font-bold">
                SG
              </div>
              <span className="font-heading text-xl font-bold tracking-tight text-foreground">
                ExploreSG
              </span>
            </a>
          </Link>
        </div>

        {/* Desktop Nav */}
        <div className="hidden md:flex md:items-center md:gap-6">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <a
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  location === item.href
                    ? "text-primary font-semibold"
                    : "text-muted-foreground"
                }`}
              >
                {item.label}
              </a>
            </Link>
          ))}
          
          {user ? (
            <div className="ml-4 flex items-center gap-2">
              <Link href="/profile">
                <a className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-full transition-colors">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={user.avatar || undefined} />
                    <AvatarFallback>{user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium text-foreground">{user.name}</span>
                </a>
              </Link>
              <Button
                size="sm"
                variant="ghost"
                onClick={async () => {
                  try {
                    await logout();
                  } catch (error) {
                    toast({
                      title: "Logout failed",
                      description: error instanceof Error ? error.message : "Please try again.",
                      variant: "destructive",
                    });
                  }
                }}
              >
                Log out
              </Button>
            </div>
          ) : (
            <div className="ml-4 flex items-center gap-2">
              <Link href="/login">
                <Button size="sm" variant="outline">
                  Sign In
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm">Create Account</Button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Nav */}
        <div className="md:hidden">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <div className="flex flex-col gap-4 mt-8">
                {navItems.map((item) => (
                  <Link key={item.href} href={item.href}>
                    <a
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${
                        location === item.href
                          ? "bg-primary/10 text-primary font-semibold"
                          : "hover:bg-muted text-foreground"
                      }`}
                    >
                      <item.icon className="h-5 w-5" />
                      {item.label}
                    </a>
                  </Link>
                ))}
                
                <div className="mt-4 border-t pt-4">
                  {user ? (
                    <>
                      <Link href="/profile">
                        <a 
                          onClick={() => setIsOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-muted rounded-md"
                        >
                          <User className="h-5 w-5" />
                          My Profile
                        </a>
                      </Link>
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await logout();
                            setIsOpen(false);
                          } catch (error) {
                            toast({
                              title: "Logout failed",
                              description: error instanceof Error ? error.message : "Please try again.",
                              variant: "destructive",
                            });
                          }
                        }}
                        className="flex w-full items-center gap-3 px-4 py-3 hover:bg-muted rounded-md text-left"
                      >
                        <User className="h-5 w-5" />
                        Log out
                      </button>
                    </>
                  ) : (
                    <div className="space-y-2 px-4">
                      <Link href="/login">
                        <Button variant="outline" className="w-full" onClick={() => setIsOpen(false)}>
                          Sign In
                        </Button>
                      </Link>
                      <Link href="/register">
                        <Button className="w-full" onClick={() => setIsOpen(false)}>
                          Create Account
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
