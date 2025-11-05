import { useLanguage } from "@/contexts/LanguageContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export interface TransactionFiltersValue {
  type: 'all' | 'buy' | 'sell';
  status: 'all' | 'pending' | 'completed' | 'failed';
  datePreset: 'today' | 'this_week' | 'this_month' | 'range';
  from?: string | null;
  to?: string | null;
}

interface TransactionFiltersProps {
  value: TransactionFiltersValue;
  onChange: (next: TransactionFiltersValue) => void;
}

export function TransactionFilters({ value, onChange }: TransactionFiltersProps) {
  const { t } = useLanguage();

  function update<K extends keyof TransactionFiltersValue>(
    key: K,
    newValue: TransactionFiltersValue[K]
  ) {
    const next = { ...value, [key]: newValue };
    // Si cambia el preset a no-range, limpiar fechas
    if (key === 'datePreset' && newValue !== 'range') {
      next.from = null;
      next.to = null;
    }
    onChange(next);
  }

  function reset() {
    onChange({
      type: 'all',
      status: 'all',
      datePreset: 'today',
      from: null,
      to: null,
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2" data-testid="transaction-filters">
      {/* Tipo de operación */}
      <Select value={value.type} onValueChange={(v) => update('type', v as any)}>
        <SelectTrigger className="w-[220px]" data-testid="select-trade-type">
          <SelectValue placeholder={t('dashboard.tradeType')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t('dashboard.allTransactions')}</SelectItem>
          <SelectItem value="buy">{t('dashboard.fiatToCrypto')}</SelectItem>
          <SelectItem value="sell">{t('dashboard.cryptoToFiat')}</SelectItem>
        </SelectContent>
      </Select>

      {/* Rango de fecha */}
      <Select value={value.datePreset} onValueChange={(v) => update('datePreset', v as any)}>
        <SelectTrigger className="w-[180px]" data-testid="select-date-range">
          <SelectValue placeholder={t('dashboard.dateRange')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="today">{t('dashboard.today')}</SelectItem>
          <SelectItem value="this_week">{t('dashboard.thisWeek')}</SelectItem>
          <SelectItem value="this_month">{t('dashboard.thisMonth')}</SelectItem>
          <SelectItem value="range">{t('dashboard.customRange')}</SelectItem>
        </SelectContent>
      </Select>

      {/* Inputs de rango personalizado */}
      {value.datePreset === 'range' && (
        <>
          <Input
            type="date"
            value={value.from ?? ''}
            onChange={(e) => update('from', e.target.value)}
            className="w-[160px]"
            placeholder={t('dashboard.from')}
            data-testid="input-date-from"
          />
          <Input
            type="date"
            value={value.to ?? ''}
            onChange={(e) => update('to', e.target.value)}
            className="w-[160px]"
            placeholder={t('dashboard.to')}
            data-testid="input-date-to"
          />
        </>
      )}

      {/* Botón Reset */}
      <Button
        type="button"
        variant="outline"
        onClick={reset}
        data-testid="button-reset-filters"
      >
        {t('dashboard.reset')}
      </Button>
    </div>
  );
}
