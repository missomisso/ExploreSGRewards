import { useState } from "react";
import { Link } from "wouter";
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
  Ticket
} from "lucide-react";

export default function Profile() {
  const user = {
    name: "Alex Chen",
    email: "alex.chen@example.com",
    level: 3,
    points: 1250,
    nextLevelPoints: 2000,
    joinedDate: "Nov 2023"
  };

  const history = [
    { id: 1, type: "mission", title: "Gardens by the Bay Adventure", points: "+500", date: "2 hours ago", status: "Completed" },
    { id: 2, type: "reward", title: "1-for-1 Bubble Tea", points: "-500", date: "1 day ago", status: "Redeemed" },
    { id: 3, type: "mission", title: "Maxwell Food Centre Feast", points: "+350", date: "3 days ago", status: "Completed" },
    { id: 4, type: "mission", title: "National Gallery Tour", points: "+400", date: "1 week ago", status: "Completed" },
  ];

  const vouchers = [
    { id: 1, title: "1-for-1 Bubble Tea", merchant: "LiHO Tea", expiry: "Valid until 30 Dec", code: "BUBBLE50", used: false },
    { id: 2, title: "$5 Off Laksa", merchant: "328 Katong Laksa", expiry: "Valid until 15 Dec", code: "LAKSA05", used: false },
  ];

  return (
    <div className="min-h-screen bg-background font-sans pb-20">
      <Navbar />
      
      <div className="bg-primary/5 pb-12 pt-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="relative">
              <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
                <AvatarImage src="https://github.com/shadcn.png" />
                <AvatarFallback>AC</AvatarFallback>
              </Avatar>
              <div className="absolute bottom-0 right-0 bg-accent text-accent-foreground text-xs font-bold px-2 py-1 rounded-full border border-white shadow-sm">
                Lvl {user.level}
              </div>
            </div>
            
            <div className="text-center md:text-left flex-1">
              <h1 className="text-2xl font-heading font-bold">{user.name}</h1>
              <p className="text-muted-foreground text-sm mb-3">Member since {user.joinedDate}</p>
              
              <div className="flex items-center justify-center md:justify-start gap-4 text-sm">
                <div className="flex items-center gap-1 bg-white px-3 py-1 rounded-full shadow-sm border">
                  <Trophy className="h-4 w-4 text-yellow-500" />
                  <span className="font-bold">{user.points}</span> Points
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>Singapore</span>
                </div>
              </div>
            </div>

            <div className="w-full md:w-64 bg-white p-4 rounded-xl shadow-sm border">
              <div className="flex justify-between text-xs mb-2 font-medium">
                <span>Progress to Level {user.level + 1}</span>
                <span className="text-primary">{Math.round((user.points / user.nextLevelPoints) * 100)}%</span>
              </div>
              <Progress value={(user.points / user.nextLevelPoints) * 100} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2 text-right">
                {user.nextLevelPoints - user.points} points to go
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
              <Ticket className="h-5 w-5" /> Active Vouchers
            </h2>
            {vouchers.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-4">
                {vouchers.map((voucher) => (
                  <Card key={voucher.id} className="overflow-hidden border-l-4 border-l-primary shadow-md hover:shadow-lg transition-shadow">
                    <CardContent className="p-0 flex">
                      <div className="flex-1 p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-bold text-lg">{voucher.title}</h3>
                            <p className="text-sm text-muted-foreground">{voucher.merchant}</p>
                          </div>
                          <Badge variant="secondary" className="bg-green-100 text-green-700 border-0">Active</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mb-4">{voucher.expiry}</p>
                        <Button size="sm" className="w-full gap-2">
                          <QrCode className="h-4 w-4" /> Show Code
                        </Button>
                      </div>
                      <div className="w-12 bg-gray-50 border-l flex items-center justify-center relative">
                        <div className="absolute -top-2 -left-2 w-4 h-4 bg-background rounded-full border border-gray-200" />
                        <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-background rounded-full border border-gray-200" />
                        <span className="writing-mode-vertical text-xs text-muted-foreground font-mono tracking-widest rotate-180">
                          {voucher.code}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
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
              <History className="h-5 w-5" /> Recent Activity
            </h2>
            <Card>
              <CardContent className="p-0">
                {history.map((item, idx) => (
                  <div key={item.id} className={`flex items-center justify-between p-4 ${idx !== history.length - 1 ? 'border-b' : ''}`}>
                    <div className="flex items-center gap-4">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center ${item.type === 'mission' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'}`}>
                        {item.type === 'mission' ? <MapPin className="h-5 w-5" /> : <Trophy className="h-5 w-5" />}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{item.title}</p>
                        <p className="text-xs text-muted-foreground">{item.date}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`font-bold text-sm ${item.points.startsWith('+') ? 'text-green-600' : 'text-orange-600'}`}>
                        {item.points}
                      </span>
                      <p className="text-xs text-muted-foreground">{item.status}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card>
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between py-2 border-b">
                  <div>
                    <p className="font-medium">Push Notifications</p>
                    <p className="text-sm text-muted-foreground">Receive alerts about new missions</p>
                  </div>
                  <Badge>Enabled</Badge>
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                  <div>
                    <p className="font-medium">Email Preferences</p>
                    <p className="text-sm text-muted-foreground">Weekly summary and rewards</p>
                  </div>
                  <Badge variant="outline">Weekly</Badge>
                </div>
                <Button variant="destructive" className="w-full mt-4 gap-2">
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
