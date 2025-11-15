import { AlertCircle, AlertTriangle, Clock, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ClinicalSummary } from '@/types/clinical';
import { AudioPlayer } from '@/components/AudioPlayer';

interface QuickSummaryViewProps {
  summary: ClinicalSummary;
  onShowDetails: () => void;
}

export const QuickSummaryView = ({ summary, onShowDetails }: QuickSummaryViewProps) => {
  const topRedFlags = summary.red_flags?.slice(0, 3) || [];
  const topVigilance = summary.points_de_vigilance?.slice(0, 3) || [];
  
  // Extract first sentence of clinical summary
  const quickResume = summary.resume_clinique?.split('.')[0] + '.' || 'Aucun résumé disponible.';

  return (
    <div className="bg-gradient-to-br from-primary/5 via-background to-background border-2 border-primary/20 rounded-xl p-6 shadow-lg">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold mb-1">{summary.patient_name}</h2>
          {summary.generation_time_ms && (
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Brief généré en {(summary.generation_time_ms / 1000).toFixed(1)}s
            </p>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {/* Quick Resume */}
        <div className="bg-card/50 rounded-lg p-3 border border-border">
          <p className="text-sm leading-relaxed">{quickResume}</p>
        </div>

        {/* Audio Brief */}
        {summary.audio_brief_base64 && (
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <Volume2 className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-sm">Brief Audio (20s)</h3>
            </div>
            <AudioPlayer audioBase64={summary.audio_brief_base64} />
          </div>
        )}

        {/* Time Saved Counter */}
        <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg p-2 text-center">
          <p className="text-xs text-green-900 dark:text-green-200">
            ⏱️ ~15 minutes économisées sur ce dossier
          </p>
        </div>

        {/* Red Flags & Vigilance in 2 columns */}
        <div className="grid md:grid-cols-2 gap-3">
          {/* Red Flags */}
          <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-destructive" />
              <h3 className="font-semibold text-sm">Red Flags</h3>
            </div>
            {topRedFlags.length > 0 ? (
              <ul className="space-y-1">
                {topRedFlags.map((flag, idx) => (
                  <li key={idx} className="text-xs text-destructive flex gap-1.5">
                    <span>•</span>
                    <span className="line-clamp-1">{flag}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground">Aucun</p>
            )}
          </div>

          {/* Points de Vigilance */}
          <div className="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <h3 className="font-semibold text-sm">Points de vigilance</h3>
            </div>
            {topVigilance.length > 0 ? (
              <ul className="space-y-1">
                {topVigilance.map((point, idx) => (
                  <li key={idx} className="text-xs text-amber-900 dark:text-amber-200 flex gap-1.5">
                    <span>•</span>
                    <span className="line-clamp-1">{point}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground">Aucun</p>
            )}
          </div>
        </div>

        <Button onClick={onShowDetails} className="w-full">
          Voir le brief complet
        </Button>
      </div>
    </div>
  );
};
