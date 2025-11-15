import { SummaryCard } from './SummaryCard';
import { AudioPlayer } from './AudioPlayer';
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
  Download,
} from 'lucide-react';
import type { ClinicalSummary } from '@/types/clinical';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { usePdfExport } from '@/hooks/usePdfExport';

interface SummaryLayoutProps {
  summary: ClinicalSummary;
}

export const SummaryLayout = ({ summary }: SummaryLayoutProps) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const { exportToPdf, isExporting } = usePdfExport();

  const copyNote = () => {
    if (summary.note_medicale_brute) {
      navigator.clipboard.writeText(summary.note_medicale_brute);
      setCopied(true);
      toast({
        title: 'Note copied',
        description: 'Medical note copied to clipboard',
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleExport = async () => {
    const result = await exportToPdf(summary);
    if (result.success) {
      toast({
        title: 'PDF exported',
        description: 'Clinical brief successfully downloaded',
      });
    } else {
      toast({
        title: 'Error',
        description: "Unable to export PDF",
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-2">
      {/* Export PDF Button */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          disabled={isExporting}
          className="gap-2"
        >
          <Download className="w-3 h-3" />
          {isExporting ? 'Export...' : 'PDF'}
        </Button>
      </div>

      {/* Audio Brief */}
      {summary.audio_brief_base64 && (
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-2">
          <AudioPlayer audioBase64={summary.audio_brief_base64} />
        </div>
      )}

      {/* Generation Time Badge */}
      {summary.generation_time_ms && (
        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">
            <Clock className="w-3 h-3" />
            {(summary.generation_time_ms / 1000).toFixed(1)}s
          </span>
        </div>
      )}

      <SummaryCard title="Clinical Summary" icon={Stethoscope}>
        <p className="text-sm leading-relaxed">
          {summary.resume_clinique || 'No summary available.'}
        </p>
      </SummaryCard>

      <SummaryCard title="Key Points" icon={AlertTriangle} variant="warning">
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
            No specific points identified in provided documents.
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
            No explicit red flags detected in documents. Always interpret in clinical context.
          </p>
        )}
      </SummaryCard>

      {/* Inconsistencies Section */}
      {summary.inconsistencies && summary.inconsistencies.length > 0 && (
        <SummaryCard 
          title="🔍 Detected Inconsistencies" 
          icon={AlertTriangle}
          variant="warning"
        >
          <div className="space-y-3">
            {summary.inconsistencies.map((inc, index) => {
              const severityColors = {
                low: 'bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-300',
                medium: 'bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800 text-orange-800 dark:text-orange-300',
                high: 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300'
              };
              
              const severityLabels = {
                low: 'Low',
                medium: 'Medium',
                high: 'High'
              };

              return (
                <div 
                  key={index}
                  className={`border rounded-lg p-3 ${severityColors[inc.severity]}`}
                >
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold uppercase">
                          {inc.type.replace('_', ' ')}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-background/50">
                          Severity: {severityLabels[inc.severity]}
                        </span>
                      </div>
                      <p className="text-sm font-medium">{inc.description}</p>
                      {inc.details && (
                        <p className="text-xs mt-1 opacity-80">{inc.details}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </SummaryCard>
      )}

      <SummaryCard title="Comparison with History" icon={Clock}>
        <p className="text-sm leading-relaxed">
          {summary.comparaison_historique ||
            'No comparison available due to lack of previous exams in provided documents.'}
        </p>
      </SummaryCard>

      <SummaryCard title="Raw Medical Note (SOAP)" icon={FileText}>
        <div className="space-y-3">
          <pre className="text-xs font-mono bg-muted p-4 rounded-md overflow-x-auto max-h-64 overflow-y-auto whitespace-pre-wrap">
            {summary.note_medicale_brute || 'No note available.'}
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
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-2" />
                Copy Note
              </>
            )}
          </Button>
        </div>
      </SummaryCard>

      <SummaryCard title="To Explain to Patient" icon={MessageCircle}>
        <p className="text-sm leading-relaxed">
          {summary.a_expliquer_au_patient ||
            'No patient-friendly explanation available.'}
        </p>
      </SummaryCard>
    </div>
  );
};
