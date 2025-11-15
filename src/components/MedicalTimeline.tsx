import { useEffect, useState } from 'react';
import { Calendar, Activity, FileText, Stethoscope, Pill, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';

interface TimelineEvent {
  id: string;
  event_date: string;
  event_type: string;
  description: string;
  document_source: string;
}

interface MedicalTimelineProps {
  summaryId: string;
}

export const MedicalTimeline = ({ summaryId }: MedicalTimelineProps) => {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTimeline();
  }, [summaryId]);

  const fetchTimeline = async () => {
    const { data, error } = await supabase
      .from('medical_timeline')
      .select('*')
      .eq('summary_id', summaryId)
      .order('event_date', { ascending: false });

    if (!error && data) {
      setEvents(data);
    }
    setIsLoading(false);
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'examen': return <Activity className="w-4 h-4" />;
      case 'consultation': return <Stethoscope className="w-4 h-4" />;
      case 'hospitalisation': return <AlertCircle className="w-4 h-4" />;
      case 'traitement': return <Pill className="w-4 h-4" />;
      case 'diagnostic': return <FileText className="w-4 h-4" />;
      default: return <Calendar className="w-4 h-4" />;
    }
  };

  const getEventColor = (type: string) => {
    const colors: Record<string, string> = {
      examen: 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
      consultation: 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800',
      hospitalisation: 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800',
      traitement: 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
      diagnostic: 'bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800',
      autre: 'bg-muted text-muted-foreground border-border'
    };
    return colors[type] || colors.autre;
  };

  if (isLoading) {
    return <div className="animate-pulse text-muted-foreground">Chargement de la timeline...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">Timeline médicale</h3>
        <span className="text-sm text-muted-foreground">({events.length} événements)</span>
      </div>

      {/* Timeline visualization */}
      <div className="relative border-l-2 border-primary/20 pl-6 space-y-6">
        {events.map((event) => (
          <div key={event.id} className="relative">
            {/* Timeline dot */}
            <div className="absolute -left-[29px] w-4 h-4 rounded-full bg-primary border-4 border-background" />
            
            {/* Event card */}
            <div className={`border rounded-lg p-4 ${getEventColor(event.event_type)}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {getEventIcon(event.event_type)}
                    <span className="font-semibold capitalize">{event.event_type}</span>
                    <span className="text-xs opacity-70">
                      {format(new Date(event.event_date), 'PPP', { locale: fr })}
                    </span>
                  </div>
                  <p className="text-sm">{event.description}</p>
                  {event.document_source && (
                    <p className="text-xs opacity-60 mt-2">
                      Source : {event.document_source}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {events.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>Aucun événement chronologique détecté dans les documents.</p>
        </div>
      )}
    </div>
  );
};
