import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';

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
    danger: 'border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-950/20',
  };

  return (
    <Card className={variantStyles[variant]}>
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
  );
};
