import { AdminLayout } from "@/components/layout/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { 
  Users, 
  Building2, 
  Map, 
  Gift, 
  MoreHorizontal, 
  AlertCircle, 
  Loader2,
  Trophy,
  Target
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useSupabaseAuth } from "@/hooks/use-supabase-auth";

export default function SuperAdminDashboard() {
  const { session } = useSupabaseAuth();

  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const token = session?.access_token;
      if (!token) return [];
      const res = await fetch("/api/admin/users", {
        headers: { "Authorization": `Bearer ${token}` },
      });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!session?.access_token,
  });

  const { data: missions = [], isLoading: missionsLoading } = useQuery({
    queryKey: ["/api/missions", "all"],
    queryFn: async () => {
      const res = await fetch("/api/missions?all=true");
      if (!res.ok) throw new Error("Failed to fetch missions");
      return res.json();
    },
  });

  const { data: rewards = [], isLoading: rewardsLoading } = useQuery({
    queryKey: ["/api/rewards"],
    queryFn: async () => {
      const res = await fetch("/api/rewards");
      if (!res.ok) throw new Error("Failed to fetch rewards");
      return res.json();
    },
  });

  const { data: userProgress = [], isLoading: progressLoading } = useQuery({
    queryKey: ["/api/admin/user-progress"],
    queryFn: async () => {
      const token = session?.access_token;
      if (!token) return [];
      const res = await fetch("/api/admin/user-progress", {
        headers: { "Authorization": `Bearer ${token}` },
      });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!session?.access_token,
  });

  const { data: submissions = [], isLoading: submissionsLoading } = useQuery({
    queryKey: ["/api/submissions", "pending"],
    queryFn: async () => {
      const res = await fetch("/api/submissions?status=pending");
      if (!res.ok) throw new Error("Failed to fetch submissions");
      return res.json();
    },
  });

  const isLoading = usersLoading || missionsLoading || rewardsLoading || submissionsLoading || progressLoading;

  const touristCount = users.filter((u: any) => u.role === "tourist").length;
  const businessCount = users.filter((u: any) => u.role === "business").length;
  const activeMissions = missions.filter((m: any) => m.status === "active").length;
  const pendingSubmissions = submissions.length;

  const kpiData = [
    { title: "Businesses", value: businessCount.toString(), icon: Building2, color: "text-blue-600 bg-blue-100" },
    { title: "Total Users", value: touristCount.toString(), icon: Users, color: "text-green-600 bg-green-100" },
    { title: "Active Missions", value: activeMissions.toString(), icon: Map, color: "text-purple-600 bg-purple-100" },
    { title: "Rewards Available", value: rewards.length.toString(), icon: Gift, color: "text-orange-600 bg-orange-100" },
  ];

  const businesses = users.filter((u: any) => u.role === "business").slice(0, 5);

  const getTimeSince = (date: string) => {
    if (!date) return "Unknown";
    const diff = Date.now() - new Date(date).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 24) return `${hours} hours ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} days ago`;
    return new Date(date).toLocaleDateString();
  };

  const alerts = [];
  if (pendingSubmissions > 0) {
    alerts.push({ id: 1, message: `${pendingSubmissions} submissions pending review`, type: "warning" });
  }

  if (isLoading) {
    return (
      <AdminLayout type="super">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout type="super">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-heading font-bold">Platform Overview</h1>
          <p className="text-muted-foreground">Welcome back, Super Admin.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/super/users">
            <Button variant="outline">Manage Users</Button>
          </Link>
          <Link href="/admin/super/rewards">
            <Button>Manage Rewards</Button>
          </Link>
        </div>
      </div>

      {alerts.length > 0 && (
        <div className="grid gap-4 mb-8">
          {alerts.map((alert) => (
            <div key={alert.id} className={`flex items-center gap-3 p-4 rounded-lg border ${alert.type === 'warning' ? 'bg-yellow-50 border-yellow-200 text-yellow-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
              <AlertCircle className="h-5 w-5" />
              <span className="font-medium">{alert.message}</span>
              <Link href="/admin/business/verification">
                <Button variant="ghost" size="sm" className="ml-auto h-8">Review</Button>
              </Link>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {kpiData.map((kpi) => (
          <Card key={kpi.title} data-testid={`kpi-${kpi.title.toLowerCase().replace(' ', '-')}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {kpi.title}
              </CardTitle>
              <div className={`h-8 w-8 rounded-md flex items-center justify-center ${kpi.color}`}>
                <kpi.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                User Progress
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Top tourists and their mission progress.</p>
            </div>
            <Link href="/admin/super/users">
              <Button variant="outline" size="sm">View All</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {userProgress.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">No user activity yet.</p>
            ) : (
              <div className="space-y-4">
                {userProgress.slice(0, 5).map((user: any) => (
                  <div key={user.id} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.profile_image_url} />
                      <AvatarFallback>{(user.first_name || "U").charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium truncate">
                          {user.first_name || "Anonymous"} {user.last_name || ""}
                        </p>
                        <Badge variant="secondary" className="ml-2">
                          {user.points || 0} pts
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Target className="h-3 w-3" />
                          {Number(user.missions_started) || 0} started
                        </span>
                        <span className="flex items-center gap-1">
                          <Trophy className="h-3 w-3" />
                          {Number(user.missions_completed) || 0} completed
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Business Accounts</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Registered business partners.</p>
            </div>
            <Link href="/admin/super/businesses">
              <Button variant="outline" size="sm">View All</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {businesses.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">No business accounts registered yet.</p>
            ) : (
              <div className="space-y-3">
                {businesses.map((business: any) => (
                  <div key={business.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {business.business_name || `${business.first_name || ''} ${business.last_name || ''}`.trim() || "Unnamed Business"}
                        </p>
                        <p className="text-sm text-muted-foreground">{business.email}</p>
                      </div>
                    </div>
                    <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-0">
                      Active
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
