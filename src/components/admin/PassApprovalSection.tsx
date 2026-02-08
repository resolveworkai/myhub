import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Check, 
  X, 
  Eye, 
  Ticket,
  IndianRupee,
  CheckCircle2,
  XCircle,
  Clock,
  Building2,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  getPassConfigurations,
  createPassConfiguration,
  updatePassConfiguration,
  deletePassConfiguration,
  getBusinesses,
  type PassConfiguration,
  type BusinessListItem,
} from "@/lib/adminApiService";

export function PassApprovalSection() {
  const [passConfigs, setPassConfigs] = useState<PassConfiguration[]>([]);
  const [businesses, setBusinesses] = useState<BusinessListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConfig, setSelectedConfig] = useState<PassConfiguration | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newPassData, setNewPassData] = useState({
    name: '',
    description: '',
    passType: 'daily' as 'daily' | 'weekly' | 'monthly' | 'custom',
    durationDays: 1,
    price: 0,
  });

  // Fetch pass configurations and businesses
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [configs, businessesResult] = await Promise.all([
          getPassConfigurations(),
          getBusinesses({ limit: 1000 }),
        ]);
        setPassConfigs(configs);
        setBusinesses(businessesResult.businesses);
      } catch (error: any) {
      toast.error(error.message || "Failed to load pass configurations");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleCreatePass = async () => {
    try {
      if (!newPassData.name || !newPassData.passType || !newPassData.durationDays || !newPassData.price) {
      toast.error("Please fill in all required fields");
        return;
      }

      const newConfig = await createPassConfiguration(newPassData);
      setPassConfigs(prev => [...prev, newConfig]);
      setCreateDialogOpen(false);
      setNewPassData({
        name: '',
        description: '',
        passType: 'daily',
        durationDays: 1,
        price: 0,
      });
      toast.success("Pass configuration created successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to create pass configuration");
    }
  };

  const handleUpdatePass = async (id: string, updates: Partial<PassConfiguration>) => {
    try {
      const updated = await updatePassConfiguration(id, updates);
      setPassConfigs(prev => prev.map(c => c.id === id ? updated : c));
      toast.success("Pass configuration updated successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to update pass configuration");
    }
  };

  const handleDeletePass = async (id: string) => {
    if (!confirm("Are you sure you want to delete this pass configuration?")) {
      return;
    }

    try {
      await deletePassConfiguration(id);
      setPassConfigs(prev => prev.filter(c => c.id !== id));
      toast.success("Pass configuration deleted successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete pass configuration");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl lg:text-3xl font-bold text-foreground flex items-center gap-3">
            <Ticket className="h-7 w-7 text-primary" />
            Pass Management
          </h1>
          <p className="text-muted-foreground">
            Manage pass configurations for the platform
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Pass
        </Button>
      </div>

      {/* Pass Configurations Table */}
      <Card>
        <CardHeader>
          <CardTitle>Pass Configurations</CardTitle>
          <CardDescription>
            Manage pass types and their pricing
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {passConfigs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No pass configurations found. Create one to get started.
                      </TableCell>
                    </TableRow>
                  ) : (
                    passConfigs.map((config) => (
                      <TableRow key={config.id}>
                        <TableCell className="font-medium">{config.name}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="capitalize">
                            {config.passType}
                          </Badge>
                        </TableCell>
                        <TableCell>{config.durationDays} days</TableCell>
                        <TableCell>₹{config.price}</TableCell>
                        <TableCell>
                          <Badge variant={config.isActive ? "success" : "secondary"}>
                            {config.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => {
                                setSelectedConfig(config);
                                setDetailsOpen(true);
                              }}
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => handleUpdatePass(config.id, { isActive: !config.isActive })}
                              title={config.isActive ? "Deactivate" : "Activate"}
                            >
                              {config.isActive ? (
                                <XCircle className="h-4 w-4 text-warning" />
                              ) : (
                                <CheckCircle2 className="h-4 w-4 text-success" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => handleDeletePass(config.id)}
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Modal */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Ticket className="h-5 w-5 text-primary" />
              Pass Configuration Details
            </DialogTitle>
            <DialogDescription>
              {selectedConfig?.name}
            </DialogDescription>
          </DialogHeader>
          
          {selectedConfig && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Type:</span>
                    <Badge variant="secondary" className="capitalize">
                      {selectedConfig.passType}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Duration:</span>
                    <span className="font-medium">{selectedConfig.durationDays} days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Price:</span>
                    <span className="font-medium">₹{selectedConfig.price}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge variant={selectedConfig.isActive ? "success" : "secondary"}>
                      {selectedConfig.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  {selectedConfig.description && (
                    <div className="pt-2 border-t">
                      <span className="text-muted-foreground">Description:</span>
                      <p className="mt-1 text-sm">{selectedConfig.description}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Pass Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Pass Configuration</DialogTitle>
            <DialogDescription>
              Create a new pass type for the platform
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Name *</Label>
              <Input
                value={newPassData.name}
                onChange={(e) => setNewPassData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Monthly Premium"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={newPassData.description}
                onChange={(e) => setNewPassData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Optional description"
                rows={3}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Pass Type *</Label>
              <Select
                value={newPassData.passType}
                onValueChange={(value) => setNewPassData(prev => ({ ...prev, passType: value as 'daily' | 'weekly' | 'monthly' | 'custom' }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select pass type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Duration (Days) *</Label>
              <Input
                type="number"
                value={newPassData.durationDays}
                onChange={(e) => setNewPassData(prev => ({ ...prev, durationDays: parseInt(e.target.value) || 1 }))}
                min="1"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Price (₹) *</Label>
              <Input
                type="number"
                value={newPassData.price}
                onChange={(e) => setNewPassData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                min="0"
                step="0.01"
                className="mt-1"
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreatePass}>
                Create Pass
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
