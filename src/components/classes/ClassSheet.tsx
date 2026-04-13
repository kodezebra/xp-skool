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
  category: string;
}

interface ClassSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classData?: ClassData | null;
  onSave: (data: Omit<ClassData, "id">) => void;
  isSaving: boolean;
}

const CATEGORIES = [
  { value: "primary", label: "Primary (P1-P7)" },
  { value: "secondary", label: "Secondary (S1-S6)" },
  { value: "tertiary", label: "Tertiary (Other)" },
] as const;

const LEVELS = ["P1", "P2", "P3", "P4", "P5", "P6", "P7", "S1", "S2", "S3", "S4", "S5", "S6", "Year 1", "Year 2", "Year 3", "Other"];

export function ClassSheet({
  open,
  onOpenChange,
  classData,
  onSave,
  isSaving,
}: ClassSheetProps) {
  const [name, setName] = useState("");
  const [level, setLevel] = useState("P1");
  const [baseCategory, setBaseCategory] = useState<string>("primary");
  const [customCategory, setCustomCategory] = useState("");

  useEffect(() => {
    if (classData) {
      setName(classData.name);
      setLevel(classData.level);
      if (["primary", "secondary"].includes(classData.category)) {
        setBaseCategory(classData.category);
        setCustomCategory("");
      } else {
        setBaseCategory("tertiary");
        setCustomCategory(classData.category);
      }
    } else {
      setName("");
      setLevel("P1");
      setBaseCategory("primary");
      setCustomCategory("");
    }
  }, [classData, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalCategory = baseCategory === "tertiary" ? customCategory || "Tertiary" : baseCategory;
    onSave({ name, level, category: finalCategory });
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
              <Label htmlFor="category">School Level</Label>
              <Select value={baseCategory} onValueChange={setBaseCategory}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {baseCategory === "tertiary" && (
              <div className="space-y-2">
                <Label htmlFor="custom-category">Program / Course Name</Label>
                <Input
                  id="custom-category"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  required
                  placeholder="e.g. ICT, Nursing, Law"
                  className="h-10"
                />
                <p className="text-[10px] text-muted-foreground">
                  Specify the course this class belongs to.
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="level">Study Year / Grade</Label>
              <Select value={level} onValueChange={setLevel}>
                <SelectTrigger id="level">
                  <SelectValue placeholder="Select year" />
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
                placeholder="e.g. Year 1 Day, P1 North"
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
              disabled={isSaving || !name || (baseCategory === 'tertiary' && !customCategory)}
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
