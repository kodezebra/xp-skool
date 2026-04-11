import { useState, useEffect, useMemo } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useStudents } from "@/lib/hooks/useStudents";
import { useClasses } from "@/lib/hooks/useClasses";
import { useFinance } from "@/lib/hooks/useFinance";
import { useAuth } from "@/lib/hooks/useAuth";
import { useToast } from "@/lib/hooks/useToast";
import { Search } from "lucide-react";

interface PaymentSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId?: string; // If provided, the student is pre-selected
}

const CATEGORIES = ["Tuition", "Uniform", "Lunch", "Transport", "Admission", "Other"];
const METHODS = [
  { value: "cash", label: "Cash" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "mobile_money", label: "Mobile Money" },
  { value: "cheque", label: "Cheque" }
];

export function PaymentSheet({
  open,
  onOpenChange,
  studentId: initialStudentId,
}: PaymentSheetProps) {
  const toast = useToast();
  const { user } = useAuth();
  const { students } = useStudents();
  const { classes } = useClasses();
  const { recordPayment, isRecording } = useFinance();

  const [selectedClassId, setSelectedClassId] = useState<string>("all");
  const [studentSearch, setStudentSearch] = useState("");
  const [studentId, setStudentId] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Tuition");
  const [method, setMethod] = useState("cash");
  const [reference, setReference] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [remarks, setRemarks] = useState("");

  // Filter students based on class and search query
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchesClass = selectedClassId === "all" || s.current_class === selectedClassId || s.class_id === selectedClassId;
      const matchesSearch = s.name.toLowerCase().includes(studentSearch.toLowerCase()) || 
                           s.admission_no.toLowerCase().includes(studentSearch.toLowerCase());
      return matchesClass && matchesSearch;
    });
  }, [students, selectedClassId, studentSearch]);

  useEffect(() => {
    if (initialStudentId) {
      setStudentId(initialStudentId);
    } else {
      setStudentId("");
    }
    setSelectedClassId("all");
    setStudentSearch("");
    setAmount("");
    setReference("");
    setRemarks("");
  }, [initialStudentId, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId || !amount || !user) return;

    recordPayment({
      student_id: studentId,
      amount: parseInt(amount),
      payment_date: date,
      payment_method: method,
      reference_no: reference || undefined,
      category,
      recorded_by: user.id,
      remarks: remarks || undefined,
    });

    toast.success("Payment recorded successfully");
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[550px] overflow-y-auto p-10 sm:p-12">
        <SheetHeader className="mb-8">
          <SheetTitle>Record Payment</SheetTitle>
          <SheetDescription>
            Find a student by class or name to record their fee payment.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            {!initialStudentId && (
              <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="class-filter">1. Filter by Class</Label>
                    <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                      <SelectTrigger id="class-filter">
                        <SelectValue placeholder="All Classes" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Classes</SelectItem>
                        {classes.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="student-search">2. Search Name/Admission No.</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-3 size-4 text-muted-foreground" />
                      <Input
                        id="student-search"
                        placeholder="Type student name or number..."
                        value={studentSearch}
                        onChange={(e) => setStudentSearch(e.target.value)}
                        className="pl-9 h-10"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t">
                  <Label htmlFor="student">3. Select Student Result</Label>
                  <select
                    id="student"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    required
                    size={5}
                    className="flex w-full rounded-md border border-input bg-background px-1 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    {filteredStudents.length === 0 ? (
                      <option disabled>No students found...</option>
                    ) : (
                      filteredStudents.map((s) => (
                        <option key={s.id} value={s.id} className="py-1 px-2 cursor-pointer hover:bg-primary hover:text-primary-foreground">
                          {s.name} ({s.admission_no}) - {s.current_class}
                        </option>
                      ))
                    )}
                  </select>
                  <p className="text-[10px] text-muted-foreground">
                    {filteredStudents.length} students matching filters
                  </p>
                </div>
              </div>
            )}

            {studentId && (
              <div className="p-3 bg-primary/5 border border-primary/20 rounded-md text-sm">
                <span className="text-muted-foreground">Recording payment for: </span>
                <span className="font-bold">
                  {students.find(s => s.id === studentId)?.name}
                </span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (UGX)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  placeholder="e.g. 500000"
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Payment Date</Label>
                <DatePicker
                  selected={date ? new Date(date) : undefined}
                  onSelect={(d) => setDate(d ? d.toISOString().split('T')[0] : "")}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="method">Method</Label>
                <Select value={method} onValueChange={setMethod}>
                  <SelectTrigger id="method">
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    {METHODS.map((m) => (
                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reference">Reference / Receipt No.</Label>
              <Input
                id="reference"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Bank slip or MM ID"
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="remarks">Remarks (Optional)</Label>
              <Input
                id="remarks"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Additional notes"
                className="h-10"
              />
            </div>
          </div>

          <SheetFooter className="pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isRecording}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isRecording || !studentId || !amount}
              className="flex-1"
            >
              {isRecording ? "Recording..." : "Complete Payment"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
