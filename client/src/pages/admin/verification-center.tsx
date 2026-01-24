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
  ZoomIn
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Mock Data
const MOCK_SUBMISSIONS = [
  {
    id: "s1",
    user: { name: "Alice Tan", avatar: "https://github.com/shadcn.png" },
    mission: "Gardens by the Bay Adventure",
    task: "Selfie with a Supertree",
    type: "photo",
    timestamp: "10 mins ago",
    status: "pending",
    proofUrl: "/attached_assets/generated_images/3d_neon_supertree_badge_icon.png", // Using existing asset as placeholder
    notes: "Looks valid!",
  },
  {
    id: "s2",
    user: { name: "John Doe", avatar: "https://github.com/shadcn.png" },
    mission: "Maxwell Food Centre Feast",
    task: "Try our Signature Dish",
    type: "receipt",
    timestamp: "25 mins ago",
    status: "pending",
    proofUrl: "/attached_assets/generated_images/vibrant_hawker_center_food_stall.png", // Using existing asset as placeholder
    amount: "$12.50",
  },
  {
    id: "s3",
    user: { name: "Sarah Lee", avatar: "https://github.com/shadcn.png" },
    mission: "Night Safari Explorer",
    task: "Find the Lion Statue",
    type: "photo",
    timestamp: "1 hour ago",
    status: "pending",
    proofUrl: "/attached_assets/generated_images/3d_gold_merlion_badge_icon.png",
  },
  {
    id: "s4",
    user: { name: "Mike Chen", avatar: "https://github.com/shadcn.png" },
    mission: "Chinatown Heritage Walk",
    task: "Souvenir Purchase",
    type: "receipt",
    timestamp: "2 hours ago",
    status: "pending",
    proofUrl: "/attached_assets/generated_images/vibrant_hawker_center_food_stall.png",
  },
];

