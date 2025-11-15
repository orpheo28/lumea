import { SummaryCard } from './SummaryCard';
import { Button } from '@/components/ui/button';
import {
  Stethoscope,
  AlertTriangle,
  Clock,
  AlertCircle,
  FileText,
  MessageCircle,
  Copy,
  Check,
} from 'lucide-react';
import type { ClinicalSummary } from '@/types/clinical';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface SummaryLayoutProps {
  summary: ClinicalSummary;
}

export const SummaryLayout = ({ summary }: SummaryLayoutProps) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const copyNote = () => {
    if (summary.note_medicale_brute) {
      navigator.clipboard.writeText(summary.note_medicale_brute);
      setCopied(true);
      toast({
        title: 'Note copiée',
        description: 'La note médicale a été copiée dans le presse-papier',
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-4">
      <SummaryCard title="Résumé clinique" icon={Stethoscope}>
        <p className="text-sm leading-relaxed">
          {summary.resume_clinique || 'Aucun résumé disponible.'}
        </p>
      </SummaryCard>

      <SummaryCard title="Points de vigilance" icon={AlertTriangle} variant="warning">
        {summary.points_de_vigilance && summary.points_de_vigilance.length > 0 ? (
          <ul className="space-y-2">
            {summary.points_de_vigilance.map((point, index) => (
              <li key={index} className="text-sm flex gap-2">
                <span className="text-amber-600 dark:text-amber-400">•</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            Aucun point particulier identifié dans les documents fournis.
          </p>
        )}
      </SummaryCard>

      <SummaryCard
        title="Red Flags"
        icon={AlertCircle}
        variant={summary.red_flags && summary.red_flags.length > 0 ? 'danger' : 'default'}
      >
        {summary.red_flags && summary.red_flags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {summary.red_flags.map((flag, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-destructive/10 text-destructive text-sm rounded-md border border-destructive/20"
              >
                {flag}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Aucun red flag explicite détecté dans les documents. Toujours interpréter dans le
            contexte clinique.
          </p>
        )}
      </SummaryCard>

      <SummaryCard title="Comparaison avec l'historique" icon={Clock}>
        <p className="text-sm leading-relaxed">
          {summary.comparaison_historique ||
            'Aucune comparaison disponible faute d\'examens antérieurs dans les documents fournis.'}
        </p>
      </SummaryCard>

      <SummaryCard title="Note médicale brute (SOAP)" icon={FileText}>
        <div className="space-y-3">
          <pre className="text-xs font-mono bg-muted p-4 rounded-md overflow-x-auto max-h-64 overflow-y-auto whitespace-pre-wrap">
            {summary.note_medicale_brute || 'Aucune note disponible.'}
          </pre>
          <Button
            variant="outline"
            size="sm"
            onClick={copyNote}
            disabled={!summary.note_medicale_brute}
            className="w-full"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Copié !
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-2" />
                Copier la note
              </>
            )}
          </Button>
        </div>
      </SummaryCard>

      <SummaryCard title="À expliquer au patient" icon={MessageCircle}>
        <p className="text-sm leading-relaxed">
          {summary.a_expliquer_au_patient ||
            'Aucune formulation pédagogique disponible.'}
        </p>
      </SummaryCard>
    </div>
  );
};
