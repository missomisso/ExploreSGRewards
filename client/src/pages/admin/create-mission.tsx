import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  ArrowRight, 
  Camera, 
  FileText, 
  MapPin, 
  HelpCircle, 
  QrCode, 
  Plus, 
  Trash2,
  Save,
  GripVertical
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { TaskDefinition } from "@shared/schema";

type TaskType = "gps" | "photo" | "receipt" | "quiz" | "qrcode";

interface TaskDraft {
  id: string;
  type: TaskType;
  title: string;
  description: string;
  points: number;
  // Quiz specific
  question?: string;
  options?: string[];
  correctOption?: number;
}

export default function CreateMission() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  
  // Form State
  const [missionData, setMissionData] = useState({
    title: "",
    description: "",
    location: "",
    startDate: "",
    endDate: "",
    totalPoints: 0,
  });

  const [tasks, setTasks] = useState<TaskDraft[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Task Builder State
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskType, setNewTaskType] = useState<TaskType>("gps");

  const handleAddTask = () => {
    const newTask: TaskDraft = {
      id: Math.random().toString(36).substr(2, 9),
      type: newTaskType,
      title: newTaskType === "gps" ? "Location Check-in" : 
             newTaskType === "photo" ? "Photo Challenge" :
             newTaskType === "receipt" ? "Spend & Redeem" :
             newTaskType === "quiz" ? "Trivia Question" : "Find the Code",
      description: "",
      points: 50,
      options: newTaskType === "quiz" ? ["", "", "", ""] : undefined,
      question: newTaskType === "quiz" ? "" : undefined,
    };
    setTasks([...tasks, newTask]);
    setIsAddingTask(false);
  };

  const updateTask = (id: string, field: keyof TaskDraft, value: any) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  const updateQuizOption = (taskId: string, optionIndex: number, value: string) => {
    setTasks(tasks.map(t => {
      if (t.id !== taskId || !t.options) return t;
      const newOptions = [...t.options];
      newOptions[optionIndex] = value;
      return { ...t, options: newOptions };
    }));
  };

  const removeTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const calculateTotalPoints = () => {
    return tasks.reduce((sum, t) => sum + (Number(t.points) || 0), 0);
  };

  const createMission = useMutation({
    mutationFn: async () => {
      const mappedTasks: TaskDefinition[] = tasks.map((task) => ({
        id: task.id,
        type: task.type,
        title: task.title,
        description: task.description,
        points: Number(task.points) || 0,
        question: task.question,
        options: task.options,
        correctAnswer: task.correctOption,
      }));

      const payload = {
        title: missionData.title.trim(),
        description: missionData.description.trim(),
        location: missionData.location.trim() || undefined,
        totalPoints: calculateTotalPoints(),
        startDate: missionData.startDate ? new Date(missionData.startDate).toISOString() : undefined,
        endDate: missionData.endDate ? new Date(missionData.endDate).toISOString() : undefined,
        tasks: mappedTasks,
        status: "active",
      };

      const response = await apiRequest("POST", "/api/missions", payload);
      return response.json();
    },
  });

  const handleSave = async () => {
    if (!missionData.title.trim() || !missionData.description.trim()) {
      toast({
        title: "Missing mission details",
        description: "Add a title and description before publishing.",
        variant: "destructive",
      });
      return;
    }

    if (tasks.length === 0) {
      toast({
        title: "Add at least one task",
        description: "Missions need tasks so visitors can earn points.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSaving(true);
      await createMission.mutateAsync();
      toast({
        title: "Mission Created Successfully!",
        description: "Your mission is now live and visible to tourists.",
        className: "bg-green-600 text-white border-0",
      });
      setTimeout(() => setLocation("/admin/business"), 1500);
    } catch (error) {
      toast({
        title: "Mission creation failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="title">Mission Title</Label>
          <Input 
            id="title" 
            placeholder="e.g., Summer Food Festival Hunt" 
            value={missionData.title}
            onChange={(e) => setMissionData({...missionData, title: e.target.value})}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="description">Description</Label>
          <Textarea 
            id="description" 
            placeholder="Describe what users need to do..." 
            className="h-32"
            value={missionData.description}
            onChange={(e) => setMissionData({...missionData, description: e.target.value})}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="location">Location</Label>
            <Input 
              id="location" 
              placeholder="Select store location" 
              value={missionData.location}
              onChange={(e) => setMissionData({...missionData, location: e.target.value})}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="duration">Validity Period</Label>
            <div className="grid grid-cols-2 gap-2">
              <Input 
                type="date" 
                value={missionData.startDate}
                onChange={(e) => setMissionData({...missionData, startDate: e.target.value})}
              />
              <Input 
                type="date" 
                value={missionData.endDate}
                onChange={(e) => setMissionData({...missionData, endDate: e.target.value})}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Mission Tasks ({tasks.length})</h3>
        <div className="flex items-center gap-2">
          {isAddingTask ? (
            <div className="flex items-center gap-2 bg-white p-1 rounded-lg border shadow-sm animate-in zoom-in duration-200">
              <select 
                className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={newTaskType}
                onChange={(e) => setNewTaskType(e.target.value as TaskType)}
              >
                <option value="gps">📍 GPS Check-in</option>
                <option value="photo">📸 Photo Challenge</option>
                <option value="receipt">🧾 Receipt Upload</option>
                <option value="quiz">❓ Trivia Quiz</option>
                <option value="qrcode">📱 QR Scan</option>
              </select>
              <Button size="sm" onClick={handleAddTask}>Add</Button>
              <Button size="sm" variant="ghost" onClick={() => setIsAddingTask(false)}>Cancel</Button>
            </div>
          ) : (
            <Button size="sm" variant="outline" onClick={() => setIsAddingTask(true)}>
              <Plus className="h-4 w-4 mr-2" /> Add Task
            </Button>
          )}
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-xl bg-gray-50 text-muted-foreground">
          <p>No tasks added yet.</p>
          <p className="text-sm mt-1">Add tasks to build your mission.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {tasks.map((task, index) => (
            <Card key={task.id} className="relative group">
              <div className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => removeTask(task.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <CardContent className="p-4 pt-6">
                <div className="flex items-start gap-4">
                  <div className="mt-1 cursor-move text-muted-foreground">
                    <GripVertical className="h-5 w-5" />
                  </div>
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="uppercase text-xs font-bold tracking-wider">
                        {task.type}
                      </Badge>
                      <span className="text-sm text-muted-foreground">Task #{index + 1}</span>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label>Task Title</Label>
                        <Input 
                          value={task.title}
                          onChange={(e) => updateTask(task.id, "title", e.target.value)}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Points Reward</Label>
                        <Input 
                          type="number"
                          value={task.points}
                          onChange={(e) => updateTask(task.id, "points", Number(e.target.value))}
                        />
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <Label>Instructions for User</Label>
                      <Input 
                        value={task.description}
                        placeholder="e.g., Take a selfie with our mascot..."
                        onChange={(e) => updateTask(task.id, "description", e.target.value)}
                      />
                    </div>

                    {/* Quiz Specific Fields */}
                    {task.type === "quiz" && (
                      <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                        <div className="grid gap-2">
                          <Label>Question</Label>
                          <Input 
                            value={task.question}
                            placeholder="Enter your question..."
                            onChange={(e) => updateTask(task.id, "question", e.target.value)}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label>Options (Select correct answer)</Label>
                          <RadioGroup 
                            value={task.correctOption?.toString()} 
                            onValueChange={(val) => updateTask(task.id, "correctOption", parseInt(val))}
                          >
                            {task.options?.map((opt, idx) => (
                              <div key={idx} className="flex items-center gap-2">
                                <RadioGroupItem value={idx.toString()} id={`q-${task.id}-${idx}`} />
                                <Input 
                                  value={opt}
                                  onChange={(e) => updateQuizOption(task.id, idx, e.target.value)}
                                  placeholder={`Option ${idx + 1}`}
                                  className="h-8 bg-white"
                                />
                              </div>
                            ))}
                          </RadioGroup>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
      <Card className="bg-muted/50 border-dashed">
        <CardHeader>
          <CardTitle>Mission Summary</CardTitle>
          <CardDescription>Review your mission details before publishing.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground block">Title</span>
              <span className="font-medium text-lg">{missionData.title || "Untitled Mission"}</span>
            </div>
            <div>
              <span className="text-muted-foreground block">Total Points</span>
              <span className="font-bold text-lg text-primary">{calculateTotalPoints()} pts</span>
            </div>
            <div>
              <span className="text-muted-foreground block">Location</span>
              <span className="font-medium">{missionData.location || "Not set"}</span>
            </div>
            <div>
              <span className="text-muted-foreground block">Tasks</span>
              <span className="font-medium">{tasks.length} steps</span>
            </div>
          </div>
          
          <div className="pt-4 border-t">
            <h4 className="font-medium mb-2">Task Sequence</h4>
            <ul className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
              {tasks.map((t) => (
                <li key={t.id}>
                  <span className="font-medium text-foreground">{t.title}</span> 
                  <span className="ml-2 text-xs bg-gray-200 px-2 py-0.5 rounded-full">{t.type}</span>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <AdminLayout type="business">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8 flex items-center gap-4">
          <Link href="/admin/business">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-heading font-bold">Create New Mission</h1>
            <p className="text-muted-foreground">Design an engaging experience for your visitors.</p>
          </div>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center gap-2">
            <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold transition-colors ${step >= 1 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'}`}>1</div>
            <span className={`text-sm font-medium ${step >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>Details</span>
          </div>
          <div className={`w-12 h-1 bg-gray-200 mx-2 ${step >= 2 ? 'bg-primary' : ''}`} />
          <div className="flex items-center gap-2">
            <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold transition-colors ${step >= 2 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'}`}>2</div>
            <span className={`text-sm font-medium ${step >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>Tasks</span>
          </div>
          <div className={`w-12 h-1 bg-gray-200 mx-2 ${step >= 3 ? 'bg-primary' : ''}`} />
          <div className="flex items-center gap-2">
            <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold transition-colors ${step >= 3 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'}`}>3</div>
            <span className={`text-sm font-medium ${step >= 3 ? 'text-primary' : 'text-muted-foreground'}`}>Review</span>
          </div>
        </div>

        {/* Content */}
        <div className="mb-8">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-4 border-t">
          <Button 
            variant="outline" 
            onClick={() => setStep(Math.max(1, step - 1))}
            disabled={step === 1}
          >
            Back
          </Button>
          
          {step < 3 ? (
            <Button onClick={() => setStep(step + 1)}>
              Next Step <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700 text-white" disabled={isSaving}>
              {isSaving ? "Publishing..." : "Publish Mission"} <Save className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