export default function VerificationCenter() {
  const { toast } = useToast();
  const [submissions, setSubmissions] = useState(MOCK_SUBMISSIONS);
  const [selectedSubmission, setSelectedSubmission] = useState<typeof MOCK_SUBMISSIONS[0] | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const handleApprove = (id: string) => {
    setSubmissions(submissions.filter(s => s.id !== id));
    setSelectedSubmission(null);
    toast({
      title: "Submission Approved",
      description: "Points have been awarded to the user.",
      className: "bg-green-600 text-white border-0",
    });
  };

  const handleReject = () => {
    if (selectedSubmission) {
      setSubmissions(submissions.filter(s => s.id !== selectedSubmission.id));
      setSelectedSubmission(null);
      setRejectionReason("");
      toast({
        title: "Submission Rejected",
        description: "User has been notified to try again.",
        variant: "destructive",
      });
    }
  };

  const pendingCount = submissions.length;

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
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
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
          {submissions.map((sub) => (
            <Card key={sub.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <div className="relative h-48 bg-gray-100 group cursor-pointer" onClick={() => setSelectedSubmission(sub)}>
                <img 
                  src={sub.proofUrl} 
                  alt="Proof" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 bg-white/90 text-black px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-sm">
                    <ZoomIn className="h-3 w-3" /> View Details
                  </div>
                </div>
                <div className="absolute top-2 right-2">
                  <Badge className={sub.type === 'photo' ? 'bg-blue-500' : 'bg-purple-500'}>
                    {sub.type === 'photo' ? <Camera className="h-3 w-3 mr-1" /> : <FileText className="h-3 w-3 mr-1" />}
                    {sub.type === 'photo' ? 'Photo' : 'Receipt'}
                  </Badge>
                </div>
              </div>
              
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={sub.user.avatar} />
                    <AvatarFallback>{sub.user.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-bold leading-none">{sub.user.name}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Clock className="h-3 w-3" /> {sub.timestamp}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Mission</p>
                  <p className="text-sm font-medium line-clamp-1">{sub.mission}</p>
                </div>
                <div className="space-y-1 mt-2">
                  <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Task</p>
                  <p className="text-sm line-clamp-1">{sub.task}</p>
                </div>
              </CardContent>
              
              <CardFooter className="p-3 bg-gray-50 border-t grid grid-cols-2 gap-2">
                <Button 
                  variant="outline" 
                  className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 border-red-100"
                  onClick={() => setSelectedSubmission(sub)}
                >
                  <XCircle className="h-4 w-4 mr-1" /> Reject
                </Button>
                <Button 
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => handleApprove(sub.id)}
                >
                  <CheckCircle2 className="h-4 w-4 mr-1" /> Approve
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Detail/Action Modal */}
      <Dialog open={!!selectedSubmission} onOpenChange={(open) => !open && setSelectedSubmission(null)}>
        <DialogContent className="max-w-3xl h-[80vh] flex flex-col p-0 overflow-hidden">
          <div className="flex flex-1 overflow-hidden">
            {/* Left: Image Preview */}
            <div className="w-1/2 bg-black flex items-center justify-center p-4">
              {selectedSubmission && (
                <img 
                  src={selectedSubmission.proofUrl} 
                  alt="Proof Full" 
                  className="max-w-full max-h-full object-contain"
                />
              )}
            </div>

            {/* Right: Details & Actions */}
            <div className="w-1/2 flex flex-col bg-white p-6 overflow-y-auto">
              <DialogHeader className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                  <Avatar>
                    <AvatarImage src={selectedSubmission?.user.avatar} />
                    <AvatarFallback>U</AvatarFallback>
                  </Avatar>
                  <div>
                    <DialogTitle>{selectedSubmission?.user.name}</DialogTitle>
                    <DialogDescription>{selectedSubmission?.timestamp}</DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-6 flex-1">
                <div className="p-4 bg-gray-50 rounded-lg border">
                  <h4 className="font-medium text-sm mb-2">Mission Details</h4>
                  <p className="text-sm font-bold">{selectedSubmission?.mission}</p>
                  <p className="text-sm text-muted-foreground">{selectedSubmission?.task}</p>
                </div>

                {selectedSubmission?.type === 'receipt' && (
                   <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                    <h4 className="font-medium text-sm text-blue-800 mb-1">Receipt Amount</h4>
                    <p className="text-2xl font-bold text-blue-600">{selectedSubmission.amount}</p>
                  </div>
                )}

                <div className="space-y-3">
                  <h4 className="font-medium text-sm">Action</h4>
                  <Tabs defaultValue="approve" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="approve" className="data-[state=active]:bg-green-100 data-[state=active]:text-green-700">Approve</TabsTrigger>
                      <TabsTrigger value="reject" className="data-[state=active]:bg-red-100 data-[state=active]:text-red-700">Reject</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="approve" className="mt-4 space-y-4">
                      <div className="p-4 border rounded-md bg-green-50/50 text-green-800 text-sm">
                        <p>User will receive points immediately.</p>
                        <p>This action cannot be undone.</p>
                      </div>
                      <Button className="w-full bg-green-600 hover:bg-green-700" onClick={() => selectedSubmission && handleApprove(selectedSubmission.id)}>
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
                        />
                        <div className="flex gap-2 mt-2">
                          <Badge variant="outline" className="cursor-pointer hover:bg-gray-100" onClick={() => setRejectionReason("Image is blurry")}>Blurry</Badge>
                          <Badge variant="outline" className="cursor-pointer hover:bg-gray-100" onClick={() => setRejectionReason("Wrong item")}>Wrong Item</Badge>
                          <Badge variant="outline" className="cursor-pointer hover:bg-gray-100" onClick={() => setRejectionReason("Date invalid")}>Date Invalid</Badge>
                        </div>
                      </div>
                      <Button variant="destructive" className="w-full" onClick={handleReject} disabled={!rejectionReason}>
                        Reject Submission
                      </Button>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
