import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  MapPin, 
  Trophy, 
  Clock, 
  QrCode, 
  Settings, 
  LogOut, 
  ChevronRight,
  History,
  Ticket,
  Loader2
} from "lucide-react";
import { useSupabaseAuth } from "@/hooks/use-supabase-auth";
import { useQuery } from "@tanstack/react-query";

export default function Profile() {
  const { user, isAuthenticated, isLoading: authLoading, logout } = useSupabaseAuth();
  const [, setLocation] = useLocation();

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

  const { data: userMissions = [] } = useQuery({
    queryKey: ["/api/user-missions", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const res = await fetch(`/api/user-missions/${user.id}`);
      if (!res.ok) throw new Error("Failed to fetch user missions");
      return res.json();
    },
    enabled: !!user?.id,
  });

  const { data: allMissions = [] } = useQuery({
    queryKey: ["/api/missions"],
    queryFn: async () => {
      const res = await fetch("/api/missions");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: allRewards = [] } = useQuery({
    queryKey: ["/api/rewards"],
    queryFn: async () => {
      const res = await fetch("/api/rewards");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const getMissionTitle = (missionId: number) => {
    const mission = allMissions.find((m: any) => m.id === missionId);
    return mission?.title || `Mission #${missionId}`;
  };

  const getRewardDetails = (rewardId: number) => {
    const reward = allRewards.find((r: any) => r.id === rewardId);
    return reward || { title: `Reward #${rewardId}`, merchant: "", cost: 0 };
  };

  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background font-sans pb-20">
        <Navbar />
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--brand)]" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-background font-sans pb-20">
        <Navbar />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Please Log In</h1>
          <p className="text-muted-foreground mb-6">You need to be logged in to view your profile.</p>
          <Link href="/auth/login">
            <Button>Go to Login</Button>
          </Link>
        </div>
      </div>
    );
  }

  const nextLevelPoints = (user.level || 1) * 1000;
  const progressPercent = Math.min((user.points / nextLevelPoints) * 100, 100);

  const completedMissions = userMissions.filter((m: any) => m.status === "completed");
  const activeVouchers = userRewards.filter((r: any) => !r.used);

  return (
    <div className="min-h-screen bg-background font-sans pb-20">
      <Navbar />
      
      <div className="bg-primary/5 pb-12 pt-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="relative">
              <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
                <AvatarImage src={user.profileImageUrl || "https://github.com/shadcn.png"} />
                <AvatarFallback>{(user.firstName || "U").charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="absolute bottom-0 right-0 bg-accent text-accent-foreground text-xs font-bold px-2 py-1 rounded-full border border-white shadow-sm">
                Lvl {user.level || 1}
              </div>
            </div>
            
            <div className="text-center md:text-left flex-1">
              <h1 className="text-2xl font-heading font-bold">
                {user.firstName || "Explorer"} {user.lastName || ""}
              </h1>
              <p className="text-muted-foreground text-sm mb-3">{user.email}</p>
              
              <div className="flex items-center justify-center md:justify-start gap-4 text-sm">
                <div className="flex items-center gap-1 bg-white px-3 py-1 rounded-full shadow-sm border">
                  <Trophy className="h-4 w-4 text-yellow-500" />
                  <span className="font-bold">{user.points || 0}</span> Points
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>Singapore</span>
                </div>
              </div>
            </div>

            <div className="w-full md:w-64 bg-white p-4 rounded-xl shadow-sm border">
              <div className="flex justify-between text-xs mb-2 font-medium">
                <span>Progress to Level {(user.level || 1) + 1}</span>
                <span className="text-primary">{Math.round(progressPercent)}%</span>
              </div>
              <Progress value={progressPercent} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2 text-right">
                {nextLevelPoints - (user.points || 0)} points to go
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-6">
        <Tabs defaultValue="wallet" className="w-full">
          <TabsList className="w-full grid grid-cols-3 bg-white shadow-lg rounded-xl p-1 h-14 border mb-8">
            <TabsTrigger value="wallet" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary h-full rounded-lg">My Wallet</TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary h-full rounded-lg">Activity</TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary h-full rounded-lg">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="wallet" className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="font-heading text-xl font-bold mb-4 flex items-center gap-2">
              <Ticket className="h-5 w-5" /> Active Vouchers ({activeVouchers.length})
            </h2>
            {activeVouchers.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-4">
                {activeVouchers.map((voucher: any) => {
                  const reward = getRewardDetails(voucher.rewardId);
                  return (
                    <Card key={voucher.id} className="overflow-hidden border-l-4 border-l-primary shadow-md hover:shadow-lg transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-bold text-lg">{reward.title}</h3>
                            {reward.merchant && (
                              <p className="text-sm text-muted-foreground">{reward.merchant}</p>
                            )}
                          </div>
                          <Badge variant="secondary" className="bg-green-100 text-green-700 border-0">Active</Badge>
                        </div>
                        <div className="bg-gray-50 border-2 border-dashed rounded-lg p-4 text-center mb-3">
                          <p className="text-xs text-muted-foreground mb-1">Redemption Code</p>
                          <p className="text-2xl font-mono font-bold tracking-wider">{voucher.code}</p>
                          <div className="mt-2 mx-auto w-24 h-24 bg-white border rounded-lg flex items-center justify-center">
                            <QrCode className="h-16 w-16 text-gray-400" />
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">Show this code at the merchant</p>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Expires: {new Date(voucher.expiresAt).toLocaleDateString()}
                        </p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed">
                <p className="text-muted-foreground">No active vouchers.</p>
                <Link href="/rewards">
                  <Button variant="link">Go to Rewards Center</Button>
                </Link>
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="font-heading text-xl font-bold mb-4 flex items-center gap-2">
              <History className="h-5 w-5" /> Completed Missions ({completedMissions.length})
            </h2>
            <Card>
              <CardContent className="p-0">
                {completedMissions.length > 0 ? (
                  completedMissions.map((mission: any, idx: number) => (
                    <div key={mission.id} className={`flex items-center justify-between p-4 ${idx !== completedMissions.length - 1 ? 'border-b' : ''}`}>
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full flex items-center justify-center bg-green-100 text-green-600">
                          <MapPin className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{getMissionTitle(mission.missionId)}</p>
                          <p className="text-xs text-muted-foreground">
                            Completed: {mission.completedAt ? new Date(mission.completedAt).toLocaleDateString() : "N/A"}
                          </p>
                        </div>
                      </div>
                      <Badge className="bg-green-100 text-green-700">Completed</Badge>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-muted-foreground">
                    No completed missions yet. Start exploring!
                  </div>
                )}
              </CardContent>
            </Card>

            {userMissions.filter((m: any) => m.status !== "completed").length > 0 && (
              <>
                <h2 className="font-heading text-xl font-bold mb-4 mt-6 flex items-center gap-2">
                  <Clock className="h-5 w-5" /> Missions In Progress
                </h2>
                <Card>
                  <CardContent className="p-0">
                    {userMissions.filter((m: any) => m.status !== "completed").map((mission: any, idx: number, arr: any[]) => (
                      <Link key={mission.id} href={`/missions/${mission.missionId}`}>
                        <div className={`flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 ${idx !== arr.length - 1 ? 'border-b' : ''}`}>
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-full flex items-center justify-center bg-blue-100 text-blue-600">
                              <MapPin className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">{getMissionTitle(mission.missionId)}</p>
                              <p className="text-xs text-muted-foreground">
                                {mission.completedTasks?.length || 0} tasks completed
                              </p>
                            </div>
                          </div>
                          <Badge className="bg-blue-100 text-blue-700">In Progress</Badge>
                        </div>
                      </Link>
                    ))}
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          <TabsContent value="settings" className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card>
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between py-2 border-b">
                  <div>
                    <p className="font-medium">Email</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                  <div>
                    <p className="font-medium">Role</p>
                    <p className="text-sm text-muted-foreground capitalize">{user.role}</p>
                  </div>
                </div>
                <Button variant="destructive" className="w-full mt-4 gap-2" onClick={handleLogout}>
                  <LogOut className="h-4 w-4" /> Sign Out
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
