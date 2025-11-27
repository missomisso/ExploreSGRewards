import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Upload, MapPin, QrCode, CheckCircle2, Circle, HelpCircle, FileText, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

// Types for our tasks
type TaskType = "gps" | "photo" | "receipt" | "quiz" | "qrcode";

interface Task {
  id: string;
  type: TaskType;
  title: string;
  description: string;
  points: number;
  completed: boolean;
  // Optional properties for specific task types
  quizQuestion?: string;
  quizOptions?: string[];
  correctAnswer?: number;
}

// Mock Data for the Mission
const MOCK_MISSION = {
  id: "gardens-by-the-bay",
  title: "Gardens by the Bay Adventure",
  description: "Complete these challenges to unlock the exclusive Supertree Grove Badge and 500 points!",
  image: "/attached_assets/generated_images/singapore_skyline_with_gardens_by_the_bay_and_marina_bay_sands_in_a_lush,_futuristic_style.png",
  totalPoints: 500,
  tasks: [
    {
      id: "t1",
      type: "gps",
      title: "Check-in at Supertree Grove",
      description: "Verify you are at the location to start.",
      points: 50,
      completed: false,
    },
    {
      id: "t2",
      type: "photo",
      title: "Selfie with a Supertree",
      description: "Take a creative selfie with the Supertrees in the background.",
      points: 100,
      completed: false,
    },
    {
      id: "t3",
      type: "quiz",
      title: "Sustainability Trivia",
      description: "Answer a quick question about the Gardens.",
      points: 50,
      completed: false,
      quizQuestion: "How many Supertrees are there in the Gardens?",
      quizOptions: ["12", "18", "25", "5"],
      correctAnswer: 1, // Index of "18"
    },
    {
      id: "t4",
      type: "qrcode",
      title: "Find the Hidden Code",
      description: "Scan the QR code located near the OCBC Skyway entrance.",
      points: 150,
      completed: false,
    },
    {
      id: "t5",
      type: "receipt",
      title: "Gift Shop Souvenir",
      description: "Upload a receipt from the gift shop (min spend $10).",
      points: 150,
      completed: false,
    },
  ] as Task[],
};

