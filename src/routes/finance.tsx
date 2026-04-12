import { useState, useMemo, useEffect } from "react";
import { Plus, Search, Download, Wallet, FileText, ChevronLeft, ChevronRight, CreditCard, Save, RefreshCw, Zap, Table as TableIcon, List, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DateRangePicker } from "@/components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import type { DateRange } from "react-day-picker";
import { useFinance, useFeeCategories } from "@/lib/hooks/useFinance";
import { useStudents } from "@/lib/hooks/useStudents";
import { useClasses } from "@/lib/hooks/useClasses";
import { queries } from "@/lib/db";
import { PaymentSheet } from "@/components/finance/PaymentSheet";
import { useToast } from "@/lib/hooks/useToast";
import { cn } from "@/lib/utils";

type FinanceTab = "payments" | "balances" | "structure";

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

  const [activeTab, setActiveTab] = useState<FinanceTab>("payments");

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
          <h1 className="text-xl font-semibold">Finance</h1>
          <p className="text-sm text-muted-foreground">School fees and payment management</p>
        </div>
        <div className="flex gap-2">
          {activeTab === "payments" && (
            <Button variant="outline" size="sm" onClick={exportToCSV} disabled={filteredPayments.length === 0}>
              <Download className="size-4 mr-1.5" />
              Export CSV
            </Button>
          )}
          <Button onClick={() => setIsSheetOpen(true)} size="sm">
            <Plus className="size-4 mr-1.5" />
            Record Payment
          </Button>
        </div>
      </div>

      <div className="flex border-b overflow-x-auto no-scrollbar">
        {[
          { key: "payments", label: "Payment History", icon: List },
          { key: "balances", label: "Student Balances", icon: Wallet },
          { key: "structure", label: "Fee Structure (Billing)", icon: TableIcon },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as FinanceTab)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
              activeTab === tab.key 
                ? "border-primary text-primary" 
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <tab.icon className="size-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "payments" && (
        <>
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
        </>
      )}

      {activeTab === "balances" && <StudentBalancesTab />}
      {activeTab === "structure" && <FeeStructureGridTab />}

      <PaymentSheet 
        open={isSheetOpen} 
        onOpenChange={setIsSheetOpen} 
      />
    </div>
  );
}

function CardStat({ title, value, icon, description, className }: { title: string, value: string, icon: React.ReactNode, description: string, className?: string }) {
  return (
    <div className={cn("bg-card border rounded-lg p-4 space-y-1", className)}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground uppercase">{title}</span>
        {icon}
      </div>
      <div className="text-xl font-bold">{value}</div>
      <p className="text-[10px] text-muted-foreground">{description}</p>
    </div>
  );
}

