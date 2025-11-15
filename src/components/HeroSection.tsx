import { Sparkles } from 'lucide-react';

export const HeroSection = () => {
  return (
    <section className="relative w-full py-6 md:py-8 overflow-hidden border-b backdrop-blur-sm">
      {/* Enhanced gradient background with blur */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-blue-500/5 to-purple-500/8 dark:from-primary/5 dark:via-blue-500/3 dark:to-purple-500/5" />
      <div className="absolute inset-0 bg-gradient-to-t from-background/50 to-transparent" />
      
      <div className="relative container mx-auto px-4 md:px-8">
        <div className="flex items-center justify-between">
          {/* Logo + Titre à gauche */}
          <div className="flex items-center gap-5">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-primary via-blue-600 to-purple-600 bg-clip-text text-transparent drop-shadow-sm">
                Lumea
              </span>
            </h1>
            <div className="h-8 w-px bg-border/50 hidden md:block" />
            <span className="text-sm font-medium text-muted-foreground hidden md:block tracking-wide">
              10-Second Clinical Summary
            </span>
          </div>
          
          {/* Badge à droite avec animation */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-white/90 to-white/70 dark:from-card/90 dark:to-card/70 backdrop-blur-xl border border-primary/20 shadow-lg shadow-primary/5 text-xs font-medium animate-pulse hover:scale-105 transition-transform duration-300">
            <Sparkles className="w-3.5 h-3.5 text-primary animate-pulse" />
            <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">Demo</span>
          </div>
        </div>
      </div>
    </section>
  );
};
