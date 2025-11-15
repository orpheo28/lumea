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
    { id: 'courrier_medecin', label: 'Courrier médecin', icon: FileText },
    { id: 'courrier_patient', label: 'Courrier patient', icon: FileText },
    { id: 'compte_rendu', label: 'Compte-rendu', icon: FileText },
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
          title: "✅ Courrier généré",
          description: "Le courrier a été généré avec succès.",
        });
      } else {
        throw new Error(data.error || 'Failed to generate letter');
      }
    } catch (err) {
      console.error('Error generating letter:', err);
      toast({
        title: "❌ Erreur",
        description: err instanceof Error ? err.message : 'Erreur lors de la génération',
        variant: "destructive",
      });
    } finally {
      setIsGenerating(prev => ({ ...prev, [letterType]: false }));
    }
  };

  const copyToClipboard = (content: string, letterType: string) => {
    navigator.clipboard.writeText(content);
    setCopied(letterType);
    toast({
      title: "📋 Copié",
      description: "Le courrier a été copié dans le presse-papier.",
    });
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Courriers médicaux</h2>
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
                    Générez automatiquement un {type.label.toLowerCase()} professionnel.
                  </p>
                  <Button
                    onClick={() => generateLetter(type.id)}
                    disabled={isGenerating[type.id]}
                  >
                    {isGenerating[type.id] ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Génération...
                      </>
                    ) : (
                      <>
                        <FileText className="w-4 h-4 mr-2" />
                        Générer
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
                          Copié
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-2" />
                          Copier
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
                        Régénération...
                      </>
                    ) : (
                      'Régénérer'
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
