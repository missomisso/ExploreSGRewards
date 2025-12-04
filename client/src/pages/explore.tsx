import { useState, useEffect } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, ShoppingCart, Heart, Star, Filter } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

// Mock Data adapted for Marketplace style
const PRODUCTS = [
  {
    id: 1,
    title: "Gardens by the Bay Entry",
    price: 25,
    rating: 4.9,
    image: "/attached_assets/generated_images/singapore_skyline_with_gardens_by_the_bay_and_marina_bay_sands_in_a_lush,_futuristic_style.png",
    category: "Attractions",
    badge: "Best Seller",
    desc: "Access to Cloud Forest & Flower Dome."
  },
  {
    id: 2,
    title: "Maxwell Chicken Rice",
    price: 5.50,
    rating: 4.8,
    image: "/attached_assets/generated_images/vibrant_hawker_center_food_stall.png",
    category: "Food",
    badge: "Must Try",
    desc: "Michelin-approved hawker delight."
  },
  {
    id: 3,
    title: "ArtScience Museum Ticket",
    price: 18,
    rating: 4.7,
    image: "/attached_assets/generated_images/artscience_museum_singapore.png",
    category: "Culture",
    badge: "New Exhibition",
    desc: "Future World: Where Art Meets Science."
  },
  {
    id: 4,
    title: "Singapore Sling Experience",
    price: 32,
    rating: 4.6,
    image: "/attached_assets/generated_images/singapore_skyline_with_gardens_by_the_bay_and_marina_bay_sands_in_a_lush,_futuristic_style.png",
    category: "Nightlife",
    badge: null,
    desc: "Original cocktail at Long Bar."
  },
  {
    id: 5,
    title: "Merlion Plushie (Gold)",
    price: 15.90,
    rating: 5.0,
    image: "/attached_assets/generated_images/3d_gold_merlion_badge_icon.png",
    category: "Souvenirs",
    badge: "Limited",
    desc: "Exclusive collectible plush toy."
  },
  {
    id: 6,
    title: "Supertree Light Show",
    price: 0,
    rating: 4.9,
    image: "/attached_assets/generated_images/3d_neon_supertree_badge_icon.png",
    category: "Attractions",
    badge: "Free",
    desc: "Daily light and sound show."
  }
];

const CATEGORIES = ["All", "Attractions", "Food", "Culture", "Nightlife", "Souvenirs"];

export default function Explore() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortOption, setSortOption] = useState("recommended");
  const [cart, setCart] = useState<number[]>([]);

  // Load cart from local storage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, []);

  const addToCart = (id: number) => {
    const newCart = [...cart, id];
    setCart(newCart);
    localStorage.setItem("cart", JSON.stringify(newCart));
    
    toast({
      title: "Added to Itinerary!",
      description: "Item saved to your plan.",
      className: "bg-[var(--brand)] text-white border-0",
    });
  };

  // Filter Logic
  const filteredProducts = PRODUCTS.filter(product => {
    const matchesSearch = product.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          product.desc.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }).sort((a, b) => {
    if (sortOption === "price-low") return a.price - b.price;
    if (sortOption === "price-high") return b.price - a.price;
    return 0; // recommended (default order)
  });

  return (
    <div className="min-h-screen bg-[var(--bg)] font-sans">
      <Navbar />

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-12 grid md:grid-cols-2 gap-8 items-center">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight text-[var(--foreground)]">
            Find great deals from <span className="text-[var(--brand)]">trusted partners</span>
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Discover the best attractions, food, and experiences Singapore has to offer.
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
        <div className="hidden md:block relative h-[400px] rounded-3xl overflow-hidden shadow-2xl rotate-3 hover:rotate-0 transition-transform duration-500">
          <img 
            src={PRODUCTS[0].image} 
            alt="Hero" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end p-8">
            <div className="text-white">
              <p className="font-bold text-xl">Gardens by the Bay</p>
              <p className="text-sm opacity-90">#1 Attraction in Singapore</p>
            </div>
          </div>
        </div>
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
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" className="gap-2 bg-white border-gray-200">
              <Filter className="h-4 w-4" /> Price Range
            </Button>
          </div>
        </div>
      </section>

      {/* Product Grid */}
      <section className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" id="products-grid">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="overflow-hidden border-0 shadow-md hover:shadow-xl transition-all bg-white group">
              <div className="relative h-56 overflow-hidden bg-gray-100">
                <img 
                  src={product.image} 
                  alt={product.title} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                {product.badge && (
                  <Badge className="absolute top-3 left-3 bg-[var(--brand)] text-white border-0">
                    {product.badge}
                  </Badge>
                )}
                <button className="absolute top-3 right-3 p-2 bg-white/80 rounded-full hover:bg-white text-gray-600 hover:text-red-500 transition-colors">
                  <Heart className="h-4 w-4" />
                </button>
              </div>
              
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">{product.category}</div>
                  <div className="flex items-center gap-1 text-amber-500 text-xs font-bold">
                    <Star className="h-3 w-3 fill-amber-500" /> {product.rating}
                  </div>
                </div>
                <h3 className="font-bold text-lg mb-1 line-clamp-1 text-[var(--foreground)]">{product.title}</h3>
                <p className="text-sm text-gray-500 line-clamp-2 mb-3">{product.desc}</p>
                <div className="font-bold text-xl text-[var(--brand)]">
                  {product.price === 0 ? "Free" : `$${product.price.toFixed(2)}`}
                </div>
              </CardContent>
              
              <CardFooter className="p-4 pt-0">
                <Button 
                  className="w-full bg-[var(--brand)] hover:bg-[var(--brand-hover)] text-white font-medium shadow-md group-hover:shadow-lg transition-all"
                  onClick={() => addToCart(product.id)}
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  {cart.includes(product.id) ? "Added!" : "Add to Itinerary"}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
