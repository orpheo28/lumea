import { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FileText, X, Upload } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

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
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const droppedFiles = Array.from(e.dataTransfer.files).filter(
        (file) => file.type === 'application/pdf'
      );
      if (droppedFiles.length > 0) {
        onFilesChange([...files, ...droppedFiles].slice(0, 3));
      }
    },
    [files, onFilesChange]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        const selectedFiles = Array.from(e.target.files).filter(
          (file) => file.type === 'application/pdf'
        );
        onFilesChange([...files, ...selectedFiles].slice(0, 3));
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
          className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer bg-muted/30"
          onClick={() => document.getElementById('file-input')?.click()}
        >
          <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-base font-medium mb-2">
            Glissez-déposez jusqu'à 3 comptes-rendus / bilans en PDF
          </p>
          <p className="text-sm text-muted-foreground">
            Ou cliquez pour parcourir vos fichiers
          </p>
          <input
            id="file-input"
            type="file"
            accept="application/pdf"
            multiple
            onChange={handleFileInput}
            className="hidden"
            disabled={disabled}
          />
        </div>

        {files.length > 0 && (
          <div className="space-y-2">
            {files.map((file, index) => (
              <Card key={index} className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <FileText className="w-5 h-5 text-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <Badge variant="secondary" className="flex-shrink-0">PDF</Badge>
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
            ))}
          </div>
        )}
      </div>

      <Button
        onClick={onGenerate}
        disabled={!canGenerate || isLoading}
        className="w-full h-12 text-base font-semibold"
        size="lg"
      >
        {isLoading ? 'Analyse en cours...' : 'Générer le brief clinique'}
      </Button>
    </div>
  );
};
