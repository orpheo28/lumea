import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SummaryCardProps {
  title: string;
  children: ReactNode;
  icon?: LucideIcon;
  variant?: 'default' | 'warning' | 'danger';
  badge?: string;
}

export const SummaryCard = ({
  title,
  children,
  icon: Icon,
  variant = 'default',
  badge,
}: SummaryCardProps) => {
  const variantStyles = {
    default: 'border-border',
    warning: 'border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/20',
    danger: cn(
      'border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-950/20',
      'relative'
    ),
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <Card className={cn(variantStyles[variant], "transition-all duration-200 hover:shadow-lg")}>
        {variant === 'danger' && (
          <span className="absolute -top-1 -right-1 z-10">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
            </span>
          </span>
        )}
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {Icon && <Icon className="w-5 h-5 text-primary" />}
              <CardTitle className="text-lg">{title}</CardTitle>
            </div>
            {badge && (
              <Badge variant={variant === 'danger' ? 'destructive' : 'secondary'}>
                {badge}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </motion.div>
  );
};
