import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Heart, Star, Filter, MapPin, CheckCircle2, Clock } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import type { Mission } from "@shared/schema";
import { listMissions } from "@/lib/supabaseApi";
import { useAuth } from "@/hooks/use-auth";

const CATEGORIES = ["All", "Landmarks", "Nature", "Culture", "Food", "Shopping"];

export default function Explore() {
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortOption, setSortOption] = useState("recommended");
  const [favorites, setFavorites] = useState<number[]>([]);

  const { data: missions = [], isLoading } = useQuery({
    queryKey: ["missions"],
    queryFn: listMissions,
  });

  const { data: userMissions = [] } = useQuery<any[]>({
    queryKey: ["/api/user-missions", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const res = await fetch(`/api/user-missions/${user.id}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!user?.id && isAuthenticated,
  });

  const getMissionStatus = (missionId: number): "completed" | "in_progress" | "not_started" => {
    const um = userMissions.find((m: any) => m.missionId === missionId);
    if (!um) return "not_started";
    if (um.status === "completed") return "completed";
    return "in_progress";
  };

  useEffect(() => {
    const savedFavorites = localStorage.getItem("favorites");
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }
  }, []);

  const toggleFavorite = (id: number) => {
    const newFavorites = favorites.includes(id)
      ? favorites.filter(fid => fid !== id)
      : [...favorites, id];
    setFavorites(newFavorites);
    localStorage.setItem("favorites", JSON.stringify(newFavorites));

    toast({
      title: favorites.includes(id) ? "Removed from favorites" : "Added to favorites!",
      description: favorites.includes(id) ? "Mission removed" : "Mission saved to your favorites.",
      className: "bg-[var(--brand)] text-white border-0",
    });
  };

  const filteredMissions = missions.filter(mission => {
    const matchesSearch = mission.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          mission.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || mission.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }).sort((a, b) => {
    if (sortOption === "points-low") return a.totalPoints - b.totalPoints;
    if (sortOption === "points-high") return b.totalPoints - a.totalPoints;
    return 0;
  });

  return (
    <div className="min-h-screen bg-[var(--bg)] font-sans">
      <Navbar />

      <section className="container mx-auto px-4 py-12 grid md:grid-cols-2 gap-8 items-center">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight text-[var(--foreground)]">
            Discover <span className="text-[var(--brand)]">Singapore Missions</span>
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Complete challenges, earn points, and unlock exclusive rewards across Singapore.
          </p>

          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedCategory === cat
                    ? "bg-[var(--brand)] text-white shadow-lg transform scale-105"
                    : "bg-white text-gray-600 hover:bg-[var(--panel)] border"
                }`}
                data-testid={`filter-category-${cat.toLowerCase()}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
        {missions.length > 0 && (
          <div className="hidden md:block relative h-[400px] rounded-3xl overflow-hidden shadow-2xl rotate-3 hover:rotate-0 transition-transform duration-500">
            <img
              src={missions[0].imageUrl || "/placeholder.jpg"}
              alt="Hero"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end p-8">
              <div className="text-white">
                <p className="font-bold text-xl">{missions[0].title}</p>
                <p className="text-sm opacity-90">{missions[0].totalPoints} Points Available</p>
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="sticky top-16 z-40 bg-[var(--bg)]/95 backdrop-blur-sm border-y border-[var(--border)] py-4">
        <div className="container mx-auto px-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search experiences..."
              className="pl-10 bg-white border-gray-200"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="input-search"
            />
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto overflow-x-auto">
            <Select value={sortOption} onValueChange={setSortOption}>
              <SelectTrigger className="w-[180px] bg-white border-gray-200" data-testid="select-sort">
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recommended">Recommended</SelectItem>
                <SelectItem value="points-low">Points: Low to High</SelectItem>
                <SelectItem value="points-high">Points: High to Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12">
        {isLoading ? (
          <div className="text-center py-12 text-gray-500">Loading missions...</div>
        ) : filteredMissions.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No missions found</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" id="missions-grid" data-testid="missions-grid">
            {filteredMissions.map((mission) => {
              const status = getMissionStatus(mission.id);

              return (
                <Link key={mission.id} href={`/mission/${mission.id}`}>
                  <Card className={`overflow-hidden border-0 shadow-md hover:shadow-xl transition-all bg-white group cursor-pointer ${status === "completed" ? "ring-2 ring-green-400/50" : ""}`} data-testid={`mission-card-${mission.id}`}>
                    <div className="relative h-56 overflow-hidden bg-gray-100">
                      <img
                        src={mission.imageUrl || "/placeholder.jpg"}
                        alt={mission.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      {status === "completed" && (
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                          <div className="bg-green-600 text-white px-4 py-2 rounded-full flex items-center gap-2 shadow-lg" data-testid={`badge-completed-${mission.id}`}>
                            <CheckCircle2 className="h-5 w-5" />
                            <span className="font-bold text-sm">Completed</span>
                          </div>
                        </div>
                      )}
                      {status === "in_progress" && (
                        <div className="absolute bottom-2 left-2">
                          <Badge className="bg-yellow-500 text-white border-0 shadow-md" data-testid={`badge-in-progress-${mission.id}`}>
                            <Clock className="h-3 w-3 mr-1" /> In Progress
                          </Badge>
                        </div>
                      )}
                      {mission.category && (
                        <Badge className="absolute top-3 left-3 bg-[var(--brand)] text-white border-0">
                          {mission.category}
                        </Badge>
                      )}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          toggleFavorite(mission.id);
                        }}
                        className="absolute top-3 right-3 p-2 bg-white/80 rounded-full hover:bg-white transition-colors"
                        data-testid={`favorite-button-${mission.id}`}
                      >
                        <Heart className={`h-4 w-4 ${favorites.includes(mission.id) ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
                      </button>
                    </div>

                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {mission.location || "Singapore"}
                        </div>
                        <div className="flex items-center gap-1 text-amber-500 text-xs font-bold">
                          <Star className="h-3 w-3 fill-amber-500" /> {mission.tasks.length}
                        </div>
                      </div>
                      <h3 className="font-bold text-lg mb-1 line-clamp-1 text-[var(--foreground)]" data-testid={`mission-title-${mission.id}`}>{mission.title}</h3>
                      <p className="text-sm text-gray-500 line-clamp-2 mb-3">{mission.description}</p>
                      <div className="font-bold text-xl text-[var(--brand)]" data-testid={`mission-points-${mission.id}`}>
                        {mission.totalPoints} Points
                      </div>
                    </CardContent>

                    <CardFooter className="p-4 pt-0">
                      <Button
                        className={`w-full font-medium shadow-md group-hover:shadow-lg transition-all ${
                          status === "completed"
                            ? "bg-green-600 hover:bg-green-700 text-white"
                            : status === "in_progress"
                            ? "bg-yellow-500 hover:bg-yellow-600 text-white"
                            : "bg-[var(--brand)] hover:bg-[var(--brand-hover)] text-white"
                        }`}
                        data-testid={`start-mission-button-${mission.id}`}
                      >
                        {status === "completed" ? "View Mission" : status === "in_progress" ? "Continue Mission" : "Start Mission"}
                      </Button>
                    </CardFooter>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
