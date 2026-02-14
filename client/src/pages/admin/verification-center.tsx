import { useState } from "react";
import { Link } from "wouter";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  Camera,
  ArrowLeft,
  Filter,
  ZoomIn,
  Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export default function VerificationCenter() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const { data: submissions = [], isLoading } = useQuery({
    queryKey: ["/api/submissions", "pending"],
    queryFn: async () => {
      const res = await fetch("/api/submissions?status=pending");
      if (!res.ok) throw new Error("Failed to fetch submissions");
      return res.json();
    },
  });

  const { data: users = {} } = useQuery({
    queryKey: ["supabase-users-for-verification", submissions],
    queryFn: async () => {
      const userIds = Array.from(new Set(submissions.map((s: any) => s.userId))) as string[];
      if (userIds.length === 0) return {};
      const { data } = await supabase
        .from("users")
        .select("id, first_name, last_name, profile_image_url")
        .in("id", userIds);
      const map: Record<string, any> = {};
      (data || []).forEach((u: any) => { map[u.id] = u; });
      return map;
    },
    enabled: submissions.length > 0,
  });

  const { data: missions = {} } = useQuery({
    queryKey: ["missions-for-verification", submissions],
    queryFn: async () => {
      const missionIds = Array.from(new Set(submissions.map((s: any) => s.missionId))) as number[];
      if (missionIds.length === 0) return {};
      const { data } = await supabase
        .from("missions")
        .select("id, title, tasks")
        .in("id", missionIds);
      const map: Record<number, any> = {};
      (data || []).forEach((m: any) => { map[m.id] = m; });
      return map;
    },
    enabled: submissions.length > 0,
  });

  const getUserDisplay = (userId: string) => {
    const u = users[userId];
    if (u?.first_name) return `${u.first_name}${u.last_name ? " " + u.last_name : ""}`;
    return `User #${userId.slice(0, 8)}`;
  };

  const getUserInitials = (userId: string) => {
    const u = users[userId];
    if (u?.first_name) return `${u.first_name[0]}${u.last_name?.[0] || ""}`.toUpperCase();
    return userId.slice(0, 2).toUpperCase();
  };

  const getUserAvatar = (userId: string) => {
    return users[userId]?.profile_image_url || null;
  };

  const getMissionTitle = (missionId: number) => {
    return missions[missionId]?.title || `Mission #${missionId}`;
  };

  const getTaskTitle = (missionId: number, taskId: string) => {
    const m = missions[missionId];
    if (!m?.tasks) return taskId;
    const task = (m.tasks as any[]).find((t: any) => t.id === taskId);
    return task?.title || taskId;
  };

  const approveMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/submissions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "approved" }),
      });
      if (!res.ok) throw new Error("Failed to approve");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/submissions"] });
      setSelectedSubmission(null);
      toast({
        title: "Submission Approved",
        description: "Points have been awarded and the user has been notified.",
        className: "bg-green-600 text-white border-0",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/submissions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "rejected", reviewNote: rejectionReason }),
      });
      if (!res.ok) throw new Error("Failed to reject");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/submissions"] });
      setSelectedSubmission(null);
      setRejectionReason("");
      toast({
        title: "Submission Rejected",
        description: "User has been notified to try again.",
        variant: "destructive",
      });
    },
  });

  const handleApprove = (id: number) => {
    approveMutation.mutate(id);
  };

  const handleReject = () => {
    if (selectedSubmission) {
      rejectMutation.mutate(selectedSubmission.id);
    }
  };

  const getTimeSince = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins} mins ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} hours ago`;
    return `${Math.floor(hours / 24)} days ago`;
  };

  const pendingCount = submissions.length;

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
          <Link href="/admin/business">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-heading font-bold">Verification Center</h1>
            <p className="text-muted-foreground">Review pending proofs from your visitors.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-sm px-3 py-1 h-9">
            {pendingCount} Pending
          </Badge>
        </div>
      </div>

      {submissions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed rounded-xl bg-gray-50">
          <div className="h-16 w-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h3 className="text-xl font-bold">All Caught Up!</h3>
          <p className="text-muted-foreground max-w-sm mt-2">
            There are no pending submissions to review. Great job clearing the queue.
          </p>
          <Link href="/admin/business">
            <Button className="mt-6">Return to Dashboard</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {submissions.map((sub: any) => (
            <Card key={sub.id} className="overflow-hidden hover:shadow-md transition-shadow" data-testid={`submission-card-${sub.id}`}>
              <div className="relative h-48 bg-gray-100 group cursor-pointer" onClick={() => setSelectedSubmission(sub)}>
                {sub.proofUrl && sub.proofUrl !== "uploaded://simulated" ? (
                  <img
                    src={sub.proofUrl}
                    alt="Proof"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <Camera className="h-12 w-12" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 bg-white/90 text-black px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-sm">
                    <ZoomIn className="h-3 w-3" /> View Details
                  </div>
                </div>
                <div className="absolute top-2 right-2">
                  <Badge className={sub.type === 'photo' ? 'bg-blue-500' : 'bg-purple-500'}>
                    {sub.type === 'photo' ? <Camera className="h-3 w-3 mr-1" /> : <FileText className="h-3 w-3 mr-1" />}
                    {sub.type || 'Task'}
                  </Badge>
                </div>
              </div>

              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={getUserAvatar(sub.userId) || undefined} />
                    <AvatarFallback>{getUserInitials(sub.userId)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-bold leading-none" data-testid={`submission-user-${sub.id}`}>{getUserDisplay(sub.userId)}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Clock className="h-3 w-3" /> {getTimeSince(sub.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Mission</p>
                  <p className="text-sm font-medium line-clamp-1" data-testid={`submission-mission-${sub.id}`}>{getMissionTitle(sub.missionId)}</p>
                </div>
                <div className="space-y-1 mt-2">
                  <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Task</p>
                  <p className="text-sm line-clamp-1" data-testid={`submission-task-${sub.id}`}>{getTaskTitle(sub.missionId, sub.taskId)}</p>
                </div>
              </CardContent>

              <CardFooter className="p-3 bg-gray-50 border-t grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 border-red-100"
                  onClick={() => setSelectedSubmission(sub)}
                  data-testid={`button-reject-${sub.id}`}
                >
                  <XCircle className="h-4 w-4 mr-1" /> Reject
                </Button>
                <Button
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => handleApprove(sub.id)}
                  disabled={approveMutation.isPending}
                  data-testid={`button-approve-${sub.id}`}
                >
                  {approveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <CheckCircle2 className="h-4 w-4 mr-1" />}
                  Approve
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!selectedSubmission} onOpenChange={(open) => !open && setSelectedSubmission(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Review Submission</DialogTitle>
            <DialogDescription>
              {selectedSubmission && (
                <>
                  <span className="font-medium">{getMissionTitle(selectedSubmission.missionId)}</span>
                  {" — "}
                  {getTaskTitle(selectedSubmission.missionId, selectedSubmission.taskId)}
                  {" by "}
                  <span className="font-medium">{getUserDisplay(selectedSubmission.userId)}</span>
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {selectedSubmission?.proofUrl && selectedSubmission.proofUrl !== "uploaded://simulated" ? (
              <div className="bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={selectedSubmission.proofUrl}
                  alt="Proof"
                  className="w-full max-h-80 object-contain"
                />
              </div>
            ) : (
              <div className="bg-gray-100 rounded-lg p-8 text-center">
                <Camera className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No image attached to this submission</p>
              </div>
            )}

            <Tabs defaultValue="approve" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="approve" className="data-[state=active]:bg-green-100 data-[state=active]:text-green-700">Approve</TabsTrigger>
                <TabsTrigger value="reject" className="data-[state=active]:bg-red-100 data-[state=active]:text-red-700">Reject</TabsTrigger>
              </TabsList>

              <TabsContent value="approve" className="mt-4 space-y-4">
                <div className="p-4 border rounded-md bg-green-50/50 text-green-800 text-sm">
                  <p>User will receive points immediately and a notification.</p>
                  <p>This action cannot be undone.</p>
                </div>
                <Button
                  className="w-full bg-green-600 hover:bg-green-700"
                  onClick={() => selectedSubmission && handleApprove(selectedSubmission.id)}
                  disabled={approveMutation.isPending}
                  data-testid="button-confirm-approve"
                >
                  {approveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Confirm Approval
                </Button>
              </TabsContent>

              <TabsContent value="reject" className="mt-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reason">Rejection Reason</Label>
                  <Textarea
                    id="reason"
                    placeholder="Explain why this was rejected..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    data-testid="input-rejection-reason"
                  />
                  <div className="flex gap-2 mt-2">
                    <Badge variant="outline" className="cursor-pointer hover:bg-gray-100" onClick={() => setRejectionReason("Image is blurry")}>Blurry</Badge>
                    <Badge variant="outline" className="cursor-pointer hover:bg-gray-100" onClick={() => setRejectionReason("Wrong item")}>Wrong Item</Badge>
                    <Badge variant="outline" className="cursor-pointer hover:bg-gray-100" onClick={() => setRejectionReason("Date invalid")}>Date Invalid</Badge>
                  </div>
                </div>
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={handleReject}
                  disabled={!rejectionReason || rejectMutation.isPending}
                  data-testid="button-confirm-reject"
                >
                  {rejectMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Reject Submission
                </Button>
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
