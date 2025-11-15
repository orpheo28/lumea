import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';
import CountUp from 'react-countup';
import Confetti from 'react-confetti';
import { useWindowSize } from '@/hooks/useWindowSize';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface SuccessModalProps {
  show: boolean;
  timeSaved: number;
  onClose: () => void;
}

export const SuccessModal = ({ show, timeSaved, onClose }: SuccessModalProps) => {
  const { width, height } = useWindowSize();

  return (
    <Dialog open={show} onOpenChange={onClose}>
      <DialogContent className="text-center max-w-md">
        {show && <Confetti width={width} height={height} numberOfPieces={200} recycle={false} />}
        
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", bounce: 0.6, duration: 0.6 }}
        >
          <CheckCircle className="w-20 h-20 mx-auto text-green-500 mb-4" />
        </motion.div>
        
        <h3 className="text-2xl font-bold mb-2">Brief généré ! 🎉</h3>
        
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-2 border-green-200 dark:border-green-800 rounded-xl p-4 mb-4">
          <p className="text-3xl font-bold text-green-600 dark:text-green-400">
            <CountUp end={timeSaved} duration={2} />
            <span className="text-2xl ml-1">min</span>
          </p>
          <p className="text-sm text-green-800 dark:text-green-300">économisées sur ce dossier</p>
        </div>
        
        <Button onClick={onClose} className="w-full">
          Voir le brief
        </Button>
      </DialogContent>
    </Dialog>
  );
};
