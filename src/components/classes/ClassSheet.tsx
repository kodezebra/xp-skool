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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ClassData {
  id?: string;
  name: string;
  level: string;
}

interface ClassSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classData?: ClassData | null;
  onSave: (data: Omit<ClassData, "id">) => void;
  isSaving: boolean;
}

const LEVELS = ["P1", "P2", "P3", "P4", "P5", "P6", "P7", "S1", "S2", "S3", "S4", "S5", "S6"];

export function ClassSheet({
  open,
  onOpenChange,
  classData,
  onSave,
  isSaving,
}: ClassSheetProps) {
  const [name, setName] = useState("");
  const [level, setLevel] = useState("P1");

  useEffect(() => {
    if (classData) {
      setName(classData.name);
      setLevel(classData.level);
    } else {
      setName("");
      setLevel("P1");
    }
  }, [classData, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ name, level });
  };

  const isEditing = !!classData;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[450px] p-10 sm:p-12">
        <SheetHeader className="mb-8">
          <SheetTitle>
            {isEditing ? "Edit Class" : "Add New Class / Stream"}
          </SheetTitle>
          <SheetDescription>
            {isEditing 
              ? "Update the class name or level." 
              : "Define a new class or stream (e.g., P1 Blue)."}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="level">Level</Label>
              <Select value={level} onValueChange={setLevel}>
                <SelectTrigger id="level">
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  {LEVELS.map((l) => (
                    <SelectItem key={l} value={l}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Class Name / Stream</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="e.g. P1 North"
                className="h-10"
              />
              <p className="text-[10px] text-muted-foreground">
                This name will appear on reports and lists.
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
              {isSaving ? "Saving..." : isEditing ? "Save Changes" : "Create Class"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
