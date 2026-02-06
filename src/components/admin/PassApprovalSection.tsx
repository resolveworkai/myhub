import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
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
  Building2
} from "lucide-react";
import { toast } from "sonner";
import { usePassConfigStore, PassConfig } from "@/store/passConfigStore";
import businessUsersData from "@/data/mock/businessUsers.json";
import { cn } from "@/lib/utils";

interface BusinessUser {
  id: string;
  businessName: string;
  ownerName: string;
  businessType: string;
  locations: string[];
}

export function PassApprovalSection() {
  const { 
    configs, 
    getConfig, 
    approvePass, 
    rejectPass, 
    approveAllPending, 
    rejectAllPending,
    updatePassConfig 
  } = usePassConfigStore();
  
  const [selectedBusiness, setSelectedBusiness] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  
  const businessUsers = businessUsersData as BusinessUser[];
  
  // Get all businesses with their pass configs
  const businessConfigs = businessUsers.map(business => ({
    ...business,
    config: getConfig(business.locations[0] || business.id),
  }));
  
  // Filter to show pending approvals first
  const pendingFirst = [...businessConfigs].sort((a, b) => {
    if (a.config.pendingApproval && !b.config.pendingApproval) return -1;
    if (!a.config.pendingApproval && b.config.pendingApproval) return 1;
    return 0;
  });

  const handleApprovePass = (businessId: string, passType: 'daily' | 'weekly' | 'monthly') => {
    approvePass(businessId, passType);
    toast.success(`${passType.charAt(0).toUpperCase() + passType.slice(1)} pass approved`);
  };

  const handleRejectPass = (businessId: string, passType: 'daily' | 'weekly' | 'monthly') => {
    rejectPass(businessId, passType);
    toast.info(`${passType.charAt(0).toUpperCase() + passType.slice(1)} pass rejected`);
  };

  const handleApproveAll = (businessId: string) => {
    approveAllPending(businessId);
    toast.success("All pending passes approved");
  };

  const handleRejectAll = (businessId: string) => {
    rejectAllPending(businessId);
    toast.info("All pending passes rejected");
  };

  const handleTogglePassDirect = (businessId: string, passType: 'daily' | 'weekly' | 'monthly', enabled: boolean) => {
    const config = getConfig(businessId);
    const updates: Partial<PassConfig> = {};
    
    switch (passType) {
      case 'daily':
        updates.dailyPassEnabled = enabled;
        updates.dailyAdminApproved = enabled;
        break;
      case 'weekly':
        updates.weeklyPassEnabled = enabled;
        updates.weeklyAdminApproved = enabled;
        break;
      case 'monthly':
        updates.monthlyPassEnabled = enabled;
        updates.monthlyAdminApproved = enabled;
        break;
    }
    
    updatePassConfig(businessId, updates);
    toast.success(`${passType.charAt(0).toUpperCase() + passType.slice(1)} pass ${enabled ? 'enabled' : 'disabled'}`);
  };

  const getPassStatus = (enabled: boolean, approved: boolean) => {
    if (!enabled) return { label: "Off", variant: "secondary" as const };
    if (approved) return { label: "Active", variant: "success" as const };
    return { label: "Pending", variant: "warning" as const };
  };

  const selectedBusinessData = selectedBusiness 
    ? businessConfigs.find(b => b.locations[0] === selectedBusiness || b.id === selectedBusiness)
    : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl lg:text-3xl font-bold text-foreground flex items-center gap-3">
          <Ticket className="h-7 w-7 text-primary" />
          Pass Management
        </h1>
        <p className="text-muted-foreground">
          Approve or reject pass configurations for businesses. Toggle passes directly or review pending requests.
        </p>
      </div>

      {/* Pending Approvals Summary */}
      {pendingFirst.some(b => b.config.pendingApproval) && (
        <Card className="border-warning bg-warning/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-warning" />
              <div>
                <p className="font-medium">Pending Approvals</p>
                <p className="text-sm text-muted-foreground">
                  {pendingFirst.filter(b => b.config.pendingApproval).length} business(es) have pending pass configurations
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Business Pass Table */}
      <Card>
        <CardHeader>
          <CardTitle>Business Pass Configurations</CardTitle>
          <CardDescription>
            Manage which pass types are available for each business
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Business</TableHead>
                  <TableHead className="text-center">Daily</TableHead>
                  <TableHead className="text-center">Weekly</TableHead>
                  <TableHead className="text-center">Monthly</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingFirst.map((business) => {
                  const config = business.config;
                  const venueId = business.locations[0] || business.id;
                  const dailyStatus = getPassStatus(config.dailyPassEnabled, config.dailyAdminApproved);
                  const weeklyStatus = getPassStatus(config.weeklyPassEnabled, config.weeklyAdminApproved);
                  const monthlyStatus = getPassStatus(config.monthlyPassEnabled, config.monthlyAdminApproved);
                  
                  return (
                    <TableRow key={business.id} className={cn(config.pendingApproval && "bg-warning/5")}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Building2 className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{business.businessName}</p>
                            <p className="text-xs text-muted-foreground capitalize">{business.businessType}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center gap-1">
                          <Switch
                            checked={config.dailyPassEnabled && config.dailyAdminApproved}
                            onCheckedChange={(checked) => handleTogglePassDirect(venueId, 'daily', checked)}
                          />
                          <span className="text-xs text-muted-foreground">₹{config.dailyPrice}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center gap-1">
                          <Switch
                            checked={config.weeklyPassEnabled && config.weeklyAdminApproved}
                            onCheckedChange={(checked) => handleTogglePassDirect(venueId, 'weekly', checked)}
                          />
                          <span className="text-xs text-muted-foreground">₹{config.weeklyPrice}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center gap-1">
                          <Switch
                            checked={config.monthlyPassEnabled && config.monthlyAdminApproved}
                            onCheckedChange={(checked) => handleTogglePassDirect(venueId, 'monthly', checked)}
                          />
                          <span className="text-xs text-muted-foreground">₹{config.monthlyPrice}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {config.pendingApproval ? (
                          <Badge variant="warning">
                            <Clock className="h-3 w-3 mr-1" />
                            Pending
                          </Badge>
                        ) : (
                          <Badge variant="success">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => {
                              setSelectedBusiness(venueId);
                              setDetailsOpen(true);
                            }}
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {config.pendingApproval && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => handleApproveAll(venueId)}
                                title="Approve All"
                              >
                                <Check className="h-4 w-4 text-success" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => handleRejectAll(venueId)}
                                title="Reject All"
                              >
                                <X className="h-4 w-4 text-destructive" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Details Modal */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <IndianRupee className="h-5 w-5 text-primary" />
              Pass Configuration Details
            </DialogTitle>
            <DialogDescription>
              {selectedBusinessData?.businessName}
            </DialogDescription>
          </DialogHeader>
          
          {selectedBusinessData && (
            <div className="space-y-4">
              {[
                { type: 'daily' as const, label: 'Daily Pass', enabled: selectedBusinessData.config.dailyPassEnabled, approved: selectedBusinessData.config.dailyAdminApproved, price: selectedBusinessData.config.dailyPrice },
                { type: 'weekly' as const, label: 'Weekly Pass', enabled: selectedBusinessData.config.weeklyPassEnabled, approved: selectedBusinessData.config.weeklyAdminApproved, price: selectedBusinessData.config.weeklyPrice },
                { type: 'monthly' as const, label: 'Monthly Pass', enabled: selectedBusinessData.config.monthlyPassEnabled, approved: selectedBusinessData.config.monthlyAdminApproved, price: selectedBusinessData.config.monthlyPrice },
              ].map((pass) => {
                const status = getPassStatus(pass.enabled, pass.approved);
                const isPending = pass.enabled && !pass.approved;
                
                return (
                  <div key={pass.type} className={cn(
                    "p-4 rounded-xl border",
                    isPending && "border-warning bg-warning/5"
                  )}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{pass.label}</p>
                        <p className="text-sm text-muted-foreground">₹{pass.price}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={status.variant}>{status.label}</Badge>
                        {isPending && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 text-success border-success hover:bg-success/10"
                              onClick={() => handleApprovePass(selectedBusiness!, pass.type)}
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 text-destructive border-destructive hover:bg-destructive/10"
                              onClick={() => handleRejectPass(selectedBusiness!, pass.type)}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
