import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { AppHeader } from "@/components/AppHeader";
import { KanbanBoard } from "@/components/KanbanBoard";
import { CreateTransactionDialog } from "@/components/CreateTransactionDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, ArrowDownRight, DollarSign, FileText } from "lucide-react";

export default function Index() {
  const { t, language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  // Redirect to login if no user
  useEffect(() => {
    if (!user) {
      navigate("/");
    }
  }, [user, navigate]);

  // Fetch user statistics
  const { data: statistics } = useQuery<{
    totalTransactions: number;
    buyOrders: number;
    sellOrders: number;
    totalProcessed: number;
  }>({
    queryKey: [`/api/user-statistics/${user?.id}`],
    enabled: !!user,
  });

  const totalTransactions = statistics?.totalTransactions || 0;
  const buyOrders = statistics?.buyOrders || 0;
  const sellOrders = statistics?.sellOrders || 0;
  const totalProcessed = statistics?.totalProcessed || 0;

  const handleTransactionCreated = () => {
    setCreateDialogOpen(false);
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen w-full flex flex-col">
      <AppHeader 
        currentLanguage={language} 
        onLanguageChange={setLanguage}
        onCreateTransaction={() => setCreateDialogOpen(true)}
      />
      <main className="flex-1 p-3 sm:p-4 md:p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold" data-testid="text-page-title">
              {t('dashboard.title')}
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              {t('dashboard.subtitle')}
            </p>
          </div>

          {/* Statistics Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card data-testid="card-total-transactions">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t('dashboard.totalTransactions')}
                </CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-total-transactions">
                  {totalTransactions}
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('dashboard.transactionsWithOffers')}
                </p>
              </CardContent>
            </Card>

            <Card data-testid="card-buy-orders">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t('dashboard.buyOrders')}
                </CardTitle>
                <ArrowUpRight className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-buy-orders">
                  {buyOrders}
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('createTransaction.cryptoToFiat')}
                </p>
              </CardContent>
            </Card>

            <Card data-testid="card-sell-orders">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t('dashboard.sellOrders')}
                </CardTitle>
                <ArrowDownRight className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-sell-orders">
                  {sellOrders}
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('createTransaction.fiatToCrypto')}
                </p>
              </CardContent>
            </Card>

            <Card data-testid="card-total-processed">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t('dashboard.totalProcessed')}
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-total-processed">
                  ${totalProcessed.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('dashboard.inCompletedTransactions')}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Kanban Board */}
          <KanbanBoard />

          <CreateTransactionDialog
            open={createDialogOpen}
            onOpenChange={setCreateDialogOpen}
            onTransactionCreated={handleTransactionCreated}
          />
        </div>
      </main>
    </div>
  );
}
