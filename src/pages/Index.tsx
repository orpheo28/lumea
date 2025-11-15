import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileText, MessageSquare, Calendar, Mail, Users, Sparkles } from 'lucide-react';
import { HeroSection } from '@/components/HeroSection';
import { PatientForm } from '@/components/PatientForm';
import { UploadSection } from '@/components/UploadSection';
import { SummaryLayout } from '@/components/SummaryLayout';
import { QuickSummaryView } from '@/components/QuickSummaryView';
import { DocumentChat } from '@/components/DocumentChat';
import { LoaderOverlay } from '@/components/LoaderOverlay';
import { ErrorBanner } from '@/components/ErrorBanner';
import { MedicalTimeline } from '@/components/MedicalTimeline';
import { MedicalLetters } from '@/components/MedicalLetters';
import { useClinicalSummary } from '@/hooks/useClinicalSummary';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';

const Index = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [patientName, setPatientName] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [showDetails, setShowDetails] = useState(false);
  const { isLoading, error, summary, generateSummary, reset } = useClinicalSummary();

  useEffect(() => {
    const summaryId = searchParams.get('summaryId');
    if (summaryId) {
      loadSummary(summaryId);
    }
  }, [searchParams]);

  const loadSummary = async (summaryId: string) => {
    try {
      const { data, error } = await supabase
        .from('clinical_summaries')
        .select('*')
        .eq('id', summaryId)
        .single();

      if (error) throw error;
      if (data) {
        // Load the summary into the state via the hook
        // For now, we'll just trigger a navigation refresh
        setShowDetails(true);
      }
    } catch (err) {
      console.error('Error loading summary:', err);
    }
  };

  const handleGenerate = async () => {
    await generateSummary(patientName, files);
  };

  const handleRetry = () => {
    reset();
  };

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {isLoading && <LoaderOverlay />}
      
      <HeroSection />

      <main className="flex-1 overflow-hidden">
        <div className="h-full container mx-auto px-4 md:px-8 max-w-7xl pt-4">
          <div className="grid lg:grid-cols-2 gap-6 h-full">
            {/* Left column - Input */}
            <ScrollArea className="h-full pr-4">
              <div className="space-y-4 pb-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold">Nouveau brief</h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/patients')}
                    className="flex items-center gap-2"
                  >
                    <Users className="w-3 h-3" />
                <span className="ml-2 hidden md:inline">Multi-patient</span>
              </Button>
                </div>
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
            </ScrollArea>

            {/* Right column - Results */}
            <ScrollArea className="h-full pr-4">
              <div className="space-y-4 pb-6">
            {error && <ErrorBanner message={error} onRetry={handleRetry} onDismiss={reset} />}
            
            {!summary && !error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="border-2 border-dashed border-border rounded-2xl p-12 text-center bg-gradient-to-br from-muted/50 to-background"
              >
                <div className="relative mb-6">
                  <div className="w-24 h-24 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                    <FileText className="w-12 h-12 text-primary" />
                  </div>
                  <Sparkles className="absolute top-0 right-1/3 w-6 h-6 text-amber-400 animate-pulse" />
                  <Sparkles className="absolute bottom-0 left-1/3 w-4 h-4 text-blue-400 animate-pulse" style={{ animationDelay: '500ms' }} />
                </div>
                <h3 className="text-xl font-bold mb-2">Prêt à analyser ✨</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Uploadez les documents médicaux et nous générerons un brief clinique complet en quelques secondes
                </p>
              </motion.div>
            )}

            {summary && !showDetails && (
              <QuickSummaryView summary={summary} onShowDetails={() => setShowDetails(true)} />
            )}

            {summary && showDetails && (
              <Tabs defaultValue="summary" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="summary" className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Résumé
                  </TabsTrigger>
                  <TabsTrigger value="timeline" className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Timeline
                  </TabsTrigger>
                  <TabsTrigger value="letters" className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Courriers
                  </TabsTrigger>
                  <TabsTrigger value="chat" className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Chat RAG
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="summary" className="mt-4">
                  <SummaryLayout summary={summary} />
                </TabsContent>

                <TabsContent value="timeline" className="mt-4">
                  <MedicalTimeline summaryId={summary.id} />
                </TabsContent>

                <TabsContent value="letters" className="mt-4">
                  <MedicalLetters summaryId={summary.id} />
                </TabsContent>
                
                <TabsContent value="chat" className="mt-4">
                  <DocumentChat summaryId={summary.id} patientName={summary.patient_name} />
                </TabsContent>
              </Tabs>
            )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
