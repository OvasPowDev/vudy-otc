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

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Type Filter Buttons */}
      <div className="flex gap-2">
        <Button
          type="button"
          onClick={() => upd("type", "all")}
          variant={value.type === "all" ? "default" : "outline"}
          size="default"
          data-testid="button-filter-all"
        >
          {t("filters.all")}
        </Button>
        <Button
          type="button"
          onClick={() => upd("type", "crypto_to_fiat")}
          variant={value.type === "crypto_to_fiat" ? "default" : "outline"}
          size="default"
          data-testid="button-filter-purchases"
        >
          {t("filters.purchases")}
        </Button>
        <Button
          type="button"
          onClick={() => upd("type", "fiat_to_crypto")}
          variant={value.type === "fiat_to_crypto" ? "default" : "outline"}
          size="default"
          data-testid="button-filter-sales"
        >
          {t("filters.sales")}
        </Button>
      </div>

      {/* Date Filter Dropdown */}
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

      {/* Custom Date Range Inputs */}
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
    </div>
  );
}
