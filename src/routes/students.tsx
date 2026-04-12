import { useState, useMemo } from "react";
import { Plus, Search, Edit2, Trash2, User as UserIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useStudents } from "@/lib/hooks/useStudents";
import { useClasses } from "@/lib/hooks/useClasses";
import { StudentSheet } from "@/components/students/StudentSheet";
import { useToast } from "@/lib/hooks/useToast";
import { useApp } from "@/lib/context/AppContext";
import type { Student } from "@/lib/db";
import { Link } from "react-router-dom";

const PAGE_SIZE = 20;

export default function Students() {
  const toast = useToast();
  const { classes: allClasses } = useClasses();
  const { schoolType } = useApp();
  const { 
    students, 
    isLoading, 
    createStudent, 
    updateStudent, 
    deleteStudent,
    isCreating,
    isUpdating
  } = useStudents();
  
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; studentId: string | null; studentName: string }>({
    open: false,
    studentId: null,
    studentName: "",
  });

  const categoryMap: Record<string, string[]> = {
    primary: ["primary"],
    secondary: ["secondary"],
    college: ["tertiary"],
    vocational: ["tertiary"],
  };
  const allowedCategories = categoryMap[schoolType] || ["primary", "secondary", "tertiary"];
  const classes = useMemo(() => {
    const classSet = new Set(students.filter(s => allowedCategories.some(cat => {
      const c = allClasses.find(cl => cl.name === s.current_class);
      return c?.category === cat;
    })).map(s => s.current_class));
    return Array.from(classSet).sort();
  }, [students, allClasses, allowedCategories]);

  const handleRegister = () => {
    setEditingStudent(null);
    setModalOpen(true);
  };

  const handleEdit = (student: Student) => {
    setEditingStudent(student);
    setModalOpen(true);
  };

  const handleSave = (data: Omit<Student, "id" | "created_at" | "updated_at">) => {
    if (editingStudent) {
      updateStudent({ id: editingStudent.id, data });
      toast.success("Student updated successfully");
    } else {
      createStudent(data);
      toast.success("Student registered successfully");
    }
    setModalOpen(false);
  };

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchesSearch = 
        s.name.toLowerCase().includes(search.toLowerCase()) || 
        s.admission_no.toLowerCase().includes(search.toLowerCase());
      const matchesClass = !classFilter || s.current_class === classFilter;
      const matchesStatus = !statusFilter || s.status === statusFilter;
      return matchesSearch && matchesClass && matchesStatus;
    });
  }, [students, search, classFilter, statusFilter]);

  const totalPages = Math.ceil(filteredStudents.length / PAGE_SIZE);
  const paginatedStudents = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredStudents.slice(start, start + PAGE_SIZE);
  }, [filteredStudents, page]);

  function goToPage(newPage: number) {
    setPage(Math.max(1, Math.min(newPage, totalPages)));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Students</h1>
          <p className="text-sm text-muted-foreground">
            {filteredStudents.length} student{filteredStudents.length !== 1 ? "s" : ""} 
            {search && ` matching "${search}"`}
          </p>
        </div>
        <Button onClick={handleRegister} size="sm">
          <Plus className="size-4 mr-1" />
          Register Student
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search name or admission number..."
            className="pl-8"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <Select value={classFilter || "all"} onValueChange={(v) => { setClassFilter(v === "all" ? "" : v); setPage(1); }}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Classes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Classes</SelectItem>
            {classes.map(c => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter || "all"} onValueChange={(v) => { setStatusFilter(v === "all" ? "" : v); setPage(1); }}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="alumni">Alumni</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Student</th>
                <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Adm. No</th>
                <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Class</th>
                <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Gender</th>
                <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-3 py-2.5 text-right font-medium text-muted-foreground"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedStudents.map((student) => (
                <tr key={student.id} className="hover:bg-muted/30 transition-colors group">
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        {student.image_path ? (
                          <img src={student.image_path} alt="" className="size-full rounded-full object-cover" />
                        ) : (
                          <UserIcon className="size-4 text-primary" />
                        )}
                      </div>
                      <Link 
                        to={`/students/${student.id}`}
                        className="font-medium hover:text-primary transition-colors"
                      >
                        {student.name}
                      </Link>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 font-mono text-xs">{student.admission_no}</td>
                  <td className="px-3 py-2.5">{student.current_class}</td>
                  <td className="px-3 py-2.5">{student.gender === "M" ? "Male" : "Female"}</td>
                  <td className="px-3 py-2.5">
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium capitalize ${
                      student.status === "active" ? "bg-green-100 text-green-700" : 
                      student.status === "alumni" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"
                    }`}>
                      {student.status}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <div className="flex justify-end gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon-sm" onClick={() => handleEdit(student)}>
                        <Edit2 className="size-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" onClick={() => {
                        setDeleteConfirm({ open: true, studentId: student.id, studentName: student.name });
                      }}>
                        <Trash2 className="size-3.5 text-destructive" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {paginatedStudents.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={6} className="px-3 py-12 text-center text-muted-foreground">
                    {search || classFilter || statusFilter ? "No students match your filters." : "No students registered yet."}
                  </td>
                </tr>
              )}
              {isLoading && (
                <tr>
                  <td colSpan={6} className="px-3 py-12 text-center text-muted-foreground">
                    Loading students...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/30">
            <p className="text-xs text-muted-foreground">
              Showing {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, filteredStudents.length)} of {filteredStudents.length}
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => goToPage(page - 1)}
                disabled={page === 1}
              >
                <ChevronLeft className="size-4" />
              </Button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }
                return (
                  <Button
                    key={pageNum}
                    variant={page === pageNum ? "default" : "outline"}
                    size="icon-sm"
                    onClick={() => goToPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => goToPage(page + 1)}
                disabled={page === totalPages}
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <StudentSheet
        open={modalOpen}
        onOpenChange={setModalOpen}
        student={editingStudent}
        onSave={handleSave}
        isSaving={isCreating || isUpdating}
      />

      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => setDeleteConfirm((prev) => ({ ...prev, open }))}
        title="Delete Student"
        description={`Are you sure you want to delete ${deleteConfirm.studentName}? This action cannot be undone.`}
        onConfirm={() => {
          if (deleteConfirm.studentId) {
            deleteStudent(deleteConfirm.studentId);
            toast.success("Student deleted");
          }
        }}
        confirmText="Delete"
        destructive
      />
    </div>
  );
}
