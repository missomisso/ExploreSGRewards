import { useState } from "react";
import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  Map, 
  Gift, 
  ShieldAlert, 
  Settings, 
  LogOut, 
  Menu,
  Store,
  ClipboardList,
  CheckSquare,
  BarChart3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface AdminLayoutProps {
  children: React.ReactNode;
  type: "super" | "business";
}

export function AdminLayout({ children, type }: AdminLayoutProps) {
  const [location] = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const superAdminNav = [
    { href: "/admin/super", label: "Overview", icon: LayoutDashboard },
    { href: "/admin/super/businesses", label: "Businesses", icon: Building2 },
    { href: "/admin/super/users", label: "Users", icon: Users },
    { href: "/admin/super/rewards", label: "Rewards", icon: Gift },
  ];

  const businessAdminNav = [
    { href: "/admin/business", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/business/missions", label: "Missions", icon: ClipboardList },
    { href: "/admin/business/rewards", label: "Rewards", icon: Gift },
    { href: "/admin/business/verification", label: "Verifications", icon: CheckSquare },
    { href: "/admin/business/settings", label: "Settings", icon: Settings },
  ];

  const navItems = type === "super" ? superAdminNav : businessAdminNav;
  const roleLabel = type === "super" ? "Super Admin" : "Business Admin";

  const NavContent = () => (
    <div className="flex h-full flex-col gap-2">
      <div className="flex h-16 items-center border-b px-6">
        <div className="flex items-center gap-2 font-bold text-xl">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white">
            {type === "super" ? "SA" : "BA"}
          </div>
          <span>ExploreSG</span>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto py-4">
        <nav className="grid gap-1 px-2">
          {navItems.map((item) => (
            <Link 
              key={item.href} 
              href={item.href}
              className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                location === item.href
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="mt-auto border-t p-4">
        <div className="flex items-center gap-3 mb-4 px-2">
          <Avatar className="h-9 w-9">
            <AvatarImage src="https://github.com/shadcn.png" />
            <AvatarFallback>AD</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm font-medium">Admin User</span>
            <span className="text-xs text-muted-foreground">{roleLabel}</span>
          </div>
        </div>
        <Link href="/">
          <Button variant="outline" className="w-full justify-start gap-2" size="sm">
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900/50">
      {/* Mobile Sidebar */}
      <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden fixed top-4 left-4 z-50">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-64">
          <NavContent />
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <div className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col md:border-r md:bg-background">
        <NavContent />
      </div>

      {/* Main Content */}
      <main className="md:ml-64 min-h-screen">
        <div className="container mx-auto p-6 md:p-8 pt-16 md:pt-8">
          {children}
        </div>
      </main>
    </div>
  );
}
