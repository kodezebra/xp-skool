import { useState, useEffect } from "react";
import { queries } from "@/lib/db";
import { useAuth } from "@/lib/hooks/useAuth";
import { useToast } from "@/lib/hooks/useToast";
import { useClasses } from "@/lib/hooks/useClasses";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, X, FileText } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Student, Attendance } from "@/lib/db";

export function meta() {
  return [{ title: "Academic" }];
}

type Tab = "attendance" | "marks" | "subjects" | "timetable" | "gradebook";

export default function Academic() {
  const [activeTab, setActiveTab] = useState<Tab>("attendance");
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Academic</h1>
        <p className="text-sm text-muted-foreground">Attendance and marks management</p>
      </div>

      <div className="flex border-b overflow-x-auto no-scrollbar">
        {[
          { key: "attendance", label: "Attendance" },
          { key: "marks", label: "Marks Entry" },
          { key: "gradebook", label: "My Classes" },
          { key: "subjects", label: "Subjects" },
          { key: "timetable", label: "Timetable" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as Tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.key ? "border-primary text-primary" : "border-transparent text-muted-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "attendance" && <AttendanceTab />}
      {activeTab === "marks" && <MarksTab />}
      {activeTab === "subjects" && <SubjectsTab />}
      {activeTab === "timetable" && <TimetableTab />}
      {activeTab === "gradebook" && <GradebookTab />}
    </div>
  );
}

function AttendanceTab() {
  const toast = useToast();
  const { user } = useAuth();
  const { classes } = useClasses();
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<Record<string, Attendance["status"]>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (selectedClass) {
      loadStudents();
      loadAttendance();
    }
  }, [selectedClass, selectedDate]);

  async function loadStudents() {
    setIsLoading(true);
    try {
      const all = await queries.students.findAll();
      const classStudents = all.filter((s) => s.current_class === selectedClass && s.status === "active");
      setStudents(classStudents);
    } catch (error) {
      console.error("Failed to load students:", error);
      toast.error("Failed to load students");
    } finally {
      setIsLoading(false);
    }
  }

  async function loadAttendance() {
    try {
      const records = await queries.academic.getAttendance(selectedClass, selectedDate);
      const attendanceMap: Record<string, Attendance["status"]> = {};
      records.forEach((r) => {
        attendanceMap[r.student_id] = r.status;
      });
      setAttendance(attendanceMap);
    } catch (error) {
      console.error("Failed to load attendance:", error);
    }
  }

  async function saveAttendance() {
    if (!selectedClass || !user) return;
    setIsSaving(true);
    try {
      for (const student of students) {
        const status = attendance[student.id] || "present";
        await queries.academic.recordAttendance({
          student_id: student.id,
          class_name: selectedClass,
          date: selectedDate,
          status,
          recorded_by: user.id,
        });
      }
      toast.success("Attendance saved");
    } catch (error) {
      console.error("Failed to save attendance:", error);
      toast.error("Failed to save attendance");
    } finally {
      setIsSaving(false);
    }
  }

  function setAllPresent() {
    const newAttendance: Record<string, Attendance["status"]> = {};
    students.forEach((s) => {
      newAttendance[s.id] = "present";
    });
    setAttendance(newAttendance);
  }

  function markAllAbsent() {
    const newAttendance: Record<string, Attendance["status"]> = {};
    students.forEach((s) => {
      newAttendance[s.id] = "absent";
    });
    setAttendance(newAttendance);
  }

  const presentCount = Object.values(attendance).filter((s) => s === "present").length;
  const absentCount = students.length - presentCount;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Daily Attendance</CardTitle>
          <CardDescription>Record student attendance for a specific class and date</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <div className="space-y-2">
              <Label>Class</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((c) => (
                    <SelectItem key={c.id} value={c.name}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <DatePicker
                selected={selectedDate ? new Date(selectedDate) : undefined}
                onSelect={(date) => setSelectedDate(date ? date.toISOString().split('T')[0] : "")}
              />
            </div>
            <div className="flex items-end gap-2">
              <Button variant="outline" size="sm" onClick={setAllPresent}>
                <Check className="size-4 mr-1" /> All Present
              </Button>
              <Button variant="outline" size="sm" onClick={markAllAbsent}>
                <X className="size-4 mr-1" /> All Absent
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedClass && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">{selectedClass} - {selectedDate}</CardTitle>
              <CardDescription>
                {presentCount} present, {absentCount} absent
              </CardDescription>
            </div>
            <Button onClick={saveAttendance} disabled={isSaving || isLoading}>
              {isSaving ? "Saving..." : "Save Attendance"}
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-center py-8 text-muted-foreground">Loading students...</p>
            ) : students.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">
                No active students in {selectedClass}
              </p>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium">Student</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Adm No</th>
                      <th className="px-4 py-3 text-center text-sm font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {students.map((student) => (
                      <tr key={student.id} className="hover:bg-muted/30">
                        <td className="px-4 py-3 text-sm">{student.name}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{student.admission_no}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            {(["present", "absent", "late", "excused"] as const).map((status) => (
                              <button
                                key={status}
                                onClick={() => setAttendance((prev) => ({ ...prev, [student.id]: status }))}
                                className={`px-2 py-1 text-xs rounded-md transition-colors ${
                                  attendance[student.id] === status
                                    ? status === "present" ? "bg-green-100 text-green-700" :
                                      status === "absent" ? "bg-red-100 text-red-700" :
                                      status === "late" ? "bg-yellow-100 text-yellow-700" :
                                      "bg-blue-100 text-blue-700"
                                    : "bg-muted hover:bg-muted/80 text-muted-foreground"
                                }`}
                              >
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                              </button>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function MarksTab() {
  const toast = useToast();
  const { user } = useAuth();
  const { classes } = useClasses();
  const [subjects, setSubjects] = useState<{ id: string; name: string; code?: string }[]>([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [term, setTerm] = useState("1");
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [students, setStudents] = useState<Student[]>([]);
  const [marks, setMarks] = useState<Record<string, { opening: number; mid: number; end: number }>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadSubjects();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      loadStudents();
    }
  }, [selectedClass]);

  async function loadSubjects() {
    try {
      const subs = await queries.subjects.findAll();
      setSubjects(subs);
    } catch (error) {
      console.error("Failed to load subjects:", error);
    }
  }

  async function loadStudents() {
    setIsLoading(true);
    try {
      const all = await queries.students.findAll();
      const classStudents = all.filter((s) => s.current_class === selectedClass && s.status === "active");
      setStudents(classStudents);
      
      const marksMap: Record<string, { opening: number; mid: number; end: number }> = {};
      for (const student of classStudents) {
        const studentMarks = await queries.academic.getMarks(student.id);
        const subjectMark = studentMarks.find((m) => m.subject_id === selectedSubject && m.term === parseInt(term) && m.year === parseInt(year));
        if (subjectMark) {
          marksMap[student.id] = {
            opening: subjectMark.opening_mark,
            mid: subjectMark.mid_term_mark,
            end: subjectMark.end_term_mark,
          };
        }
      }
      setMarks(marksMap);
    } catch (error) {
      console.error("Failed to load students:", error);
      toast.error("Failed to load students");
    } finally {
      setIsLoading(false);
    }
  }

  async function saveMarks() {
    if (!selectedClass || !selectedSubject || !user) return;
    setIsSaving(true);
    try {
      for (const student of students) {
        const m = marks[student.id] || { opening: 0, mid: 0, end: 0 };
        await queries.academic.recordMarks({
          student_id: student.id,
          subject_id: selectedSubject,
          class_name: selectedClass,
          term: parseInt(term),
          year: parseInt(year),
          opening_mark: m.opening,
          mid_term_mark: m.mid,
          end_term_mark: m.end,
          grade: calculateGrade((m.opening + m.mid + m.end) / 3),
          recorded_by: user.id,
        });
      }
      toast.success("Marks saved");
    } catch (error) {
      console.error("Failed to save marks:", error);
      toast.error("Failed to save marks");
    } finally {
      setIsSaving(false);
    }
  }

  function calculateGrade(average: number): string {
    if (average >= 90) return "A";
    if (average >= 80) return "B";
    if (average >= 70) return "C";
    if (average >= 60) return "D";
    if (average >= 50) return "E";
    return "F";
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Marks Entry</CardTitle>
          <CardDescription>Enter examination marks for students</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-2">
              <Label>Class</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((c) => (
                    <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Subject</Label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name} {s.code ? `(${s.code})` : ""}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Term</Label>
              <Select value={term} onValueChange={setTerm}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Term" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Term 1</SelectItem>
                  <SelectItem value="2">Term 2</SelectItem>
                  <SelectItem value="3">Term 3</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Year</Label>
              <Input
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-24"
              />
            </div>
            <Button onClick={saveMarks} disabled={!selectedClass || !selectedSubject || isSaving}>
              <FileText className="size-4 mr-2" />
              {isSaving ? "Saving..." : "Save Marks"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {selectedClass && selectedSubject && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">
              {selectedClass} - {subjects.find((s) => s.id === selectedSubject)?.name} - Term {term} {year}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-center py-8 text-muted-foreground">Loading...</p>
            ) : students.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">No students found</p>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium">Student</th>
                      <th className="px-4 py-3 text-center text-sm font-medium">Opening (30)</th>
                      <th className="px-4 py-3 text-center text-sm font-medium">Mid-Term (30)</th>
                      <th className="px-4 py-3 text-center text-sm font-medium">End-Term (40)</th>
                      <th className="px-4 py-3 text-center text-sm font-medium">Total</th>
                      <th className="px-4 py-3 text-center text-sm font-medium">Grade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {students.map((student) => {
                      const m = marks[student.id] || { opening: 0, mid: 0, end: 0 };
                      const total = m.opening + m.mid + m.end;
                      return (
                        <tr key={student.id} className="hover:bg-muted/30">
                          <td className="px-4 py-3 text-sm">{student.name}</td>
                          {["opening", "mid", "end"].map((key) => (
                            <td key={key} className="px-4 py-3">
                              <Input
                                type="number"
                                min="0"
                                max={key === "opening" || key === "mid" ? "30" : "40"}
                                value={m[key as keyof typeof m]}
                                onChange={(e) => setMarks((prev) => ({
                                  ...prev,
                                  [student.id]: {
                                    ...prev[student.id] || { opening: 0, mid: 0, end: 0 },
                                    [key]: parseInt(e.target.value) || 0,
                                  },
                                }))}
                                className="w-20 mx-auto text-center"
                              />
                            </td>
                          ))}
                          <td className="px-4 py-3 text-center text-sm font-medium">{total}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2 py-1 text-xs rounded-md font-medium ${
                              calculateGrade(total / 3).startsWith("A") ? "bg-green-100 text-green-700" :
                              calculateGrade(total / 3).startsWith("B") ? "bg-blue-100 text-blue-700" :
                              calculateGrade(total / 3).startsWith("C") ? "bg-yellow-100 text-yellow-700" :
                              "bg-red-100 text-red-700"
                            }`}>
                              {calculateGrade(total / 3)}
                            </span>
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
      )}
    </div>
  );
}

function SubjectsTab() {
  const [subjects, setSubjects] = useState<{ id: string; name: string; code?: string }[]>([]);
  const [newSubject, setNewSubject] = useState({ name: "", code: "" });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; subjectId: string | null }>({ open: false, subjectId: null });
  const toast = useToast();

  useEffect(() => {
    loadSubjects();
  }, []);

  async function loadSubjects() {
    try {
      const subs = await queries.subjects.findAll();
      setSubjects(subs);
    } catch (error) {
      console.error("Failed to load subjects:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function addSubject() {
    if (!newSubject.name.trim()) {
      toast.error("Subject name is required");
      return;
    }
    setIsSaving(true);
    try {
      const created = await queries.subjects.create({
        name: newSubject.name.trim(),
        code: newSubject.code.trim() || undefined,
      });
      setSubjects([...subjects, created]);
      setNewSubject({ name: "", code: "" });
      toast.success("Subject added");
    } catch (error) {
      console.error("Failed to add subject:", error);
      toast.error("Failed to add subject");
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteSubject(id: string) {
    try {
      await queries.subjects.delete(id);
      setSubjects(subjects.filter((s) => s.id !== id));
      toast.success("Subject deleted");
    } catch (error) {
      console.error("Failed to delete subject:", error);
      toast.error("Failed to delete subject");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Subjects</CardTitle>
        <CardDescription>Manage school subjects</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-4">
          <Input
            placeholder="Subject name"
            value={newSubject.name}
            onChange={(e) => setNewSubject((s) => ({ ...s, name: e.target.value }))}
            className="flex-1"
          />
          <Input
            placeholder="Code (optional)"
            value={newSubject.code}
            onChange={(e) => setNewSubject((s) => ({ ...s, code: e.target.value }))}
            className="w-32"
          />
          <Button onClick={addSubject} disabled={isSaving}>
            <Plus className="size-4 mr-2" />
            Add
          </Button>
        </div>

        {isLoading ? (
          <p className="text-center py-8 text-muted-foreground">Loading...</p>
        ) : subjects.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground">No subjects yet</p>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium">Name</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Code</th>
                  <th className="px-4 py-3 w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {subjects.map((subject) => (
                  <tr key={subject.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 text-sm">{subject.name}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{subject.code || "-"}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => {
                          setDeleteConfirm({ open: true, subjectId: subject.id });
                        }}
                        className="p-1 hover:text-destructive"
                      >
                        <X className="size-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>

      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => setDeleteConfirm((prev) => ({ ...prev, open }))}
        title="Delete Subject"
        description="Are you sure you want to delete this subject? This action cannot be undone."
        onConfirm={() => {
          if (deleteConfirm.subjectId) deleteSubject(deleteConfirm.subjectId);
        }}
        confirmText="Delete"
        destructive
      />
    </Card>
  );
}

function Plus(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M5 12h14"/>
      <path d="M12 5v14"/>
    </svg>
  );
}

function TimetableTab() {
  const toast = useToast();
  const { classes } = useClasses();
  const [subjects, setSubjects] = useState<{ id: string; name: string; code?: string }[]>([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [entries, setEntries] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingCell, setEditingCell] = useState<{ day: number; period: number } | null>(null);
  const [cellSubject, setCellSubject] = useState("");

  const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

  useEffect(() => {
    loadSubjects();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      loadTimetable();
    } else {
      setEntries([]);
    }
  }, [selectedClass]);

  async function loadSubjects() {
    try {
      const subs = await queries.subjects.findAll();
      setSubjects(subs);
    } catch (error) {
      console.error("Failed to load subjects:", error);
    }
  }

  async function loadTimetable() {
    setIsLoading(true);
    try {
      const data = await queries.timetable.getByClass(selectedClass);
      setEntries(data);
    } catch (error) {
      console.error("Failed to load timetable:", error);
      toast.error("Failed to load timetable");
    } finally {
      setIsLoading(false);
    }
  }

  async function saveCell() {
    if (!editingCell || !cellSubject || !selectedClass) return;
    setIsSaving(true);
    try {
      await queries.timetable.createOrUpdate({
        class_name: selectedClass,
        day_of_week: editingCell.day,
        period: editingCell.period,
        subject_id: cellSubject,
      });
      await loadTimetable();
      setEditingCell(null);
      setCellSubject("");
      toast.success("Timetable updated");
    } catch (error) {
      console.error("Failed to save timetable:", error);
      toast.error("Failed to save");
    } finally {
      setIsSaving(false);
    }
  }

  function getEntry(day: number, period: number) {
    return entries.find(e => e.day_of_week === day && e.period === period);
  }

  function openEdit(day: number, period: number) {
    const entry = getEntry(day, period);
    setEditingCell({ day, period });
    setCellSubject(entry?.subject_id || "");
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Class Timetable</CardTitle>
          <CardDescription>Set up weekly timetable for classes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="space-y-2">
              <Label>Class</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((c) => (
                    <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedClass && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">{selectedClass} Weekly Timetable</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-center py-8 text-muted-foreground">Loading...</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="border p-2 w-20">Period</th>
                      {DAYS.slice(0, 5).map((day, i) => (
                        <th key={i} className="border p-2 text-center min-w-[120px]">{day}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {PERIODS.map((period) => (
                      <tr key={period}>
                        <td className="border p-2 text-center font-medium bg-muted/30">
                          {period}
                        </td>
                        {DAYS.slice(0, 5).map((_, dayIndex) => {
                          const entry = getEntry(dayIndex, period);
                          return (
                            <td key={dayIndex} className="border p-1 min-h-[60px]">
                              {editingCell?.day === dayIndex && editingCell?.period === period ? (
                                <div className="space-y-1">
                                  <Select value={cellSubject} onValueChange={setCellSubject}>
                                    <SelectTrigger className="w-full h-8 text-xs">
                                      <SelectValue placeholder="-" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {subjects.map((s) => (
                                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <div className="flex gap-1">
                                    <Button size="sm" onClick={saveCell} disabled={isSaving} className="flex-1 h-6 text-xs">
                                      Save
                                    </Button>
                                    <Button size="sm" variant="outline" onClick={() => { setEditingCell(null); setCellSubject(""); }} className="h-6 text-xs">
                                      X
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div
                                  className="p-1 text-xs text-center hover:bg-muted/50 cursor-pointer rounded min-h-[50px] flex items-center justify-center"
                                  onClick={() => openEdit(dayIndex, period)}
                                >
                                  {entry?.subject_name || "-"}
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function GradebookTab() {
  const toast = useToast();
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [marks, setMarks] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadAssignments();
  }, []);

  useEffect(() => {
    if (selectedAssignment) {
      loadClassStudents();
    }
  }, [selectedAssignment]);

  async function loadAssignments() {
    setIsLoading(true);
    try {
      const { getDb } = await import("@/lib/db");
      const database = await getDb();
      const data = await database.select<any[]>(
        `SELECT ta.*, sub.name as subject_name, sub.code as subject_code 
         FROM teacher_assignments ta 
         LEFT JOIN subjects sub ON ta.subject_id = sub.id 
         WHERE ta.teacher_id = $1`,
        [user?.id]
      );
      setAssignments(data);
      if (data.length === 1) {
        setSelectedAssignment(data[0]);
      }
    } catch (error) {
      console.error("Failed to load assignments:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function loadClassStudents() {
    if (!selectedAssignment) return;
    try {
      const classStudents = await queries.students.findAll();
      const filtered = classStudents.filter(
        (s) => s.current_class === selectedAssignment.class_name && s.status === "active"
      );
      setStudents(filtered);
      const marksMap: Record<string, any> = {};
      for (const student of filtered) {
        const studentMarks = await queries.academic.getMarks(student.id);
        const subjectMark = studentMarks.find(
          (m) => m.subject_id === selectedAssignment.subject_id
        );
        if (subjectMark) {
          marksMap[student.id] = subjectMark;
        }
      }
      setMarks(marksMap);
    } catch (error) {
      console.error("Failed to load students:", error);
    }
  }

  async function saveMarks() {
    if (!selectedAssignment || !user) return;
    setIsSaving(true);
    try {
      const currentYear = new Date().getFullYear();
      const currentTerm = 1;
      for (const student of students) {
        const m = marks[student.id] || {};
        await queries.academic.recordMarks({
          student_id: student.id,
          subject_id: selectedAssignment.subject_id,
          class_name: selectedAssignment.class_name,
          term: currentTerm,
          year: currentYear,
          opening_mark: m.opening_mark || 0,
          mid_term_mark: m.mid_term_mark || 0,
          end_term_mark: m.end_term_mark || 0,
          grade: m.grade || "",
          recorded_by: user.id,
        });
      }
      toast.success("Marks saved successfully");
      await loadClassStudents();
    } catch (error) {
      console.error("Failed to save marks:", error);
      toast.error("Failed to save marks");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return <p className="text-center py-8 text-muted-foreground">Loading your classes...</p>;
  }

  if (assignments.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">No classes assigned yet.</p>
          <p className="text-sm text-muted-foreground mt-1">
            Contact your administrator to assign you to classes and subjects.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>My Classes</CardTitle>
          <CardDescription>Quick access to your assigned classes and subjects</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {assignments.map((a) => (
              <button
                key={a.id}
                onClick={() => setSelectedAssignment(a)}
                className={`px-4 py-2 rounded-lg border text-sm transition-colors ${
                  selectedAssignment?.id === a.id
                    ? "bg-primary text-primary-foreground border-primary"
                    : "hover:bg-muted border-border"
                }`}
              >
                {a.class_name} - {a.subject_name}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedAssignment && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">
                {selectedAssignment.class_name} - {selectedAssignment.subject_name}
              </CardTitle>
              <CardDescription>{students.length} students enrolled</CardDescription>
            </div>
            <Button onClick={saveMarks} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Marks"}
            </Button>
          </CardHeader>
          <CardContent>
            {students.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">No students in this class</p>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium">Student</th>
                      <th className="px-4 py-3 text-left font-medium">Adm No</th>
                      <th className="px-4 py-3 text-center font-medium">Op (30)</th>
                      <th className="px-4 py-3 text-center font-medium">Mid (30)</th>
                      <th className="px-4 py-3 text-center font-medium">End (40)</th>
                      <th className="px-4 py-3 text-center font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {students.map((student) => {
                      const mark = marks[student.id] || {};
                      const total = (mark.opening_mark || 0) + (mark.mid_term_mark || 0) + (mark.end_term_mark || 0);
                      return (
                        <tr key={student.id} className="hover:bg-muted/30">
                          <td className="px-4 py-3">{student.name}</td>
                          <td className="px-4 py-3 text-muted-foreground text-xs">{student.admission_no}</td>
                          {["opening_mark", "mid_term_mark", "end_term_mark"].map((key, idx) => (
                            <td key={key} className="px-4 py-3">
                              <Input
                                type="number"
                                min="0"
                                max={idx < 2 ? "30" : "40"}
                                value={mark[key] || ""}
                                onChange={(e) => setMarks((prev) => ({
                                  ...prev,
                                  [student.id]: {
                                    ...prev[student.id] || {},
                                    [key]: parseInt(e.target.value) || 0,
                                  },
                                }))}
                                className="w-16 mx-auto text-center"
                              />
                            </td>
                          ))}
                          <td className="px-4 py-3 text-center font-medium">{total}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
