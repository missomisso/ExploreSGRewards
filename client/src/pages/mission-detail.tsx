/**
 * MissionDetail Component
 * 
 * A comprehensive mission detail page that displays interactive tasks for users to complete.
 * Supports multiple task types including GPS verification, photo uploads, quizzes, QR code scanning,
 * and receipt uploads. Tracks progress and rewards users with points upon completion.
 * 
 * @component
 * @example
 * return (
 *   <MissionDetail />
 * )
 * 
 * @returns {React.ReactElement} The rendered mission detail page with task list and completion dialog
 * 
 * @remarks
 * - Uses mock data for demonstration purposes
 * - Supports 5 task types: GPS, Photo, Quiz, QR Code, and Receipt
 * - Implements smooth animations using Framer Motion
 * - Displays progress bar that updates as tasks are completed
 * - Shows completion dialog with rewards summary when all tasks are finished
 * - Integrates toast notifications for user feedback
 * 
 * @state tasks - Array of tasks for the current mission
 * @state activeTaskId - ID of currently expanded/active task
 * @state isComplete - Boolean flag indicating if mission is fully completed
 * @state isLoading - Boolean flag for async task completion operations
 */
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Upload, MapPin, QrCode, CheckCircle2, Circle, HelpCircle, FileText, ArrowLeft, Loader2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Link, useLocation, useParams } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";

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
  const { user, isLoading: authLoading } = useAuth();
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [pendingTasks, setPendingTasks] = useState<string[]>([]);
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
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/user-mission"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      
      if (result.autoValidated) {
        toast({
          title: "Task Completed!",
          description: `You've earned ${result.pointsAwarded} points!`,
          className: "bg-green-600 text-white border-0",
        });
      } else if (result.pendingReview) {
        setPendingTasks(prev => [...prev, variables.taskId]);
        toast({
          title: "Submission Received",
          description: "Your submission is pending review by the business.",
          className: "bg-blue-600 text-white border-0",
        });
      }
      
      setActiveTaskId(null);
      setSelectedAnswer(null);

      // Check if all tasks completed
      const completedCount = (userMission?.completedTasks?.length || 0) + 1;
      const pendingCount = pendingTasks.length + (result.pendingReview ? 1 : 0);
      if (mission && completedCount + pendingCount >= mission.tasks.length) {
        if (completedCount >= mission.tasks.length) {
          setTimeout(() => setIsComplete(true), 500);
        }
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const completedTasks = userMission?.completedTasks || [];
  const tasks = mission?.tasks || [];
  const completedCount = completedTasks.length;
  const progress = tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0;

  const isTaskCompleted = (taskId: string) => completedTasks.includes(taskId);
  const isTaskPending = (taskId: string) => pendingTasks.includes(taskId);

  const handleTaskComplete = (task: Task) => {
    if (task.type === "quiz" && selectedAnswer === null) {
      toast({
        title: "Select an answer",
        description: "Please select an answer before submitting.",
        variant: "destructive",
      });
      return;
    }

    completeMutation.mutate({
      taskId: task.id,
      taskType: task.type,
      answer: task.type === "quiz" ? selectedAnswer! : undefined,
      proofUrl: task.type === "photo" || task.type === "receipt" ? "uploaded://simulated" : undefined,
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
            <Button className="w-full" onClick={() => handleTaskComplete(task)} disabled={completeMutation.isPending}>
              {completeMutation.isPending ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <MapPin className="mr-2 h-4 w-4" />}
              Verify Location
            </Button>
          </div>
        );
      case "photo":
      case "receipt":
        return (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-xl h-48 flex flex-col items-center justify-center bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors">
              {task.type === 'photo' ? <Camera className="h-10 w-10 text-muted-foreground mb-2" /> : <FileText className="h-10 w-10 text-muted-foreground mb-2" />}
              <span className="text-sm text-muted-foreground font-medium">Tap to {task.type === 'photo' ? 'Take Photo' : 'Upload Receipt'}</span>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              This submission will be reviewed by the business before points are awarded.
            </p>
            <Button className="w-full" onClick={() => handleTaskComplete(task)} disabled={completeMutation.isPending}>
              {completeMutation.isPending ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Upload className="mr-2 h-4 w-4" />}
              Submit for Review
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
            <Button className="w-full" onClick={() => handleTaskComplete(task)} disabled={completeMutation.isPending || selectedAnswer === null}>
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
            <Button className="w-full" onClick={() => handleTaskComplete(task)} disabled={completeMutation.isPending}>
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
          <Button variant="ghost" size="icon" className="absolute top-4 left-4 text-white hover:bg-white/20">
            <ArrowLeft className="h-6 w-6" />
          </Button>
        </Link>
        <div className="absolute bottom-0 left-0 p-6 w-full">
          <h1 className="text-3xl font-heading font-bold text-foreground">{mission.title}</h1>
          <p className="text-muted-foreground text-sm mt-1 max-w-xl">{mission.description}</p>
        </div>
      </div>

      <div className="container mx-auto px-4 mt-6">
        <div className="mb-8 bg-card p-4 rounded-xl border shadow-sm">
          <div className="flex justify-between text-sm mb-2 font-medium">
            <span>Mission Progress</span>
            <span className="text-primary">{completedCount}/{tasks.length} tasks</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-heading font-bold mb-4">Your Tasks</h2>
          
          {tasks.map((task, index) => {
            const Icon = getIconForType(task.type);
            const isActive = activeTaskId === task.id;
            const completed = isTaskCompleted(task.id);
            const pending = isTaskPending(task.id);
            
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
                    completed 
                      ? 'border-l-green-500 bg-green-50/50 dark:bg-green-900/10' 
                      : pending
                      ? 'border-l-yellow-500 bg-yellow-50/50 dark:bg-yellow-900/10'
                      : isActive 
                      ? 'border-l-primary ring-2 ring-primary/20' 
                      : 'border-l-gray-300 hover:border-l-primary/50'
                  }`}
                  onClick={() => !completed && !pending && setActiveTaskId(isActive ? null : task.id)}
                >
                  <CardHeader className="flex flex-row items-center space-y-0 p-4 gap-4">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${
                      completed 
                        ? 'bg-green-100 text-green-600' 
                        : pending 
                        ? 'bg-yellow-100 text-yellow-600'
                        : 'bg-primary/10 text-primary'
                    }`}>
                      {completed ? <CheckCircle2 className="h-6 w-6" /> : pending ? <Clock className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                    </div>
                    <div className="flex-grow">
                      <CardTitle className="text-base font-bold">{task.title}</CardTitle>
                      <CardDescription className="line-clamp-1 text-xs">
                        {pending ? "Pending review" : task.description}
                      </CardDescription>
                    </div>
                    <div className="font-bold text-sm text-muted-foreground shrink-0">
                      {task.points} pts
                    </div>
                  </CardHeader>
                  
                  <AnimatePresence>
                    {isActive && !completed && !pending && (
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
