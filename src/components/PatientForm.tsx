import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User } from 'lucide-react';

interface PatientFormProps {
  patientName: string;
  onPatientNameChange: (name: string) => void;
  disabled?: boolean;
}

export const PatientForm = ({ patientName, onPatientNameChange, disabled }: PatientFormProps) => {
  return (
    <div className="space-y-4">
      <Label htmlFor="patient-name" className="text-base font-semibold flex items-center gap-2">
        <User className="w-4 h-4 text-primary" />
        Patient
      </Label>
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          <User className="w-4 h-4" />
        </div>
        <Input
          id="patient-name"
          type="text"
          placeholder="Nom du patient ou identifiant unique"
          value={patientName}
          onChange={(e) => onPatientNameChange(e.target.value)}
          disabled={disabled}
          className="h-12 pl-10 rounded-xl border-2 transition-all duration-300 focus-visible:ring-4 focus-visible:ring-primary/20 focus-visible:border-primary hover:border-primary/50"
        />
      </div>
      <p className="text-xs italic text-muted-foreground/80">
        Identifiant unique pour cette analyse clinique
      </p>
    </div>
  );
};
