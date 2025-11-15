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

  const iconBgStyles = {
    default: 'p-1.5 bg-primary/10 rounded-lg',
    warning: 'p-1.5 bg-amber-100 dark:bg-amber-900/20 rounded-lg',
    danger: 'p-1.5 bg-red-100 dark:bg-red-900/20 rounded-lg',
  };

  const iconColorStyles = {
    default: 'text-primary',
    warning: 'text-amber-600',
    danger: 'text-red-600',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <Card className={cn("relative", variantStyles[variant])}>
        {variant === 'danger' && (
          <span className="absolute -top-1 -right-1 z-10">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
            </span>
          </span>
        )}
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              {Icon && (
                <div className={iconBgStyles[variant]}>
                  <Icon className={cn("w-4 h-4", iconColorStyles[variant])} />
                </div>
              )}
              {title}
            </CardTitle>
            {badge && (
              <Badge variant={variant === 'danger' ? 'destructive' : 'secondary'}>
                {badge}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-2">{children}</CardContent>
      </Card>
    </motion.div>
  );
};
