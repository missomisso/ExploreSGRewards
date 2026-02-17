import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Ticket, Coffee, ShoppingBag, Gift, Loader2, CheckCircle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSupabaseAuth } from "@/hooks/use-supabase-auth";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const iconMap: Record<string, any> = {
  Coffee,
  Ticket,
  Gift,
  ShoppingBag,
};

const colorMap: Record<string, string> = {
  Coffee: "bg-orange-100 text-orange-600",
  Ticket: "bg-green-100 text-green-600",
  Gift: "bg-purple-100 text-purple-600",
  ShoppingBag: "bg-red-100 text-red-600",
};

export default function Rewards() {
  const { user, isAuthenticated, session, refreshUser } = useSupabaseAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedReward, setSelectedReward] = useState<any>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [rewardCode, setRewardCode] = useState("");

  const userPoints = user?.points || 0;

  const { data: rewards = [], isLoading } = useQuery({
    queryKey: ["/api/rewards"],
    queryFn: async () => {
      const res = await fetch("/api/rewards");
      if (!res.ok) throw new Error("Failed to fetch rewards");
      return res.json();
    },
  });

  const { data: userRewards = [] } = useQuery({
    queryKey: ["/api/user-rewards", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const res = await fetch(`/api/user-rewards/${user.id}`);
      if (!res.ok) throw new Error("Failed to fetch user rewards");
      return res.json();
    },
    enabled: !!user?.id,
  });

  const claimMutation = useMutation({
    mutationFn: async (rewardId: number) => {
      const res = await fetch("/api/rewards/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user?.id, rewardId }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to claim reward");
      }
      return res.json();
    },
    onSuccess: (data) => {
      setRewardCode(data.code);
      setShowSuccess(true);
      setSelectedReward(null);
      queryClient.invalidateQueries({ queryKey: ["/api/user-rewards"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      refreshUser();
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Failed to redeem",
        description: error.message,
      });
    },
  });

  const handleRedeem = (reward: any) => {
    if (!isAuthenticated) {
      toast({
        variant: "destructive",
        title: "Please log in",
        description: "You need to be logged in to redeem rewards.",
      });
      return;
    }
    setSelectedReward(reward);
  };

  const confirmRedeem = () => {
    if (selectedReward) {
      claimMutation.mutate(selectedReward.id);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background font-sans">
        <Navbar />
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--brand)]" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-sans">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-12 text-center">
           <h1 className="font-heading text-3xl font-bold mb-2">Rewards Center</h1>
           <p className="text-muted-foreground mb-6">Redeem your hard-earned points for exclusive perks.</p>
           
           <div className="mx-auto max-w-md rounded-2xl bg-white p-6 shadow-lg border border-gray-100 dark:bg-gray-900 dark:border-gray-800">
             <div className="flex items-center justify-between mb-2">
               <span className="text-sm font-medium text-muted-foreground">Available Points</span>
               <span className="text-2xl font-bold text-primary">{userPoints}</span>
             </div>
             <Progress value={Math.min((userPoints / 2000) * 100, 100)} className="h-2 mb-2" />
             <p className="text-xs text-muted-foreground text-right">
               {userPoints >= 2000 ? "Max tier reached!" : `${2000 - userPoints} points to next tier`}
             </p>
           </div>
        </div>

        {rewards.length === 0 ? (
          <div className="text-center py-12">
            <Gift className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No rewards available yet. Check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {rewards.map((reward: any) => {
              const IconComponent = iconMap[reward.icon] || Gift;
              const colorClass = colorMap[reward.icon] || "bg-gray-100 text-gray-600";
              
              return (
                <Card key={reward.id} className="overflow-hidden border-0 shadow-md hover:shadow-xl transition-all">
                  <CardContent className="p-6 flex flex-col items-center text-center">
                    <div className={`mb-4 flex h-16 w-16 items-center justify-center rounded-full ${colorClass}`}>
                      <IconComponent className="h-8 w-8" />
                    </div>
                    <h3 className="font-heading text-lg font-bold mb-1">{reward.title}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{reward.merchant}</p>
                    <div className="text-2xl font-bold text-primary">{reward.cost} pts</div>
                  </CardContent>
                  <CardFooter className="bg-gray-50 px-6 py-4 dark:bg-gray-900">
                    <Button 
                      className="w-full" 
                      disabled={userPoints < reward.cost || !isAuthenticated}
                      variant={userPoints >= reward.cost ? "default" : "secondary"}
                      onClick={() => handleRedeem(reward)}
                    >
                      {!isAuthenticated ? "Login to Redeem" : userPoints >= reward.cost ? "Redeem Now" : "Not Enough Points"}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}

        {userRewards.length > 0 && (
          <div className="mt-12">
            <h2 className="font-heading text-2xl font-bold mb-6">Your Redeemed Rewards</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userRewards.map((ur: any) => (
                <Card key={ur.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Reward #{ur.rewardId}</p>
                      <p className="text-sm text-muted-foreground">Code: {ur.code}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${ur.used ? "bg-gray-200" : "bg-green-100 text-green-700"}`}>
                      {ur.used ? "Used" : "Active"}
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      <Dialog open={!!selectedReward} onOpenChange={() => setSelectedReward(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Redemption</DialogTitle>
            <DialogDescription>
              Are you sure you want to redeem "{selectedReward?.title}" for {selectedReward?.cost} points?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedReward(null)}>Cancel</Button>
            <Button onClick={confirmRedeem} disabled={claimMutation.isPending}>
              {claimMutation.isPending ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-green-600" />
              Reward Redeemed!
            </DialogTitle>
            <DialogDescription>
              Your reward has been successfully redeemed. Here's your code:
            </DialogDescription>
          </DialogHeader>
          <div className="text-center py-4">
            <div className="text-3xl font-mono font-bold tracking-wider bg-gray-100 py-4 rounded-lg">
              {rewardCode}
            </div>
            <p className="text-sm text-muted-foreground mt-2">Show this code to the merchant to claim your reward.</p>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowSuccess(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
