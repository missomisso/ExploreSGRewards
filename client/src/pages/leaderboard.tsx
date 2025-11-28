import { useState } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Medal, Crown, ArrowUp, ArrowDown, Minus } from "lucide-react";
import { motion } from "framer-motion";

const LEADERBOARD_DATA = [
  { rank: 1, name: "Jessica Lim", avatar: "https://i.pravatar.cc/150?u=1", points: 15420, badge: "Lion City Legend", change: "up" },
  { rank: 2, name: "David Chen", avatar: "https://i.pravatar.cc/150?u=2", points: 14850, badge: "Super Explorer", change: "same" },
  { rank: 3, name: "Sarah Jones", avatar: "https://i.pravatar.cc/150?u=3", points: 13200, badge: "Foodie King", change: "down" },
  { rank: 4, name: "Michael Tan", avatar: "https://i.pravatar.cc/150?u=4", points: 12100, badge: "Nature Lover", change: "up" },
  { rank: 5, name: "Priya Raj", avatar: "https://i.pravatar.cc/150?u=5", points: 11500, badge: "Culture Vulture", change: "same" },
  { rank: 6, name: "John Smith", avatar: "https://i.pravatar.cc/150?u=6", points: 10800, badge: "Night Owl", change: "up" },
  { rank: 7, name: "Wei Ling", avatar: "https://i.pravatar.cc/150?u=7", points: 9500, badge: "Explorer", change: "down" },
  { rank: 8, name: "Kumar S.", avatar: "https://i.pravatar.cc/150?u=8", points: 9200, badge: "Explorer", change: "same" },
  { rank: 9, name: "Lisa Wong", avatar: "https://i.pravatar.cc/150?u=9", points: 8800, badge: "Novice", change: "up" },
  { rank: 10, name: "Tom Baker", avatar: "https://i.pravatar.cc/150?u=10", points: 8100, badge: "Novice", change: "down" },
];

const CURRENT_USER_RANK = { rank: 42, name: "Alex Chen", avatar: "https://github.com/shadcn.png", points: 1250, badge: "Explorer", change: "up" };

