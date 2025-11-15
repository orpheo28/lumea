import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Search, AlertCircle, Users, Activity } from 'lucide-react';
import type { ClinicalSummary } from '@/types/clinical';

const Patients = () => {
  const navigate = useNavigate();
  const [summaries, setSummaries] = useState<ClinicalSummary[]>([]);
  const [filteredSummaries, setFilteredSummaries] = useState<ClinicalSummary[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSummaries();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredSummaries(summaries);
    } else {
      const filtered = summaries.filter(s =>
        s.patient_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredSummaries(filtered);
    }
  }, [searchTerm, summaries]);

  const loadSummaries = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('clinical_summaries')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSummaries((data as unknown) as ClinicalSummary[] || []);
      setFilteredSummaries((data as unknown) as ClinicalSummary[] || []);
    } catch (err) {
      console.error('Error loading summaries:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateUrgencyScore = (summary: ClinicalSummary): number => {
    const redFlagsCount = summary.red_flags?.length || 0;
    const highInconsistencies = (summary.inconsistencies || []).filter(
      i => i.severity === 'high'
    ).length;
    return redFlagsCount * 10 + highInconsistencies * 5;
  };

  const getUrgencyBadge = (score: number) => {
    if (score >= 20) {
      return <Badge variant="destructive">Urgent</Badge>;
    } else if (score >= 10) {
      return <Badge className="bg-amber-500 text-white">Modéré</Badge>;
    } else {
      return <Badge variant="secondary">Normal</Badge>;
    }
  };

  const urgentCases = filteredSummaries.filter(s => calculateUrgencyScore(s) >= 20).length;
  const moderateCases = filteredSummaries.filter(
    s => calculateUrgencyScore(s) >= 10 && calculateUrgencyScore(s) < 20
  ).length;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 md:px-8 py-8 max-w-7xl">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
          <h1 className="text-3xl font-bold">Vue Multi-patients</h1>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total patients</p>
                <p className="text-2xl font-bold">{filteredSummaries.length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-8 h-8 text-destructive" />
              <div>
                <p className="text-sm text-muted-foreground">Cas urgents</p>
                <p className="text-2xl font-bold">{urgentCases}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Activity className="w-8 h-8 text-amber-500" />
              <div>
                <p className="text-sm text-muted-foreground">Cas modérés</p>
                <p className="text-2xl font-bold">{moderateCases}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Search */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un patient..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Table */}
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Urgence</TableHead>
                <TableHead>Red Flags</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Chargement...
                  </TableCell>
                </TableRow>
              ) : filteredSummaries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Aucun patient trouvé
                  </TableCell>
                </TableRow>
              ) : (
                filteredSummaries
                  .sort((a, b) => calculateUrgencyScore(b) - calculateUrgencyScore(a))
                  .map((summary) => {
                    const urgencyScore = calculateUrgencyScore(summary);
                    return (
                      <TableRow key={summary.id}>
                        <TableCell className="font-medium">{summary.patient_name}</TableCell>
                        <TableCell>
                          {new Date(summary.created_at).toLocaleDateString('fr-FR')}
                        </TableCell>
                        <TableCell>{getUrgencyBadge(urgencyScore)}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {summary.red_flags?.length || 0}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            onClick={() => navigate(`/?summaryId=${summary.id}`)}
                          >
                            Voir dossier
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
};

export default Patients;
