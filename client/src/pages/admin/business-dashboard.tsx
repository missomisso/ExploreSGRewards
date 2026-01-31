import { AdminLayout } from "@/components/layout/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Store, 
  MapPin, 
  ClipboardCheck, 
  Plus,
  Trophy,
  Loader2,
  Users,
  Target,
  Eye
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

export default function BusinessAdminDashboard() {
  const { user, session } = useSupabaseAuth();

  const { data: missions = [], isLoading: missionsLoading } = useQuery({
    queryKey: ["/api/missions"],
    queryFn: async () => {
      const res = await fetch("/api/missions");
      if (!res.ok) throw new Error("Failed to fetch missions");
      return res.json();
    },
  });

  const { data: submissions = [], isLoading: submissionsLoading } = useQuery({
    queryKey: ["/api/submissions", "pending"],
    queryFn: async () => {
      const res = await fetch("/api/submissions?status=pending");
      if (!res.ok) throw new Error("Failed to fetch submissions");
      return res.json();
    },
  });

  const { data: missionStats = [], isLoading: statsLoading } = useQuery({
    queryKey: ["/api/admin/mission-stats"],
    queryFn: async () => {
      const token = session?.access_token;
      if (!token) return [];
      const res = await fetch("/api/admin/mission-stats", {
        headers: { "Authorization": `Bearer ${token}` },
      });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!session?.access_token,
  });

  const pendingCount = submissions.filter((s: any) => s.status === "pending").length;
  const totalUsersStarted = missionStats.reduce((sum: number, m: any) => sum + (Number(m.users_started) || 0), 0);
  const totalUsersCompleted = missionStats.reduce((sum: number, m: any) => sum + (Number(m.users_completed) || 0), 0);
  
  const stats = [
    { title: "Total Missions", value: missions.length.toString(), icon: MapPin, color: "text-blue-600 bg-blue-100" },
    { title: "Users Participating", value: totalUsersStarted.toString(), icon: Users, color: "text-green-600 bg-green-100" },
    { title: "Missions Completed", value: totalUsersCompleted.toString(), icon: Trophy, color: "text-yellow-600 bg-yellow-100" },
    { title: "Pending Reviews", value: pendingCount.toString(), icon: ClipboardCheck, color: "text-orange-600 bg-orange-100" },
  ];

  const getTimeSince = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins} mins ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} hours ago`;
    return `${Math.floor(hours / 24)} days ago`;
  };

  if (missionsLoading || submissionsLoading || statsLoading) {
    return (
      <AdminLayout type="business">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--brand)]" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout type="business">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-heading font-bold">Business Dashboard</h1>
          <p className="text-muted-foreground">Manage your missions and track user engagement.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/business/verification">
            <Button variant="outline">
              <ClipboardCheck className="h-4 w-4 mr-2" />
              Review Submissions
              {pendingCount > 0 && (
                <Badge className="ml-2 bg-orange-500">{pendingCount}</Badge>
              )}
            </Button>
          </Link>
          <Link href="/admin/business/missions/create">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Mission
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`h-8 w-8 rounded-md flex items-center justify-center ${stat.color}`}>
                <stat.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mb-8">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Mission Performance
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">User engagement and completion rates for your missions.</p>
          </div>
          <Link href="/admin/business/missions">
            <Button variant="outline" size="sm">View All Missions</Button>
          </Link>
        </CardHeader>
        <CardContent>
          {missionStats.length === 0 ? (
            <div className="text-center py-12">
              <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No missions yet</h3>
              <p className="text-muted-foreground mb-4">Create your first mission to start engaging tourists.</p>
              <Link href="/admin/business/missions/create">
                <Button>Create Mission</Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mission</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Users Started</TableHead>
                  <TableHead>Users Completed</TableHead>
                  <TableHead>Completion Rate</TableHead>
                  <TableHead>Pending Reviews</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {missionStats.map((mission: any) => {
                  const started = Number(mission.users_started) || 0;
                  const completed = Number(mission.users_completed) || 0;
                  const completionRate = started > 0 ? Math.round((completed / started) * 100) : 0;
                  const pending = Number(mission.pending_submissions) || 0;
                  
                  return (
                    <TableRow key={mission.id} data-testid={`mission-row-${mission.id}`}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{mission.title}</p>
                          <p className="text-sm text-muted-foreground">{mission.total_points} pts</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={mission.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}>
                          {mission.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          {started}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Trophy className="h-4 w-4 text-yellow-500" />
                          {completed}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={completionRate} className="w-16 h-2" />
                          <span className="text-sm text-muted-foreground">{completionRate}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {pending > 0 ? (
                          <Badge className="bg-orange-100 text-orange-700">{pending} pending</Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/admin/business/missions/${mission.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {pendingCount > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-orange-500" />
              Recent Submissions
            </CardTitle>
            <p className="text-sm text-muted-foreground">Latest photo and receipt submissions awaiting review.</p>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Mission</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.slice(0, 5).map((sub: any) => {
                  const mission = missions.find((m: any) => m.id === sub.missionId);
                  return (
                    <TableRow key={sub.id}>
                      <TableCell className="font-medium">User {sub.userId?.slice(0, 8)}...</TableCell>
                      <TableCell>{mission?.title || `Mission #${sub.missionId}`}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{sub.type}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {getTimeSince(sub.submittedAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href="/admin/business/verification">
                          <Button variant="ghost" size="sm">Review</Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </AdminLayout>
  );
}
