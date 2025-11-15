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
      <div className="space-y-3">
        <h3 className="text-base font-semibold">Documents médicaux</h3>
        
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300 cursor-pointer",
            isDragging
              ? "border-primary bg-primary/10 scale-105 shadow-lg"
              : "border-border hover:border-primary/50 bg-muted/30"
          )}
          onClick={() => document.getElementById('file-input')?.click()}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", bounce: 0.5 }}
          >
            <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          </motion.div>
          <p className="text-base font-medium mb-2">
            Glissez-déposez jusqu'à 5 documents (PDF ou images)
          </p>
          <p className="text-sm text-muted-foreground">
            Comptes-rendus, bilans, IRM, radios, scanners...
          </p>
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
          <div className="space-y-2">
            {files.map((file, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="p-3 flex items-center justify-between hover:shadow-md transition-all duration-200">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {file.type.startsWith('image/') ? (
                      <FileImage className="w-5 h-5 text-blue-500 flex-shrink-0" />
                    ) : (
                      <FileText className="w-5 h-5 text-primary flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <Badge variant="secondary" className="flex-shrink-0">
                      {file.type.startsWith('image/') ? 'IMAGE' : 'PDF'}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFile(index)}
                    disabled={disabled}
                    className="flex-shrink-0 ml-2"
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
          "w-full h-14 text-base font-semibold relative overflow-hidden",
          "bg-gradient-to-r from-primary to-blue-600 hover:shadow-xl hover:scale-105",
          "transition-all duration-300",
          "disabled:opacity-50 disabled:hover:scale-100"
        )}
        size="lg"
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            Analyse en cours...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Générer le brief clinique
          </span>
        )}
      </Button>
    </div>
  );
};
