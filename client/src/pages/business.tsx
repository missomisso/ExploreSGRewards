import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, BarChart3, Users, Megaphone } from "lucide-react";

export default function Business() {
  return (
    <div className="min-h-screen bg-background font-sans">
      <Navbar />

      {/* B2B Hero */}
      <section className="relative overflow-hidden bg-primary py-24 text-white">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1565963672773-5028953866b3?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-10 mix-blend-overlay"></div>
        <div className="container relative mx-auto px-4 text-center">
          <span className="mb-4 inline-block rounded-full bg-white/10 px-4 py-1.5 text-sm font-bold backdrop-blur-md border border-white/20 text-yellow-300">
            For Business Partners
          </span>
          <h1 className="font-heading mb-6 text-4xl font-bold md:text-6xl">
            Turn Tourists into Customers
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-xl text-white/90">
            Join ExploreSG Rewards to list your business, create digital coupons, and reach thousands of travelers actively looking for places to spend.
          </p>
          <div className="flex justify-center gap-4">
            <Button size="lg" className="bg-white text-primary hover:bg-gray-100 font-bold h-12 px-8">
              Partner With Us
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 h-12">
              View Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Value Props */}
      <section className="py-20 container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="font-heading text-3xl font-bold text-foreground">Why Partner with ExploreSG?</h2>
          <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
            We bridge the gap between foot traffic and digital engagement, bringing high-intent tourists directly to your door.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <Card className="border-0 shadow-lg">
            <CardContent className="pt-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="font-heading text-xl font-bold mb-2">Increased Foot Traffic</h3>
              <p className="text-muted-foreground">
                Gamification encourages tourists to visit your specific location to unlock badges and rewards.
              </p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg">
             <CardContent className="pt-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                <Megaphone className="h-6 w-6" />
              </div>
              <h3 className="font-heading text-xl font-bold mb-2">Targeted Exposure</h3>
              <p className="text-muted-foreground">
                Showcase your products to users who are nearby and actively exploring your category (Food, Retail, etc.).
              </p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg">
             <CardContent className="pt-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 text-purple-600">
                <BarChart3 className="h-6 w-6" />
              </div>
              <h3 className="font-heading text-xl font-bold mb-2">Actionable Insights</h3>
              <p className="text-muted-foreground">
                Access a dashboard to track check-ins, coupon redemptions, and customer demographics.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Pricing / CTA */}
      <section className="bg-gray-50 py-20 dark:bg-gray-900/50">
         <div className="container mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
           <div>
             <h2 className="font-heading text-3xl font-bold mb-6">Simple, Transparent Pricing</h2>
             <ul className="space-y-4 mb-8">
               {[
                 "Unlimited Business Listings",
                 "Real-time Analytics Dashboard",
                 "Create Custom Coupons & Deals",
                 "Priority Support",
                 "Verified Partner Badge"
               ].map((item) => (
                 <li key={item} className="flex items-center gap-3">
                   <CheckCircle2 className="h-5 w-5 text-primary" />
                   <span className="font-medium">{item}</span>
                 </li>
               ))}
             </ul>
             <Button size="lg" className="bg-primary text-white font-bold">
               Get Started Now
             </Button>
           </div>
           <div className="relative">
             {/* Placeholder for dashboard screenshot */}
             <div className="aspect-video rounded-xl bg-white shadow-2xl border border-gray-200 p-2 flex items-center justify-center text-muted-foreground">
               <span className="text-sm">Dashboard Preview UI</span>
             </div>
             <div className="absolute -bottom-6 -right-6 h-32 w-32 rounded-lg bg-secondary/20 backdrop-blur-lg"></div>
             <div className="absolute -top-6 -left-6 h-32 w-32 rounded-full bg-accent/20 backdrop-blur-lg"></div>
           </div>
         </div>
      </section>
    </div>
  );
}
