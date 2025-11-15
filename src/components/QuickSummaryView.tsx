import { ClinicalSummary } from '@/types/clinical';
import { AlertCircle, AlertTriangle, Clock, Volume2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AudioPlayer } from './AudioPlayer';
import CountUp from 'react-countup';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface QuickSummaryViewProps {
  summary: ClinicalSummary;
  onShowDetails: () => void;
}

export const QuickSummaryView = ({ summary, onShowDetails }: QuickSummaryViewProps) => {
  const generationTimeSeconds = summary.generation_time_ms ? (summary.generation_time_ms / 1000).toFixed(1) : null;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="space-y-6">
      <div className="text-center space-y-3">
        <motion.h2 initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="text-2xl font-bold">{summary.patient_name}</motion.h2>
        {generationTimeSeconds && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium">
            <Clock className="w-4 h-4" />Brief generated in {generationTimeSeconds} seconds
          </motion.div>
        )}
      </div>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-gradient-to-br from-card to-muted/30 border border-border rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg"><Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" /></div>
          <h3 className="font-bold text-lg">Quick Summary</h3>
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">{summary.resume_clinique?.slice(0, 300) || 'No summary available.'}{summary.resume_clinique && summary.resume_clinique.length > 300 && '...'}</p>
      </motion.div>
      {summary.audio_brief_base64 ? (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }} className={cn("relative overflow-hidden bg-gradient-to-br from-primary/10 via-blue-500/10 to-purple-500/10 dark:from-primary/5 dark:via-blue-500/5 dark:to-purple-500/5 border-2 border-primary/30 rounded-xl p-4 shadow-lg shadow-primary/20")}>
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent opacity-50 blur-xl" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 bg-primary/20 rounded-lg"><Volume2 className="w-5 h-5 text-primary" /></div>
              <div><h3 className="font-bold text-sm">Audio Brief (20s)</h3><p className="text-xs text-muted-foreground">Listen before consultation</p></div>
            </div>
            <AudioPlayer audioBase64={summary.audio_brief_base64} />
          </div>
        </motion.div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} 
          animate={{ opacity: 1, scale: 1 }} 
          transition={{ delay: 0.4 }}
          className="bg-muted/50 border border-dashed border-muted-foreground/30 rounded-xl p-4 text-center"
        >
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Volume2 className="w-4 h-4" />
            <p className="text-sm">Audio brief unavailable - voice synthesis in progress</p>
          </div>
        </motion.div>
      )}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-2 border-green-200 dark:border-green-800 rounded-xl p-4 text-center">
        <p className="text-xs text-green-700 dark:text-green-300 mb-1">⏱️ Time Saved</p>
        <p className="text-4xl font-bold text-green-600 dark:text-green-400"><CountUp end={15} duration={2.5} /><span className="text-2xl ml-1">min</span></p>
      </motion.div>
      <div className="grid md:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }} className={cn("border rounded-xl p-4", summary.red_flags && summary.red_flags.length > 0 ? "border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-950/20" : "border-border bg-card")}>
          <div className="flex items-center gap-2 mb-3"><div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg"><AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" /></div><h3 className="font-bold text-sm">Red Flags</h3></div>
          {summary.red_flags && summary.red_flags.length > 0 ? (<ul className="space-y-1.5">{summary.red_flags.slice(0, 3).map((flag, index) => (<li key={index} className="text-sm flex gap-2"><span className="text-red-600 dark:text-red-400">•</span><span className="text-sm">{flag}</span></li>))}</ul>) : (<p className="text-sm text-muted-foreground">No red flags detected</p>)}
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.7 }} className="border border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3"><div className="p-2 bg-amber-100 dark:bg-amber-900/20 rounded-lg"><AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" /></div><h3 className="font-bold text-sm">Key Points</h3></div>
          {summary.points_de_vigilance && summary.points_de_vigilance.length > 0 ? (<ul className="space-y-1.5">{summary.points_de_vigilance.slice(0, 3).map((point, index) => (<li key={index} className="text-sm flex gap-2"><span className="text-amber-600 dark:text-amber-400">•</span><span className="text-sm">{point}</span></li>))}</ul>) : (<p className="text-sm text-muted-foreground">No specific points</p>)}
        </motion.div>
      </div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}><Button onClick={onShowDetails} variant="outline" className="w-full h-12 text-base font-semibold hover:bg-primary hover:text-primary-foreground transition-all duration-200">View Full Brief</Button></motion.div>
    </motion.div>
  );
};
