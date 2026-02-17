/**
 * Leaderboard page component displaying global explorer rankings.
 * 
 * Features:
 * - Top 3 podium display with animated avatars and special styling
 * - Timeframe filtering (weekly, monthly, all-time)
 * - Full ranked list of explorers (4-10) with points and badges
 * - Sticky user rank indicator for mobile devices
 * - Rank change indicators (up/down/same)
 * - Responsive design optimized for mobile and desktop
 * 
 * @component
 * @returns {JSX.Element} The rendered leaderboard page with navigation, podium, rankings list, and sticky user indicator
 * 
 * @example
 * export default function Leaderboard() { ... }
 */

import { useState } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Medal, Crown, ArrowUp, ArrowDown, Minus, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useSupabaseAuth } from "@/hooks/use-supabase-auth";

export default function Leaderboard() {
  const [timeframe, setTimeframe] = useState("all-time");
  const { user } = useSupabaseAuth();

  const { data: leaderboardData = [], isLoading, error } = useQuery({
  queryKey: ["leaderboard", timeframe],
  queryFn: async () => {
    const { getSupabase } = await import("@/lib/supabase");
    const supabase = await getSupabase();

    const { data, error } = await supabase
      .from("users")
      .select("id, first_name, last_name, profile_image_url, level, points")
      .eq("role", "tourist")
      .order("points", { ascending: false })
      .limit(100);

    if (error) throw error;
    return data ?? [];
  },
  });

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown className="h-6 w-6 text-yellow-500 fill-yellow-500" />;
      case 2: return <Medal className="h-6 w-6 text-gray-400 fill-gray-400" />;
      case 3: return <Medal className="h-6 w-6 text-amber-700 fill-amber-700" />;
      default: return <span className="font-bold text-muted-foreground w-6 text-center">{rank}</span>;
    }
  };

  const getBadge = (level: number) => {
    if (level >= 10) return "Lion City Legend";
    if (level >= 7) return "Super Explorer";
    if (level >= 5) return "Nature Lover";
    if (level >= 3) return "Explorer";
    return "Novice";
  };

  const formatName = (user: any) => {
    if (user.first_name && user.last_name) return `${user.first_name} ${user.last_name}`;
    if (user.first_name) return user.first_name;
    return "Anonymous Explorer";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background font-sans pb-20">
        <Navbar />
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--brand)]" />
        </div>
      </div>
    );
  }

  if (error) {
  return (
    <div className="min-h-screen bg-background font-sans pb-20">
      <Navbar />
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-red-600 font-medium">Failed to load leaderboard</p>
        <p className="text-muted-foreground text-sm mt-2">
          {error instanceof Error ? error.message : String(error)}
        </p>
      </div>
    </div>
  );
}


  const rankedUsers = leaderboardData.map((u: any, idx: number) => ({
    ...u,
    rank: idx + 1,
    name: formatName(u),
    avatar: u.profile_image_url || `https://i.pravatar.cc/150?u=${u.id}`,
    badge: getBadge(u.level || 1),
  }));

  const currentUserRank = user ? rankedUsers.find((u: any) => u.id === user.id) : null;

  return (
    <div className="min-h-screen bg-background font-sans pb-20">
      <Navbar />

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
        {rankedUsers.length === 0 ? (
          <div className="text-center py-12">
            <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No explorers yet. Be the first!</p>
          </div>
        ) : (
          <>
            {rankedUsers.length >= 3 && (
              <div className="flex flex-col md:flex-row items-end justify-center gap-4 mb-12 px-4">
                {rankedUsers[1] && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="order-2 md:order-1 w-full md:w-1/3 max-w-[250px] flex flex-col items-center"
                  >
                    <div className="relative mb-4">
                      <Avatar className="h-20 w-20 border-4 border-gray-300">
                        <AvatarImage src={rankedUsers[1].avatar} />
                        <AvatarFallback>2</AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-gray-300 text-gray-800 text-xs font-bold px-2 py-0.5 rounded-full border border-white">
                        #2
                      </div>
                    </div>
                    <Card className="w-full text-center border-t-4 border-t-gray-300">
                      <CardContent className="pt-6 pb-4">
                        <h3 className="font-bold truncate">{rankedUsers[1].name}</h3>
                        <p className="text-primary font-bold text-lg">{(rankedUsers[1].points || 0).toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">{rankedUsers[1].badge}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {rankedUsers[0] && (
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
                        <AvatarImage src={rankedUsers[0].avatar} />
                        <AvatarFallback>1</AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-0.5 rounded-full border border-white">
                        #1
                      </div>
                    </div>
                    <Card className="w-full text-center border-t-4 border-t-yellow-400 shadow-lg transform scale-105">
                      <CardContent className="pt-8 pb-6">
                        <h3 className="font-bold text-lg truncate">{rankedUsers[0].name}</h3>
                        <p className="text-primary font-bold text-xl">{(rankedUsers[0].points || 0).toLocaleString()}</p>
                        <Badge variant="secondary" className="mt-2 bg-yellow-100 text-yellow-800 hover:bg-yellow-200">
                          {rankedUsers[0].badge}
                        </Badge>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {rankedUsers[2] && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="order-3 md:order-3 w-full md:w-1/3 max-w-[250px] flex flex-col items-center"
                  >
                    <div className="relative mb-4">
                      <Avatar className="h-20 w-20 border-4 border-amber-600">
                        <AvatarImage src={rankedUsers[2].avatar} />
                        <AvatarFallback>3</AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-amber-600 text-white text-xs font-bold px-2 py-0.5 rounded-full border border-white">
                        #3
                      </div>
                    </div>
                    <Card className="w-full text-center border-t-4 border-t-amber-600">
                      <CardContent className="pt-6 pb-4">
                        <h3 className="font-bold truncate">{rankedUsers[2].name}</h3>
                        <p className="text-primary font-bold text-lg">{(rankedUsers[2].points || 0).toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">{rankedUsers[2].badge}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </div>
            )}

            {rankedUsers.length > 3 && (
              <Card className="overflow-hidden border-0 shadow-lg">
                <CardHeader className="bg-gray-50 border-b px-6 py-3">
                  <div className="grid grid-cols-12 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    <div className="col-span-1 text-center">Rank</div>
                    <div className="col-span-7 md:col-span-8">Explorer</div>
                    <div className="col-span-4 md:col-span-3 text-right">Points</div>
                  </div>
                </CardHeader>
                <div className="divide-y">
                  {rankedUsers.slice(3).map((rankUser: any) => (
                    <div key={rankUser.id} className="grid grid-cols-12 items-center px-6 py-4 hover:bg-gray-50 transition-colors">
                      <div className="col-span-1 flex justify-center items-center gap-1">
                        <span className="font-bold text-muted-foreground">{rankUser.rank}</span>
                      </div>
                      <div className="col-span-7 md:col-span-8 flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={rankUser.avatar} />
                          <AvatarFallback>{rankUser.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm truncate">{rankUser.name}</p>
                          <p className="text-xs text-muted-foreground hidden md:block">{rankUser.badge}</p>
                        </div>
                      </div>
                      <div className="col-span-4 md:col-span-3 text-right font-bold text-primary">
                        {(rankUser.points || 0).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </>
        )}
      </div>

      {currentUserRank && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] p-4 z-50 md:hidden">
          <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="font-bold text-muted-foreground w-6 text-center">{currentUserRank.rank}</div>
              <Avatar className="h-10 w-10 border-2 border-primary">
                <AvatarImage src={currentUserRank.avatar} />
                <AvatarFallback>ME</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-bold text-sm">You</p>
                <p className="text-xs text-muted-foreground">{currentUserRank.points} pts</p>
              </div>
            </div>
            <Button size="sm" variant="outline" className="text-xs h-8">
              View Full Profile
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
