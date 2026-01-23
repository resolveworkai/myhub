import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, Loader2, FileSpreadsheet, FileText, File } from "lucide-react";
import { toast } from "sonner";

interface ExportReportsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExportReportsModal({ open, onOpenChange }: ExportReportsModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [format, setFormat] = useState("");
  const [dateRange, setDateRange] = useState("");
  const [selectedReports, setSelectedReports] = useState<string[]>([]);

  const reports = [
    { id: "members", label: "Member Report", description: "All member data and status" },
    { id: "revenue", label: "Revenue Report", description: "Income and payment history" },
    { id: "appointments", label: "Appointments Report", description: "Booking and attendance data" },
    { id: "attendance", label: "Attendance Report", description: "Check-in/check-out records" },
    { id: "analytics", label: "Analytics Summary", description: "Performance metrics and trends" },
  ];

  const toggleReport = (reportId: string) => {
    setSelectedReports((prev) =>
      prev.includes(reportId)
        ? prev.filter((id) => id !== reportId)
        : [...prev, reportId]
    );
  };

  const handleExport = async () => {
    if (selectedReports.length === 0) {
      toast.error("Please select at least one report");
      return;
    }
    if (!format) {
      toast.error("Please select export format");
      return;
    }

    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsLoading(false);

    const formatNames: Record<string, string> = {
      pdf: "PDF",
      excel: "Excel",
      csv: "CSV",
    };

    toast.success("Reports exported successfully!", {
      description: `${selectedReports.length} report(s) downloaded as ${formatNames[format]}`,
    });

    onOpenChange(false);
  };

  const getFormatIcon = (fmt: string) => {
    switch (fmt) {
      case "pdf":
        return <FileText className="h-4 w-4" />;
      case "excel":
        return <FileSpreadsheet className="h-4 w-4" />;
      case "csv":
        return <File className="h-4 w-4" />;
      default:
        return <Download className="h-4 w-4" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-primary" />
            Export Reports
          </DialogTitle>
          <DialogDescription>
            Select reports and format to export
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label>Date Range</Label>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger>
                <SelectValue placeholder="Select date range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="quarter">This Quarter</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label>Select Reports</Label>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer"
                  onClick={() => toggleReport(report.id)}
                >
                  <Checkbox
                    checked={selectedReports.includes(report.id)}
                    onCheckedChange={() => toggleReport(report.id)}
                  />
                  <div className="flex-1">
                    <div className="font-medium text-sm">{report.label}</div>
                    <div className="text-xs text-muted-foreground">{report.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Export Format *</Label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "pdf", label: "PDF", icon: FileText },
                { id: "excel", label: "Excel", icon: FileSpreadsheet },
                { id: "csv", label: "CSV", icon: File },
              ].map((fmt) => (
                <Button
                  key={fmt.id}
                  type="button"
                  variant={format === fmt.id ? "default" : "outline"}
                  className="flex flex-col h-auto py-3 gap-1"
                  onClick={() => setFormat(fmt.id)}
                >
                  <fmt.icon className="h-5 w-5" />
                  <span className="text-xs">{fmt.label}</span>
                </Button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Export ({selectedReports.length})
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
