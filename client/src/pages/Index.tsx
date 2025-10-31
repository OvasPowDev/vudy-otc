import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppHeader } from "@/components/AppHeader";
import { KanbanBoard } from "@/components/KanbanBoard";
import { TransactionTotals } from "@/components/TransactionTotals";
import { DateFilter, DateFilterOptions } from "@/components/DateFilter";
import { useLanguage } from "@/contexts/LanguageContext";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { CreateTransactionDialog } from "@/components/CreateTransactionDialog";
import { useQuery } from "@tanstack/react-query";

const Index = () => {
  const navigate = useNavigate();
  const { language, setLanguage, t } = useLanguage();
  const [user, setUser] = useState<any | null>(null);
  const [dateFilters, setDateFilters] = useState<DateFilterOptions>({
    period: 'last30',
    startDate: '',
    endDate: '',
  });
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  // Fetch transactions from API
  const { data: transactions = [], isLoading: loading } = useQuery<any[]>({
    queryKey: ['/api/transactions', dateFilters],
    enabled: !!user && !!dateFilters.startDate && !!dateFilters.endDate,
  });

  const totalCount = transactions.length;
  const buyCount = transactions.filter((tx) => tx.type === "Buy").length;
  const sellCount = transactions.filter((tx) => tx.type === "Sell").length;

  // Calculate totals from real transaction data
  const totalCrypto = transactions.reduce((sum, tx) => sum + (typeof tx.amount_value === 'string' ? parseFloat(tx.amount_value) : tx.amount_value), 0);
  const totalFiat = transactions.reduce((sum, tx) => sum + (typeof tx.amount_value === 'string' ? parseFloat(tx.amount_value) : tx.amount_value), 0);

  useEffect(() => {
    // TODO: Implement proper authentication check
    // For now, we'll just set a placeholder user
    // In production, this should check session/token from backend
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      // Temporarily allow access for development - set a mock user
      setUser({ email: 'dev@example.com' });
    }
  }, [navigate]);

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen w-full flex flex-col">
      <AppHeader 
        user={user} 
        currentLanguage={language} 
        onLanguageChange={setLanguage}
        onCreateTransaction={() => setCreateDialogOpen(true)}
      />
      <main className="flex-1 p-3 sm:p-4 md:p-6">
        <div className="space-y-4 sm:space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold">{t('dashboard.title')}</h2>
              <p className="text-sm sm:text-base text-muted-foreground">{t('dashboard.subtitle')}</p>
            </div>
            <div className="w-full sm:w-auto sm:min-w-[400px]">
              <TransactionTotals totalCrypto={totalCrypto} totalFiat={totalFiat} />
            </div>
          </div>

          <Tabs defaultValue="all" className="w-full">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <TabsList className="w-full sm:w-auto">
                <TabsTrigger value="all" className="gap-1 sm:gap-2 text-xs sm:text-sm">
                  <span className="hidden sm:inline">{t('dashboard.allRequests')}</span>
                  <Badge variant="secondary" className="rounded-full text-xs">
                    {totalCount}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="buy" className="gap-1 sm:gap-2 text-xs sm:text-sm">
                  <span className="hidden sm:inline">{t('dashboard.buyRequests')}</span>
                  <Badge variant="secondary" className="rounded-full text-xs">
                    {buyCount}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="sell" className="gap-1 sm:gap-2 text-xs sm:text-sm">
                  <span className="hidden sm:inline">{t('dashboard.sellRequests')}</span>
                  <Badge variant="secondary" className="rounded-full text-xs">
                    {sellCount}
                  </Badge>
                </TabsTrigger>
              </TabsList>
              
              <DateFilter onFilterChange={setDateFilters} />
            </div>
            <TabsContent value="all" className="mt-4 sm:mt-6">
              <KanbanBoard filterType="all" filters={dateFilters} onAddTransaction={() => {}} />
            </TabsContent>
            <TabsContent value="buy" className="mt-4 sm:mt-6">
              <KanbanBoard filterType="buy" filters={dateFilters} onAddTransaction={() => {}} />
            </TabsContent>
            <TabsContent value="sell" className="mt-4 sm:mt-6">
              <KanbanBoard filterType="sell" filters={dateFilters} onAddTransaction={() => {}} />
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      <CreateTransactionDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onTransactionCreated={(transaction) => {
          console.log("Transaction created:", transaction);
          // Add the transaction to the KanbanBoard
          if ((window as any).__addTransaction) {
            (window as any).__addTransaction(transaction);
          }
        }}
      />
    </div>
  );
};

export default Index;
