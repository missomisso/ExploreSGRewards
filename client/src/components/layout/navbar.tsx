import { Link, useLocation } from "wouter";
import { MapPin, Gift, Building2, Trophy, Menu, User, LogOut, Settings, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";

declare global {
  interface Window {
    logout?: () => Promise<void>;
  }
}

export function Navbar() {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navItems = [
    { href: "/", label: "Home", icon: MapPin },
    { href: "/explore", label: "Explore", icon: MapPin },
    { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
    { href: "/rewards", label: "Rewards", icon: Gift },
    { href: "/business", label: "For Business", icon: Building2 },
  ];

  const getInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return "U";
  };

  const getDisplayName = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user?.firstName) {
      return user.firstName;
    }
    if (user?.email) {
      return user.email.split("@")[0];
    }
    return "User";
  };

  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery<any[]>({
    queryKey: ["/api/notifications", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const res = await fetch(`/api/notifications/${user.id}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!user?.id && isAuthenticated,
    refetchInterval: 30000,
  });

  const unreadCount = notifications.filter((n: any) => !n.read).length;

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      await fetch("/api/notifications/read-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user?.id }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });

  const markReadMutation = useMutation({
    mutationFn: async (notifId: number) => {
      await fetch(`/api/notifications/${notifId}/read`, {
        method: "POST",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md dark:bg-gray-950/80">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-secondary text-white font-bold">
              SG
            </div>
            <span className="font-heading text-xl font-bold tracking-tight text-foreground">
              ExploreSG
            </span>
          </Link>
        </div>

        {/* Desktop Nav */}
        <div className="hidden md:flex md:items-center md:gap-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-sm font-medium transition-colors hover:text-primary ${
                location === item.href
                  ? "text-primary font-semibold"
                  : "text-muted-foreground"
              }`}
            >
              {item.label}
            </Link>
          ))}
          
          {isLoading ? (
            <div className="ml-4 h-8 w-24 animate-pulse bg-gray-200 rounded-full" />
          ) : isAuthenticated && user ? (
            <div className="flex items-center gap-2 ml-4">
              <div className="relative" ref={notifRef}>
                <button
                  className="relative p-2 text-gray-500 hover:text-gray-700 transition-colors"
                  data-testid="button-notifications"
                  onClick={() => setNotifOpen(!notifOpen)}
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>
                {notifOpen && (
                  <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg border z-50">
                    <div className="flex items-center justify-between p-3 border-b">
                      <h3 className="font-semibold text-sm">Notifications</h3>
                      {unreadCount > 0 && (
                        <button
                          onClick={() => markAllReadMutation.mutate()}
                          className="text-xs text-primary hover:underline"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-sm text-muted-foreground">
                          No notifications yet
                        </div>
                      ) : (
                        notifications.slice(0, 20).map((notif: any) => (
                          <div
                            key={notif.id}
                            className={`p-3 border-b last:border-0 cursor-pointer hover:bg-gray-50 transition-colors ${!notif.read ? "bg-blue-50/50" : ""}`}
                            onClick={() => !notif.read && markReadMutation.mutate(notif.id)}
                          >
                            <div className="flex items-start gap-2">
                              <div className={`h-2 w-2 rounded-full mt-1.5 shrink-0 ${
                                notif.type === "submission_approved" ? "bg-green-500" :
                                notif.type === "submission_rejected" ? "bg-red-500" :
                                notif.type === "mission_completed" ? "bg-yellow-500" :
                                "bg-blue-500"
                              }`} />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium">{notif.title}</p>
                                <p className="text-xs text-muted-foreground line-clamp-2">{notif.message}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {new Date(notif.createdAt).toLocaleDateString()} at {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
              {(user.role === "admin" || user.role === "business") && (
                <Link 
                  href={user.role === "admin" ? "/admin/super" : "/admin/business"} 
                  className="flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors mr-2"
                  data-testid="link-admin"
                >
                  <Settings className="h-4 w-4" />
                  Admin
                </Link>
              )}
              <Link href="/profile" className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-full transition-colors">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={user.profileImageUrl || undefined} />
                  <AvatarFallback>{getInitials()}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium text-foreground">{getDisplayName()}</span>
              </Link>
              <button
                onClick={() => logout()}
                className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                data-testid="button-logout"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <Link href="/auth/login" data-testid="button-login">
              <Button size="sm" className="ml-4 bg-[var(--brand)] hover:bg-[var(--brand-hover)] text-white">
                Sign In
              </Button>
            </Link>
          )}
        </div>

        {/* Mobile Nav */}
        <div className="md:hidden">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" data-testid="button-menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <div className="flex flex-col gap-4 mt-8">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${
                      location === item.href
                        ? "bg-primary/10 text-primary font-semibold"
                        : "hover:bg-muted text-foreground"
                    }`}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                ))}
                
                <div className="mt-4 border-t pt-4">
                  {isAuthenticated && user ? (
                    <>
                      {(user.role === "admin" || user.role === "business") && (
                        <Link
                          href={user.role === "admin" ? "/admin/super" : "/admin/business"}
                          onClick={() => setIsOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-muted rounded-md text-primary font-medium"
                          data-testid="link-admin-mobile"
                        >
                          <Settings className="h-5 w-5" />
                          Admin Dashboard
                        </Link>
                      )}
                      <Link
                        href="/profile"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-muted rounded-md"
                      >
                        <Bell className="h-5 w-5" />
                        Notifications
                        {unreadCount > 0 && (
                          <Badge className="ml-auto bg-red-500 text-white text-xs">{unreadCount}</Badge>
                        )}
                      </Link>
                      <Link
                        href="/profile"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-muted rounded-md"
                      >
                        <User className="h-5 w-5" />
                        My Profile
                      </Link>
                      <button
                        onClick={() => {
                          logout();
                          setIsOpen(false);
                        }}
                        className="flex w-full items-center gap-3 px-4 py-3 hover:bg-muted rounded-md text-red-600"
                      >
                        <LogOut className="h-5 w-5" />
                        Sign Out
                      </button>
                    </>
                  ) : (
                    <Link
                      href="/auth/login"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 bg-[var(--brand)] text-white rounded-md"
                    >
                      <User className="h-5 w-5" />
                      Sign In
                    </Link>
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
