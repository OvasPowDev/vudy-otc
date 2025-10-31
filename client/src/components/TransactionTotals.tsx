import { Card } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { TrendingUp, DollarSign } from "lucide-react";

interface TransactionTotalsProps {
  totalCrypto: number;
  totalFiat: number;
}

export function TransactionTotals({ totalCrypto, totalFiat }: TransactionTotalsProps) {
  const { t } = useLanguage();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <Card className="flex-1 p-4 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground font-medium">
              {t('dashboard.totalCrypto')}
            </p>
            <p className="text-2xl font-bold text-foreground mt-1">
              {formatCurrency(totalCrypto)}
            </p>
          </div>
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <TrendingUp className="h-6 w-6 text-primary" />
          </div>
        </div>
      </Card>

      <Card className="flex-1 p-4 bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground font-medium">
              {t('dashboard.totalFiat')}
            </p>
            <p className="text-2xl font-bold text-foreground mt-1">
              {formatCurrency(totalFiat)}
            </p>
          </div>
          <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center">
            <DollarSign className="h-6 w-6 text-accent-foreground" />
          </div>
        </div>
      </Card>
    </div>
  );
}
