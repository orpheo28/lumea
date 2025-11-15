import { Brain } from 'lucide-react';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';

export const LoaderOverlay = () => {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="max-w-2xl w-full space-y-4 p-8">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center mb-8"
        >
          <Brain className="w-16 h-16 mx-auto text-primary mb-4 animate-pulse" />
          <h3 className="text-xl font-bold mb-2">Analyse en cours... 📖</h3>
          <p className="text-muted-foreground">Lecture des documents médicaux</p>
        </motion.div>
        
        {/* Skeleton cards */}
        <Skeleton className="h-32 w-full animate-pulse" />
        <Skeleton className="h-24 w-full animate-pulse" />
        <Skeleton className="h-40 w-full animate-pulse" />
        
        {/* Progress indicator */}
        <div className="space-y-2">
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-primary to-blue-600"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 8, ease: "easeInOut" }}
            />
          </div>
          <p className="text-xs text-center text-muted-foreground">
            Cela prend généralement 10-15 secondes
          </p>
        </div>
      </div>
    </div>
  );
};
