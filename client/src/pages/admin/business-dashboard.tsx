import { AdminLayout } from "@/components/layout/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Store, 
  MapPin, 
  QrCode, 
  ClipboardCheck, 
  Plus,
  Clock,
  Trophy,
  Loader2
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
  const { user } = useSupabaseAuth();

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

  const pendingCount = submissions.filter((s: any) => s.status === "pending").length;
  
  const stats = [
    { title: "Total Missions", value: missions.length.toString(), icon: MapPin, color: "text-blue-600 bg-blue-100" },
    { title: "Active Missions", value: missions.filter((m: any) => m.status === "active").length.toString(), icon: Store, color: "text-purple-600 bg-purple-100" },
    { title: "Total Points Available", value: missions.reduce((sum: number, m: any) => sum + (m.totalPoints || 0), 0).toString(), icon: Trophy, color: "text-yellow-600 bg-yellow-100" },
    { title: "Pending Reviews", value: pendingCount.toString(), icon: ClipboardCheck, color: "text-orange-600 bg-orange-100" },
  ];

  const activeMissions = missions.filter((m: any) => m.status === "active").slice(0, 5);

  const getTimeSince = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins} mins ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} hours ago`;
    return `${Math.floor(hours / 24)} days ago`;
  };

  if (missionsLoading || submissionsLoading) {
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
          <p className="text-muted-foreground">Manage your locations, missions, and customer rewards.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <QrCode className="h-4 w-4" /> Print QR Codes
          </Button>
          <Link href="/admin/business/missions/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Create Mission
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="flex items-center p-6">
              <div className={`h-12 w-12 rounded-full flex items-center justify-center mr-4 ${stat.color}`}>
                <stat.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                <h3 className="text-2xl font-bold">{stat.value}</h3>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Active Missions</CardTitle>
            <Button variant="ghost" size="sm">View All</Button>
          </CardHeader>
          <CardContent>
            {activeMissions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No active missions yet.</p>
                <Link href="/admin/business/missions/new">
                  <Button className="mt-4">Create Your First Mission</Button>
                </Link>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mission Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Points</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeMissions.map((mission: any) => (
                    <TableRow key={mission.id}>
                      <TableCell className="font-medium">{mission.title}</TableCell>
                      <TableCell>{mission.category || "General"}</TableCell>
                      <TableCell>{mission.totalPoints}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                          Active
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/mission/${mission.id}`}>
                          <Button variant="ghost" size="sm">View</Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Pending Reviews
              <Badge variant="secondary">{pendingCount}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {submissions.length === 0 ? (
              <p className="text-center py-4 text-muted-foreground">No pending submissions</p>
            ) : (
              <div className="space-y-4">
                {submissions.slice(0, 5).map((sub: any) => (
                  <div key={sub.id} className="flex items-start justify-between border-b pb-4 last:border-0 last:pb-0">
                    <div>
                      <p className="font-medium text-sm">User #{sub.userId?.slice(0, 8)}</p>
                      <p className="text-xs text-muted-foreground">Task: {sub.taskId}</p>
                      <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" /> {getTimeSince(sub.createdAt)}
                      </div>
                    </div>
                    <Link href="/admin/business/verification">
                      <Button size="sm" variant="outline">Review</Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
            <Button className="w-full mt-6" variant="secondary" asChild>
              <Link href="/admin/business/verification">View All Pending</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
