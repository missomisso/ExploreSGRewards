import { useState, useEffect } from "react";
import { Link, useParams, useLocation } from "wouter";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Save, 
  Loader2,
  Camera,
  FileText,
  MapPin,
  HelpCircle,
  QrCode,
  Trash2,
  Plus
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

type TaskType = "gps" | "photo" | "receipt" | "quiz" | "qrcode";

interface Task {
  id: string;
  type: TaskType;
  title: string;
  description: string;
  points: number;
  question?: string;
  options?: string[];
  correctAnswer?: number;
}

export default function EditMission() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [missionData, setMissionData] = useState({
    title: "",
    description: "",
    location: "",
    status: "active",
  });
  const [tasks, setTasks] = useState<Task[]>([]);

  const { data: mission, isLoading } = useQuery({
    queryKey: ["/api/missions", id],
    queryFn: async () => {
      const res = await fetch(`/api/missions/${id}`);
      if (!res.ok) throw new Error("Failed to fetch mission");
      return res.json();
    },
    enabled: !!id,
  });

  useEffect(() => {
    if (mission) {
      setMissionData({
        title: mission.title || "",
        description: mission.description || "",
        location: mission.location || "",
        status: mission.status || "active",
      });
      setTasks(mission.tasks || []);
    }
  }, [mission]);

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`/api/missions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update mission");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/missions"] });
      toast({
        title: "Mission Updated",
        description: "Your changes have been saved.",
        className: "bg-green-600 text-white border-0",
      });
      setLocation("/admin/business/missions");
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update mission.",
      });
    },
  });

  const handleSave = () => {
    const totalPoints = tasks.reduce((sum, t) => sum + (t.points || 0), 0);
    updateMutation.mutate({
      ...missionData,
      tasks,
      totalPoints,
    });
  };

  const getTaskIcon = (type: TaskType) => {
    switch (type) {
      case "gps": return MapPin;
      case "photo": return Camera;
      case "receipt": return FileText;
      case "quiz": return HelpCircle;
      case "qrcode": return QrCode;
      default: return MapPin;
    }
  };

  const removeTask = (index: number) => {
    setTasks(tasks.filter((_, i) => i !== index));
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
        <div className="flex items-center gap-4">
          <Link href="/admin/business/missions">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-heading font-bold">Edit Mission</h1>
            <p className="text-muted-foreground">Update mission details and tasks.</p>
          </div>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={updateMutation.isPending}
          className="gap-2"
        >
          {updateMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save Changes
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Mission Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={missionData.title}
                  onChange={(e) => setMissionData({ ...missionData, title: e.target.value })}
                  placeholder="Enter mission title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={missionData.description}
                  onChange={(e) => setMissionData({ ...missionData, description: e.target.value })}
                  placeholder="Describe your mission..."
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={missionData.location}
                  onChange={(e) => setMissionData({ ...missionData, location: e.target.value })}
                  placeholder="e.g., Marina Bay Sands"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Tasks ({tasks.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {tasks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No tasks added yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {tasks.map((task, idx) => {
                    const Icon = getTaskIcon(task.type);
                    return (
                      <div key={task.id || idx} className="flex items-center gap-3 p-4 border rounded-lg">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{task.title}</p>
                          <p className="text-sm text-muted-foreground">{task.description}</p>
                        </div>
                        <Badge variant="secondary">{task.points} pts</Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-500 hover:text-red-600"
                          onClick={() => removeTask(idx)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Points</span>
                <span className="font-bold text-primary">
                  {tasks.reduce((sum, t) => sum + (t.points || 0), 0)} pts
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tasks</span>
                <span className="font-bold">{tasks.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge className={missionData.status === "active" ? "bg-green-100 text-green-700" : ""}>
                  {missionData.status}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
