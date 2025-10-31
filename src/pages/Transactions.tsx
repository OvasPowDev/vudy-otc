import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { AppHeader } from "@/components/AppHeader";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Download, ChevronLeft, ChevronRight, MoreVertical, Copy, Eye } from "lucide-react";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { TransactionDetailModal } from "@/components/TransactionDetailModal";
import { MakeOfferDialog } from "@/components/MakeOfferDialog";

interface TransactionData {
  id: string;
  code: string;
  createdAt: string;
  offeredAt: string | null;
  approvedAt: string | null;
  completedAt: string | null;
  type: "Buy" | "Sell";
  direction: "CTF" | "FTC";
  chain: string;
  token: string;
  amount: { value: number; currency: string };
  bankAccountId: string;
  walletAddress: string;
  status: "pending" | "offer_made" | "escrow_created" | "completed";
}

interface ApiResponse {
  success: boolean;
  data: {
    total: number;
    items: TransactionData[];
  };
}

const getDateRangeForFilter = (filter: string): { start: Date; end: Date } => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

  switch (filter) {
    case "hoy":
      return { start: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0), end: today };
    case "ultimos_7":
      return { start: subDays(today, 6), end: today };
    case "ultimos_30":
      return { start: subDays(today, 29), end: today };
    case "este_mes":
      return { start: startOfMonth(now), end: endOfMonth(now) };
    default:
      return { start: subDays(today, 29), end: today };
  }
};

const formatDateTime = (dateString: string | null) => {
  if (!dateString) return "-";
  try {
    const date = new Date(dateString);
    return format(date, "dd/MM/yyyy HH:mm");
  } catch {
    return "-";
  }
};

