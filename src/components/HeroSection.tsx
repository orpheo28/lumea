export const HeroSection = () => {
  return (
    <section className="w-full py-12 md:py-16 bg-gradient-to-br from-primary/5 via-background to-background border-b border-border">
      <div className="container mx-auto px-4 md:px-8 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 rounded-full bg-muted border border-border">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Hackathon Demo
          </span>
          <span className="text-xs text-muted-foreground">•</span>
          <span className="text-xs text-muted-foreground">Non destiné à un usage médical réel</span>
        </div>
        
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 bg-gradient-to-br from-primary to-primary/60 bg-clip-text text-transparent">
          Medora MD
        </h1>
        
        <p className="text-xl md:text-2xl font-semibold text-foreground mb-3">
          10-Second Clinical Summary
        </p>
        
        <p className="text-base md:text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
          Le premier assistant qui lit <span className="font-semibold text-foreground">TOUT</span> le dossier médical pour vous,
          et vous donne en 10 secondes exactement ce que vous devez savoir pour commencer la consultation.
        </p>
      </div>
    </section>
  );
};