export default function Leaderboard() {
  const [timeframe, setTimeframe] = useState("all-time");

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown className="h-6 w-6 text-yellow-500 fill-yellow-500" />;
      case 2: return <Medal className="h-6 w-6 text-gray-400 fill-gray-400" />;
      case 3: return <Medal className="h-6 w-6 text-amber-700 fill-amber-700" />;
      default: return <span className="font-bold text-muted-foreground w-6 text-center">{rank}</span>;
    }
  };

  const getChangeIcon = (change: string) => {
    switch (change) {
      case "up": return <ArrowUp className="h-3 w-3 text-green-500" />;
      case "down": return <ArrowDown className="h-3 w-3 text-red-500" />;
      default: return <Minus className="h-3 w-3 text-gray-300" />;
    }
  };

  return (
    <div className="min-h-screen bg-background font-sans pb-20">
      <Navbar />

      {/* Hero Header */}
      <div className="bg-primary/5 py-12">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-heading text-3xl md:text-4xl font-bold mb-3 flex items-center justify-center gap-3">
            <Trophy className="h-8 w-8 text-yellow-500" /> Global Leaderboard
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto mb-8">
            Compete with fellow explorers to become the ultimate Singapore expert.
          </p>

          <Tabs defaultValue="all-time" className="w-full max-w-md mx-auto">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="weekly" onClick={() => setTimeframe("weekly")}>Weekly</TabsTrigger>
              <TabsTrigger value="monthly" onClick={() => setTimeframe("monthly")}>Monthly</TabsTrigger>
              <TabsTrigger value="all-time" onClick={() => setTimeframe("all-time")}>All Time</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-6 relative z-10">
        {/* Top 3 Podium */}
        <div className="flex flex-col md:flex-row items-end justify-center gap-4 mb-12 px-4">
          {/* 2nd Place */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="order-2 md:order-1 w-full md:w-1/3 max-w-[250px] flex flex-col items-center"
          >
            <div className="relative mb-4">
              <Avatar className="h-20 w-20 border-4 border-gray-300">
                <AvatarImage src={LEADERBOARD_DATA[1].avatar} />
                <AvatarFallback>2</AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-gray-300 text-gray-800 text-xs font-bold px-2 py-0.5 rounded-full border border-white">
                #2
              </div>
            </div>
            <Card className="w-full text-center border-t-4 border-t-gray-300">
              <CardContent className="pt-6 pb-4">
                <h3 className="font-bold truncate">{LEADERBOARD_DATA[1].name}</h3>
                <p className="text-primary font-bold text-lg">{LEADERBOARD_DATA[1].points.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">{LEADERBOARD_DATA[1].badge}</p>
              </CardContent>
            </Card>
          </motion.div>

          {/* 1st Place */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="order-1 md:order-2 w-full md:w-1/3 max-w-[280px] flex flex-col items-center -mt-8 md:-mt-12 z-20"
          >
            <div className="relative mb-4">
              <div className="absolute -top-8 left-1/2 -translate-x-1/2">
                <Crown className="h-8 w-8 text-yellow-500 fill-yellow-500 animate-bounce" />
              </div>
              <Avatar className="h-24 w-24 border-4 border-yellow-400 ring-4 ring-yellow-100">
                <AvatarImage src={LEADERBOARD_DATA[0].avatar} />
                <AvatarFallback>1</AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-0.5 rounded-full border border-white">
                #1
              </div>
            </div>
            <Card className="w-full text-center border-t-4 border-t-yellow-400 shadow-lg transform scale-105">
              <CardContent className="pt-8 pb-6">
                <h3 className="font-bold text-lg truncate">{LEADERBOARD_DATA[0].name}</h3>
                <p className="text-primary font-bold text-xl">{LEADERBOARD_DATA[0].points.toLocaleString()}</p>
                <Badge variant="secondary" className="mt-2 bg-yellow-100 text-yellow-800 hover:bg-yellow-200">
                  {LEADERBOARD_DATA[0].badge}
                </Badge>
              </CardContent>
            </Card>
          </motion.div>

          {/* 3rd Place */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="order-3 md:order-3 w-full md:w-1/3 max-w-[250px] flex flex-col items-center"
          >
            <div className="relative mb-4">
              <Avatar className="h-20 w-20 border-4 border-amber-600">
                <AvatarImage src={LEADERBOARD_DATA[2].avatar} />
                <AvatarFallback>3</AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-amber-600 text-white text-xs font-bold px-2 py-0.5 rounded-full border border-white">
                #3
              </div>
            </div>
            <Card className="w-full text-center border-t-4 border-t-amber-600">
              <CardContent className="pt-6 pb-4">
                <h3 className="font-bold truncate">{LEADERBOARD_DATA[2].name}</h3>
                <p className="text-primary font-bold text-lg">{LEADERBOARD_DATA[2].points.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">{LEADERBOARD_DATA[2].badge}</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* The Rest of the List */}
        <Card className="overflow-hidden border-0 shadow-lg">
          <CardHeader className="bg-gray-50 border-b px-6 py-3">
            <div className="grid grid-cols-12 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              <div className="col-span-1 text-center">Rank</div>
              <div className="col-span-7 md:col-span-8">Explorer</div>
              <div className="col-span-4 md:col-span-3 text-right">Points</div>
            </div>
          </CardHeader>
          <div className="divide-y">
            {LEADERBOARD_DATA.slice(3).map((user) => (
              <div key={user.rank} className="grid grid-cols-12 items-center px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="col-span-1 flex justify-center items-center gap-1">
                  <span className="font-bold text-muted-foreground">{user.rank}</span>
                  {getChangeIcon(user.change)}
                </div>
                <div className="col-span-7 md:col-span-8 flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm truncate">{user.name}</p>
                    <p className="text-xs text-muted-foreground hidden md:block">{user.badge}</p>
                  </div>
                </div>
                <div className="col-span-4 md:col-span-3 text-right font-bold text-primary">
                  {user.points.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Sticky User Rank */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] p-4 z-50 md:hidden">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="font-bold text-muted-foreground w-6 text-center">{CURRENT_USER_RANK.rank}</div>
            <Avatar className="h-10 w-10 border-2 border-primary">
              <AvatarImage src={CURRENT_USER_RANK.avatar} />
              <AvatarFallback>ME</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-bold text-sm">You</p>
              <p className="text-xs text-muted-foreground">{CURRENT_USER_RANK.points} pts</p>
            </div>
          </div>
          <Button size="sm" variant="outline" className="text-xs h-8">
            View Full Profile
          </Button>
        </div>
      </div>
    </div>
  );
}
