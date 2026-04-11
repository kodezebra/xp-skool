import { useState, useMemo } from "react";
import { Plus, Search, Download, Wallet, FileText, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DateRangePicker } from "@/components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { DateRange } from "react-day-picker";
import { useFinance } from "@/lib/hooks/useFinance";
import { useStudents } from "@/lib/hooks/useStudents";
import { PaymentSheet } from "@/components/finance/PaymentSheet";
import { useToast } from "@/lib/hooks/useToast";

export default function Finance() {
  const { payments, isLoading } = useFinance();
  const { students } = useStudents();
  const toast = useToast();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 25;

  const dateFrom = dateRange?.from?.toISOString().split('T')[0] || "";
  const dateTo = dateRange?.to?.toISOString().split('T')[0] || "";

  const getStudentName = (id: string) => {
    const student = students.find(s => s.id === id);
    return student ? student.name : "Unknown Student";
  };

  const categories = useMemo(() => {
    const cats = new Set(payments.map(p => p.category));
    return Array.from(cats).sort();
  }, [payments]);

  const filteredPayments = useMemo(() => {
    return payments.filter(p => {
      const studentName = getStudentName(p.student_id).toLowerCase();
      const ref = (p.reference_no || "").toLowerCase();
      const query = search.toLowerCase();
      
      const matchesSearch = studentName.includes(query) || ref.includes(query);
      const matchesCategory = !categoryFilter || p.category === categoryFilter;
      const matchesDateFrom = !dateFrom || new Date(p.payment_date) >= new Date(dateFrom);
      const matchesDateTo = !dateTo || new Date(p.payment_date) <= new Date(dateTo + "T23:59:59");
      
      return matchesSearch && matchesCategory && matchesDateFrom && matchesDateTo;
    });
  }, [payments, search, categoryFilter, dateFrom, dateTo, students]);

  const totalPages = Math.ceil(filteredPayments.length / PAGE_SIZE);
  const paginatedPayments = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredPayments.slice(start, start + PAGE_SIZE);
  }, [filteredPayments, page]);

  const totalCollected = filteredPayments.reduce((sum, p) => sum + p.amount, 0);
  const pageTotal = paginatedPayments.reduce((sum, p) => sum + p.amount, 0);

  function exportToCSV() {
    if (filteredPayments.length === 0) {
      toast.error("No data to export");
      return;
    }

    const headers = ["Date", "Student", "Category", "Method", "Reference", "Amount"];
    const rows = filteredPayments.map(p => [
      new Date(p.payment_date).toLocaleDateString(),
      getStudentName(p.student_id),
      p.category,
      p.payment_method,
      p.reference_no || "",
      p.amount.toString(),
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `payments_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success("Export complete");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Finance Ledger</h1>
          <p className="text-sm text-muted-foreground">Track all school fee collections</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportToCSV} disabled={filteredPayments.length === 0}>
            <Download className="size-4 mr-1.5" />
            Export CSV
          </Button>
          <Button onClick={() => setIsSheetOpen(true)} size="sm">
            <Plus className="size-4 mr-1.5" />
            Record Payment
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <CardStat 
          title="Total Collected" 
          value={`${totalCollected.toLocaleString()} UGX`} 
          icon={<Wallet className="size-4 text-green-600" />}
          description="Based on current filters"
        />
        <CardStat 
          title="Transactions" 
          value={filteredPayments.length.toString()} 
          icon={<FileText className="size-4 text-blue-600" />}
          description="Recorded payments"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search student or reference..."
            className="pl-8 h-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={categoryFilter || "all"} onValueChange={(v) => setCategoryFilter(v === "all" ? "" : v)}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map(cat => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <DateRangePicker
          selected={dateRange}
          onSelect={setDateRange}
        />
      </div>

      <div className="border rounded-lg overflow-hidden bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Student</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Category</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Method</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Reference</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Amount (UGX)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedPayments.map((payment) => (
                <tr key={payment.id} className="hover:bg-muted/30 transition-colors group">
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(payment.payment_date).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 font-medium">
                    {getStudentName(payment.student_id)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full bg-secondary text-[10px] font-medium">
                      {payment.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 uppercase text-[10px] text-muted-foreground">
                    {payment.payment_method.replace("_", " ")}
                  </td>
                  <td className="px-4 py-3 text-xs font-mono text-muted-foreground">
                    {payment.reference_no || "-"}
                  </td>
                  <td className="px-4 py-3 text-right font-bold">
                    {payment.amount.toLocaleString()}
                  </td>
                </tr>
              ))}
              {paginatedPayments.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                    No transactions found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
            {paginatedPayments.length > 0 && (
              <tfoot className="bg-muted/50">
                <tr>
                  <td colSpan={5} className="px-4 py-3 text-right font-medium">Page Total:</td>
                  <td className="px-4 py-3 text-right font-bold">{pageTotal.toLocaleString()}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/30">
            <p className="text-xs text-muted-foreground">
              Showing {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, filteredPayments.length)} of {filteredPayments.length}
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="size-4" />
              </Button>
              <span className="px-2 text-xs">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <PaymentSheet 
        open={isSheetOpen} 
        onOpenChange={setIsSheetOpen} 
      />
    </div>
  );
}

function CardStat({ title, value, icon, description }: { title: string, value: string, icon: React.ReactNode, description: string }) {
  return (
    <div className="bg-card border rounded-lg p-4 space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground uppercase">{title}</span>
        {icon}
      </div>
      <div className="text-xl font-bold">{value}</div>
      <p className="text-[10px] text-muted-foreground">{description}</p>
    </div>
  );
}
