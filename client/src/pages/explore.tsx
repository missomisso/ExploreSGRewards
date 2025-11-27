import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { AttractionCard } from "@/components/ui/attraction-card";
import { Input } from "@/components/ui/input";
import { Search, Filter } from "lucide-react";

// Assets
import heroBg from "@assets/generated_images/singapore_skyline_with_gardens_by_the_bay_and_marina_bay_sands_in_a_lush,_futuristic_style.png";
import imgHawker from "@assets/generated_images/vibrant_hawker_center_food_stall.png";
import imgMuseum from "@assets/generated_images/artscience_museum_singapore.png";

export default function Explore() {
  const categories = ["All", "Nature", "Food", "Culture", "Shopping", "Nightlife"];

  return (
    <div className="min-h-screen bg-background font-sans">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="font-heading text-3xl font-bold mb-4">Explore Singapore</h1>
          
          {/* Search & Filter */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search attractions, food, places..." className="pl-10" />
            </div>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" /> Filters
            </Button>
          </div>

          {/* Categories */}
          <div className="mt-6 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map((cat, i) => (
              <Button 
                key={cat} 
                variant={i === 0 ? "default" : "outline"} 
                className={`rounded-full ${i === 0 ? 'bg-primary text-white' : ''}`}
              >
                {cat}
              </Button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
           <AttractionCard 
              title="Maxwell Food Centre"
              category="Food & Dining"
              points={150}
              rating={4.8}
              imageUrl={imgHawker}
              distance="0.2km"
            />
            <AttractionCard 
              title="ArtScience Museum"
              category="Culture & Arts"
              points={300}
              rating={4.9}
              imageUrl={imgMuseum}
              distance="1.5km"
            />
             <AttractionCard 
              title="Gardens by the Bay"
              category="Nature"
              points={250}
              rating={4.9}
              imageUrl={heroBg}
              distance="2.1km"
            />
            <AttractionCard 
              title="Lau Pa Sat"
              category="Food & Dining"
              points={150}
              rating={4.7}
              imageUrl={imgHawker}
              distance="1.0km"
            />
            <AttractionCard 
              title="National Gallery"
              category="Culture"
              points={250}
              rating={4.8}
              imageUrl={imgMuseum}
              distance="1.2km"
            />
             <AttractionCard 
              title="Cloud Forest"
              category="Nature"
              points={350}
              rating={5.0}
              imageUrl={heroBg}
              distance="2.2km"
            />
        </div>
      </div>
    </div>
  );
}
