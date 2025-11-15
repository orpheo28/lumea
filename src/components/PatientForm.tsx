import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface PatientFormProps {
  patientName: string;
  onPatientNameChange: (name: string) => void;
  disabled?: boolean;
}

export const PatientForm = ({ patientName, onPatientNameChange, disabled }: PatientFormProps) => {
  return (
    <div className="space-y-3">
      <Label htmlFor="patient-name" className="text-base font-semibold">
        Patient
      </Label>
      <Input
        id="patient-name"
        type="text"
        placeholder="Patient Name / ID"
        value={patientName}
        onChange={(e) => onPatientNameChange(e.target.value)}
        disabled={disabled}
        className="h-11"
      />
      <p className="text-sm text-muted-foreground">
        Unique patient identifier for this analysis
      </p>
    </div>
  );
};