export default function MissionDetail() {
  const [tasks, setTasks] = useState<Task[]>(MOCK_MISSION.tasks);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const completedCount = tasks.filter(t => t.completed).length;
  const progress = (completedCount / tasks.length) * 100;

  // Handlers for task completion
  const handleTaskComplete = (taskId: string) => {
    setIsLoading(true);
    // Simulate network delay
    setTimeout(() => {
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: true } : t));
      setActiveTaskId(null);
      setIsLoading(false);
      toast({
        title: "Task Completed!",
        description: "You've earned points towards your reward.",
        className: "bg-green-600 text-white border-0",
      });
      
      // Check if all complete
      const remaining = tasks.filter(t => !t.completed && t.id !== taskId).length;
      if (remaining === 0) {
        setTimeout(() => setIsComplete(true), 500);
      }
    }, 1500);
  };

  // Render specific task content based on type
  const renderTaskContent = (task: Task) => {
    switch (task.type) {
      case "gps":
        return (
          <div className="space-y-4">
             <div className="h-48 w-full rounded-lg bg-gray-100 relative overflow-hidden border">
               {/* Mock Map */}
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
             <p className="text-sm text-muted-foreground text-center">You are 50m away from the target location.</p>
             <Button className="w-full" onClick={() => handleTaskComplete(task.id)} disabled={isLoading}>
               {isLoading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <MapPin className="mr-2 h-4 w-4" />}
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
            <Button className="w-full" onClick={() => handleTaskComplete(task.id)} disabled={isLoading}>
              {isLoading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Upload className="mr-2 h-4 w-4" />}
              Submit {task.type === 'photo' ? 'Photo' : 'Receipt'}
            </Button>
          </div>
        );
      case "quiz":
        return (
           <div className="space-y-6">
             <p className="font-medium text-lg">{task.quizQuestion}</p>
             <RadioGroup defaultValue="option-one">
                {task.quizOptions?.map((option, idx) => (
                  <div key={idx} className="flex items-center space-x-2 border p-3 rounded-lg hover:bg-gray-50">
                    <RadioGroupItem value={`option-${idx}`} id={`option-${idx}`} />
                    <Label htmlFor={`option-${idx}`} className="flex-grow cursor-pointer">{option}</Label>
                  </div>
                ))}
             </RadioGroup>
             <Button className="w-full" onClick={() => handleTaskComplete(task.id)} disabled={isLoading}>
               {isLoading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : "Submit Answer"}
             </Button>
           </div>
        );
      case "qrcode":
        return (
           <div className="space-y-4 text-center">
             <div className="bg-black rounded-xl h-64 w-full flex items-center justify-center relative overflow-hidden">
                {/* Mock Camera View */}
                <div className="absolute inset-0 opacity-30 bg-[url('https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&q=80')] bg-cover bg-center"></div>
                <div className="border-2 border-white w-48 h-48 rounded-lg relative z-10">
                   <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-primary -mt-1 -ml-1"></div>
                   <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-primary -mt-1 -mr-1"></div>
                   <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-primary -mb-1 -ml-1"></div>
                   <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-primary -mb-1 -mr-1"></div>
                </div>
                <p className="absolute bottom-4 text-white text-xs bg-black/50 px-3 py-1 rounded-full">Align QR code within frame</p>
             </div>
             <Button className="w-full" onClick={() => handleTaskComplete(task.id)} disabled={isLoading}>
                {isLoading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <QrCode className="mr-2 h-4 w-4" />}
                Scan Now (Simulate)
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

  return (
    <div className="min-h-screen bg-background font-sans pb-20">
      {/* Header Image */}
      <div className="relative h-64 w-full">
        <div className="absolute inset-0">
          <img src={MOCK_MISSION.image} alt="Mission" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-background" />
        </div>
        <Link href="/explore">
          <Button variant="ghost" size="icon" className="absolute top-4 left-4 text-white hover:bg-white/20">
            <ArrowLeft className="h-6 w-6" />
          </Button>
        </Link>
        <div className="absolute bottom-0 left-0 p-6 w-full">
           <h1 className="text-3xl font-heading font-bold text-foreground">{MOCK_MISSION.title}</h1>
           <p className="text-muted-foreground text-sm mt-1 max-w-xl">{MOCK_MISSION.description}</p>
        </div>
      </div>

      <div className="container mx-auto px-4 mt-6">
        {/* Progress Bar */}
        <div className="mb-8 bg-card p-4 rounded-xl border shadow-sm">
          <div className="flex justify-between text-sm mb-2 font-medium">
            <span>Mission Progress</span>
            <span className="text-primary">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Task List */}
        <div className="space-y-4">
          <h2 className="text-xl font-heading font-bold mb-4">Your Tasks</h2>
          
          {tasks.map((task, index) => {
            const Icon = getIconForType(task.type);
            const isActive = activeTaskId === task.id;
            
            return (
              <motion.div 
                key={task.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card 
                  className={`border-l-4 transition-all cursor-pointer overflow-hidden ${task.completed ? 'border-l-green-500 bg-green-50/50 dark:bg-green-900/10' : isActive ? 'border-l-primary ring-2 ring-primary/20' : 'border-l-gray-300 hover:border-l-primary/50'}`}
                  onClick={() => !task.completed && setActiveTaskId(isActive ? null : task.id)}
                >
                  <CardHeader className="flex flex-row items-center space-y-0 p-4 gap-4">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${task.completed ? 'bg-green-100 text-green-600' : 'bg-primary/10 text-primary'}`}>
                      {task.completed ? <CheckCircle2 className="h-6 w-6" /> : <Icon className="h-5 w-5" />}
                    </div>
                    <div className="flex-grow">
                      <CardTitle className="text-base font-bold">{task.title}</CardTitle>
                      <CardDescription className="line-clamp-1 text-xs">{task.description}</CardDescription>
                    </div>
                    <div className="font-bold text-sm text-muted-foreground shrink-0">
                      {task.points} pts
                    </div>
                  </CardHeader>
                  
                  <AnimatePresence>
                    {isActive && !task.completed && (
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

      {/* Completion Dialog */}
      <Dialog open={isComplete} onOpenChange={setIsComplete}>
        <DialogContent className="sm:max-w-md text-center">
          <DialogHeader>
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-yellow-100 mb-4">
              <span className="text-4xl">🏆</span>
            </div>
            <DialogTitle className="text-2xl font-heading font-bold text-center">Mission Complete!</DialogTitle>
            <DialogDescription className="text-center text-base">
              You've conquered the Gardens by the Bay mission.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-gray-50 p-4 rounded-lg text-center my-2 dark:bg-gray-800">
             <p className="text-sm text-muted-foreground">Total Earned</p>
             <p className="text-3xl font-bold text-primary mt-1">{MOCK_MISSION.totalPoints} Points</p>
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
