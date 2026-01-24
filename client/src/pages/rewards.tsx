import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Ticket, Coffee, ShoppingBag, Gift } from "lucide-react";

export default function Rewards() {
  const userPoints = 1250;

  const rewards = [
    {
      id: 1,
      title: "1-for-1 Bubble Tea",
      cost: 500,
      merchant: "LiHO Tea",
      icon: Coffee,
      color: "bg-orange-100 text-orange-600",
    },
    {
      id: 2,
      title: "$10 Off Entry Ticket",
      cost: 1000,
      merchant: "Gardens by the Bay",
      icon: Ticket,
      color: "bg-green-100 text-green-600",
    },
    {
      id: 3,
      title: "Exclusive Merlion Plushie",
      cost: 2500,
      merchant: "ExploreSG Shop",
      icon: Gift,
      color: "bg-purple-100 text-purple-600",
    },
    {
      id: 4,
      title: "20% Off Souvenirs",
      cost: 800,
      merchant: "Chinatown Heritage Shop",
      icon: ShoppingBag,
      color: "bg-red-100 text-red-600",
    },
  ];

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
             <Progress value={62} className="h-2 mb-2" />
             <p className="text-xs text-muted-foreground text-right">750 points to next tier</p>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {rewards.map((reward) => (
            <Card key={reward.id} className="overflow-hidden border-0 shadow-md hover:shadow-xl transition-all">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <div className={`mb-4 flex h-16 w-16 items-center justify-center rounded-full ${reward.color}`}>
                  <reward.icon className="h-8 w-8" />
                </div>
                <h3 className="font-heading text-lg font-bold mb-1">{reward.title}</h3>
                <p className="text-sm text-muted-foreground mb-4">{reward.merchant}</p>
                <div className="text-2xl font-bold text-primary">{reward.cost} pts</div>
              </CardContent>
              <CardFooter className="bg-gray-50 px-6 py-4 dark:bg-gray-900">
                <Button 
                  className="w-full" 
                  disabled={userPoints < reward.cost}
                  variant={userPoints >= reward.cost ? "default" : "secondary"}
                >
                  {userPoints >= reward.cost ? "Redeem Now" : "Not Enough Points"}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
