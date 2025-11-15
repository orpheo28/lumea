import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Loader2, Copy, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MedicalLettersProps {
  summaryId: string;
}

export const MedicalLetters = ({ summaryId }: MedicalLettersProps) => {
  const [isGenerating, setIsGenerating] = useState<Record<string, boolean>>({});
  const [letters, setLetters] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState<string | null>(null);
  const { toast } = useToast();

  const letterTypes = [
    { id: 'courrier_medecin', label: 'Physician Letter', icon: FileText },
    { id: 'courrier_patient', label: 'Patient Letter', icon: FileText },
    { id: 'compte_rendu', label: 'Consultation Report', icon: FileText },
  ];

  const generateLetter = async (letterType: string) => {
    setIsGenerating(prev => ({ ...prev, [letterType]: true }));

    try {
      const { data, error } = await supabase.functions.invoke('generate-medical-letter', {
        body: { summaryId, letterType }
      });

      if (error) throw error;

      if (data.success && data.letter) {
        setLetters(prev => ({ ...prev, [letterType]: data.letter.content }));
        toast({
          title: "✅ Letter generated",
          description: "The letter was successfully generated.",
        });
      } else {
        throw new Error(data.error || 'Failed to generate letter');
      }
    } catch (err) {
      console.error('Error generating letter:', err);
      
      const errorMessage = err instanceof Error ? err.message : 'Error generating letter';
      const isQuotaError = errorMessage.includes('quota');
      
      toast({
        title: isQuotaError ? "⏳ API Quota Exceeded" : "❌ Error",
        description: isQuotaError 
          ? "The Gemini API quota has been exceeded. Please wait a few minutes and try again."
          : errorMessage,
        variant: "destructive",
        duration: isQuotaError ? 8000 : 5000,
      });
    } finally {
      setIsGenerating(prev => ({ ...prev, [letterType]: false }));
    }
  };

  const copyToClipboard = (content: string, letterType: string) => {
    navigator.clipboard.writeText(content);
    setCopied(letterType);
    toast({
      title: "📋 Copied",
      description: "The letter has been copied to clipboard.",
    });
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Medical Letters</h2>
      </div>

      <Tabs defaultValue="courrier_medecin" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          {letterTypes.map(type => (
            <TabsTrigger key={type.id} value={type.id} className="flex items-center gap-2">
              <type.icon className="w-4 h-4" />
              {type.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {letterTypes.map(type => (
          <TabsContent key={type.id} value={type.id} className="mt-4">
            <Card className="p-6">
              {!letters[type.id] ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">
                    {type.label}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Automatically generate a professional {type.label.toLowerCase()}.
                  </p>
                  <Button
                    onClick={() => generateLetter(type.id)}
                    disabled={isGenerating[type.id]}
                  >
                    {isGenerating[type.id] ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <FileText className="w-4 h-4 mr-2" />
                        Generate
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">{type.label}</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(letters[type.id], type.id)}
                    >
                    {copied === type.id ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-2" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
                <div className="bg-muted/30 rounded-lg p-4 whitespace-pre-wrap text-sm leading-relaxed border border-border">
                  {letters[type.id]}
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => generateLetter(type.id)}
                  disabled={isGenerating[type.id]}
                >
                  {isGenerating[type.id] ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Regenerating...
                    </>
                  ) : (
                    'Regenerate'
                  )}
                </Button>
                </div>
              )}
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};
