import { motion } from "framer-motion";
import { MapPin, Star } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface AttractionCardProps {
  title: string;
  category: string;
  points: number;
  rating: number;
  imageUrl: string;
  distance?: string;
}

import { Link } from "wouter";

export function AttractionCard({
  title,
  category,
  points,
  rating,
  imageUrl,
  distance = "0.5km",
}: AttractionCardProps) {
  return (
    <motion.div whileHover={{ y: -5 }} transition={{ duration: 0.2 }}>
      <Card className="overflow-hidden border-0 shadow-md transition-all hover:shadow-xl">
        <div className="relative h-48 w-full overflow-hidden">
          <img
            src={imageUrl}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-500 hover:scale-110"
          />
          <div className="absolute top-3 right-3">
            <Badge variant="secondary" className="bg-white/90 text-primary font-bold backdrop-blur-sm shadow-sm hover:bg-white">
              +{points} pts
            </Badge>
          </div>
          <div className="absolute bottom-3 left-3">
             <Badge className="bg-black/60 text-white hover:bg-black/70 backdrop-blur-sm border-0">
               {category}
             </Badge>
          </div>
        </div>
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-heading text-lg font-bold leading-tight line-clamp-1">{title}</h3>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-accent text-accent" />
              <span className="font-medium text-foreground">{rating}</span>
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              <span>{distance}</span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="p-4 pt-0">
          <Link href="/mission/gardens-by-the-bay">
            <Button className="w-full bg-primary hover:bg-primary/90 text-white shadow-sm">
              Check In & Earn
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
