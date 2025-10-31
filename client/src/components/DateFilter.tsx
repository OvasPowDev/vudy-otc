import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";

export interface DateFilterOptions {
  period: 'today' | 'last7' | 'last30' | 'thisMonth' | 'custom';
  startDate: string;
  endDate: string;
}

interface DateFilterProps {
  onFilterChange: (filters: DateFilterOptions) => void;
}

export function DateFilter({ onFilterChange }: DateFilterProps) {
  const { t } = useLanguage();
  const [selectedPeriod, setSelectedPeriod] = useState<string>('last30');
  const [customDialogOpen, setCustomDialogOpen] = useState(false);
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');

  // Get date in Guatemala timezone (UTC-6)
  const getGuatemalaDate = (daysOffset: number = 0) => {
    const now = new Date();
    // Adjust for Guatemala timezone (UTC-6)
    now.setHours(now.getHours() - 6);
    now.setDate(now.getDate() + daysOffset);
    return now.toISOString().split('T')[0];
  };

  const getDateRange = (period: string): { startDate: string; endDate: string } => {
    const today = getGuatemalaDate();
    
    switch (period) {
      case 'today':
        return { startDate: today, endDate: today };
      
      case 'last7':
        return { startDate: getGuatemalaDate(-6), endDate: today };
      
      case 'last30':
        return { startDate: getGuatemalaDate(-29), endDate: today };
      
      case 'thisMonth':
        const monthStart = today.substring(0, 8) + '01';
        return { startDate: monthStart, endDate: today };
      
      case 'custom':
        return { startDate: customStart, endDate: customEnd };
      
      default:
        return { startDate: today, endDate: today };
    }
  };

  const handlePeriodChange = (value: string) => {
    if (value === 'custom') {
      // Initialize custom range: start = today - 30 days, end = today
      const defaultStart = getGuatemalaDate(-30);
      const defaultEnd = getGuatemalaDate();
      setCustomStart(defaultStart);
      setCustomEnd(defaultEnd);
      setCustomDialogOpen(true);
    } else {
      setSelectedPeriod(value);
      const dateRange = getDateRange(value);
      onFilterChange({
        period: value as any,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      });
    }
  };

  const handleCustomApply = () => {
    // Validate dates
    if (!customStart || !customEnd) {
      toast.error(t('filters.invalidRange'));
      return;
    }

    const start = new Date(customStart);
    const end = new Date(customEnd);

    if (start > end) {
      toast.error(t('filters.invalidRange'));
      return;
    }

    // Check max range (366 days)
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 366) {
      toast.error(t('filters.invalidRange'));
      return;
    }

    setSelectedPeriod('custom');
    onFilterChange({
      period: 'custom',
      startDate: customStart,
      endDate: customEnd,
    });
    setCustomDialogOpen(false);
    toast.success(t('filters.applied'));
  };

  const handleCustomCancel = () => {
    setCustomDialogOpen(false);
    // Keep the previous filter active
  };

  // Apply default filter on mount
  useEffect(() => {
    const dateRange = getDateRange('last30');
    onFilterChange({
      period: 'last30',
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
    });
  }, []);

  return (
    <>
      <div className="flex items-center gap-2">
        <Label className="text-sm font-medium whitespace-nowrap">
          {t('filters.dateFilter')}:
        </Label>
        <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-background z-50">
            <SelectItem value="today">{t('filters.today')}</SelectItem>
            <SelectItem value="last7">{t('filters.last7Days')}</SelectItem>
            <SelectItem value="last30">{t('filters.last30Days')}</SelectItem>
            <SelectItem value="thisMonth">{t('filters.thisMonth')}</SelectItem>
            <SelectItem value="custom">{t('filters.customRange')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Dialog open={customDialogOpen} onOpenChange={setCustomDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t('filters.title')}</DialogTitle>
            <DialogDescription>{t('filters.description')}</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="start-date">{t('filters.startDate')}</Label>
              <Input
                id="start-date"
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                max={customEnd || undefined}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="end-date">{t('filters.endDate')}</Label>
              <Input
                id="end-date"
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                min={customStart || undefined}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={handleCustomCancel}>
              {t('filters.clear')}
            </Button>
            <Button 
              onClick={handleCustomApply}
              disabled={!customStart || !customEnd}
            >
              {t('filters.apply')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

