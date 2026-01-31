import { Link } from "wouter";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Eye,
  Loader2,
  MapPin
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export default function MissionsList() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const { data: missions = [], isLoading } = useQuery({
    queryKey: ["/api/missions", "all"],
    queryFn: async () => {
      const res = await fetch("/api/missions?all=true");
      if (!res.ok) throw new Error("Failed to fetch missions");
      return res.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/missions/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete mission");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/missions"] });
      toast({ title: "Mission deleted successfully" });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Failed to delete mission" });
    },
  });

  const filteredMissions = missions.filter((m: any) =>
    m.title?.toLowerCase().includes(search.toLowerCase()) ||
    m.location?.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-700">Active</Badge>;
      case "draft":
        return <Badge variant="secondary">Draft</Badge>;
      case "ended":
        return <Badge variant="outline">Ended</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (isLoading) {
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
          <h1 className="text-3xl font-heading font-bold">Missions</h1>
          <p className="text-muted-foreground">Manage all your missions in one place.</p>
        </div>
        <Link href="/admin/business/missions/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" /> Create Mission
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader className="border-b">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search missions..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredMissions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-bold">No missions found</h3>
              <p className="text-muted-foreground mb-4">Create your first mission to get started.</p>
              <Link href="/admin/business/missions/new">
                <Button>Create Mission</Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mission</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Points</TableHead>
                  <TableHead>Tasks</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[70px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMissions.map((mission: any) => (
                  <TableRow key={mission.id}>
                    <TableCell>
                      <div className="font-medium">{mission.title}</div>
                      <div className="text-sm text-muted-foreground line-clamp-1">
                        {mission.description}
                      </div>
                    </TableCell>
                    <TableCell>{mission.location || "—"}</TableCell>
                    <TableCell className="font-bold text-primary">
                      {mission.totalPoints} pts
                    </TableCell>
                    <TableCell>
                      {mission.tasks?.length || 0} tasks
                    </TableCell>
                    <TableCell>{getStatusBadge(mission.status)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <Link href={`/mission/${mission.id}`}>
                            <DropdownMenuItem>
                              <Eye className="h-4 w-4 mr-2" /> View
                            </DropdownMenuItem>
                          </Link>
                          <Link href={`/admin/business/missions/${mission.id}/edit`}>
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" /> Edit
                            </DropdownMenuItem>
                          </Link>
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => deleteMutation.mutate(mission.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
