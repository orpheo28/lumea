import { Sparkles } from 'lucide-react';

export const HeroSection = () => {
  return (
    <section className="relative w-full py-4 md:py-6 overflow-hidden border-b">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-blue-500/5 dark:from-primary/3 dark:to-blue-500/3" />
      
      <div className="relative container mx-auto px-4 md:px-8">
        <div className="flex items-center justify-between">
          {/* Logo + Titre à gauche */}
          <div className="flex items-center gap-4">
            <h1 className="text-2xl md:text-3xl font-bold">
              <span className="bg-gradient-to-r from-primary via-blue-600 to-purple-600 bg-clip-text text-transparent">
                Lumea
              </span>
            </h1>
            <span className="text-sm text-muted-foreground hidden md:block">
              10-Second Clinical Summary
            </span>
          </div>
          
          {/* Badge à droite */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 dark:bg-card/80 backdrop-blur border border-border text-xs">
            <Sparkles className="w-3 h-3 text-primary" />
            <span>Demo</span>
          </div>
        </div>
      </div>
    </section>
  );
};
