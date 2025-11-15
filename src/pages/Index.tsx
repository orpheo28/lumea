import { useState } from 'react';
import { HeroSection } from '@/components/HeroSection';
import { PatientForm } from '@/components/PatientForm';
import { UploadSection } from '@/components/UploadSection';
import { SummaryLayout } from '@/components/SummaryLayout';
import { QuickSummaryView } from '@/components/QuickSummaryView';
import { DocumentChat } from '@/components/DocumentChat';
import { LoaderOverlay } from '@/components/LoaderOverlay';
import { ErrorBanner } from '@/components/ErrorBanner';
import { useClinicalSummary } from '@/hooks/useClinicalSummary';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, MessageSquare } from 'lucide-react';

const Index = () => {
  const [patientName, setPatientName] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [showDetails, setShowDetails] = useState(false);
  const { isLoading, error, summary, generateSummary, reset } = useClinicalSummary();

  const handleGenerate = async () => {
    await generateSummary(patientName, files);
  };

  const handleRetry = () => {
    reset();
  };

  return (
    <div className="min-h-screen bg-background">
      {isLoading && <LoaderOverlay />}
      
      <HeroSection />

      <main className="container mx-auto px-4 md:px-8 py-8 md:py-12 max-w-7xl">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left column - Input */}
          <div className="space-y-6">
            <PatientForm
              patientName={patientName}
              onPatientNameChange={setPatientName}
              disabled={isLoading}
            />
            <UploadSection
              files={files}
              onFilesChange={setFiles}
              onGenerate={handleGenerate}
              disabled={isLoading}
              isLoading={isLoading}
              patientName={patientName}
            />
          </div>

          {/* Right column - Results */}
          <div className="space-y-4">
            {error && <ErrorBanner message={error} onRetry={handleRetry} onDismiss={reset} />}
            
            {!summary && !error && (
              <div className="border-2 border-dashed border-border rounded-lg p-12 text-center">
                <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Prêt à analyser</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Uploadez des documents médicaux et générez un premier brief clinique en 10
                  secondes.
                </p>
              </div>
            )}

            {summary && !showDetails && (
              <QuickSummaryView summary={summary} onShowDetails={() => setShowDetails(true)} />
            )}

            {summary && showDetails && (
              <Tabs defaultValue="summary" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="summary" className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Résumé
                  </TabsTrigger>
                  <TabsTrigger value="chat" className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Chat RAG
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="summary" className="mt-4">
                  <SummaryLayout summary={summary} />
                </TabsContent>
                
                <TabsContent value="chat" className="mt-4">
                  <DocumentChat summaryId={summary.id} patientName={summary.patient_name} />
                </TabsContent>
              </Tabs>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
