import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Eye, Search, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Transaction {
  id: string;
  userId: string;
  type: string;
  token: string;
  amountValue: string;
  amountCurrency: string;
  bankAccount: string;
  wallet: string;
  status: string;
  createdAt: string;
  code?: string;
}

export function TransactionsDataTable() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const { data: transactions = [], isLoading } = useQuery<Transaction[]>({
    queryKey: [`/api/transactions?userId=${user?.id}`],
    enabled: !!user,
  });

  // Filter transactions
  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch = 
      transaction.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.token?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || transaction.status === statusFilter;
    const matchesType = typeFilter === "all" || transaction.type?.toLowerCase() === typeFilter.toLowerCase();

    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", label: string }> = {
      pending: { variant: "outline", label: "Pendiente" },
      offer_made: { variant: "secondary", label: "Oferta Hecha" },
      escrow_created: { variant: "default", label: "Escrow Creado" },
      waiting_deposit: { variant: "default", label: "Esperando Depósito" },
      deposit_approval: { variant: "default", label: "Aprobación Depósito" },
      completed: { variant: "default", label: "Completada" },
    };

    const config = statusConfig[status] || { variant: "outline" as const, label: status };
    return <Badge variant={config.variant} data-testid={`badge-status-${status}`}>{config.label}</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Tabla de Transacciones</span>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar por código, token..."
                className="pl-8 w-[250px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                data-testid="input-search-transactions"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[150px]" data-testid="select-type-filter">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="buy">Compra (CTF)</SelectItem>
                <SelectItem value="sell">Venta (FTC)</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]" data-testid="select-status-filter">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendiente</SelectItem>
                <SelectItem value="offer_made">Oferta Hecha</SelectItem>
                <SelectItem value="escrow_created">Escrow Creado</SelectItem>
                <SelectItem value="completed">Completada</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {transactions.length === 0 
                ? "No tienes transacciones todavía. Crea tu primera transacción."
                : "No se encontraron transacciones con los filtros aplicados."}
            </p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Token</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((transaction) => (
                  <TableRow key={transaction.id} data-testid={`row-transaction-${transaction.id}`}>
                    <TableCell className="font-medium" data-testid={`text-code-${transaction.id}`}>
                      {transaction.code || transaction.id.substring(0, 8)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {transaction.type?.toLowerCase() === 'buy' ? (
                          <>
                            <ArrowUpRight className="h-4 w-4 text-green-600" />
                            <span>Compra (CTF)</span>
                          </>
                        ) : (
                          <>
                            <ArrowDownRight className="h-4 w-4 text-red-600" />
                            <span>Venta (FTC)</span>
                          </>
                        )}
                      </div>
                    </TableCell>
                    <TableCell data-testid={`text-token-${transaction.id}`}>
                      {transaction.token}
                    </TableCell>
                    <TableCell data-testid={`text-amount-${transaction.id}`}>
                      <div>
                        <div>{transaction.amountValue} {transaction.token}</div>
                        <div className="text-xs text-muted-foreground">
                          {transaction.amountCurrency}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(transaction.status)}
                    </TableCell>
                    <TableCell data-testid={`text-date-${transaction.id}`}>
                      {format(new Date(transaction.createdAt), "dd MMM yyyy", { locale: es })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        data-testid={`button-view-${transaction.id}`}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
