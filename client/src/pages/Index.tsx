import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { AppHeader } from "@/components/AppHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, ArrowDownRight, DollarSign, FileText } from "lucide-react";

export default function Index() {
  const { t, language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Redirect to auth if no user
  useEffect(() => {
    if (!user) {
      navigate("/auth");
    }
  }, [user, navigate]);

  // Fetch user's transactions
  const { data: transactions = [] } = useQuery<any[]>({
    queryKey: [`/api/transactions?userId=${user?.id}`],
    enabled: !!user,
  });

  // Calculate statistics
  const buyOrders = transactions.filter(t => t.type?.toLowerCase() === 'buy').length;
  const sellOrders = transactions.filter(t => t.type?.toLowerCase() === 'sell').length;
  const completedTransactions = transactions.filter(t => t.status === 'completed');
  const totalProcessed = completedTransactions.reduce((sum, t) => sum + (t.amountValue || 0), 0);

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen w-full flex flex-col">
      <AppHeader 
        currentLanguage={language} 
        onLanguageChange={setLanguage}
      />
      <main className="flex-1 p-3 sm:p-4 md:p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold" data-testid="text-page-title">
              {t('dashboard.title')}
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              Bienvenido a tu hub de transacciones OTC
            </p>
          </div>

          {/* Statistics Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card data-testid="card-total-transactions">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Transacciones
                </CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-total-transactions">
                  {transactions.length}
                </div>
                <p className="text-xs text-muted-foreground">
                  {completedTransactions.length} completadas
                </p>
              </CardContent>
            </Card>

            <Card data-testid="card-buy-orders">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Órdenes de Compra
                </CardTitle>
                <ArrowUpRight className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-buy-orders">
                  {buyOrders}
                </div>
                <p className="text-xs text-muted-foreground">
                  Crypto → Fiat
                </p>
              </CardContent>
            </Card>

            <Card data-testid="card-sell-orders">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Órdenes de Venta
                </CardTitle>
                <ArrowDownRight className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-sell-orders">
                  {sellOrders}
                </div>
                <p className="text-xs text-muted-foreground">
                  Fiat → Crypto
                </p>
              </CardContent>
            </Card>

            <Card data-testid="card-total-processed">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Procesado
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-total-processed">
                  ${totalProcessed.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">
                  En transacciones completadas
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Acciones Rápidas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Button 
                  onClick={() => navigate("/transactions")}
                  className="w-full"
                  data-testid="button-view-transactions"
                >
                  Ver Transacciones
                </Button>
                <Button 
                  onClick={() => navigate("/bank-accounts")}
                  variant="outline"
                  className="w-full"
                  data-testid="button-manage-banks"
                >
                  Gestionar Bancos
                </Button>
                <Button 
                  onClick={() => navigate("/wallets")}
                  variant="outline"
                  className="w-full"
                  data-testid="button-manage-wallets"
                >
                  Gestionar Wallets
                </Button>
                <Button 
                  onClick={() => navigate("/profile")}
                  variant="outline"
                  className="w-full"
                  data-testid="button-view-profile"
                >
                  Ver Perfil
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          {transactions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Actividad Reciente</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {transactions.slice(0, 5).map((transaction) => (
                    <div 
                      key={transaction.id} 
                      className="flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-muted/50"
                      onClick={() => navigate("/transactions")}
                    >
                      <div className="flex items-center gap-3">
                        {transaction.type?.toLowerCase() === 'buy' ? (
                          <ArrowUpRight className="h-5 w-5 text-green-600" />
                        ) : (
                          <ArrowDownRight className="h-5 w-5 text-red-600" />
                        )}
                        <div>
                          <p className="font-medium">
                            {transaction.type} {transaction.token}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {transaction.code || transaction.id.substring(0, 8)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          {transaction.amountValue} {transaction.token}
                        </p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {transaction.status}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {transactions.length === 0 && (
            <Card>
              <CardContent className="pt-6 pb-6 text-center">
                <p className="text-muted-foreground mb-4">
                  No tienes transacciones todavía. ¡Crea tu primera transacción OTC!
                </p>
                <Button onClick={() => navigate("/transactions")}>
                  Crear Transacción
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
