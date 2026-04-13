import { useState, useEffect, useRef, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { 
  ArrowLeft, 
  User as UserIcon, 
  GraduationCap, 
  Wallet, 
  Calendar, 
  Edit, 
  Save,
  Printer
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
} from "@/components/ui/dialog";
import { useStudent } from "@/lib/hooks/useStudents";
import { useFinance } from "@/lib/hooks/useFinance";
import { useMarks } from "@/lib/hooks/useAcademic";
import { queries, getDb } from "@/lib/db";
import { StudentSheet } from "@/components/students/StudentSheet";
import { PaymentSheet } from "@/components/finance/PaymentSheet";
import { useStudents } from "@/lib/hooks/useStudents";
import { useToast } from "@/lib/hooks/useToast";
import { cn } from "@/lib/utils";
import type { Student, Attendance, AssessmentMark } from "@/lib/db";
import type { Payment } from "@/lib/db";

type Tab = "profile" | "academic" | "finance" | "attendance";

export default function StudentDetail() {
  const { studentId } = useParams<{ studentId: string }>();
  const toast = useToast();
  const { data: student, isLoading } = useStudent(studentId!);
  const { updateStudent, isUpdating } = useStudents();
  const { payments, isLoading: isFinanceLoading } = useFinance(studentId);
  const { marks, isLoading: isMarksLoading } = useMarks(studentId!);
  
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isPaymentSheetOpen, setIsPaymentSheetOpen] = useState(false);

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Loading student details...</div>;
  }

  if (!student) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground mb-4">Student not found.</p>
        <Link to="/students">
          <Button variant="outline">Back to Students</Button>
        </Link>
      </div>
    );
  }

  const handleSave = (data: any) => {
    updateStudent({ id: student.id, data });
    setIsSheetOpen(false);
    toast.success("Student updated");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/students">
          <Button variant="ghost" size="icon" className="shrink-0">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold truncate">{student.name}</h1>
          <p className="text-sm text-muted-foreground">{student.admission_no} • {student.current_class}</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsPaymentSheetOpen(true)} size="sm" variant="default" className="bg-green-600 hover:bg-green-700">
            <Wallet className="size-4 mr-1.5" />
            Record Payment
          </Button>
          <Button onClick={() => setIsSheetOpen(true)} size="sm" variant="outline">
            <Edit className="size-4 mr-1.5" />
            Edit Profile
          </Button>
        </div>
      </div>

      <div className="flex border-b overflow-x-auto no-scrollbar">
        <TabButton 
          active={activeTab === "profile"} 
          onClick={() => setActiveTab("profile")}
          icon={<UserIcon className="size-4" />}
          label="Profile"
        />
        <TabButton 
          active={activeTab === "academic"} 
          onClick={() => setActiveTab("academic")}
          icon={<GraduationCap className="size-4" />}
          label="Academic"
        />
        <TabButton 
          active={activeTab === "finance"} 
          onClick={() => setActiveTab("finance")}
          icon={<Wallet className="size-4" />}
          label="Finance"
        />
        <TabButton 
          active={activeTab === "attendance"} 
          onClick={() => setActiveTab("attendance")}
          icon={<Calendar className="size-4" />}
          label="Attendance"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {activeTab === "profile" && <ProfileTab student={student} />}
          {activeTab === "academic" && (
            <AcademicTab 
              studentId={student.id} 
              studentClass={student.current_class} 
              marks={marks} 
              isLoading={isMarksLoading} 
            />
          )}
          {activeTab === "finance" && <FinanceTab payments={payments} isLoading={isFinanceLoading} />}
          {activeTab === "attendance" && <AttendanceHistoryTab studentId={studentId!} studentClass={student.current_class} />}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Status</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  student.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                }`}>
                  {student.status}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Class</span>
                <span className="font-medium">{student.current_class}</span>
              </div>
              <Separator />
              <div className="pt-2">
                <p className="text-xs text-muted-foreground mb-1">Total Payments</p>
                <p className="text-xl font-bold">
                  {payments.reduce((sum, p) => sum + p.amount, 0).toLocaleString()} <span className="text-xs font-normal">UGX</span>
                </p>
              </div>
              <Separator />
              <div>
                <p className="text-xs text-muted-foreground mb-1">Outstanding Balance</p>
                <BalanceBadge studentId={student.id} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <StudentSheet
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        student={student}
        onSave={handleSave}
        isSaving={isUpdating}
      />

      <PaymentSheet
        open={isPaymentSheetOpen}
        onOpenChange={setIsPaymentSheetOpen}
        studentId={student.id}
      />
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
        active 
          ? "border-primary text-primary" 
          : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function ProfileTab({ student }: { student: Student }) {
  const [isEditing, setIsEditing] = useState(false);
  const [guardian, setGuardian] = useState({
    name: student.guardian_name || "",
    phone: student.guardian_phone || "",
    email: student.guardian_email || "",
    relation: student.guardian_relation || "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const toast = useToast();

  async function saveGuardian() {
    setIsSaving(true);
    try {
      await queries.students.update(student.id, {
        guardian_name: guardian.name || undefined,
        guardian_phone: guardian.phone || undefined,
        guardian_email: guardian.email || undefined,
        guardian_relation: guardian.relation || undefined,
      });
      setIsEditing(false);
      toast.success("Guardian details saved");
    } catch (error) {
      console.error("Failed to save guardian:", error);
      toast.error("Failed to save guardian details");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Personal Information</CardTitle>
          {!isEditing && (
            <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
              <Edit className="size-4 mr-1" />
              Edit
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <InfoItem label="Full Name" value={student.name} />
          <InfoItem label="Admission Number" value={student.admission_no} />
          <InfoItem label="Gender" value={student.gender === "M" ? "Male" : "Female"} />
          <InfoItem label="Date of Birth" value={student.date_of_birth || "Not set"} />
          <InfoItem label="Registration Date" value={new Date(student.created_at).toLocaleDateString()} />
          {student.address && <InfoItem label="Address" value={student.address} />}
        </div>
        
        <Separator />
        
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-medium">Guardian Details</h4>
            {isEditing && (
              <div className="flex gap-2">
                <Button size="sm" onClick={saveGuardian} disabled={isSaving}>
                  <Save className="size-4 mr-1" />
                  {isSaving ? "Saving..." : "Save"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
              </div>
            )}
          </div>
          
          {isEditing ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Guardian Name</Label>
                <Input
                  value={guardian.name}
                  onChange={(e) => setGuardian((g) => ({ ...g, name: e.target.value }))}
                  placeholder="Enter guardian name"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Relationship</Label>
                <Select value={guardian.relation} onValueChange={(v) => setGuardian((g) => ({ ...g, relation: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select relationship" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="father">Father</SelectItem>
                    <SelectItem value="mother">Mother</SelectItem>
                    <SelectItem value="guardian">Guardian</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Phone Number</Label>
                <Input
                  value={guardian.phone}
                  onChange={(e) => setGuardian((g) => ({ ...g, phone: e.target.value }))}
                  placeholder="Enter phone number"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Email</Label>
                <Input
                  type="email"
                  value={guardian.email}
                  onChange={(e) => setGuardian((g) => ({ ...g, email: e.target.value }))}
                  placeholder="Enter email"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {guardian.name ? (
                <>
                  <InfoItem label="Name" value={guardian.name} />
                  <InfoItem label="Relationship" value={guardian.relation || "Not specified"} />
                  <InfoItem label="Phone" value={guardian.phone || "Not provided"} />
                  <InfoItem label="Email" value={guardian.email || "Not provided"} />
                </>
              ) : (
                <p className="text-sm text-muted-foreground col-span-2">No guardian information recorded yet.</p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function AcademicTab({ studentId, studentClass, marks, isLoading }: { studentId: string, studentClass: string, marks: any[], isLoading: boolean }) {
  const [subTab, setSubTab] = useState<"marks" | "subjects">("marks");

  return (
    <div className="space-y-4">
      <div className="flex gap-2 p-1 bg-muted rounded-lg w-fit">
        <button
          onClick={() => setSubTab("marks")}
          className={cn(
            "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
            subTab === "marks" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
          )}
        >
          Marks History
        </button>
        <button
          onClick={() => setSubTab("subjects")}
          className={cn(
            "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
            subTab === "subjects" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
          )}
        >
          Enrolled Subjects
        </button>
      </div>

      {subTab === "marks" ? (
        <MarksSubTab marks={marks} isLoading={isLoading} />
      ) : (
        <SubjectsSubTab studentId={studentId} studentClass={studentClass} />
      )}
    </div>
  );
}

function MarksSubTab({ studentId }: { studentId: string }) {
  const [marks, setMarks] = useState<AssessmentMark[]>([]);
  const [selectedTerm, setSelectedTerm] = useState<{ term: number; year: number } | null>(null);
  const [showReportCard, setShowReportCard] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadMarks();
  }, [studentId]);

  async function loadMarks() {
    setIsLoading(true);
    try {
      const data = await queries.academic.getAssessmentMarks(studentId);
      setMarks(data);
      if (data.length > 0) {
        setSelectedTerm({ term: data[0].term, year: data[0].year });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }

  const terms = useMemo(() => {
    const unique = new Map<string, { term: number; year: number }>();
    marks.forEach(m => {
      unique.set(`${m.term}-${m.year}`, { term: m.term, year: m.year });
    });
    return Array.from(unique.values()).sort((a, b) => b.year - a.year || b.term - a.term);
  }, [marks]);

  const filteredMarks = useMemo(() => {
    if (!selectedTerm) return [];
    return marks.filter(m => m.term === selectedTerm.term && m.year === selectedTerm.year);
  }, [marks, selectedTerm]);

  // Group marks by subject for the report card
  const subjectGrouped = useMemo(() => {
    const groups: Record<string, Record<string, number>> = {};
    filteredMarks.forEach(m => {
      if (!groups[m.subject_id]) groups[m.subject_id] = {};
      groups[m.subject_id][m.assessment_name] = m.score;
    });
    return groups;
  }, [filteredMarks]);

  const assessmentNames = useMemo(() => {
    const names = new Set<string>();
    filteredMarks.forEach(m => names.add(m.assessment_name));
    return Array.from(names);
  }, [filteredMarks]);

  function getGrade(total: number) {
    if (total >= 90) return { grade: "A", remarks: "Excellent" };
    if (total >= 80) return { grade: "B", remarks: "Very Good" };
    if (total >= 70) return { grade: "C", remarks: "Good" };
    if (total >= 60) return { grade: "D", remarks: "Satisfactory" };
    if (total >= 50) return { grade: "E", remarks: "Pass" };
    return { grade: "F", remarks: "Fail" };
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Academic Progress</CardTitle>
          {terms.length > 0 && (
            <div className="flex gap-2">
              <Select
                value={selectedTerm ? `${selectedTerm.term}-${selectedTerm.year}` : ""}
                onValueChange={(v) => {
                  const [term, year] = v.split("-").map(Number);
                  setSelectedTerm({ term, year });
                }}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="All Terms" />
                </SelectTrigger>
                <SelectContent>
                  {terms.map(t => (
                    <SelectItem key={`${t.term}-${t.year}`} value={`${t.term}-${t.year}`}>
                      Term {t.term} {t.year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button size="sm" variant="outline" onClick={() => setShowReportCard(true)}>
                <Printer className="size-4 mr-1" />
                Report Card
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center py-8 text-muted-foreground text-sm">Loading academic records...</p>
          ) : filteredMarks.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground text-sm">No marks found for the selected period.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground bg-muted/30">
                    <th className="text-left py-2 px-2">Subject</th>
                    {assessmentNames.map(name => (
                      <th key={name} className="text-center py-2 px-2">{name}</th>
                    ))}
                    <th className="text-right py-2 px-2 font-bold">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {Object.entries(subjectGrouped).map(([subjectId, scores]) => {
                    const total = Object.values(scores).reduce((a, b) => a + b, 0);
                    return (
                      <tr key={subjectId}>
                        <td className="py-2 px-2 font-medium">{subjectId}</td>
                        {assessmentNames.map(name => (
                          <td key={name} className="text-center py-2 px-2">{scores[name] || "-"}</td>
                        ))}
                        <td className="text-right py-2 px-2">
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-bold mr-2",
                            getGrade(total).grade === "F" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                          )}>
                            {getGrade(total).grade}
                          </span>
                          {total}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showReportCard} onOpenChange={setShowReportCard}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Academic Report Card</DialogTitle>
          </DialogHeader>
          <div ref={reportRef} className="p-8 border rounded-lg space-y-6">
            <div className="text-center border-b pb-4">
              <h2 className="text-2xl font-bold uppercase tracking-tight">Student Progress Report</h2>
              <p className="text-muted-foreground">Term {selectedTerm?.term}, Academic Year {selectedTerm?.year}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm mb-6">
              <div>
                <p><span className="text-muted-foreground uppercase text-[10px] font-bold">Student Name:</span></p>
                <p className="font-bold">Managed at Page Level</p>
              </div>
              <div className="text-right">
                <p><span className="text-muted-foreground uppercase text-[10px] font-bold">Generated:</span></p>
                <p className="font-mono">{new Date().toLocaleDateString()}</p>
              </div>
            </div>

            <table className="w-full text-sm border">
              <thead>
                <tr className="bg-muted/50 border-b">
                  <th className="py-3 px-4 text-left border-r">Subject</th>
                  {assessmentNames.map(name => (
                    <th key={name} className="py-3 px-2 text-center border-r">{name}</th>
                  ))}
                  <th className="py-3 px-2 text-center border-r">Total</th>
                  <th className="py-3 px-2 text-center">Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {Object.entries(subjectGrouped).map(([subjectId, scores]) => {
                  const total = Object.values(scores).reduce((a, b) => a + b, 0);
                  return (
                    <tr key={subjectId}>
                      <td className="py-3 px-4 font-medium border-r">{subjectId}</td>
                      {assessmentNames.map(name => (
                        <td key={name} className="py-3 px-2 text-center border-r">{scores[name] || "0"}</td>
                      ))}
                      <td className="py-3 px-2 text-center border-r font-bold">{total}</td>
                      <td className="py-3 px-2 text-center font-bold text-primary">{getGrade(total).grade}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReportCard(false)}>Close</Button>
            <Button onClick={() => window.print()}>Print Now</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function SubjectsSubTab({ studentId, studentClass }: { studentId: string, studentClass: string }) {
  const toast = useToast();
  const [enrolled, setEnrolled] = useState<{ id: string; name: string; code?: string }[]>([]);
  const [allSubjects, setAllSubjects] = useState<{ id: string; name: string; code?: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadData();
  }, [studentId]);

  async function loadData() {
    setLoading(true);
    try {
      const [enrolledData, all] = await Promise.all([
        queries.studentSubjects.findByStudent(studentId),
        queries.subjects.findAll()
      ]);
      setEnrolled(enrolledData);
      setAllSubjects(all);
    } catch (error) {
      console.error("Failed to load subject data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAssign(subjectId: string) {
    setIsProcessing(true);
    try {
      await queries.studentSubjects.assign(studentId, subjectId);
      toast.success("Subject assigned");
      loadData();
    } catch (error) {
      toast.error("Failed to assign subject");
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleUnassign(subjectId: string) {
    setIsProcessing(true);
    try {
      await queries.studentSubjects.unassign(studentId, subjectId);
      toast.success("Subject removed");
      loadData();
    } catch (error) {
      toast.error("Failed to remove subject");
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleResetToDefaults() {
    setIsProcessing(true);
    try {
      await queries.students.assignDefaultSubjectsByClass(studentId, studentClass);
      toast.success("Reset to class defaults complete");
      loadData();
    } catch (error) {
      toast.error("Failed to reset subjects");
    } finally {
      setIsProcessing(false);
    }
  }

  const available = allSubjects.filter(s => !enrolled.find(e => e.id === s.id));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Current Curriculum</CardTitle>
            <p className="text-[10px] text-muted-foreground uppercase font-bold">{enrolled.length} Subjects Enrolled</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleResetToDefaults} disabled={isProcessing}>
            <RotateCcw className="size-3 mr-1.5" />
            Reset Defaults
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-8 text-muted-foreground">Loading...</p>
          ) : enrolled.length === 0 ? (
            <div className="text-center py-8 bg-muted/20 rounded-lg border border-dashed">
              <p className="text-sm text-muted-foreground">No subjects enrolled yet.</p>
              <p className="text-[10px] mt-1">Click "Reset Defaults" or add manually.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {enrolled.map(s => (
                <div key={s.id} className="flex items-center justify-between p-2 rounded-md border bg-card hover:bg-muted/30 transition-colors group">
                  <div>
                    <p className="text-sm font-medium">{s.name}</p>
                    <p className="text-[10px] font-mono text-muted-foreground uppercase">{s.code || "No Code"}</p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon-sm" 
                    className="opacity-0 group-hover:opacity-100 text-destructive hover:bg-destructive/10"
                    onClick={() => handleUnassign(s.id)}
                    disabled={isProcessing}
                  >
                    <UserMinus className="size-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Available Subjects</CardTitle>
          <p className="text-[10px] text-muted-foreground uppercase font-bold">Add to student curriculum</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
            {available.length === 0 ? (
              <p className="text-center py-8 text-xs text-muted-foreground">No more subjects available.</p>
            ) : (
              available.map(s => (
                <div key={s.id} className="flex items-center justify-between p-2 rounded-md border bg-muted/10">
                  <div>
                    <p className="text-sm font-medium">{s.name}</p>
                    <p className="text-[10px] font-mono text-muted-foreground uppercase">{s.code}</p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-primary hover:bg-primary/10 h-8"
                    onClick={() => handleAssign(s.id)}
                    disabled={isProcessing}
                  >
                    <Plus className="size-3 mr-1" />
                    Add
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function FinanceTab({ payments, isLoading }: { payments: Payment[], isLoading: boolean }) {
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const receiptRef = useRef<HTMLDivElement>(null);

  function printReceipt(payment: Payment) {
    setSelectedPayment(payment);
  }

  function handlePrint() {
    const printContent = receiptRef.current;
    if (!printContent) return;
    
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt - ${selectedPayment?.id}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; max-width: 600px; margin: auto; }
            .receipt { border: 1px solid #ccc; padding: 20px; }
            .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 20px; }
            .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #ccc; }
            .total { font-weight: bold; font-size: 1.2em; border-top: 2px solid #000; margin-top: 10px; padding-top: 10px; }
            .footer { text-align: center; margin-top: 30px; font-size: 0.9em; color: #666; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          <div class="receipt" ref=${printContent.id}>
            <div class="header">
              <h1>Payment Receipt</h1>
              <p>Receipt #: ${selectedPayment?.id.slice(0, 8).toUpperCase()}</p>
              <p>${new Date(selectedPayment?.payment_date || "").toLocaleDateString()}</p>
            </div>
            <div class="row">
              <span>Category:</span>
              <span>${selectedPayment?.category}</span>
            </div>
            <div class="row">
              <span>Payment Method:</span>
              <span>${selectedPayment?.payment_method}</span>
            </div>
            ${selectedPayment?.reference_no ? `
            <div class="row">
              <span>Reference:</span>
              <span>${selectedPayment.reference_no}</span>
            </div>
            ` : ""}
            <div class="row total">
              <span>Amount Paid:</span>
              <span>UGX ${selectedPayment?.amount.toLocaleString()}</span>
            </div>
            ${selectedPayment?.remarks ? `
            <div class="row">
              <span>Remarks:</span>
              <span>${selectedPayment.remarks}</span>
            </div>
            ` : ""}
            <div class="footer">
              <p>Thank you for your payment!</p>
              <p>This is an official receipt.</p>
            </div>
          </div>
          <script>window.print(); window.close();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center py-8 text-sm text-muted-foreground">Loading payments...</p>
          ) : payments.length === 0 ? (
            <p className="text-center py-8 text-sm text-muted-foreground">No payment records found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left py-2">Date</th>
                    <th className="text-left py-2">Category</th>
                    <th className="text-left py-2">Method</th>
                    <th className="text-right py-2">Amount (UGX)</th>
                    <th className="w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {payments.map(p => (
                    <tr key={p.id} className="hover:bg-muted/30">
                      <td className="py-2">{new Date(p.payment_date).toLocaleDateString()}</td>
                      <td className="py-2 capitalize">{p.category}</td>
                      <td className="py-2 uppercase text-xs">{p.payment_method.replace("_", " ")}</td>
                      <td className="py-2 text-right font-medium">{p.amount.toLocaleString()}</td>
                      <td className="py-2">
                        <Button variant="ghost" size="icon-sm" onClick={() => printReceipt(p)} title="Print Receipt">
                          <Printer className="size-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedPayment} onOpenChange={() => setSelectedPayment(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Payment Receipt</DialogTitle>
          </DialogHeader>
          <div ref={receiptRef} id="receipt-content" className="border rounded-lg p-6 space-y-4">
            <div className="text-center border-b pb-4">
              <h2 className="font-bold text-lg">Payment Receipt</h2>
              <p className="text-sm text-muted-foreground">
                Receipt #{selectedPayment?.id.slice(0, 8).toUpperCase()}
              </p>
              <p className="text-sm text-muted-foreground">
                {selectedPayment && new Date(selectedPayment.payment_date).toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric"
                })}
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Category</span>
                <span className="capitalize">{selectedPayment?.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payment Method</span>
                <span className="uppercase">{selectedPayment?.payment_method}</span>
              </div>
              {selectedPayment?.reference_no && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Reference</span>
                  <span>{selectedPayment.reference_no}</span>
                </div>
              )}
            </div>
            <div className="border-t pt-4 flex justify-between items-center">
              <span className="font-semibold">Amount Paid</span>
              <span className="text-xl font-bold">UGX {selectedPayment?.amount.toLocaleString()}</span>
            </div>
            {selectedPayment?.remarks && (
              <div className="border-t pt-4">
                <p className="text-sm text-muted-foreground">Remarks</p>
                <p>{selectedPayment.remarks}</p>
              </div>
            )}
            <div className="border-t pt-4 text-center">
              <p className="text-sm text-muted-foreground">Thank you for your payment!</p>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setSelectedPayment(null)}>
              Close
            </Button>
            <Button onClick={handlePrint}>
              <Printer className="size-4 mr-2" />
              Print
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function AttendanceHistoryTab({ studentId }: { studentId: string; studentClass: string }) {
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadAttendance() {
      setIsLoading(true);
      try {
        const database = await getDb();
        const records = await database.select<Attendance[]>(
          "SELECT * FROM attendance WHERE student_id = $1 ORDER BY date DESC LIMIT 100",
          [studentId]
        );
        setAttendance(records);
      } catch (error) {
        console.error("Failed to load attendance:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadAttendance();
  }, [studentId]);

  const presentCount = attendance.filter((a) => a.status === "present").length;
  const absentCount = attendance.filter((a) => a.status === "absent").length;
  const lateCount = attendance.filter((a) => a.status === "late").length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Attendance History</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <p className="text-center py-8 text-sm text-muted-foreground">Loading attendance...</p>
        ) : attendance.length === 0 ? (
          <p className="text-center py-8 text-sm text-muted-foreground">No attendance records found.</p>
        ) : (
          <>
            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-green-100 text-green-700">{presentCount}</span>
                <span className="text-muted-foreground">Present</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-red-100 text-red-700">{absentCount}</span>
                <span className="text-muted-foreground">Absent</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-yellow-100 text-yellow-700">{lateCount}</span>
                <span className="text-muted-foreground">Late</span>
              </div>
            </div>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr className="text-muted-foreground">
                    <th className="text-left py-2 px-4">Date</th>
                    <th className="text-left py-2 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {attendance.map((record) => (
                    <tr key={record.id}>
                      <td className="py-2 px-4">{new Date(record.date).toLocaleDateString()}</td>
                      <td className="py-2 px-4">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          record.status === "present" ? "bg-green-100 text-green-700" :
                          record.status === "absent" ? "bg-red-100 text-red-700" :
                          record.status === "late" ? "bg-yellow-100 text-yellow-700" :
                          "bg-blue-100 text-blue-700"
                        }`}>
                          {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function InfoItem({ label, value }: { label: string, value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}

function BalanceBadge({ studentId }: { studentId: string }) {
  const [balance, setBalance] = useState<{ balance: number; totalDue: number; totalPaid: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBalance() {
      try {
        const data = await queries.fees.getStudentBalance(studentId);
        setBalance(data);
      } catch (error) {
        console.error("Failed to load balance:", error);
      } finally {
        setLoading(false);
      }
    }
    loadBalance();
  }, [studentId]);

  if (loading) {
    return <p className="text-lg font-semibold">Loading...</p>;
  }

  if (!balance || balance.balance <= 0) {
    return (
      <div>
        <p className="text-lg font-bold text-green-600">0 UGX</p>
        <p className="text-xs text-muted-foreground">Fully paid</p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-lg font-bold text-red-600">{balance.balance.toLocaleString()} UGX</p>
      <p className="text-xs text-muted-foreground">
        {balance.totalDue > 0 ? (
          <>Due: {balance.totalDue.toLocaleString()} / Paid: {balance.totalPaid.toLocaleString()}</>
        ) : (
          <>No fee structure set</>
        )}
      </p>
    </div>
  );
}
