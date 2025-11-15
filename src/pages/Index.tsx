import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileText, MessageSquare, Calendar, Users, Sparkles } from 'lucide-react';
import { HeroSection } from '@/components/HeroSection';
import { PatientForm } from '@/components/PatientForm';
import { UploadSection } from '@/components/UploadSection';
import { SummaryLayout } from '@/components/SummaryLayout';
import { QuickSummaryView } from '@/components/QuickSummaryView';
import { DocumentChat } from '@/components/DocumentChat';
import { LoaderOverlay } from '@/components/LoaderOverlay';
import { ErrorBanner } from '@/components/ErrorBanner';
import { MedicalTimeline } from '@/components/MedicalTimeline';
import { Card } from '@/components/ui/card';

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
              <div className="space-y-6 pb-6">
                <Card className="p-6 md:p-8 shadow-xl shadow-primary/5 border-2 rounded-2xl bg-gradient-to-br from-background via-background to-muted/20">
                  <div className="space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between pb-6 border-b border-border/50">
                      <h2 className="text-2xl font-bold flex items-center gap-3">
                        <motion.div
                          animate={{ rotate: [0, 15, -15, 0] }}
                          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                        >
                          <Sparkles className="w-6 h-6 text-primary" />
                        </motion.div>
                        <span className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                          Nouveau Brief
                        </span>
                      </h2>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate('/patients')}
                        className="flex items-center gap-2 hover:bg-primary/10 hover:text-primary hover:border-primary/50 transition-all duration-300 rounded-lg"
                      >
                        <Users className="w-4 h-4" />
                        <span className="hidden sm:inline">Multi-patient</span>
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
                </Card>
              </div>
            </ScrollArea>

            {/* Right column - Results */}
            <ScrollArea className="h-full pr-4">
              <div className="space-y-6 pb-6">
                {error && (
                  <ErrorBanner
                    message={error}
                    onRetry={handleRetry}
                  />
                )}

                {!summary && !error && (
                  <div className="flex items-center justify-center h-[calc(100vh-200px)]">
                    <Card className="max-w-md p-12 text-center border-2 border-dashed rounded-2xl bg-gradient-to-br from-muted/30 via-background to-muted/30">
                      <motion.div
                        animate={{ 
                          y: [0, -10, 0],
                          rotate: [0, 5, -5, 0]
                        }}
                        transition={{ 
                          duration: 4, 
                          repeat: Infinity, 
                          ease: "easeInOut" 
                        }}
                      >
                        <FileText className="w-20 h-20 mx-auto mb-6 text-primary/30" />
                      </motion.div>
                      <h3 className="text-xl font-semibold mb-3 bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                        Brief Clinique
                      </h3>
                      <p className="text-muted-foreground mb-2">
                        Le résumé clinique apparaîtra ici
                      </p>
                      <p className="text-sm text-muted-foreground/70">
                        Remplissez le formulaire et uploadez vos documents pour générer une analyse complète
                      </p>
                      <div className="mt-6 flex items-center justify-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-primary/40 animate-pulse" />
                        <div className="w-2 h-2 rounded-full bg-blue-500/40 animate-pulse" style={{ animationDelay: '0.2s' }} />
                        <div className="w-2 h-2 rounded-full bg-purple-500/40 animate-pulse" style={{ animationDelay: '0.4s' }} />
                      </div>
                    </Card>
                  </div>
                )}

            {summary && !showDetails && (
              <QuickSummaryView summary={summary} onShowDetails={() => setShowDetails(true)} />
            )}

            {summary && showDetails && (
              <Tabs defaultValue="summary" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="summary" className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Résumé
                  </TabsTrigger>
                  <TabsTrigger value="timeline" className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Timeline
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
