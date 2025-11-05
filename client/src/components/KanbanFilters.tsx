import { useLanguage } from "@/contexts/LanguageContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type FilterValue = {
  type: "all" | "fiat_to_crypto" | "crypto_to_fiat";
  datePreset: "today" | "this_week" | "this_month" | "range";
  from?: string | null;
  to?: string | null;
};

type Props = {
  value: FilterValue;
  onChange: (next: FilterValue) => void;
};

export function KanbanFilters({ value, onChange }: Props) {
  const { t } = useLanguage();

  const TYPES = [
    { value: "all", label: t("filters.all") },
    { value: "fiat_to_crypto", label: t("filters.fiatToCrypto") },
    { value: "crypto_to_fiat", label: t("filters.cryptoToFiat") },
  ];

  const DATES = [
    { value: "today", label: t("filters.today") },
    { value: "this_week", label: t("filters.thisWeek") },
    { value: "this_month", label: t("filters.thisMonth") },
    { value: "range", label: t("filters.range") },
  ];

  function upd<K extends keyof FilterValue>(k: K, v: FilterValue[K]) {
    const next = { ...value, [k]: v };
    if (k === "datePreset" && v !== "range") {
      next.from = null;
      next.to = null;
    }
    onChange(next);
  }

  function reset() {
    onChange({
      type: "all",
      datePreset: "today",
      from: null,
      to: null,
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        value={value.type}
        onValueChange={(v) => upd("type", v as any)}
      >
        <SelectTrigger
          className="w-[280px]"
          aria-label={t("filters.tradeType")}
          data-testid="select-trade-type"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {TYPES.map((o) => (
            <SelectItem key={o.value} value={o.value} data-testid={`option-type-${o.value}`}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={value.datePreset}
        onValueChange={(v) => upd("datePreset", v as any)}
      >
        <SelectTrigger
          className="w-[180px]"
          aria-label={t("filters.dateFilter")}
          data-testid="select-date-preset"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {DATES.map((o) => (
            <SelectItem key={o.value} value={o.value} data-testid={`option-date-${o.value}`}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {value.datePreset === "range" && (
        <>
          <Input
            type="date"
            className="w-[160px]"
            value={value.from ?? ""}
            onChange={(e) => upd("from", e.target.value || null)}
            aria-label={t("filters.startDate")}
            data-testid="input-date-from"
          />
          <Input
            type="date"
            className="w-[160px]"
            value={value.to ?? ""}
            onChange={(e) => upd("to", e.target.value || null)}
            aria-label={t("filters.endDate")}
            data-testid="input-date-to"
          />
        </>
      )}

      <Button
        type="button"
        onClick={reset}
        variant="outline"
        size="default"
        data-testid="button-reset-filters"
      >
        {t("filters.reset")}
      </Button>
    </div>
  );
}
