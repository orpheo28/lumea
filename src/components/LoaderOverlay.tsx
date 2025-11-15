import { Loader2 } from 'lucide-react';

export const LoaderOverlay = () => {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="text-center space-y-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
        <div>
          <p className="text-lg font-semibold mb-1">Analyse des documents en cours...</p>
          <p className="text-sm text-muted-foreground">
            Medora MD lit vos PDF et prépare le résumé clinique
          </p>
        </div>
      </div>
    </div>
  );
};
