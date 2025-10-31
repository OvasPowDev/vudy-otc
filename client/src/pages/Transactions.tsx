import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { AppHeader } from "@/components/AppHeader";
import { TransactionsDataTable } from "@/components/TransactionsDataTable";
import { CreateTransactionDialog } from "@/components/CreateTransactionDialog";
import { useAuth } from "@/hooks/useAuth";

export default function Transactions() {
  const { t, language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  // Redirect to auth if no user
  useEffect(() => {
    if (!user) {
      navigate("/auth");
    }
  }, [user, navigate]);

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
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold" data-testid="text-page-title">
                {t('dashboard.transactions')}
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground">
                Gestiona tus transacciones OTC en formato de tabla
              </p>
            </div>
          </div>

          <TransactionsDataTable />

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
