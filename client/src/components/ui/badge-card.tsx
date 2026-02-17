import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";

interface BadgeCardProps {
  title: string;
  description: string;
  imageUrl: string;
  isLocked?: boolean;
}

export function BadgeCard({ title, description, imageUrl, isLocked = false }: BadgeCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <Card className={`relative overflow-hidden border-0 bg-gradient-to-b from-white to-gray-50 p-4 shadow-lg dark:from-gray-900 dark:to-gray-950 ${isLocked ? 'opacity-60 grayscale' : ''}`}>
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-4 h-24 w-24">
            <div className="absolute inset-0 rounded-full bg-primary/10 blur-xl" />
            <img
              src={imageUrl}
              alt={title}
              className="relative h-full w-full object-contain drop-shadow-md"
            />
          </div>
          <h3 className="font-heading text-lg font-bold text-foreground">{title}</h3>
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
          
          {isLocked && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-[1px]">
              <span className="rounded-full bg-gray-900/80 px-3 py-1 text-xs font-bold text-white">
                Locked
              </span>
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
