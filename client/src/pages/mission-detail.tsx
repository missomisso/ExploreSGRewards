import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Upload, MapPin, QrCode, CheckCircle2, Circle, HelpCircle, FileText, ArrowLeft, Loader2, Clock, XCircle, Play, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Link, useLocation, useParams } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";

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

interface Mission {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  totalPoints: number;
  tasks: Task[];
}

interface UserMission {
  id: number;
  userId: string;
  missionId: number;
  status: string;
  completedTasks: string[];
}

export default function MissionDetail() {
  const params = useParams<{ id: string }>();
  const missionId = parseInt(params.id || "0");
  const { user, isLoading: authLoading, refreshUser } = useAuth();
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const { data: mission, isLoading: missionLoading } = useQuery<Mission>({
    queryKey: ["/api/missions", missionId],
    queryFn: async () => {
      const res = await fetch(`/api/missions/${missionId}`);
      if (!res.ok) throw new Error("Failed to fetch mission");
      return res.json();
    },
    enabled: missionId > 0,
  });

  const { data: userMission, isLoading: progressLoading } = useQuery<UserMission | null>({
    queryKey: ["/api/user-mission", user?.id, missionId],
    queryFn: async () => {
      if (!user?.id) return null;
      const res = await fetch(`/api/user-missions/${user.id}`);
      if (!res.ok) return null;
      const missions = await res.json();
      return missions.find((m: UserMission) => m.missionId === missionId) || null;
    },
    enabled: !!user?.id && missionId > 0,
  });

  const { data: userSubmissions = [] } = useQuery<any[]>({
    queryKey: ["/api/user-submissions", user?.id, missionId],
    queryFn: async () => {
      if (!user?.id) return [];
      const res = await fetch(`/api/user-submissions/${user.id}/${missionId}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!user?.id && missionId > 0,
  });

  const startMissionMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/user-missions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user?.id, missionId }),
      });
      if (!res.ok) throw new Error("Failed to start mission");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user-mission"] });
      toast({
        title: "Mission Started!",
        description: "Good luck completing all the tasks!",
        className: "bg-green-600 text-white border-0",
      });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const uploadFileToSupabase = async (file: File, taskId: string): Promise<string> => {
    const ext = file.name.split(".").pop() || "jpg";
    const fileName = `${user?.id}/${missionId}/${taskId}_${Date.now()}.${ext}`;

    const { data, error } = await supabase.storage
      .from("mission-images")
      .upload(fileName, file, { contentType: file.type, upsert: true });

    if (error) throw new Error("Failed to upload file: " + error.message);

    const { data: urlData } = supabase.storage
      .from("mission-images")
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  };

  const completeMutation = useMutation({
    mutationFn: async (data: { taskId: string; taskType: string; answer?: number; proofUrl?: string }) => {
      const res = await fetch("/api/tasks/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id,
          missionId,
          taskId: data.taskId,
          taskType: data.taskType,
          answer: data.answer,
          proofUrl: data.proofUrl,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to complete task");
      return result;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["/api/user-mission"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user-submissions"] });

      if (result.autoValidated) {
        toast({
          title: "Task Completed!",
          description: `You've earned ${result.pointsAwarded} points!`,
          className: "bg-green-600 text-white border-0",
        });
        refreshUser();
      } else if (result.pendingReview) {
        toast({
          title: "Submission Received",
          description: "Your submission is pending review by the business.",
          className: "bg-blue-600 text-white border-0",
        });
      }

      setActiveTaskId(null);
      setSelectedAnswer(null);
      setSelectedFile(null);
      setFilePreview(null);

      const completedCount = (userMission?.completedTasks?.length || 0) + (result.autoValidated ? 1 : 0);
      if (mission && completedCount >= mission.tasks.length) {
        setTimeout(() => setIsComplete(true), 500);
      }
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const completedTasks = userMission?.completedTasks || [];
  const tasks = mission?.tasks || [];
  const completedCount = completedTasks.length;
  const progress = tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0;
  const hasStarted = !!userMission;
  const isMissionCompleted = userMission?.status === "completed";

  const getTaskSubmission = (taskId: string) => {
    return userSubmissions.find((s: any) => s.taskId === taskId);
  };

  const getTaskStatus = (taskId: string): "completed" | "pending" | "rejected" | "not_started" => {
    if (completedTasks.includes(taskId)) return "completed";
    const submission = getTaskSubmission(taskId);
    if (submission?.status === "pending") return "pending";
    if (submission?.status === "rejected") return "rejected";
    return "not_started";
  };

  const pendingCount = tasks.filter(t => getTaskStatus(t.id) === "pending").length;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Please select an image under 5MB.", variant: "destructive" });
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please select an image file.", variant: "destructive" });
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setFilePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleTaskComplete = async (task: Task) => {
    if (task.type === "quiz" && selectedAnswer === null) {
      toast({ title: "Select an answer", description: "Please select an answer before submitting.", variant: "destructive" });
      return;
    }

    if ((task.type === "photo" || task.type === "receipt") && !selectedFile) {
      toast({ title: "No file selected", description: `Please select a ${task.type === "photo" ? "photo" : "receipt"} to upload.`, variant: "destructive" });
      return;
    }

    let proofUrl: string | undefined;

    if ((task.type === "photo" || task.type === "receipt") && selectedFile) {
      try {
        setIsUploading(true);
        proofUrl = await uploadFileToSupabase(selectedFile, task.id);
      } catch (err: any) {
        toast({ title: "Upload failed", description: err.message, variant: "destructive" });
        setIsUploading(false);
        return;
      } finally {
        setIsUploading(false);
      }
    }

    completeMutation.mutate({
      taskId: task.id,
      taskType: task.type,
      answer: task.type === "quiz" ? selectedAnswer! : undefined,
      proofUrl,
    });
  };

  const renderTaskContent = (task: Task) => {
    switch (task.type) {
      case "gps":
        return (
          <div className="space-y-4">
            <div className="h-48 w-full rounded-lg bg-gray-100 relative overflow-hidden border">
              <div className="absolute inset-0 bg-[url('https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Singapore_Road_Map.png/640px-Singapore_Road_Map.png')] bg-cover bg-center opacity-50 grayscale"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="relative flex h-8 w-8">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-8 w-8 bg-primary items-center justify-center">
                    <MapPin className="h-4 w-4 text-white" />
                  </span>
                </span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground text-center">You are near the target location.</p>
            <Button className="w-full" onClick={() => handleTaskComplete(task)} disabled={completeMutation.isPending} data-testid={`button-verify-gps-${task.id}`}>
              {completeMutation.isPending ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <MapPin className="mr-2 h-4 w-4" />}
              Verify Location
            </Button>
          </div>
        );
      case "photo":
      case "receipt":
        return (
          <div className="space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture={task.type === "photo" ? "environment" : undefined}
              className="hidden"
              onChange={handleFileSelect}
              data-testid={`input-file-${task.id}`}
            />
            {filePreview ? (
              <div className="relative rounded-xl overflow-hidden border">
                <img src={filePreview} alt="Preview" className="w-full h-48 object-cover" />
                <button
                  onClick={() => { setSelectedFile(null); setFilePreview(null); }}
                  className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 hover:bg-black/80"
                  data-testid={`button-remove-file-${task.id}`}
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <div
                className="border-2 border-dashed border-gray-300 rounded-xl h-48 flex flex-col items-center justify-center bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => fileInputRef.current?.click()}
                data-testid={`dropzone-${task.id}`}
              >
                {task.type === 'photo' ? <Camera className="h-10 w-10 text-muted-foreground mb-2" /> : <FileText className="h-10 w-10 text-muted-foreground mb-2" />}
                <span className="text-sm text-muted-foreground font-medium">Tap to {task.type === 'photo' ? 'Take Photo' : 'Upload Receipt'}</span>
                <span className="text-xs text-muted-foreground mt-1">Max 5MB, image files only</span>
              </div>
            )}
            <p className="text-xs text-muted-foreground text-center">
              This submission will be reviewed by the business before points are awarded.
            </p>
            <Button
              className="w-full"
              onClick={() => handleTaskComplete(task)}
              disabled={completeMutation.isPending || isUploading || !selectedFile}
              data-testid={`button-submit-${task.id}`}
            >
              {(completeMutation.isPending || isUploading) ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Upload className="mr-2 h-4 w-4" />}
              {isUploading ? "Uploading..." : "Submit for Review"}
            </Button>
          </div>
        );
      case "quiz":
        return (
          <div className="space-y-6">
            <p className="font-medium text-lg">{task.question}</p>
            <RadioGroup value={selectedAnswer?.toString()} onValueChange={(v) => setSelectedAnswer(parseInt(v))}>
              {task.options?.map((option, idx) => (
                <div key={idx} className="flex items-center space-x-2 border p-3 rounded-lg hover:bg-gray-50">
                  <RadioGroupItem value={idx.toString()} id={`option-${idx}`} />
                  <Label htmlFor={`option-${idx}`} className="flex-grow cursor-pointer">{option}</Label>
                </div>
              ))}
            </RadioGroup>
            <Button className="w-full" onClick={() => handleTaskComplete(task)} disabled={completeMutation.isPending || selectedAnswer === null} data-testid={`button-submit-quiz-${task.id}`}>
              {completeMutation.isPending ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : "Submit Answer"}
            </Button>
          </div>
        );
      case "qrcode":
        return (
          <div className="space-y-4 text-center">
            <div className="bg-black rounded-xl h-64 w-full flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 opacity-30 bg-[url('https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&q=80')] bg-cover bg-center"></div>
              <div className="border-2 border-white w-48 h-48 rounded-lg relative z-10">
                <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-primary -mt-1 -ml-1"></div>
                <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-primary -mt-1 -mr-1"></div>
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-primary -mb-1 -ml-1"></div>
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-primary -mb-1 -mr-1"></div>
              </div>
              <p className="absolute bottom-4 text-white text-xs bg-black/50 px-3 py-1 rounded-full">Align QR code within frame</p>
            </div>
            <Button className="w-full" onClick={() => handleTaskComplete(task)} disabled={completeMutation.isPending} data-testid={`button-scan-qr-${task.id}`}>
              {completeMutation.isPending ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <QrCode className="mr-2 h-4 w-4" />}
              Scan QR Code
            </Button>
          </div>
        );
      default:
        return null;
    }
  };

  const getIconForType = (type: TaskType) => {
    switch (type) {
      case "gps": return MapPin;
      case "photo": return Camera;
      case "receipt": return FileText;
      case "quiz": return HelpCircle;
      case "qrcode": return QrCode;
      default: return Circle;
    }
  };

  if (missionLoading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!mission) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <p className="text-lg text-muted-foreground mb-4">Mission not found</p>
        <Link href="/explore">
          <Button>Back to Explore</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-sans pb-20">
      <div className="relative h-64 w-full">
        <div className="absolute inset-0">
          <img
            src={mission.imageUrl || "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=800"}
            alt={mission.title}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-background" />
        </div>
        <Link href="/explore">
          <Button variant="ghost" size="icon" className="absolute top-4 left-4 text-white hover:bg-white/20" data-testid="button-back">
            <ArrowLeft className="h-6 w-6" />
          </Button>
        </Link>
        {isMissionCompleted && (
          <div className="absolute top-4 right-4">
            <Badge className="bg-green-600 text-white text-sm px-3 py-1 shadow-lg" data-testid="badge-mission-completed">
              <CheckCircle2 className="h-4 w-4 mr-1" /> Completed
            </Badge>
          </div>
        )}
        <div className="absolute bottom-0 left-0 p-6 w-full">
          <h1 className="text-3xl font-heading font-bold text-foreground">{mission.title}</h1>
          <p className="text-muted-foreground text-sm mt-1 max-w-xl">{mission.description}</p>
        </div>
      </div>

      <div className="container mx-auto px-4 mt-6">
        {!user ? (
          <div className="text-center py-12 bg-card rounded-xl border shadow-sm">
            <Play className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-heading font-bold mb-2">Sign in to Start</h3>
            <p className="text-muted-foreground mb-6">Create an account or sign in to begin this mission and earn points.</p>
            <Link href="/auth/login">
              <Button className="bg-[var(--brand)] hover:bg-[var(--brand-hover)] text-white" data-testid="button-login-to-start">
                Sign In to Start
              </Button>
            </Link>
          </div>
        ) : !hasStarted && !isMissionCompleted ? (
          <div className="text-center py-12 bg-card rounded-xl border shadow-sm mb-8">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 mb-4">
              <Play className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-xl font-heading font-bold mb-2">Ready for an Adventure?</h3>
            <p className="text-muted-foreground mb-2 max-w-md mx-auto">{mission.description}</p>
            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground mb-6">
              <span className="flex items-center gap-1"><CheckCircle2 className="h-4 w-4" /> {tasks.length} tasks</span>
              <span className="flex items-center gap-1 text-primary font-bold">{mission.totalPoints} points</span>
            </div>
            <Button
              size="lg"
              className="bg-[var(--brand)] hover:bg-[var(--brand-hover)] text-white px-8"
              onClick={() => startMissionMutation.mutate()}
              disabled={startMissionMutation.isPending}
              data-testid="button-start-mission"
            >
              {startMissionMutation.isPending ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Play className="mr-2 h-5 w-5" />}
              Start Mission
            </Button>
          </div>
        ) : (
          <>
            {isMissionCompleted && (
              <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3" data-testid="banner-mission-completed">
                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="font-bold text-green-800">Mission Complete!</p>
                  <p className="text-sm text-green-600">You earned {mission.totalPoints} points from this mission.</p>
                </div>
              </div>
            )}

            <div className="mb-8 bg-card p-4 rounded-xl border shadow-sm">
              <div className="flex justify-between text-sm mb-2 font-medium">
                <span>Mission Progress</span>
                <span className="text-primary">{completedCount}/{tasks.length} tasks{pendingCount > 0 ? ` (${pendingCount} pending review)` : ""}</span>
              </div>
              <Progress value={progress} className="h-2" />
              {pendingCount > 0 && (
                <p className="text-xs text-muted-foreground mt-2">{pendingCount} submission{pendingCount !== 1 ? "s" : ""} under review</p>
              )}
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-heading font-bold mb-4">Your Tasks</h2>

              {tasks.map((task, index) => {
                const Icon = getIconForType(task.type);
                const isActive = activeTaskId === task.id;
                const status = getTaskStatus(task.id);
                const submission = getTaskSubmission(task.id);

                return (
                  <motion.div
                    key={task.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card
                      data-testid={`task-card-${task.id}`}
                      className={`border-l-4 transition-all cursor-pointer overflow-hidden ${
                        status === "completed"
                          ? 'border-l-green-500 bg-green-50/50 dark:bg-green-900/10'
                          : status === "pending"
                          ? 'border-l-yellow-500 bg-yellow-50/50 dark:bg-yellow-900/10'
                          : status === "rejected"
                          ? 'border-l-red-500 bg-red-50/50 dark:bg-red-900/10'
                          : isActive
                          ? 'border-l-primary ring-2 ring-primary/20'
                          : 'border-l-gray-300 hover:border-l-primary/50'
                      }`}
                      onClick={() => (status === "not_started" || status === "rejected") && setActiveTaskId(isActive ? null : task.id)}
                    >
                      <CardHeader className="flex flex-row items-center space-y-0 p-4 gap-4">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${
                          status === "completed"
                            ? 'bg-green-100 text-green-600'
                            : status === "pending"
                            ? 'bg-yellow-100 text-yellow-600'
                            : status === "rejected"
                            ? 'bg-red-100 text-red-600'
                            : 'bg-primary/10 text-primary'
                        }`}>
                          {status === "completed" ? <CheckCircle2 className="h-6 w-6" /> : status === "pending" ? <Clock className="h-5 w-5" /> : status === "rejected" ? <XCircle className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                        </div>
                        <div className="flex-grow">
                          <CardTitle className="text-base font-bold">{task.title}</CardTitle>
                          <CardDescription className="line-clamp-1 text-xs" data-testid={`task-status-${task.id}`}>
                            {status === "completed"
                              ? "Completed - Points awarded"
                              : status === "pending"
                              ? "Pending review by business"
                              : status === "rejected"
                              ? (submission?.reviewNote || "Submission rejected - try again")
                              : task.description}
                          </CardDescription>
                        </div>
                        <div className="font-bold text-sm text-muted-foreground shrink-0">
                          {task.points} pts
                        </div>
                      </CardHeader>

                      <AnimatePresence>
                        {isActive && (status === "not_started" || status === "rejected") && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                          >
                            <CardContent className="pt-0 pb-6 px-4 border-t bg-gray-50/50 dark:bg-gray-900/50 mt-2 pt-4">
                              {renderTaskContent(task)}
                            </CardContent>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </>
        )}
      </div>

      <Dialog open={isComplete} onOpenChange={setIsComplete}>
        <DialogContent className="sm:max-w-md text-center">
          <DialogHeader>
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-yellow-100 mb-4">
              <span className="text-4xl">🏆</span>
            </div>
            <DialogTitle className="text-2xl font-heading font-bold text-center">Mission Complete!</DialogTitle>
            <DialogDescription className="text-center text-base">
              You've conquered the {mission.title} mission.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-gray-50 p-4 rounded-lg text-center my-2 dark:bg-gray-800">
            <p className="text-sm text-muted-foreground">Total Earned</p>
            <p className="text-3xl font-bold text-primary mt-1">{mission.totalPoints} Points</p>
          </div>
          <DialogFooter className="sm:justify-center">
            <Button className="w-full sm:w-auto" onClick={() => setLocation('/rewards')}>
              Redeem Rewards
            </Button>
            <Button variant="outline" className="w-full sm:w-auto" onClick={() => setLocation('/explore')}>
              Find Next Mission
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
