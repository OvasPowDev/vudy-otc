import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, ArrowUpDown, Clock, FileText, Shield, CheckCircle } from "lucide-react";
import { TransactionDetailModal } from "./TransactionDetailModal";
import { MakeOfferDialog } from "./MakeOfferDialog";
import { useLanguage } from "@/contexts/LanguageContext";
import { DateFilterOptions } from "./DateFilter";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
  rejectionReason?: string;
  dbId?: string; // UUID from database
  walletAddress?: string;
  chain?: string;
  acceptedByUserId?: string | null; // Usuario cuya oferta fue aceptada
  myColumn?: "pending" | "offer_made" | "escrow_created"; // Columna calculada para el usuario actual
}

const getTodayDate = () => {
  const date = new Date();
  date.setHours(date.getHours() - 6); // Guatemala timezone (UTC-6)
  return date.toISOString().split('T')[0];
};

const getDateOffset = (daysOffset: number) => {
  const date = new Date();
  date.setHours(date.getHours() - 6); // Guatemala timezone (UTC-6)
  date.setDate(date.getDate() + daysOffset);
  return date.toISOString().split('T')[0];
};

// Helper function to format transaction data from database
const formatTransactionFromDB = (transaction: any): OTCRequest => {
  return {
    dbId: transaction.id,
    id: transaction.code,
    fullname: "User", // Will be populated from profiles if needed
    type: transaction.type?.toUpperCase() as "BUY" | "SELL",
    token: `${transaction.token}/${transaction.amount_currency}`,
    amount: `${transaction.amount_value} ${transaction.token}`,
    date: transaction.created_at,
    offers: transaction.offered_at ? 1 : 0,
    status: transaction.status,
    walletAddress: transaction.wallet_address,
    chain: transaction.chain,
    acceptedByUserId: transaction.accepted_by_user_id,
  };
};

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
      <Card className={`${columnColor} border-none shadow-sm`}>
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
              >
                {t('dashboard.makeOffer')}
              </Button>
            )}
            <Button 
              size="sm" 
              variant="ghost" 
              className={request.myColumn === "pending" ? "px-2" : "flex-1"}
              onClick={() => setDetailsOpen(true)}
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
          ...request,
          transactionId: request.dbId,
        }}
        onOfferCreated={handleOfferCreated}
      />
    </>
  );
}