const formatCurrency = (amount: { value: number; currency: string }) => {
  return `${amount.currency} ${amount.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export default function Transactions() {
  const { t, language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [dateFilter, setDateFilter] = useState("ultimos_30");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [chainFilter, setChainFilter] = useState<string>("");
  const [tokenFilter, setTokenFilter] = useState<string>("");
  const [customRangeOpen, setCustomRangeOpen] = useState(false);
  const [customRange, setCustomRange] = useState<{ start: Date; end: Date }>(
    getDateRangeForFilter("ultimos_30")
  );
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [sort, setSort] = useState("created_at:desc");
  const [loading, setLoading] = useState(false);
  const [selectedTxId, setSelectedTxId] = useState<string | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedTxForOffer, setSelectedTxForOffer] = useState<TransactionData | null>(null);
  const [offerDialogOpen, setOfferDialogOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
      } else {
        navigate("/auth");
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
      } else {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (user) {
      fetchTransactions();
    }
  }, [user, dateFilter, customRange, typeFilter, statusFilter, chainFilter, tokenFilter, page, sort]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const dateRange = dateFilter === "rango_personalizado" ? customRange : getDateRangeForFilter(dateFilter);
      
      // Build query
      let query = supabase
        .from('transactions')
        .select('*', { count: 'exact' })
        .gte('created_at', dateRange.start.toISOString())
        .lte('created_at', dateRange.end.toISOString())
        .order(sort.split(':')[0], { ascending: sort.split(':')[1] === 'asc' })
        .range((page - 1) * pageSize, page * pageSize - 1);

      // Apply filters
      if (typeFilter !== "all") {
        query = query.eq('type', typeFilter as any);
      }
      if (statusFilter !== "all") {
        query = query.eq('status', statusFilter as any);
      }
      if (chainFilter) {
        query = query.ilike('chain', `%${chainFilter}%`);
      }
      if (tokenFilter) {
        query = query.ilike('token', `%${tokenFilter}%`);
      }

      const { data, error, count } = await query;

      if (error) {
        throw error;
      }

      // Map database format to component format
      const mappedTransactions: TransactionData[] = (data || []).map((item: any) => ({
        id: item.id,
        code: item.code,
        createdAt: item.created_at,
        offeredAt: item.offered_at,
        approvedAt: item.approved_at,
        completedAt: item.completed_at,
        type: item.type as "Buy" | "Sell",
        direction: item.direction as "CTF" | "FTC",
        chain: item.chain,
        token: item.token,
        amount: {
          value: typeof item.amount_value === 'string' ? parseFloat(item.amount_value) : item.amount_value,
          currency: item.amount_currency
        },
        bankAccountId: item.bank_account_id,
        walletAddress: item.wallet_address,
        status: item.status as "pending" | "offer_made" | "escrow_created" | "completed"
      }));

      setTransactions(mappedTransactions);
      setTotal(count || 0);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      toast.error("Error al cargar las transacciones");
      setTransactions([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const handleDateFilterChange = (value: string) => {
    if (value === "rango_personalizado") {
      setCustomRangeOpen(true);
    } else {
      setDateFilter(value);
      setPage(1);
    }
  };

  const handleApplyCustomRange = () => {
    if (customRange.start > customRange.end) {
      toast.error("La fecha de inicio debe ser anterior a la fecha de fin");
      return;
    }
    
    const daysDiff = Math.floor((customRange.end.getTime() - customRange.start.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff > 365) {
      toast.error("El rango máximo es de 365 días");
      return;
    }

    setDateFilter("rango_personalizado");
    setCustomRangeOpen(false);
    setPage(1);
    toast.success("Rango aplicado");
  };

  const handleExport = (format: string) => {
    const filename = format === "csv" ? "transacciones.csv" : format === "xlsx" ? "transacciones.xlsx" : "transacciones.pdf";
    toast.success(`Exportando a ${format.toUpperCase()}...`);
    
    // Generate CSV for now
    if (format === "csv") {
      const headers = ["Código", "Creación", "Oferta", "Aprobación", "Finalización", "Tipo", "Dirección", "Cadena", "Token", "Monto", "Cuenta Banco", "Wallet", "Estado"];
      const rows = transactions.map(tx => [
        tx.code,
        formatDateTime(tx.createdAt),
        formatDateTime(tx.offeredAt),
        formatDateTime(tx.approvedAt),
        formatDateTime(tx.completedAt),
        tx.type,
        tx.direction,
        tx.chain,
        tx.token,
        formatCurrency(tx.amount),
        tx.bankAccountId,
        tx.walletAddress,
        tx.status
      ]);

      const csv = [headers, ...rows].map(row => row.join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Código copiado");
  };

  const handleRowClick = (txId: string) => {
    setSelectedTxId(txId);
    setDetailModalOpen(true);
  };

  const handleMakeOffer = (tx: TransactionData) => {
    setSelectedTxForOffer(tx);
    setOfferDialogOpen(true);
  };

  const handleOfferCreated = () => {
    fetchTransactions();
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "pending": return "secondary";
      case "offer_made": return "default";
      case "escrow_created": return "default";
      case "completed": return "default";
      default: return "secondary";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100";
      case "offer_made": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100";
      case "escrow_created": return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100";
      case "completed": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100";
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: "Pendiente",
      offer_made: "Oferta hecha",
      escrow_created: "Escrow creado",
      completed: "Completada"
    };
    return labels[status] || status;
  };

  if (!user) {
    return null;
  }

  const totalPages = Math.ceil(total / pageSize);

  return (
    <>
      <div className="min-h-screen w-full bg-background">
        <AppHeader user={user} currentLanguage={language} onLanguageChange={setLanguage} />
        <main className="p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">Transacciones CTF/FTC</h1>
            <div className="mb-6 p-4 bg-muted/50 rounded-lg border">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total de transacciones</span>
                <span className="text-2xl font-bold">{total}</span>
              </div>
            </div>
            
            <div className="flex flex-col gap-4">
              {/* Date and Export Row */}
              <div className="flex items-center justify-between">
                <Select value={dateFilter} onValueChange={handleDateFilterChange}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Fecha" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hoy">Hoy</SelectItem>
                    <SelectItem value="ultimos_7">Últimos 7 días</SelectItem>
                    <SelectItem value="ultimos_30">Últimos 30 días</SelectItem>
                    <SelectItem value="este_mes">Este mes</SelectItem>
                    <SelectItem value="rango_personalizado">Rango personalizado…</SelectItem>
                  </SelectContent>
                </Select>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                      <Download className="mr-2 h-4 w-4" />
                      Exportar
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleExport('csv')}>
                      Exportar CSV
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport('xlsx')}>
                      Exportar Excel
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport('pdf')}>
                      Exportar PDF
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Filters Row */}
              <div className="flex items-center gap-3 flex-wrap">
                <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1); }}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="Buy">Buy (CTF)</SelectItem>
                    <SelectItem value="Sell">Sell (FTC)</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="pending">Pendiente</SelectItem>
                    <SelectItem value="offer_made">Oferta hecha</SelectItem>
                    <SelectItem value="escrow_created">Escrow creado</SelectItem>
                    <SelectItem value="completed">Completada</SelectItem>
                  </SelectContent>
                </Select>

                <Input
                  placeholder="Buscar cadena..."
                  value={chainFilter}
                  onChange={(e) => { setChainFilter(e.target.value); setPage(1); }}
                  className="w-[180px]"
                />

                <Input
                  placeholder="Buscar token..."
                  value={tokenFilter}
                  onChange={(e) => { setTokenFilter(e.target.value); setPage(1); }}
                  className="w-[180px]"
                />

                {(typeFilter !== "all" || statusFilter !== "all" || chainFilter || tokenFilter) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setTypeFilter("all");
                      setStatusFilter("all");
                      setChainFilter("");
                      setTokenFilter("");
                      setPage(1);
                    }}
                  >
                    Limpiar filtros
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="border rounded-lg bg-background overflow-auto">
            <Table aria-label="Tabla de transacciones">
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="w-[120px]">Código</TableHead>
                  <TableHead className="min-w-[200px]">Wallet</TableHead>
                  <TableHead className="w-[140px] text-right">Monto</TableHead>
                  <TableHead className="w-[110px]">Tipo</TableHead>
                  <TableHead className="w-[150px]">Estado</TableHead>
                  <TableHead className="w-[170px]">Fecha de creación</TableHead>
                  <TableHead className="w-[56px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-[200px] text-center">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <p className="text-lg font-medium">Cargando transacciones...</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-[200px] text-center">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <p className="text-lg font-medium">Sin transacciones</p>
                        <p className="text-sm">Ajusta filtros o rango de fechas.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((tx) => (
                    <TableRow 
                      key={tx.id} 
                      className="h-[56px] cursor-pointer hover:bg-muted/50"
                      onClick={() => handleRowClick(tx.id)}
                      aria-label={`Transacción ${tx.code}`}
                    >
                      <TableCell className="font-medium font-mono text-sm">{tx.code}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-mono text-sm">{tx.walletAddress}</span>
                          <span className="text-xs text-muted-foreground">{tx.chain} · {tx.token}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(tx.amount)}</TableCell>
                      <TableCell>{tx.type}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(tx.status)} className={cn("text-xs", getStatusColor(tx.status))}>
                          {getStatusLabel(tx.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{formatDateTime(tx.createdAt)}</TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleRowClick(tx.id)}>
                              <Eye className="mr-2 h-4 w-4" />
                              Ver detalle
                            </DropdownMenuItem>
                            {tx.status === "pending" && (
                              <DropdownMenuItem onClick={() => handleMakeOffer(tx)}>
                                <Copy className="mr-2 h-4 w-4" />
                                Hacer oferta
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => handleCopyCode(tx.code)}>
                              <Copy className="mr-2 h-4 w-4" />
                              Copiar código
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground">
              Mostrando {transactions.length > 0 ? (page - 1) * pageSize + 1 : 0} a {Math.min(page * pageSize, total)} de {total} resultados
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm">Página {page} de {totalPages || 1}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => p + 1)}
                disabled={page >= totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </main>
      </div>

      {/* Custom Date Range Dialog */}
      <Dialog open={customRangeOpen} onOpenChange={setCustomRangeOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Seleccionar rango</DialogTitle>
            <DialogDescription>Selecciona las fechas de inicio y fin para el rango personalizado.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Fecha de inicio</label>
              <Input
                type="datetime-local"
                value={format(customRange.start, "yyyy-MM-dd'T'HH:mm")}
                onChange={(e) => setCustomRange(prev => ({ ...prev, start: new Date(e.target.value) }))}
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Fecha de fin</label>
              <Input
                type="datetime-local"
                value={format(customRange.end, "yyyy-MM-dd'T'HH:mm")}
                onChange={(e) => setCustomRange(prev => ({ ...prev, end: new Date(e.target.value) }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCustomRangeOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleApplyCustomRange}>
              Aplicar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transaction Detail Modal */}
      <TransactionDetailModal
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
        transactionId={selectedTxId || ""}
      />
      
      {/* Make Offer Dialog */}
      {selectedTxForOffer && (
        <MakeOfferDialog
          open={offerDialogOpen}
          onOpenChange={setOfferDialogOpen}
          request={{
            id: selectedTxForOffer.code,
            transactionId: selectedTxForOffer.id,
            type: selectedTxForOffer.type.toUpperCase() as "BUY" | "SELL",
            token: selectedTxForOffer.token,
            amount: selectedTxForOffer.amount.value.toString(),
            senderWallet: selectedTxForOffer.walletAddress,
          }}
          onOfferCreated={handleOfferCreated}
        />
      )}
    </>
  );
}
