import { Sparkles, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

export const HeroSection = () => {
  return (
    <section className="relative w-full py-16 md:py-24 overflow-hidden">
      {/* Gradient background animé */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-blue-500/5 to-purple-500/10 dark:from-primary/5 dark:via-blue-500/2 dark:to-purple-500/5" />
      
      {/* Circles flottants */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      
      <div className="relative container mx-auto px-4 md:px-8 text-center">
        {/* Badge avec animation */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-2 mb-8 rounded-full bg-white/80 dark:bg-card/80 backdrop-blur border border-border shadow-lg"
        >
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">Hackathon Demo</span>
          <span className="text-xs text-muted-foreground">•</span>
          <span className="text-xs text-muted-foreground">Non destiné à un usage médical réel</span>
        </motion.div>
        
        {/* Titre avec gradient animé */}
        <motion.h1
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="text-5xl md:text-7xl font-bold mb-6"
        >
          <span className="bg-gradient-to-r from-primary via-blue-600 to-purple-600 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
            Medora MD
          </span>
        </motion.h1>
        
        {/* Subtitle avec icon */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex items-center justify-center gap-3 mb-4"
        >
          <Zap className="w-6 h-6 text-primary" />
          <p className="text-2xl md:text-3xl font-bold">
            10-Second Clinical Summary
          </p>
        </motion.div>
        
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto"
        >
          Le premier assistant qui lit <span className="font-bold text-foreground">TOUT</span> le dossier médical pour vous,
          et vous donne en <span className="font-bold text-primary">10 secondes</span> exactement ce que vous devez savoir.
        </motion.p>
      </div>
    </section>
  );
};
