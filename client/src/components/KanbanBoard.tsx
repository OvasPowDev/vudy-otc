import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Clock, FileText, Shield } from "lucide-react";
import { TransactionDetailModal } from "./TransactionDetailModal";
import { MakeOfferDialog } from "./MakeOfferDialog";
import { KanbanFilters, type FilterValue } from "./KanbanFilters";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";

interface OTCRequest {
  id: string;
  fullname: string;
  type: "BUY" | "SELL";
  token: string;
  amount: string;
  date: string;
  offers: number;
  status: "pending" | "offer_made" | "escrow_created" | "completed";
  escrowSubStatus?: "waiting_deposit" | "deposit_approval";
  dbId?: string;
  walletAddress?: string;
  chain?: string;
  acceptedByUserId?: string | null;
  myColumn?: "pending" | "offer_made" | "escrow_created";
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
  { id: "pending", title: t('dashboard.pending'), color: "bg-slate-100 dark:bg-slate-800", icon: Clock },
  { id: "offer_made", title: t('dashboard.offerMade'), color: "bg-blue-50 dark:bg-blue-950", icon: FileText },
  { id: "escrow_created", title: t('dashboard.escrowCreated'), color: "bg-purple-50 dark:bg-purple-950", icon: Shield },
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
            {request.myColumn === "pending" && (
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

function Column({ column, requests, onOfferCreated }: { column: any; requests: OTCRequest[]; onOfferCreated: (requestId: string) => void }) {
  const Icon = column.icon;
  
  return (
    <div className="flex-1 min-w-[320px]">
      <div className="flex items-center gap-2 mb-4">
        <Icon className="h-5 w-5 text-muted-foreground" />
        <h3 className="font-semibold">{column.title}</h3>
        <Badge variant="secondary" className="ml-auto">
          {requests.length}
        </Badge>
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
            No hay transacciones en esta columna
          </div>
        )}
      </div>
    </div>
  );
}

export function KanbanBoard() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [filters, setFilters] = useState<FilterValue>({
    type: "all",
    datePreset: "today",
    from: null,
    to: null,
  });
  const columns = getColumns(t);

  // Build query params from filters
  const buildQueryKey = () => {
    const params = new URLSearchParams();
    if (filters.type) params.set('type', filters.type);
    if (filters.datePreset) params.set('datePreset', filters.datePreset);
    if (filters.datePreset === 'range') {
      if (filters.from) params.set('from', filters.from);
      if (filters.to) params.set('to', filters.to);
    }
    const queryString = params.toString();
    return queryString ? `/api/transactions?${queryString}` : '/api/transactions';
  };

