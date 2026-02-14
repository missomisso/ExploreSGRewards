/**
 * Explore page component for browsing and discovering Singapore missions.
 * 
 * @component
 * @returns {JSX.Element} The explore page with mission browsing interface
 * 
 * @description
 * Displays a grid of missions with filtering, search, and sorting capabilities.
 * Features include:
 * - Search missions by title or description
 * - Filter by category (Landmarks, Nature, Culture, Food, Shopping)
 * - Sort by recommended, points (low to high), or points (high to low)
 * - Add/remove missions to favorites with local storage persistence
 * - Responsive grid layout with mission cards
 * - Hero section showcasing featured mission
 * 
 * @example
 * ```tsx
 * import Explore from '@/pages/explore';
 * 
 * export default function App() {
 *   return <Explore />;
 * }
 * ```
 * 
 * @remarks
 * - Favorites are persisted in browser's localStorage
 * - Missions are fetched from `/api/missions` endpoint using React Query
 * - Uses Wouter for client-side routing to mission detail pages
 * - Supports responsive design for mobile, tablet, and desktop viewports
 */
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, ShoppingCart, Heart, Star, Filter, MapPin } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import type { Mission } from "@shared/schema";
import { listMissions } from "@/lib/supabaseApi";

const CATEGORIES = ["All", "Landmarks", "Nature", "Culture", "Food", "Shopping"];

export default function Explore() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortOption, setSortOption] = useState("recommended");
  const [favorites, setFavorites] = useState<number[]>([]);

  const { data: missions = [], isLoading, error } = useQuery({
  queryKey: ["missions"],
  queryFn: listMissions,
  });

  // Load favorites from local storage on mount
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

  // Filter Logic
  const filteredMissions = missions.filter(mission => {
    const matchesSearch = mission.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          mission.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || mission.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }).sort((a, b) => {
    if (sortOption === "points-low") return a.totalPoints - b.totalPoints;
    if (sortOption === "points-high") return b.totalPoints - a.totalPoints;
    return 0; // recommended (default order)
  });

  return (
    <div className="min-h-screen bg-[var(--bg)] font-sans">
      <Navbar />

      {/* Hero Section */}
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

      {/* Filters Bar */}
      <section className="sticky top-16 z-40 bg-[var(--bg)]/95 backdrop-blur-sm border-y border-[var(--border)] py-4">
        <div className="container mx-auto px-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              placeholder="Search experiences..." 
              className="pl-10 bg-white border-gray-200"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-4 w-full md:w-auto overflow-x-auto">
            <Select value={sortOption} onValueChange={setSortOption}>
              <SelectTrigger className="w-[180px] bg-white border-gray-200">
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recommended">Recommended</SelectItem>
                <SelectItem value="points-low">Points: Low to High</SelectItem>
                <SelectItem value="points-high">Points: High to Low</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" className="gap-2 bg-white border-gray-200">
              <Filter className="h-4 w-4" /> Price Range
            </Button>
          </div>
        </div>
      </section>

      {/* Missions Grid */}
      <section className="container mx-auto px-4 py-12">
        {isLoading ? (
          <div className="text-center py-12 text-gray-500">Loading missions...</div>
        ) : filteredMissions.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No missions found</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" id="missions-grid" data-testid="missions-grid">
            {filteredMissions.map((mission) => (
              <Link key={mission.id} href={`/mission/${mission.id}`}>
                <Card className="overflow-hidden border-0 shadow-md hover:shadow-xl transition-all bg-white group cursor-pointer" data-testid={`mission-card-${mission.id}`}>
                  <div className="relative h-56 overflow-hidden bg-gray-100">
                    <img 
                      src={mission.imageUrl || "/placeholder.jpg"} 
                      alt={mission.title} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
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
                      className="w-full bg-[var(--brand)] hover:bg-[var(--brand-hover)] text-white font-medium shadow-md group-hover:shadow-lg transition-all"
                      data-testid={`start-mission-button-${mission.id}`}
                    >
                      Start Mission
                    </Button>
                  </CardFooter>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
