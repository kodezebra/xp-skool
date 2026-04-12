import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, School, Upload, Image as ImageIcon, Save, Download, Database, AlertTriangle, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useClasses } from "@/lib/hooks/useClasses";
import { ClassSheet } from "@/components/classes/ClassSheet";
import { useToast } from "@/lib/hooks/useToast";
import { queries } from "@/lib/db";
import { openImagePicker, saveImage, getImageAsDataUrl } from "@/lib/images";
import { save, open } from "@tauri-apps/plugin-dialog";
import { writeTextFile, readTextFile } from "@tauri-apps/plugin-fs";

interface SchoolSettings {
  app_name: string;
  school_type: string;
  school_address: string;
  school_phone: string;
  school_email: string;
  school_logo: string;
  academic_year: string;
  term1_start: string;
  term1_end: string;
  term2_start: string;
  term2_end: string;
  term3_start: string;
  term3_end: string;
}

interface FeeStructure {
  id: string;
  name: string;
  amount: number;
  category: string;
  class_level?: string;
}

export default function Settings() {
  const toast = useToast();
  const { classes, isLoading, createClass, updateClass, deleteClass, isCreating, isUpdating } = useClasses();
  
  const [activeTab, setActiveTab] = useState<"general" | "classes" | "academic" | "fees" | "system">("general");
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<{ id?: string; name: string; level: string; category: "primary" | "secondary" | "tertiary" } | null>(null);
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings>({
    app_name: "",
    school_type: "",
    school_address: "",
    school_phone: "",
    school_email: "",
    school_logo: "",
    academic_year: new Date().getFullYear().toString(),
    term1_start: "",
    term1_end: "",
    term2_start: "",
    term2_end: "",
    term3_start: "",
    term3_end: "",
  });
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [newFee, setNewFee] = useState({ name: "", amount: "", category: "tuition", class_level: "" });
  const [showFeeForm, setShowFeeForm] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [restoreData, setRestoreData] = useState<string | null>(null);
  const [deleteClassConfirm, setDeleteClassConfirm] = useState<{ open: boolean; classId: string | null; className: string }>({
    open: false,
    classId: null,
    className: "",
  });

  useEffect(() => {
    loadSettings();
    loadFeeStructures();
  }, []);

  useEffect(() => {
    if (schoolSettings.school_logo) {
      getImageAsDataUrl(schoolSettings.school_logo).then(setLogoPreview);
    }
  }, [schoolSettings.school_logo]);

  async function loadSettings() {
    try {
      const allSettings = await queries.settings.findAll();
      const settingsMap: Record<string, string> = {};
      allSettings.forEach((s) => {
        settingsMap[s.key] = s.value;
      });
      setSchoolSettings((prev) => ({
        ...prev,
        app_name: settingsMap.app_name || "",
        school_type: settingsMap.school_type || "",
        school_address: settingsMap.school_address || "",
        school_phone: settingsMap.school_phone || "",
        school_email: settingsMap.school_email || "",
        school_logo: settingsMap.school_logo || "",
        academic_year: settingsMap.academic_year || new Date().getFullYear().toString(),
        term1_start: settingsMap.term1_start || "",
        term1_end: settingsMap.term1_end || "",
        term2_start: settingsMap.term2_start || "",
        term2_end: settingsMap.term2_end || "",
        term3_start: settingsMap.term3_start || "",
        term3_end: settingsMap.term3_end || "",
      }));
    } catch (error) {
      console.error("Failed to load settings:", error);
    }
  }

  async function loadFeeStructures() {
    try {
      const settings = await queries.settings.findAll();
      const fees: FeeStructure[] = [];
      settings.forEach((s) => {
        if (s.key.startsWith("fee_")) {
          const parts = s.key.split("_");
          fees.push({
            id: s.key,
            name: parts.slice(2, -1).join("_"),
            amount: parseFloat(s.value),
            category: parts[1],
            class_level: parts.length > 3 ? parts[parts.length - 1] : undefined,
          });
        }
      });
      setFeeStructures(fees);
    } catch (error) {
      console.error("Failed to load fee structures:", error);
    }
  }

  const handleSaveGeneral = async () => {
    setIsSaving(true);
    try {
      await queries.settings.upsert("school_address", schoolSettings.school_address);
      await queries.settings.upsert("school_phone", schoolSettings.school_phone);
      await queries.settings.upsert("school_email", schoolSettings.school_email);
      toast.success("Settings saved");
    } catch (error) {
      console.error("Failed to save settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAcademic = async () => {
    setIsSaving(true);
    try {
      await queries.settings.upsert("academic_year", schoolSettings.academic_year);
      await queries.settings.upsert("term1_start", schoolSettings.term1_start);
      await queries.settings.upsert("term1_end", schoolSettings.term1_end);
      await queries.settings.upsert("term2_start", schoolSettings.term2_start);
      await queries.settings.upsert("term2_end", schoolSettings.term2_end);
      await queries.settings.upsert("term3_start", schoolSettings.term3_start);
      await queries.settings.upsert("term3_end", schoolSettings.term3_end);
      toast.success("Academic settings saved");
    } catch (error) {
      console.error("Failed to save academic settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoUpload = async () => {
    const result = await openImagePicker();
    if (!result) return;

    try {
      const savedPath = await saveImage(result.data, "logos");
      await queries.settings.upsert("school_logo", savedPath);
      setSchoolSettings((prev) => ({ ...prev, school_logo: savedPath }));
      toast.success("Logo uploaded");
    } catch (error) {
      console.error("Failed to upload logo:", error);
      toast.error("Failed to upload logo");
    }
  };

  const handleAddFee = async () => {
    if (!newFee.name || !newFee.amount) {
      toast.error("Name and amount are required");
      return;
    }
    try {
      const key = `fee_${newFee.category}_${newFee.name.toLowerCase().replace(/\s+/g, "_")}${newFee.class_level ? "_" + newFee.class_level : ""}`;
      await queries.settings.upsert(key, newFee.amount);
      await loadFeeStructures();
      setNewFee({ name: "", amount: "", category: "tuition", class_level: "" });
      setShowFeeForm(false);
      toast.success("Fee added");
    } catch (error) {
      console.error("Failed to add fee:", error);
      toast.error("Failed to add fee");
    }
  };

  const handleDeleteFee = async (id: string) => {
    try {
      await queries.settings.delete(id);
      await loadFeeStructures();
      toast.success("Fee deleted");
    } catch (error) {
      console.error("Failed to delete fee:", error);
      toast.error("Failed to delete fee");
    }
  };

  const handleAdd = () => {
    setEditingClass(null);
    setIsSheetOpen(true);
  };

  const handleEdit = (c: { id: string; name: string; level: string; category: "primary" | "secondary" | "tertiary" }) => {
    setEditingClass(c);
    setIsSheetOpen(true);
  };

  const handleSaveClass = (data: { name: string; level: string; category: "primary" | "secondary" | "tertiary" }) => {
    if (editingClass?.id) {
      updateClass({ id: editingClass.id, data });
      toast.success("Class updated");
    } else {
      createClass(data);
      toast.success("Class created");
    }
    setIsSheetOpen(false);
  };

  async function exportData() {
    setIsExporting(true);
    try {
      const [settings, students, payments] = await Promise.all([
        queries.settings.findAll(),
        queries.students.findAll(),
        queries.finance.getPayments(),
      ]);

      const backup = {
        version: "1.0",
        exported_at: new Date().toISOString(),
        settings,
        students,
        payments,
      };

      const filePath = await save({
        defaultPath: `skool_backup_${new Date().toISOString().split("T")[0]}.json`,
        filters: [{ name: "JSON", extensions: ["json"] }],
      });

      if (filePath) {
        await writeTextFile(filePath, JSON.stringify(backup, null, 2));
        toast.success("Data exported successfully");
      }
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("Failed to export data");
    } finally {
      setIsExporting(false);
    }
  }

  async function importData() {
    setIsImporting(true);
    try {
      const filePath = await open({
        multiple: false,
        filters: [{ name: "JSON", extensions: ["json"] }],
      });

      if (filePath) {
        const content = await readTextFile(filePath as string);
        const backup = JSON.parse(content);

        if (!backup.version || !backup.data) {
          toast.error("Invalid backup file format");
          return;
        }

        setRestoreData(content);
        setShowRestoreConfirm(true);
      }
    } catch (error) {
      console.error("Import failed:", error);
      toast.error("Failed to read backup file");
    } finally {
      setIsImporting(false);
    }
  }

  async function confirmRestore() {
    if (!restoreData) return;

    try {
      const backup = JSON.parse(restoreData);

      for (const setting of backup.settings || []) {
        await queries.settings.upsert(setting.key, setting.value);
      }

      setShowRestoreConfirm(false);
      setRestoreData(null);
      toast.success("Data restored successfully. Please refresh the page.");
    } catch (error) {
      console.error("Restore failed:", error);
      toast.error("Failed to restore data");
    }
  }

  const groupedClasses = classes.reduce((acc, c) => {
    const categoryLabel = c.category === "primary" ? "Primary" : c.category === "secondary" ? "Secondary" : "Tertiary";
    if (!acc[categoryLabel]) acc[categoryLabel] = [];
    acc[categoryLabel].push(c);
    return acc;
  }, {} as Record<string, typeof classes>);

  const categoryOrder = ["Primary", "Secondary", "Tertiary"];
  const levels = Object.keys(groupedClasses).sort((a, b) => {
    const aIdx = categoryOrder.indexOf(a);
    const bIdx = categoryOrder.indexOf(b);
    return (aIdx === -1 ? 99 : aIdx) - (bIdx === -1 ? 99 : bIdx);
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage school configuration and structure</p>
      </div>

      <div className="flex border-b overflow-x-auto no-scrollbar">
        {[
          { key: "general", label: "General" },
          { key: "academic", label: "Academic Year" },
          { key: "fees", label: "Fee Structure" },
          { key: "classes", label: "Classes & Streams" },
          { key: "system", label: "System" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.key ? "border-primary text-primary" : "border-transparent text-muted-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "general" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>School Information</CardTitle>
              <CardDescription>Basic information about your school</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>School Name</Label>
                <Input value={schoolSettings.app_name} disabled />
              </div>
              <div className="space-y-2">
                <Label>School Type</Label>
                <Input value={schoolSettings.school_type} disabled className="capitalize" />
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Input
                  value={schoolSettings.school_address}
                  onChange={(e) => setSchoolSettings((s) => ({ ...s, school_address: e.target.value }))}
                  placeholder="Enter school address"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    value={schoolSettings.school_phone}
                    onChange={(e) => setSchoolSettings((s) => ({ ...s, school_phone: e.target.value }))}
                    placeholder="Phone number"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    value={schoolSettings.school_email}
                    onChange={(e) => setSchoolSettings((s) => ({ ...s, school_email: e.target.value }))}
                    placeholder="Email address"
                    type="email"
                  />
                </div>
              </div>
              <Button onClick={handleSaveGeneral} disabled={isSaving} className="w-full">
                <Save className="size-4 mr-2" />
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>School Logo</CardTitle>
              <CardDescription>Upload your school&apos;s logo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-center border-2 border-dashed rounded-lg h-48 bg-muted/50">
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt="School logo"
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <div className="text-center text-muted-foreground">
                    <ImageIcon className="size-12 mx-auto mb-2" />
                    <p className="text-sm">No logo uploaded</p>
                  </div>
                )}
              </div>
              <Button onClick={handleLogoUpload} variant="outline" className="w-full">
                <Upload className="size-4 mr-2" />
                {logoPreview ? "Change Logo" : "Upload Logo"}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "academic" && (
        <Card>
          <CardHeader>
            <CardTitle>Academic Year & Terms</CardTitle>
            <CardDescription>Configure the academic calendar</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Academic Year</Label>
              <Input
                type="number"
                value={schoolSettings.academic_year}
                onChange={(e) => setSchoolSettings((s) => ({ ...s, academic_year: e.target.value }))}
                className="w-32"
              />
            </div>
            
            <div className="border-t pt-6">
              <h3 className="font-medium mb-4 flex items-center gap-2">
                <Calendar className="size-4" />
                Term Dates
              </h3>
              <div className="grid gap-6 md:grid-cols-3">
                {[
                  { start: "term1_start", end: "term1_end", label: "Term 1" },
                  { start: "term2_start", end: "term2_end", label: "Term 2" },
                  { start: "term3_start", end: "term3_end", label: "Term 3" },
                ].map((term) => (
                  <div key={term.start} className="space-y-3">
                    <Label className="font-semibold">{term.label}</Label>
                    <div className="space-y-2">
                      <DatePicker
                        selected={schoolSettings[term.start as keyof SchoolSettings] ? new Date(schoolSettings[term.start as keyof SchoolSettings] as string) : undefined}
                        onSelect={(date) => setSchoolSettings((s) => ({ ...s, [term.start]: date?.toISOString().split('T')[0] || "" }))}
                      />
                      <DatePicker
                        selected={schoolSettings[term.end as keyof SchoolSettings] ? new Date(schoolSettings[term.end as keyof SchoolSettings] as string) : undefined}
                        onSelect={(date) => setSchoolSettings((s) => ({ ...s, [term.end]: date?.toISOString().split('T')[0] || "" }))}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Button onClick={handleSaveAcademic} disabled={isSaving} className="w-full">
              <Save className="size-4 mr-2" />
              {isSaving ? "Saving..." : "Save Academic Settings"}
            </Button>
          </CardContent>
        </Card>
      )}

      {activeTab === "fees" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Configure fee categories and amounts
            </p>
            <Button onClick={() => setShowFeeForm(!showFeeForm)} size="sm">
              <Plus className="size-4 mr-1.5" />
              Add Fee
            </Button>
          </div>

          {showFeeForm && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">New Fee Item</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input
                      value={newFee.name}
                      onChange={(e) => setNewFee((f) => ({ ...f, name: e.target.value }))}
                      placeholder="e.g. Tuition"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Amount (UGX)</Label>
                    <Input
                      type="number"
                      value={newFee.amount}
                      onChange={(e) => setNewFee((f) => ({ ...f, amount: e.target.value }))}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select value={newFee.category} onValueChange={(v) => setNewFee((f) => ({ ...f, category: v }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tuition">Tuition</SelectItem>
                        <SelectItem value="uniform">Uniform</SelectItem>
                        <SelectItem value="lunch">Lunch</SelectItem>
                        <SelectItem value="transport">Transport</SelectItem>
                        <SelectItem value="boarding">Boarding</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Class Level (optional)</Label>
                    <Input
                      value={newFee.class_level}
                      onChange={(e) => setNewFee((f) => ({ ...f, class_level: e.target.value }))}
                      placeholder="e.g. S4"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleAddFee} size="sm">Add Fee</Button>
                  <Button variant="outline" size="sm" onClick={() => setShowFeeForm(false)}>Cancel</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {feeStructures.length > 0 ? (
            <Card>
              <CardContent className="p-0">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-4 py-3 text-left text-sm font-medium">Name</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Category</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Class Level</th>
                      <th className="px-4 py-3 text-right text-sm font-medium">Amount</th>
                      <th className="px-4 py-3 w-12"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {feeStructures.map((fee) => (
                      <tr key={fee.id} className="hover:bg-muted/30">
                        <td className="px-4 py-3 text-sm capitalize">{fee.name.replace(/_/g, " ")}</td>
                        <td className="px-4 py-3 text-sm capitalize">{fee.category}</td>
                        <td className="px-4 py-3 text-sm">{fee.class_level || "All"}</td>
                        <td className="px-4 py-3 text-sm text-right">
                          {new Intl.NumberFormat("en-US").format(fee.amount)} UGX
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleDeleteFee(fee.id)}
                            className="p-1 hover:text-destructive"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          ) : (
            <div className="border rounded-lg p-12 text-center text-muted-foreground">
              No fee items configured yet. Click "Add Fee" to start.
            </div>
          )}
        </div>
      )}

      {activeTab === "classes" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Define your school levels and specific streams.
            </p>
            <Button onClick={handleAdd} size="sm">
              <Plus className="size-4 mr-1.5" />
              Add Class
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {levels.map((level) => (
              <Card key={level}>
                <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                  <div className="space-y-1">
                    <CardTitle className="text-sm font-bold">{level}</CardTitle>
                  </div>
                  <School className="size-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {groupedClasses[level].map((c) => (
                      <div key={c.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-colors group">
                        <span className="text-sm">{c.name}</span>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleEdit(c)} className="p-1 hover:text-primary">
                            <Edit2 className="size-3" />
                          </button>
                          <button onClick={() => {
                            setDeleteClassConfirm({ open: true, classId: c.id, className: c.name });
                          }} className="p-1 hover:text-destructive">
                            <Trash2 className="size-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {levels.length === 0 && !isLoading && (
            <div className="border rounded-lg p-12 text-center text-muted-foreground">
              No classes defined yet. Click "Add Class" to start.
            </div>
          )}
        </div>
      )}

      <ClassSheet
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        classData={editingClass}
        onSave={handleSaveClass}
        isSaving={isCreating || isUpdating}
      />

      {activeTab === "system" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="size-5" />
                Backup & Restore
              </CardTitle>
              <CardDescription>Export or import your school data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="border rounded-lg p-4 space-y-4">
                <div>
                  <h4 className="font-medium">Export Data</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Download all your school data as a JSON file for backup.
                  </p>
                </div>
                <Button onClick={exportData} disabled={isExporting} className="w-full sm:w-auto">
                  {isExporting ? "Exporting..." : (
                    <>
                      <Download className="size-4 mr-2" />
                      Export All Data
                    </>
                  )}
                </Button>
              </div>

              <div className="border rounded-lg p-4 space-y-4">
                <div>
                  <h4 className="font-medium">Import Data</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Restore your school data from a previously exported JSON file.
                  </p>
                </div>
                <Button onClick={importData} disabled={isImporting} variant="outline" className="w-full sm:w-auto">
                  {isImporting ? "Importing..." : (
                    <>
                      <Upload className="size-4 mr-2" />
                      Import Data
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="size-5" />
                Database Info
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Students</p>
                  <p className="font-medium">{classes.length > 0 ? "Active" : "No data"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Backup Location</p>
                  <p className="font-medium text-xs">App Data Directory</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <AlertDialog open={showRestoreConfirm} onOpenChange={setShowRestoreConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-destructive" />
              Confirm Restore
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will replace all existing data with the imported data. This action cannot be undone.
              Are you sure you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowRestoreConfirm(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRestore} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Restore Data
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ConfirmDialog
        open={deleteClassConfirm.open}
        onOpenChange={(open) => setDeleteClassConfirm((prev) => ({ ...prev, open }))}
        title="Delete Class"
        description={`Are you sure you want to delete ${deleteClassConfirm.className}?`}
        onConfirm={() => {
          if (deleteClassConfirm.classId) {
            deleteClass(deleteClassConfirm.classId);
            toast.success("Class deleted");
          }
        }}
        confirmText="Delete"
        destructive
      />
    </div>
  );
}
