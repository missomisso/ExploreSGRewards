import { Link, useLocation } from "wouter";
import { MapPin, Gift, Building2, User, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";

export function Navbar() {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { href: "/", label: "Home", icon: MapPin },
    { href: "/explore", label: "Explore", icon: MapPin },
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
          <Button size="sm" className="ml-4">
            Sign In
          </Button>
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
                <Button className="mt-4 w-full">Sign In</Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
