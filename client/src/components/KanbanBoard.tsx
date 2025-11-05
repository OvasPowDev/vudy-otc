import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Clock, CheckCircle2, XCircle } from "lucide-react";
import { TransactionDetailModal } from "./TransactionDetailModal";
import { MakeOfferDialog } from "./MakeOfferDialog";
import { TransactionFilters, TransactionFiltersValue } from "./TransactionFilters";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";

interface OTCRequest {
  id: string;
  fullname: string;
  type: "BUY" | "SELL";
  token: string;
  amount: string;
  date: string;
  offers: number;
  status: "pending" | "completed" | "failed";
  escrowSubStatus?: "waiting_deposit" | "deposit_approval";
  dbId?: string;
  walletAddress?: string;
  chain?: string;
  acceptedByUserId?: string | null;
  userId?: string;
}

const getTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  
  const days = Math.floor(diffMs / 86400000);
  const hours = Math.floor((diffMs % 86400000) / 3600000);
  const minutes = Math.floor((diffMs % 3600000) / 60000);

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  
  return parts.length > 0 ? parts.join(' ') : 'just now';
};

const getColumns = (t: (key: string) => string) => [
  { id: "pending", title: t('dashboard.created'), color: "bg-slate-100 dark:bg-slate-800", icon: Clock },
  { id: "completed", title: t('dashboard.settled'), color: "bg-green-50 dark:bg-green-950", icon: CheckCircle2 },
  { id: "failed", title: t('dashboard.failed'), color: "bg-red-50 dark:bg-red-950", icon: XCircle },
];