  // Fetch transactions with filters
  const { data: transactions = [], refetch } = useQuery<any[]>({
    queryKey: [buildQueryKey()],
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
    
    // Determine myColumn based on transaction state
    let myColumn: "pending" | "offer_made" | "escrow_created" | undefined;
    
    // Check if user has made an offer for this transaction
    const myOffer = transactionOffers.find((o: any) => o.userId === user?.id);
    
    if (transaction.userId === user?.id) {
      // User's own transactions - show based on transaction status
      myColumn = transaction.status;
    } else {
      // Other users' transactions - show as liquidator view
      if (myOffer) {
        myColumn = "offer_made";
      } else if (transaction.status === "pending") {
        myColumn = "pending";
      }
    }

    return {
      dbId: transaction.id,
      id: transaction.code || transaction.id.substring(0, 8),
      fullname: "Usuario", // Will be populated from profiles if needed
      type: transaction.type?.toUpperCase() === "BUY" ? "BUY" : "SELL",
      token: `${transaction.token}/${transaction.amountCurrency || 'USD'}`,
      amount: `${transaction.amountValue} ${transaction.token}`,
      date: transaction.createdAt,
      offers: transactionOffers.length,
      status: transaction.status,
      walletAddress: transaction.walletAddress,
      chain: transaction.chain,
      acceptedByUserId: transaction.acceptedByUserId,
      userId: transaction.userId,
      myColumn,
    };
  };

  const allRequests = transactions.map(formatTransactionFromDB);

  // Show all transactions that have a column assignment
  const filteredRequests = allRequests.filter(r => r.myColumn);

  // Group by column
  const groupedRequests = {
    pending: filteredRequests.filter(r => r.myColumn === "pending"),
    offer_made: filteredRequests.filter(r => r.myColumn === "offer_made"),
    escrow_created: filteredRequests.filter(r => r.myColumn === "escrow_created"),
  };

  const handleOfferCreated = (requestId: string) => {
    refetch();
  };

  // Refetch when filters change
  useEffect(() => {
    if (filters.datePreset === 'range' && !(filters.from && filters.to)) {
      return; // Don't refetch until both dates are set
    }
    refetch();
  }, [filters, refetch]);

  // SSE subscription for real-time updates
  useEffect(() => {
    if (!user) return;

    // Build EventSource URL with optional stream key
    const params = new URLSearchParams();
    if (import.meta.env.VITE_STREAM_KEY) {
      params.set('streamKey', import.meta.env.VITE_STREAM_KEY);
    }
    const eventSourceUrl = `/events${params.toString() ? '?' + params.toString() : ''}`;
    const eventSource = new EventSource(eventSourceUrl);

    // Helper to check if transaction passes current filters
    const passesFilters = (tx: any): boolean => {
      // Type filter - map filter values to database values
      // "fiat_to_crypto" (FTC) → type: "buy"
      // "crypto_to_fiat" (CTF) → type: "sell"
      let passType = filters.type === 'all';
      if (!passType) {
        if (filters.type === 'fiat_to_crypto') {
          passType = tx.type === 'buy';
        } else if (filters.type === 'crypto_to_fiat') {
          passType = tx.type === 'sell';
        }
      }
      if (!passType) return false;

      // Date filter based on createdAt
      const txDate = new Date(tx.createdAt);
      const now = new Date();
      
      if (filters.datePreset === 'today') {
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        return txDate >= startOfToday;
      } else if (filters.datePreset === 'this_week') {
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - ((now.getDay() + 6) % 7));
        startOfWeek.setHours(0, 0, 0, 0);
        return txDate >= startOfWeek;
      } else if (filters.datePreset === 'this_month') {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        return txDate >= startOfMonth;
      } else if (filters.datePreset === 'range' && filters.from && filters.to) {
        const fromDate = new Date(filters.from);
        const toDate = new Date(filters.to + 'T23:59:59');
        return txDate >= fromDate && txDate <= toDate;
      }
      
      return true; // No date filter or 'all'
    };

    // Update cache with new/updated transaction
    const updateTransactionCache = (tx: any) => {
      if (!passesFilters(tx)) return;

      // Invalidate queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: [buildQueryKey()] });
      queryClient.invalidateQueries({ queryKey: ['/api/offers'] });
    };

    // Listen to transaction events
    eventSource.addEventListener('tx.created', (e: MessageEvent) => {
      try {
        const transaction = JSON.parse(e.data);
        updateTransactionCache(transaction);
      } catch (error) {
        console.error('Error processing tx.created event:', error);
      }
    });

    eventSource.addEventListener('tx.updated', (e: MessageEvent) => {
      try {
        const transaction = JSON.parse(e.data);
        updateTransactionCache(transaction);
      } catch (error) {
        console.error('Error processing tx.updated event:', error);
      }
    });

    // Error handling (EventSource auto-reconnects)
    eventSource.onerror = () => {
      // EventSource will automatically attempt to reconnect
    };

    // Cleanup on unmount or when dependencies change
    return () => {
      eventSource.close();
    };
  }, [user, filters.type, filters.datePreset, filters.from, filters.to]);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <KanbanFilters value={filters} onChange={setFilters} />

      {/* Kanban Columns */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map(column => (
          <Column
            key={column.id}
            column={column}
            requests={groupedRequests[column.id as keyof typeof groupedRequests] || []}
            onOfferCreated={handleOfferCreated}
          />
        ))}
      </div>
    </div>
  );
}
