import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { BadgeCard } from "@/components/ui/badge-card";
import { AttractionCard } from "@/components/ui/attraction-card";
import { Progress } from "@/components/ui/progress";
import { ArrowRight, Trophy, Map, Zap } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";

import heroBg from "@assets/generated_images/singapore_skyline_gardens_bay_futuristic.jpg"; 
import badgeMerlion from "@assets/generated_images/3d_gold_merlion_badge_icon.png";
import badgeSupertree from "@assets/generated_images/3d_neon_supertree_badge_icon.png";
import imgHawker from "@assets/generated_images/vibrant_hawker_center_food_stall.png";
import imgMuseum from "@assets/generated_images/artscience_museum_singapore.png";

export default function Home() {
  const { user, isAuthenticated, isLoading } = useAuth();

  const userPoints = user?.points || 0;
  const userLevel = user?.level || 1;
  const nextLevelPoints = userLevel * 500;
  const progressPercent = Math.min((userPoints / nextLevelPoints) * 100, 100);

  return (
    <div className="min-h-screen bg-[var(--bg)] font-sans text-[var(--foreground)]">
      <Navbar />

      {/* Hero Section */}
      <section className="relative h-[500px] w-full overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={heroBg}
            alt="Singapore Skyline"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg)] to-transparent" />
        </div>

        <div className="container relative mx-auto flex h-full flex-col justify-center px-4 text-white">
          <div className="max-w-2xl">
            <span className="mb-4 inline-block rounded-full bg-[var(--brand)]/20 px-4 py-1.5 text-sm font-semibold backdrop-blur-md border border-[var(--brand)]/30 text-white">
              ✨ The #1 Tourist Companion App
            </span>
            {isAuthenticated && user ? (
              <>
                <h1 className="font-heading mb-6 text-5xl font-extrabold leading-tight md:text-6xl text-white">
                  Welcome back, <br />
                  <span className="text-[var(--brand)] drop-shadow-md">
                    {user.firstName || "Explorer"}!
                  </span>
                </h1>
                <p className="mb-8 text-lg text-gray-100 md:text-xl font-light">
                  Continue your Singapore adventure. You have {userPoints} points at Level {userLevel}.
                </p>
              </>
            ) : (
              <>
                <h1 className="font-heading mb-6 text-5xl font-extrabold leading-tight md:text-6xl text-white">
                  Explore Singapore. <br />
                  <span className="text-[var(--brand)] drop-shadow-md">
                    Earn Rewards.
                  </span>
                </h1>
                <p className="mb-8 text-lg text-gray-100 md:text-xl font-light">
                  Turn your trip into a game. Visit attractions, discover hidden gems,
                  and unlock exclusive discounts at local businesses.
                </p>
              </>
            )}
            <div className="flex gap-4">
              <Link href="/explore">
                <Button size="lg" className="bg-[var(--brand)] hover:bg-[var(--brand-hover)] text-white font-bold h-12 px-8 border-0 shadow-lg" data-testid="button-start-exploring">
                  Start Exploring
                </Button>
              </Link>
              {!isAuthenticated && (
                <a href="/auth/login">
                  <Button size="lg" variant="outline" className="bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20 h-12" data-testid="button-sign-in-hero">
                    Sign In
                  </Button>
                </a>
              )}
              {isAuthenticated && (
                <Link href="/rewards">
                  <Button size="lg" variant="outline" className="bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20 h-12" data-testid="button-view-rewards">
                    View Rewards
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* User Dashboard / Progress Section */}
      <section className="container mx-auto -mt-20 relative z-10 px-4 pb-16">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Progress Card */}
          <div className="col-span-1 rounded-2xl bg-[var(--panel)] p-6 shadow-xl border border-[var(--border)]">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-heading text-xl font-bold text-[var(--foreground)]">Your Journey</h3>
                <p className="text-sm text-gray-600">
                  {isAuthenticated ? `Level ${userLevel} Explorer` : "Sign in to track progress"}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--brand)] text-white font-bold">
                L{userLevel}
              </div>
            </div>
            
            {isAuthenticated ? (
              <>
                <div className="mb-2 flex justify-between text-sm font-medium">
                  <span>{userPoints} Points</span>
                  <span className="text-gray-600">Next Level: {nextLevelPoints}</span>
                </div>
                <Progress value={progressPercent} className="h-3 bg-white" />
              </>
            ) : (
              <div className="mb-2">
                <p className="text-sm text-gray-500 mb-4">Create an account to start earning points and unlock exclusive rewards!</p>
                <a href="/auth/login">
                  <Button className="w-full bg-[var(--brand)] hover:bg-[var(--brand-hover)] text-white" data-testid="button-sign-in-progress">
                    Sign In to Start
                  </Button>
                </a>
              </div>
            )}
            
            {isAuthenticated && (
              <div className="mt-6 grid grid-cols-2 gap-3">
                <Button variant="outline" className="w-full text-xs h-8 border-[var(--brand)] text-[var(--brand)] hover:bg-[var(--brand)] hover:text-white" data-testid="button-view-history">
                  View History
                </Button>
                <Link href="/rewards">
                  <Button className="w-full text-xs h-8 bg-[var(--brand)] hover:bg-[var(--brand-hover)] text-white" data-testid="button-redeem-rewards">
                    Redeem Rewards
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Badges Preview */}
          <div className="col-span-1 lg:col-span-2 rounded-2xl bg-white p-6 shadow-xl border border-[var(--border)]">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-heading text-xl font-bold text-[var(--foreground)]">Recent Badges</h3>
              <Link href="/rewards" className="text-sm font-semibold text-[var(--brand)] hover:underline flex items-center gap-1">
                View All <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <BadgeCard 
                title="Lion City" 
                description="Visited 5 Landmarks" 
                imageUrl={badgeMerlion} 
              />
              <BadgeCard 
                title="Garden Walk" 
                description="Gardens by the Bay" 
                imageUrl={badgeSupertree} 
              />
              <BadgeCard 
                title="Foodie King" 
                description="Ate at 3 Hawkers" 
                imageUrl={imgHawker}
                isLocked
              />
              <BadgeCard 
                title="Night Owl" 
                description="Check-in after 10PM" 
                imageUrl={badgeSupertree} 
                isLocked
              />
            </div>
          </div>
        </div>
      </section>

      {/* Recommended Attractions */}
      <section className="py-16 bg-[var(--panel)]/30">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="font-heading text-3xl font-bold text-[var(--foreground)]">Recommended for You</h2>
              <p className="text-gray-600 mt-1">Based on your preferences and location</p>
            </div>
            <Link href="/explore">
              <Button variant="ghost" className="text-[var(--brand)] hover:text-[var(--brand-hover)]" data-testid="button-see-all">
                See All
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
              title="Chinatown Heritage"
              category="Culture"
              points={200}
              rating={4.6}
              imageUrl={imgHawker}
              distance="0.8km"
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 container mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-12 text-center">
          <div className="flex flex-col items-center">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--panel)] text-[var(--brand)] shadow-sm">
              <Map className="h-8 w-8" />
            </div>
            <h3 className="font-heading text-xl font-bold mb-3 text-[var(--foreground)]">Explore Hidden Gems</h3>
            <p className="text-gray-600 leading-relaxed">
              Go beyond the guidebooks. Find authentic local spots and earn extra points for off-the-beaten-path discoveries.
            </p>
          </div>
          <div className="flex flex-col items-center">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--panel)] text-[var(--brand)] shadow-sm">
              <Trophy className="h-8 w-8" />
            </div>
            <h3 className="font-heading text-xl font-bold mb-3 text-[var(--foreground)]">Collect & Compete</h3>
            <p className="text-gray-600 leading-relaxed">
              Earn unique digital badges and climb the traveler leaderboard. Show off your Singapore expertise.
            </p>
          </div>
          <div className="flex flex-col items-center">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--panel)] text-[var(--brand)] shadow-sm">
              <Zap className="h-8 w-8" />
            </div>
            <h3 className="font-heading text-xl font-bold mb-3 text-[var(--foreground)]">Real Rewards</h3>
            <p className="text-gray-600 leading-relaxed">
              Exchange points for discounts at restaurants, museum tickets, and exclusive souvenirs.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] bg-white py-12 text-sm text-gray-500">
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
          <p>© 2024 ExploreSG Rewards. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-[var(--brand)] transition-colors">Terms</a>
            <a href="#" className="hover:text-[var(--brand)] transition-colors">Privacy</a>
            <a href="#" className="hover:text-[var(--brand)] transition-colors">Partner with Us</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