function RequestCard({ request, columnColor, onOfferCreated }: { request: OTCRequest; columnColor: string; onOfferCreated: (requestId: string) => void }) {
  const { t } = useLanguage();
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [offerOpen, setOfferOpen] = useState(false);
  
  const handleOfferCreated = () => {
    onOfferCreated(request.id);
  };

  return (
    <>
      <Card className={`${columnColor} border-none shadow-sm`} data-testid={`card-transaction-${request.id}`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">{request.id}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{t('dashboard.fullname')}</span>
            <span className="text-xs font-medium">{request.fullname}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{t('dashboard.type')}</span>
            <Badge 
              variant={request.type === "BUY" ? "default" : "secondary"} 
              className={`text-xs ${
                request.type === "SELL" 
                  ? "text-white hover:opacity-90" 
                  : ""
              }`}
              style={request.type === "SELL" ? { backgroundColor: '#81a29e' } : undefined}
            >
              {request.type}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{t('dashboard.token')}</span>
            <span className="text-xs font-medium">{request.token}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{t('dashboard.amount')}</span>
            <span className="text-xs font-medium">{request.amount}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{t('dashboard.date')}</span>
            <span className="text-xs font-medium">{getTimeAgo(request.date)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{t('dashboard.offers')}</span>
            <span className="text-xs font-medium">{request.offers}</span>
          </div>
          {request.escrowSubStatus && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{t('dashboard.status')}</span>
              <Badge 
                variant="secondary" 
                className={`text-xs ${
                  request.escrowSubStatus === "waiting_deposit"
                    ? "bg-yellow-200 dark:bg-yellow-700 text-yellow-900 dark:text-yellow-100"
                    : "bg-orange-200 dark:bg-orange-700 text-orange-900 dark:text-orange-100"
                }`}
              >
                {request.escrowSubStatus === "waiting_deposit" 
                  ? t('dashboard.waitingDeposit')
                  : t('dashboard.depositApproval')}
              </Badge>
            </div>
          )}
          <div className="flex gap-2 pt-2">
            {request.status === "pending" && (
              <Button 
                size="sm" 
                variant="outline" 
                className="flex-1 text-xs"
                onClick={() => setOfferOpen(true)}
                data-testid={`button-offer-${request.id}`}
              >
                {t('dashboard.makeOffer')}
              </Button>
            )}
            <Button 
              size="sm" 
              variant="ghost" 
              className={request.myColumn === "pending" ? "px-2" : "flex-1"}
              onClick={() => setDetailsOpen(true)}
              data-testid={`button-view-${request.id}`}
            >
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <TransactionDetailModal
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        transactionId={request.dbId || request.id}
      />

      <MakeOfferDialog
        open={offerOpen}
        onOpenChange={setOfferOpen}
        request={{
          id: request.id,
          transactionId: request.dbId,
          type: request.type,
          token: request.token,
          amount: request.amount,
          senderWallet: request.walletAddress,
        }}
        onOfferCreated={handleOfferCreated}
      />
    </>
  );
}

function Column({ column, requests, onOfferCreated, onHeaderClick, isFiltering }: { 
  column: any; 
  requests: OTCRequest[]; 
  onOfferCreated: (requestId: string) => void;
  onHeaderClick: (status: string) => void;
  isFiltering: boolean;
}) {
  const { t } = useLanguage();
  const Icon = column.icon;
  
  return (
    <div className="flex-1 min-w-[320px]">
      <div 
        className="flex items-center gap-2 mb-4 cursor-pointer hover:opacity-70 transition-opacity"
        onClick={() => onHeaderClick(column.id)}
        role="button"
        aria-label={`${t('dashboard.clickToFilter')} ${column.title}`}
        data-testid={`column-header-${column.id}`}
      >
        <Icon className="h-5 w-5 text-muted-foreground" />
        <h3 className="font-semibold">{column.title}</h3>
        <Badge variant="secondary" className="ml-auto">
          {requests.length}
        </Badge>
        {isFiltering && (
          <span className="text-xs text-blue-600 dark:text-blue-400">
            {t('dashboard.filtering')}
          </span>
        )}
      </div>
      <div className="space-y-3">
        {requests.map(request => (
          <RequestCard
            key={request.id}
            request={request}
            columnColor={column.color}
            onOfferCreated={onOfferCreated}
          />
        ))}
        {requests.length === 0 && (
          <div className="text-center text-sm text-muted-foreground py-8">
            {t('dashboard.noMoreTransactions')}
          </div>
        )}
      </div>
    </div>
  );
}

export function KanbanBoard() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const columns = getColumns(t);
  
  const [filters, setFilters] = useState<TransactionFiltersValue>({
    type: 'all',
    status: 'all',
    datePreset: 'today',
    from: null,
    to: null,
  });

  // Build query params from filters
  const buildQueryParams = () => {
    const params = new URLSearchParams();
    if (filters.type !== 'all') params.set('type', filters.type);
    if (filters.status !== 'all') params.set('status', filters.status);
    params.set('datePreset', filters.datePreset);
    if (filters.datePreset === 'range') {
      if (filters.from) params.set('from', filters.from);
      if (filters.to) params.set('to', filters.to);
    }
    return params.toString();
  };

  // Fetch transactions with filters
  const { data: transactions = [], refetch, isLoading } = useQuery<any[]>({
    queryKey: ['/api/transactions', filters.type, filters.status, filters.datePreset, filters.from, filters.to],
    enabled: !!user && (filters.datePreset !== 'range' || !!(filters.from && filters.to)),
  });

  // Fetch offers for transactions
  const { data: allOffers = [] } = useQuery<any[]>({
    queryKey: ['/api/offers'],
    enabled: !!user,
  });

  // Transform transactions into OTC requests
  const formatTransactionFromDB = (transaction: any): OTCRequest => {
    // Count offers for this transaction
    const transactionOffers = allOffers.filter((o: any) => o.transactionId === transaction.id);

    return {
      dbId: transaction.id,
      id: transaction.code || transaction.id.substring(0, 8),
      fullname: "Usuario", // Will be populated from profiles if needed
      type: transaction.type?.toUpperCase() === "BUY" ? "BUY" : "SELL",
      token: `${transaction.token}/${transaction.amountCurrency || 'USD'}`,
      amount: `${transaction.amountValue} ${transaction.token}`,
      date: transaction.createdAt,
      offers: transactionOffers.length,
      status: transaction.status || "pending",
      walletAddress: transaction.walletAddress,
      chain: transaction.chain,
      acceptedByUserId: transaction.acceptedByUserId,
      userId: transaction.userId,
    };
  };

  const allRequests = transactions.map(formatTransactionFromDB);

  // Group by column
  const groupedRequests = useMemo(() => {
    return {
      pending: allRequests.filter(r => r.status === "pending"),
      completed: allRequests.filter(r => r.status === "completed"),
      failed: allRequests.filter(r => r.status === "failed"),
    };
  }, [allRequests]);

  const handleOfferCreated = (requestId: string) => {
    refetch();
  };

  const handleHeaderClick = (status: string) => {
    setFilters(prev => ({
      ...prev,
      status: prev.status === status ? 'all' : (status as any),
    }));
  };

  return (
    <div className="space-y-4">
      <TransactionFilters value={filters} onChange={setFilters} />
      
      {isLoading && (
        <div className="text-sm text-muted-foreground">{t('dashboard.loading')}</div>
      )}

      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map(column => (
          <Column
            key={column.id}
            column={column}
            requests={groupedRequests[column.id as keyof typeof groupedRequests] || []}
            onOfferCreated={handleOfferCreated}
            onHeaderClick={handleHeaderClick}
            isFiltering={filters.status === column.id}
          />
        ))}
      </div>
    </div>
  );
}
