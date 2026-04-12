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
import type { Student } from "@/lib/db";
import { useClasses } from "@/lib/hooks/useClasses";
import { useApp } from "@/lib/context/AppContext";

interface StudentSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student?: Student | null;
  onSave: (data: Omit<Student, "id" | "created_at" | "updated_at">) => void;
  isSaving: boolean;
}

const CATEGORY_MAP: Record<string, string[]> = {
  primary: ["primary"],
  secondary: ["secondary"],
  college: ["tertiary"],
  vocational: ["tertiary"],
};

export function StudentSheet({
  open,
  onOpenChange,
  student,
  onSave,
  isSaving,
}: StudentSheetProps) {
  const { classes } = useClasses();
  const { schoolType } = useApp();
  const [name, setName] = useState("");

  const filteredClasses = useMemo(() => {
    const allowedCategories = CATEGORY_MAP[schoolType] || ["primary", "secondary", "tertiary"];
    return classes.filter(c => allowedCategories.includes(c.category));
  }, [classes, schoolType]);

  const [admissionNo, setAdmissionNo] = useState("");
  const [gender, setGender] = useState<"M" | "F">("M");
  const [dob, setDob] = useState("");
  const [currentClass, setCurrentClass] = useState("");
  const [classId, setClassId] = useState("");
  const [status, setStatus] = useState<"active" | "inactive" | "alumni">("active");

  useEffect(() => {
    if (open) {
      if (student) {
        setName(student.name);
        setAdmissionNo(student.admission_no);
        setGender(student.gender);
        setDob(student.date_of_birth || "");
        setCurrentClass(student.current_class);
        setClassId(student.class_id || "");
        setStatus(student.status);
      } else {
        setName("");
        setAdmissionNo("");
        setGender("M");
        setDob("");
        setCurrentClass(filteredClasses[0]?.name || "");
        setClassId(filteredClasses[0]?.id || "");
        setStatus("active");
      }
    }
  }, [student, open]);

  // Handle case where classes load after the sheet is already open
  useEffect(() => {
    if (open && !student && !classId && filteredClasses.length > 0) {
      setClassId(filteredClasses[0].id);
      setCurrentClass(filteredClasses[0].name);
    }
  }, [open, student, filteredClasses, classId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name,
      admission_no: admissionNo,
      gender,
      date_of_birth: dob || undefined,
      current_class: currentClass,
      class_id: classId || undefined,
      status,
      image_path: student?.image_path,
    });
  };

  const handleClassChange = (selectedId: string) => {
    const selectedClass = filteredClasses.find(c => c.id === selectedId);
    if (selectedClass) {
      setClassId(selectedId);
      setCurrentClass(selectedClass.name);
    }
  };

  const isEditing = !!student;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[500px] overflow-y-auto p-10 sm:p-12" side="right">
        <SheetHeader className="mb-8">
          <SheetTitle>
            {isEditing ? "Edit Student Profile" : "Register New Student"}
          </SheetTitle>
          <SheetDescription>
            {isEditing 
              ? "Update core student details below." 
              : "Quick registration: Capture minimal info to get started."}
          </SheetDescription>
        </SheetHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Student Name"
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="admission_no">Admission Number</Label>
              <Input
                id="admission_no"
                value={admissionNo}
                onChange={(e) => setAdmissionNo(e.target.value)}
                required
                placeholder="e.g. 2024/001"
                className="h-10"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select value={gender} onValueChange={(v) => setGender(v as "M" | "F")}>
                  <SelectTrigger id="gender">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="M">Male</SelectItem>
                    <SelectItem value="F">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dob">Date of Birth</Label>
                <DatePicker
                  selected={dob ? new Date(dob) : undefined}
                  onSelect={(date) => setDob(date ? date.toISOString().split('T')[0] : "")}
                  showYearPicker
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="class">Class</Label>
                <Select value={classId} onValueChange={handleClassChange}>
                  <SelectTrigger id="class">
                    <SelectValue placeholder="Select Class" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredClasses.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as "active" | "inactive" | "alumni")}>
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="alumni">Alumni</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <SheetFooter className="flex flex-row justify-end gap-2 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
              className="flex-1 sm:flex-none"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSaving || !name || !admissionNo}
              className="flex-1 sm:flex-none"
            >
              {isSaving ? "Saving..." : isEditing ? "Save Changes" : "Register Student"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