export function KanbanBoard({ 
  filterType = "all",
  filters = { period: 'today', startDate: '', endDate: '' },
  onAddTransaction
}: { 
  filterType?: "all" | "buy" | "sell";
  filters?: DateFilterOptions;
  onAddTransaction?: (transaction: OTCRequest) => void;
}) {
  const { t } = useLanguage();
  const [requests, setRequests] = useState<OTCRequest[]>([]);
  const [sortOrder, setSortOrder] = useState<{ [key: string]: "asc" | "desc" }>({});
  const [loading, setLoading] = useState(true);
  const [userOffers, setUserOffers] = useState<Record<string, string>>({});
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const columns = getColumns(t);
  
  // Fetch user's offers from database
  const fetchUserOffers = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setCurrentUserId(user.id);

      const { data, error } = await supabase
        .from('otc_offers')
        .select('transaction_id, id')
        .eq('user_id', user.id);

      if (error) throw error;

      if (data) {
        const offersMap: Record<string, string> = {};
        data.forEach(offer => {
          offersMap[offer.transaction_id] = offer.id;
        });
        setUserOffers(offersMap);
      }
    } catch (error) {
      console.error('Error fetching user offers:', error);
    }
  };

  // Fetch transactions from database
  const fetchTransactions = async () => {
    try {
      setLoading(true);
      
      // Convert dates to ISO strings with time boundaries
      const startDateTime = filters.startDate ? `${filters.startDate}T00:00:00.000Z` : null;
      const endDateTime = filters.endDate ? `${filters.endDate}T23:59:59.999Z` : null;
      
      let query = supabase
        .from('transactions')
        .select('*');
      
      // Apply date filters if provided
      if (startDateTime) {
        query = query.gte('created_at', startDateTime);
      }
      if (endDateTime) {
        query = query.lte('created_at', endDateTime);
      }
      
      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;

      if (data) {
        const formattedData = data.map(formatTransactionFromDB);
        setRequests(formattedData);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast.error(t('dashboard.errorFetchingTransactions') || 'Error loading transactions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserOffers();
  }, []);

  useEffect(() => {
    if (filters.startDate && filters.endDate) {
      fetchTransactions();
    }
  }, [filters.startDate, filters.endDate]);
  
  // Expose a method to add transactions
  if (onAddTransaction) {
    // This allows parent to add transactions
    (window as any).__addTransaction = (transaction: OTCRequest) => {
      setRequests(prev => [transaction, ...prev]);
    };
  }
  
  // Compute "myColumn" for each request
  const computeMyColumn = (req: OTCRequest): "pending" | "offer_made" | "escrow_created" | null => {
    const txId = req.dbId;
    if (!txId) return "pending";
    
    const hasMyOffer = !!userOffers[txId];
    
    // Si la transacción está en estado escrow_created
    if (req.status === "escrow_created") {
      // Solo mostrar al usuario cuya oferta fue aceptada
      if (req.acceptedByUserId === currentUserId) {
        return "escrow_created";
      }
      // Para otros usuarios, no mostrar esta transacción
      return null;
    }
    
    // Si no tengo oferta, está pendiente
    if (!hasMyOffer) return "pending";
    
    // Si la transacción fue aceptada por otro usuario, vuelve a pendiente
    if (req.acceptedByUserId && req.acceptedByUserId !== currentUserId) {
      return "pending";
    }
    
    // Si tengo oferta y no fue aceptada por otro, está en "offer_made"
    return "offer_made";
  };

  // Filter requests based on type and add computed column
  let filteredRequests = (filterType === "all" 
    ? requests 
    : filterType === "buy"
      ? requests.filter(req => req.type === "BUY")
      : requests.filter(req => req.type === "SELL")
  ).map(req => ({
    ...req,
    myColumn: computeMyColumn(req)
  })).filter(req => req.myColumn !== null); // Filtrar transacciones que no deben mostrarse

  const getRequestsByStatus = (status: string) => {
    const filtered = filteredRequests.filter((req) => req.myColumn === status);
    const order = sortOrder[status] || "desc";
    
    return filtered.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return order === "asc" ? dateA - dateB : dateB - dateA;
    });
  };

  const toggleSortOrder = (columnId: string) => {
    setSortOrder(prev => ({
      ...prev,
      [columnId]: prev[columnId] === "asc" ? "desc" : "asc"
    }));
  };

  const handleOfferCreated = async (requestId: string) => {
    // Refresh offers and transactions from database after offer is created
    await fetchUserOffers();
    await fetchTransactions();
  };

  return (
    <>
      {/* Desktop view - horizontal scroll */}
      <div className="hidden sm:flex gap-3 sm:gap-4 overflow-x-auto pb-4 snap-x snap-mandatory">
        {columns.map((column) => {
          const columnRequests = getRequestsByStatus(column.id);
          return (
            <div key={column.id} className="flex-shrink-0 w-72 sm:w-80 snap-start">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-base sm:text-lg">{column.title}</h3>
                  <Badge variant="secondary" className="rounded-full text-xs">
                    {columnRequests.length}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleSortOrder(column.id)}
                  className="h-8 px-2"
                >
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-3">
                {loading ? (
                  <div className="text-center text-sm text-muted-foreground py-8">
                    {t('dashboard.loading') || 'Loading...'}
                  </div>
                ) : columnRequests.length === 0 ? (
                  <div className="text-center text-sm text-muted-foreground py-8">
                    {t('dashboard.noMoreTransactions')}
                  </div>
                ) : (
                  columnRequests.map((request) => (
                    <RequestCard
                      key={request.dbId || request.id}
                      request={request}
                      columnColor={column.color}
                      onOfferCreated={handleOfferCreated}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile view - horizontal tabs */}
      <div className="sm:hidden">
        <Tabs defaultValue={columns[0].id} className="w-full">
          <TabsList className="w-full grid grid-cols-3 bg-background border border-border rounded-xl shadow-sm mb-4 h-auto p-1">
            {columns.map((column) => {
              const columnRequests = getRequestsByStatus(column.id);
              const IconComponent = column.icon;
              return (
                <TabsTrigger 
                  key={column.id} 
                  value={column.id}
                  className="flex flex-col items-center justify-center h-auto py-2 px-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md rounded-lg transition-all duration-200"
                >
                  <IconComponent className="h-5 w-5 mb-1" />
                  <Badge className="rounded-full text-[10px] px-1.5 py-0 min-w-[20px] h-5 flex items-center justify-center bg-muted text-muted-foreground data-[state=active]:bg-primary-foreground/20 data-[state=active]:text-primary-foreground">
                    {columnRequests.length}
                  </Badge>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {columns.map((column) => {
            const columnRequests = getRequestsByStatus(column.id);
            return (
              <TabsContent key={column.id} value={column.id} className="w-full mt-0">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-lg">{column.title}</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleSortOrder(column.id)}
                    className="h-8 px-2"
                  >
                    <ArrowUpDown className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-3">
                  {loading ? (
                    <div className="text-center text-sm text-muted-foreground py-8">
                      {t('dashboard.loading') || 'Loading...'}
                    </div>
                  ) : columnRequests.length === 0 ? (
                    <div className="text-center text-sm text-muted-foreground py-8">
                      {t('dashboard.noMoreTransactions')}
                    </div>
                  ) : (
                    columnRequests.map((request) => (
                      <RequestCard
                        key={request.dbId || request.id}
                        request={request}
                        columnColor={column.color}
                        onOfferCreated={handleOfferCreated}
                      />
                    ))
                  )}
                </div>
              </TabsContent>
            );
          })}
        </Tabs>
      </div>
    </>
  );
}

