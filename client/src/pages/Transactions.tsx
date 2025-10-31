import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";

interface Transaction {
  id: string;
  type: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
}

const formatCurrency = (amount: number, currency: string) => {
  return `${currency} ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatDateTime = (dateString: string) => {
  try {
    const date = new Date(dateString);
    return format(date, "dd/MM/yyyy HH:mm");
  } catch {
    return "-";
  }
};

const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case "completed":
      return "default";
    case "pending":
      return "secondary";
    case "offer_made":
      return "outline";
    default:
      return "secondary";
  }
};

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    "pending": "Pendiente",
    "offer_made": "Oferta Recibida",
    "escrow_created": "En Escrow",
    "completed": "Completado",
  };
  return labels[status] || status;
};

export default function Transactions() {
  const { t, language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Fetch transactions
  const { data: transactions = [], isLoading } = useQuery<Transaction[]>({
    queryKey: ['/api/transactions', { userId: user?.id }],
    enabled: !!user,
  });

  if (!user) {
    navigate("/auth");
    return null;
  }

  return (
    <div className="min-h-screen w-full flex flex-col">
      <AppHeader 
        currentLanguage={language} 
        onLanguageChange={setLanguage}
        onCreateTransaction={() => console.log('Create transaction clicked')}
      />
      <main className="flex-1 p-3 sm:p-4 md:p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold" data-testid="text-page-title">Transacciones</h2>
              <p className="text-sm sm:text-base text-muted-foreground">
                Gestiona y visualiza tus transacciones OTC
              </p>
            </div>
            <Button className="gap-2" data-testid="button-create-transaction">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Nueva Transacción</span>
            </Button>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Cargando transacciones...</p>
            </div>
          ) : transactions.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground text-center mb-4">
                  No tienes transacciones registradas
                </p>
                <Button className="gap-2" data-testid="button-create-first">
                  <Plus className="h-4 w-4" />
                  Crear Primera Transacción
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {transactions.map((transaction) => (
                <Card key={transaction.id} data-testid={`card-transaction-${transaction.id}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          {transaction.type === "buy" ? "Compra" : "Venta"} - {transaction.id.substring(0, 8)}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {formatDateTime(transaction.createdAt)}
                        </p>
                      </div>
                      <Badge variant={getStatusBadgeVariant(transaction.status)}>
                        {getStatusLabel(transaction.status)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Monto</p>
                        <p className="font-semibold">{formatCurrency(transaction.amount, transaction.currency)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Estado</p>
                        <p>{getStatusLabel(transaction.status)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
