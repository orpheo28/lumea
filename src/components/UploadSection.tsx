import { useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FileText, X, Upload, FileImage, Sparkles, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface UploadSectionProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
  onGenerate: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  patientName: string;
}

export const UploadSection = ({
  files,
  onFilesChange,
  onGenerate,
  disabled,
  isLoading,
  patientName,
}: UploadSectionProps) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const droppedFiles = Array.from(e.dataTransfer.files).filter(
        (file) => file.type === 'application/pdf' || file.type.startsWith('image/')
      );
      if (droppedFiles.length > 0) {
        onFilesChange([...files, ...droppedFiles].slice(0, 5));
      }
    },
    [files, onFilesChange]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        const selectedFiles = Array.from(e.target.files).filter(
          (file) => file.type === 'application/pdf' || file.type.startsWith('image/')
        );
        onFilesChange([...files, ...selectedFiles].slice(0, 5));
      }
    },
    [files, onFilesChange]
  );

  const removeFile = useCallback(
    (index: number) => {
      onFilesChange(files.filter((_, i) => i !== index));
    },
    [files, onFilesChange]
  );

  const canGenerate = patientName.trim() !== '' && files.length > 0 && !disabled;

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          <h3 className="text-base font-semibold">Documents Médicaux</h3>
        </div>
        
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          className={cn(
            "group relative border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-500 cursor-pointer overflow-hidden",
            isDragging
              ? "border-primary bg-gradient-to-br from-primary/15 via-blue-500/10 to-purple-500/15 scale-[1.02] shadow-2xl shadow-primary/20"
              : "border-border/60 hover:border-primary/60 bg-gradient-to-br from-muted/40 via-background/50 to-muted/40 hover:shadow-xl hover:shadow-primary/5"
          )}
          onClick={() => document.getElementById('file-input')?.click()}
        >
          {/* Background gradient effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", bounce: 0.5 }}
            className="relative"
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <Upload className="w-14 h-14 mx-auto mb-5 text-primary/70 group-hover:text-primary transition-colors duration-300" />
            </motion.div>
          </motion.div>
          <p className="relative text-lg font-semibold mb-2 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Déposez jusqu'à 5 documents
          </p>
          <p className="relative text-sm text-muted-foreground mb-3">
            PDF ou images (rapports, analyses, IRM, radiographies...)
          </p>
          <div className="relative inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-xs font-medium">
            <Sparkles className="w-3 h-3" />
            <span>Cliquez ou glissez-déposez</span>
          </div>
          <input
            id="file-input"
            type="file"
            accept="application/pdf,image/*"
            multiple
            onChange={handleFileInput}
            className="hidden"
            disabled={disabled}
          />
        </div>

        {files.length > 0 && (
          <div className="space-y-3">
            {files.map((file, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="group p-4 flex items-center justify-between hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 border-2 hover:border-primary/30 rounded-xl bg-gradient-to-r from-background to-muted/30">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors duration-300">
                      {file.type.startsWith('image/') ? (
                        <FileImage className="w-6 h-6 text-blue-500 flex-shrink-0" />
                      ) : (
                        <FileText className="w-6 h-6 text-primary flex-shrink-0" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-2">
                        {(file.size / 1024).toFixed(1)} KB
                        <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
                        <span className="text-green-600 dark:text-green-400">✓ Prêt</span>
                      </p>
                    </div>
                    <Badge variant="secondary" className="flex-shrink-0 font-semibold px-3 py-1">
                      {file.type.startsWith('image/') ? 'IMAGE' : 'PDF'}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFile(index)}
                    disabled={disabled}
                    className="flex-shrink-0 ml-2 hover:bg-destructive/10 hover:text-destructive rounded-lg transition-all duration-300"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <Button
        onClick={onGenerate}
        disabled={!canGenerate || isLoading}
        className={cn(
          "w-full h-16 text-lg font-bold relative overflow-hidden group",
          "bg-gradient-to-r from-primary via-blue-600 to-purple-600 hover:shadow-2xl hover:shadow-primary/30 hover:scale-[1.02]",
          "transition-all duration-500 rounded-xl",
          "disabled:opacity-50 disabled:hover:scale-100 disabled:shadow-none"
        )}
        size="lg"
      >
        {/* Animated background shimmer */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
        
        {isLoading ? (
          <span className="relative flex items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span>Analyse en cours...</span>
          </span>
        ) : (
          <span className="relative flex items-center gap-3">
            <motion.div
              animate={{ rotate: [0, 15, -15, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <Sparkles className="w-6 h-6" />
            </motion.div>
            <span>Générer le Brief Clinique</span>
          </span>
        )}
      </Button>
    </div>
  );
};
