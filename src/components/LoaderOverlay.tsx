import { Loader2 } from 'lucide-react';

export const LoaderOverlay = () => {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="text-center space-y-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
        <div>
          <p className="text-lg font-semibold mb-1">Génération du brief en cours...</p>
          <p className="text-sm text-muted-foreground">
            Analyse des documents + génération audio
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Objectif : {'<'} 10 secondes ⚡
          </p>
        </div>
      </div>
    </div>
  );
};
