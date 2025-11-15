import { AlertCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorBannerProps {
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
}

export const ErrorBanner = ({ message, onRetry, onDismiss }: ErrorBannerProps) => {
  return (
    <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-start gap-3">
      <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-destructive mb-1">
          Erreur lors de la génération du brief
        </p>
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            Réessayer
          </Button>
        )}
        {onDismiss && (
          <Button variant="ghost" size="icon" onClick={onDismiss}>
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
};
