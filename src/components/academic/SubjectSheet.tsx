import { useState, useEffect } from "react";
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
import type { Subject } from "@/lib/db";

interface SubjectSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subject?: Subject | null;
  onSave: (data: Omit<Subject, "id">) => void;
  isSaving: boolean;
}

export function SubjectSheet({
  open,
  onOpenChange,
  subject,
  onSave,
  isSaving,
}: SubjectSheetProps) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");

  useEffect(() => {
    if (subject) {
      setName(subject.name);
      setCode(subject.code || "");
    } else {
      setName("");
      setCode("");
    }
  }, [subject, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ name, code: code || undefined });
  };

  const isEditing = !!subject;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[450px] p-10 sm:p-12">
        <SheetHeader className="mb-8">
          <SheetTitle>
            {isEditing ? "Edit Subject" : "Add New Subject"}
          </SheetTitle>
          <SheetDescription>
            {isEditing 
              ? "Update the subject name or code." 
              : "Define a new academic subject (e.g., Mathematics, English)."}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Subject Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="e.g. Mathematics"
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="code">Subject Code (Optional)</Label>
              <Input
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. MATH"
                className="h-10"
              />
              <p className="text-[10px] text-muted-foreground">
                Short code used for report cards.
              </p>
            </div>
          </div>

          <SheetFooter className="pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSaving || !name}
              className="flex-1"
            >
              {isSaving ? "Saving..." : isEditing ? "Save Changes" : "Create Subject"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