function StudentBalancesTab() {
  const [outstanding, setOutstanding] = useState<{ student_id: string; student_name: string; class: string; total_due: number; total_paid: number; balance: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("");

  useEffect(() => {
    loadOutstanding();
  }, []);

  async function loadOutstanding() {
    setLoading(true);
    try {
      const data = await queries.fees.getOutstandingBalance();
      setOutstanding(data);
    } catch (error) {
      console.error("Failed to load outstanding:", error);
    } finally {
      setLoading(false);
    }
  }

  const uniqueClasses = useMemo(() => {
    const classSet = new Set(outstanding.map(o => o.class).filter(Boolean));
    return Array.from(classSet).sort();
  }, [outstanding]);

  const filteredData = useMemo(() => {
    return outstanding.filter(o => {
      const matchesSearch = !search || o.student_name.toLowerCase().includes(search.toLowerCase());
      const matchesClass = !classFilter || o.class === classFilter;
      return matchesSearch && matchesClass;
    });
  }, [outstanding, search, classFilter]);

  const totalOutstanding = filteredData.reduce((sum, o) => sum + o.balance, 0);
  const totalPaid = filteredData.reduce((sum, o) => sum + o.total_paid, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <CardStat 
          title="Total Outstanding" 
          value={`${totalOutstanding.toLocaleString()} UGX`} 
          icon={<CreditCard className="size-4 text-red-600" />}
          description="Unpaid fees"
        />
        <CardStat 
          title="Total Paid" 
          value={`${totalPaid.toLocaleString()} UGX`} 
          icon={<Wallet className="size-4 text-green-600" />}
          description="Paid towards dues"
        />
        <CardStat 
          title="Students with Balance" 
          value={filteredData.length.toString()} 
          icon={<FileText className="size-4 text-blue-600" />}
          description="Having outstanding fees"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search student..."
            className="pl-8 h-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={classFilter || "all"} onValueChange={(v) => setClassFilter(v === "all" ? "" : v)}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Classes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Classes</SelectItem>
            {uniqueClasses.map(c => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={loadOutstanding} disabled={loading}>
          <RefreshCw className={cn("size-4 mr-1.5", loading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      <div className="border rounded-lg overflow-hidden bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Student</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Class</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Total Due</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Paid</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredData.map((item) => (
                <tr key={item.student_id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium">{item.student_name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{item.class}</td>
                  <td className="px-4 py-3 text-right">{item.total_due.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-green-600">{item.total_paid.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right font-bold text-red-600">{item.balance.toLocaleString()}</td>
                </tr>
              ))}
              {filteredData.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                    No outstanding balances found.
                  </td>
                </tr>
              )}
            </tbody>
            {filteredData.length > 0 && (
              <tfoot className="bg-muted/50">
                <tr>
                  <td colSpan={2} className="px-4 py-3 text-right font-medium">Totals:</td>
                  <td className="px-4 py-3 text-right font-bold">{filteredData.reduce((s, o) => s + o.total_due, 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right font-bold text-green-600">{filteredData.reduce((s, o) => s + o.total_paid, 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right font-bold text-red-600">{filteredData.reduce((s, o) => s + o.balance, 0).toLocaleString()}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}

function FeeStructureGridTab() {
  const toast = useToast();
  const { classes } = useClasses();
  const { categories, updateCategories, isUpdating: isUpdatingCats } = useFeeCategories();
  const [templates, setTemplates] = useState<Record<string, { category: string, amount: number }[]>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isApplying, setIsApplying] = useState(""); // Stores class name being applied
  const [isCatDialogOpen, setIsCatDialogOpen] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  async function loadTemplates() {
    try {
      const setting = await queries.settings.findByKey("fee_templates");
      if (setting?.value) {
        setTemplates(JSON.parse(setting.value));
      }
    } catch (error) {
      console.error("Failed to load templates:", error);
    }
  }

  const handleUpdateAmount = (className: string, category: string, amountStr: string) => {
    const amount = parseInt(amountStr) || 0;
    setTemplates(prev => {
      const classTemplate = prev[className] || [];
      const existingIdx = classTemplate.findIndex(t => t.category === category);
      
      let newClassTemplate;
      if (existingIdx >= 0) {
        newClassTemplate = classTemplate.map((t, i) => i === existingIdx ? { ...t, amount } : t);
      } else {
        newClassTemplate = [...classTemplate, { category, amount }];
      }
      
      return { ...prev, [className]: newClassTemplate };
    });
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      await queries.settings.upsert("fee_templates", JSON.stringify(templates));
      toast.success("Fee structures saved successfully");
    } catch (error) {
      console.error("Failed to save templates:", error);
      toast.error("Failed to save fee structures");
    } finally {
      setIsSaving(false);
    }
  };

  const handleApplyFees = async (className: string) => {
    setIsApplying(className);
    try {
      const settings = await queries.settings.findAll();
      const year = parseInt(settings.find(s => s.key === "academic_year")?.value || new Date().getFullYear().toString());
      const template = templates[className] || [];
      
      if (template.length === 0 || template.every(t => t.amount === 0)) {
        toast.error(`No fees defined for ${className}`);
        return;
      }

      await queries.fees.bulkApplyFees(className, 1, year, template.filter(t => t.amount > 0));
      toast.success(`Standard fees applied to all students in ${className}`);
    } catch (error) {
      console.error("Failed to apply fees:", error);
      toast.error("Failed to apply fees");
    } finally {
      setIsApplying("");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Standard Fee Billing Grid</h2>
          <p className="text-sm text-muted-foreground">Define fees for each class and apply them to students in one click.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsCatDialogOpen(true)}>
            <Settings className="size-4 mr-1.5" />
            Manage Categories
          </Button>
          <Button onClick={handleSaveAll} disabled={isSaving}>
            <Save className="size-4 mr-1.5" />
            {isSaving ? "Saving..." : "Save Grid Changes"}
          </Button>
        </div>
      </div>

      <div className="border rounded-lg bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-muted/50 border-b">
                <th className="px-3 py-2 text-left text-xs font-bold text-foreground border-r sticky left-0 bg-muted/50 min-w-[120px] z-10">
                  Class
                </th>
                {categories.map(cat => (
                  <th key={cat} className="px-3 py-2 text-center text-[11px] font-semibold text-muted-foreground border-r min-w-[100px]">
                    {cat}
                  </th>
                ))}
                <th className="px-3 py-2 text-center text-[11px] font-bold text-primary min-w-[100px]">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {classes.map(cls => (
                <tr key={cls.id} className="hover:bg-primary/5 transition-colors group">
                  <td className="px-3 py-2 text-xs font-bold border-r sticky left-0 bg-card z-10 group-hover:bg-primary/5">
                    {cls.name}
                  </td>
                  {categories.map(cat => (
                    <td key={cat} className="px-1 py-1 border-r">
                      <input
                        type="number"
                        placeholder="0"
                        className="w-full h-7 text-right font-mono text-xs bg-transparent border-none focus:ring-1 focus:ring-primary/30 rounded px-1 transition-all outline-none"
                        value={templates[cls.name]?.find(t => t.category === cat)?.amount || ""}
                        onChange={(e) => handleUpdateAmount(cls.name, cat, e.target.value)}
                      />
                    </td>
                  ))}
                  <td className="px-3 py-1 text-center">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 px-2 text-[10px] font-bold text-primary hover:bg-primary hover:text-primary-foreground"
                      disabled={isApplying === cls.name}
                      onClick={() => handleApplyFees(cls.name)}
                    >
                      {isApplying === cls.name ? (
                        <RefreshCw className="size-3 animate-spin" />
                      ) : (
                        <>
                          <Zap className="size-3 mr-1" />
                          Bill
                        </>
                      )}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="p-4 bg-primary/5 border border-primary/10 rounded-lg flex items-start gap-3">
        <div className="mt-0.5">
          <Zap className="size-4 text-primary" />
        </div>
        <div className="space-y-1">
          <p className="text-xs font-semibold text-primary">Pro Tip</p>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Filling out this grid defines the "Standard" fees for your school. When a new term starts, simply click 
            <span className="font-bold text-foreground"> "Bill Students" </span> 
            to automatically generate outstanding balances for everyone in that class. This ensures consistency and 
            saves you from manual entry for every student.
          </p>
        </div>
      </div>

      <ManageCategoriesDialog 
        open={isCatDialogOpen} 
        onOpenChange={setIsCatDialogOpen}
        categories={categories}
        onUpdate={updateCategories}
        isUpdating={isUpdatingCats}
      />
    </div>
  );
}

function ManageCategoriesDialog({ 
  open, 
  onOpenChange, 
  categories, 
  onUpdate, 
  isUpdating 
}: { 
  open: boolean, 
  onOpenChange: (v: boolean) => void,
  categories: string[],
  onUpdate: (cats: string[]) => void,
  isUpdating: boolean
}) {
  const [newCat, setNewCat] = useState("");

  const handleAdd = () => {
    if (!newCat.trim()) return;
    if (categories.includes(newCat.trim())) return;
    onUpdate([...categories, newCat.trim()]);
    setNewCat("");
  };

  const handleRemove = (cat: string) => {
    onUpdate(categories.filter(c => c !== cat));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Manage Fee Categories</DialogTitle>
          <DialogDescription>
            Add or remove types of fees you collect (e.g., Tuition, Swimming).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex gap-2">
            <Input 
              placeholder="New category name..." 
              value={newCat}
              onChange={(e) => setNewCat(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
            <Button size="sm" onClick={handleAdd} disabled={isUpdating || !newCat.trim()}>
              Add
            </Button>
          </div>

          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
            {categories.map(cat => (
              <div key={cat} className="flex items-center justify-between p-2 rounded-md border bg-muted/30 group">
                <span className="text-sm font-medium">{cat}</span>
                <Button 
                  variant="ghost" 
                  size="icon-sm" 
                  className="opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive hover:bg-destructive/10 transition-all"
                  onClick={() => handleRemove(cat)}
                  disabled={isUpdating}
                >
                  <Plus className="size-3 rotate-45" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
