import { Brain, FileText, Scan, Sparkles, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { useState, useEffect } from 'react';

export const LoaderOverlay = () => {
  const messages = [
    "Analyzing medical documents...",
    "Extracting clinical findings...",
    "Building patient timeline...",
    "Generating clinical summary..."
  ];

  const [currentMessage, setCurrentMessage] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessage(prev => (prev + 1) % messages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="max-w-2xl w-full space-y-4 p-8">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center mb-8"
        >
          <motion.div
            animate={{ 
              rotate: [0, 10, -10, 10, 0],
              scale: [1, 1.05, 1, 1.05, 1]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <Brain className="w-16 h-16 mx-auto text-primary mb-4" />
          </motion.div>
          <h3 className="text-xl font-bold mb-2">Analysis in progress</h3>
          <AnimatePresence mode="wait">
            <motion.p
              key={currentMessage}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="text-muted-foreground"
            >
              {messages[currentMessage]}
            </motion.p>
          </AnimatePresence>
        </motion.div>
        
        {/* Processing steps */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6"
        >
          <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-primary/10 border border-primary/20">
            <FileText className="w-5 h-5 text-primary animate-pulse" />
            <span className="text-xs font-medium">Upload</span>
          </div>
          <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-primary/10 border border-primary/20">
            <Scan className="w-5 h-5 text-primary animate-pulse" />
            <span className="text-xs font-medium">OCR</span>
          </div>
          <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/10">
            <Sparkles className="w-5 h-5 text-primary/60 animate-pulse" />
            <span className="text-xs font-medium text-muted-foreground">Extract</span>
          </div>
          <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-muted/50 border border-muted">
            <CheckCircle2 className="w-5 h-5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">Generate</span>
          </div>
        </motion.div>
        
        {/* Skeleton cards */}
        <Skeleton className="h-32 w-full animate-pulse" />
        <Skeleton className="h-24 w-full animate-pulse" />
        <Skeleton className="h-40 w-full animate-pulse" />
        
        {/* Progress indicator */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>Processing...</span>
            <span className="font-mono">~60s</span>
          </div>
          <div className="relative h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-primary via-blue-500 to-primary"
              style={{ backgroundSize: '200% 100%' }}
              initial={{ x: "-100%" }}
              animate={{ x: "0%" }}
              transition={{ duration: 60, ease: "linear" }}
            />
            {/* Shimmer effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              animate={{ x: ["0%", "200%"] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            />
          </div>
          <p className="text-xs text-center text-muted-foreground">
            Usually completes in under 1 minute
          </p>
        </div>
      </div>
    </div>
  );
};
