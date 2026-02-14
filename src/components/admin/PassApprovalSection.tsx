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
  getBusinessPasses,
  updateBusinessPassPrices,
  type BusinessPass,
} from "@/lib/adminApiService";

export function PassApprovalSection() {
  const [businessPasses, setBusinessPasses] = useState<BusinessPass[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBusiness, setSelectedBusiness] = useState<BusinessPass | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [updatingPass, setUpdatingPass] = useState<string | null>(null);

  // Fetch business passes
  const fetchData = async () => {
    try {
      setLoading(true);
      const passes = await getBusinessPasses();
      setBusinessPasses(passes);
    } catch (error: any) {
      toast.error(error.message || "Failed to load business passes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleTogglePass = async (businessId: string, passType: 'daily' | 'weekly' | 'monthly', currentEnabled: boolean, currentPrice: number) => {
    const passKey = `${businessId}-${passType}`;
    setUpdatingPass(passKey);
    
    try {
      const newEnabled = !currentEnabled;
      const newPrice = newEnabled ? (currentPrice > 0 ? currentPrice : 299) : 0;
      
      await updateBusinessPassPrices({
        businessId,
        passType,
        price: newPrice,
        enabled: newEnabled,
      });

      // Update local state
      setBusinessPasses(prev => prev.map(business => {
        if (business.businessId === businessId) {
          return {
            ...business,
            [`${passType}Pass`]: {
              enabled: newEnabled,
              price: newPrice,
            },
          };
        }
        return business;
      }));

      toast.success(`${passType.charAt(0).toUpperCase() + passType.slice(1)} pass ${newEnabled ? 'enabled' : 'disabled'} successfully`);
    } catch (error: any) {
      toast.error(error.message || `Failed to ${currentEnabled ? 'disable' : 'enable'} ${passType} pass`);
    } finally {
      setUpdatingPass(null);
    }
  };

  const handleUpdatePrice = async (businessId: string, passType: 'daily' | 'weekly' | 'monthly', newPrice: number) => {
    const passKey = `${businessId}-${passType}`;
    setUpdatingPass(passKey);
    
    try {
      if (newPrice < 0) {
        toast.error('Price cannot be negative');
        return;
      }

      await updateBusinessPassPrices({
        businessId,
        passType,
        price: newPrice,
        enabled: newPrice > 0,
      });

      // Update local state
      setBusinessPasses(prev => prev.map(business => {
        if (business.businessId === businessId) {
          return {
            ...business,
            [`${passType}Pass`]: {
              enabled: newPrice > 0,
              price: newPrice,
            },
          };
        }
        return business;
      }));

      toast.success(`${passType.charAt(0).toUpperCase() + passType.slice(1)} pass price updated successfully`);
    } catch (error: any) {
      toast.error(error.message || `Failed to update ${passType} pass price`);
    } finally {
      setUpdatingPass(null);
    }
  };


  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl lg:text-3xl font-bold text-foreground flex items-center gap-3">
          <Ticket className="h-7 w-7 text-primary" />
          Business Pass Management
        </h1>
        <p className="text-muted-foreground">
          View and manage pass configurations for each business
        </p>
      </div>

      {/* Business Passes Table */}
      <Card>
        <CardHeader>
          <CardTitle>Business Passes</CardTitle>
          <CardDescription>
            Daily, Weekly, and Monthly pass prices for each business
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
                    <TableHead>Business Name</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead className="text-center">Daily Pass</TableHead>
                    <TableHead className="text-center">Weekly Pass</TableHead>
                    <TableHead className="text-center">Monthly Pass</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {businessPasses.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No business passes found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    businessPasses.map((business) => (
                      <TableRow key={business.businessId}>
                        <TableCell className="font-medium">{business.businessName}</TableCell>
                        <TableCell>{business.ownerName}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex flex-col items-center gap-2">
                            <Switch
                              checked={business.dailyPass.enabled}
                              onCheckedChange={() => handleTogglePass(business.businessId, 'daily', business.dailyPass.enabled, business.dailyPass.price)}
                              disabled={updatingPass === `${business.businessId}-daily`}
                            />
                            {business.dailyPass.enabled ? (
                              <>
                                <Badge variant="success" className="mb-1">Active</Badge>
                                <div className="flex items-center gap-1">
                                  {/* <span className="text-xs">₹</span> */}
                                  {/* <Input
                                    type="number"
                                    value={business.dailyPass.price}
                                    onBlur={(e) => {
                                      const newPrice = parseFloat(e.target.value) || 0;
                                      if (newPrice >= 0 && newPrice !== business.dailyPass.price) {
                                        handleUpdatePrice(business.businessId, 'daily', newPrice);
                                      }
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.currentTarget.blur();
                                      }
                                    }}
                                    className="w-20 h-8 text-sm"
                                    min="0"
                                    step="1"
                                    disabled={updatingPass === `${business.businessId}-daily`}
                                  /> */}
                                </div>
                              </>
                            ) : (
                              <Badge variant="secondary">Disabled</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex flex-col items-center gap-2">
                            <Switch
                              checked={business.weeklyPass.enabled}
                              onCheckedChange={() => handleTogglePass(business.businessId, 'weekly', business.weeklyPass.enabled, business.weeklyPass.price)}
                              disabled={updatingPass === `${business.businessId}-weekly`}
                            />
                            {business.weeklyPass.enabled ? (
                              <>
                                <Badge variant="success" className="mb-1">Active</Badge>
                                {/* <div className="flex items-center gap-1">
                                  <span className="text-xs">₹</span>
                                  <Input
                                    type="number"
                                    value={business.weeklyPass.price}
                                    onBlur={(e) => {
                                      const newPrice = parseFloat(e.target.value) || 0;
                                      if (newPrice >= 0 && newPrice !== business.weeklyPass.price) {
                                        handleUpdatePrice(business.businessId, 'weekly', newPrice);
                                      }
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.currentTarget.blur();
                                      }
                                    }}
                                    className="w-20 h-8 text-sm"
                                    min="0"
                                    step="1"
                                    disabled={updatingPass === `${business.businessId}-weekly`}
                                  />
                                </div> */}
                              </>
                            ) : (
                              <Badge variant="secondary">Disabled</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex flex-col items-center gap-2">
                            <Switch
                              checked={business.monthlyPass.enabled}
                              onCheckedChange={() => handleTogglePass(business.businessId, 'monthly', business.monthlyPass.enabled, business.monthlyPass.price)}
                              disabled={updatingPass === `${business.businessId}-monthly`}
                            />
                            {business.monthlyPass.enabled ? (
                              <>
                                <Badge variant="success" className="mb-1">Active</Badge>
                                {/* <div className="flex items-center gap-1">
                                  <span className="text-xs">₹</span>
                                  <Input
                                    type="number"
                                    value={business.monthlyPass.price}
                                    onBlur={(e) => {
                                      const newPrice = parseFloat(e.target.value) || 0;
                                      if (newPrice >= 0 && newPrice !== business.monthlyPass.price) {
                                        handleUpdatePrice(business.businessId, 'monthly', newPrice);
                                      }
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.currentTarget.blur();
                                      }
                                    }}
                                    className="w-20 h-8 text-sm"
                                    min="0"
                                    step="1"
                                    disabled={updatingPass === `${business.businessId}-monthly`}
                                  />
                                </div> */}
                              </>
                            ) : (
                              <Badge variant="secondary">Disabled</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={business.verificationStatus === 'verified' ? "success" : business.verificationStatus === 'rejected' ? "destructive" : "warning"}>
                            {business.verificationStatus}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => {
                              setSelectedBusiness(business);
                              setDetailsOpen(true);
                            }}
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
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
              <Building2 className="h-5 w-5 text-primary" />
              {selectedBusiness?.businessName}
            </DialogTitle>
            <DialogDescription>
              Pass configuration details
            </DialogDescription>
          </DialogHeader>
          
          {selectedBusiness && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Daily Pass:</span>
                    {selectedBusiness.dailyPass.enabled ? (
                      <div className="flex items-center gap-2">
                        <Badge variant="success">Active</Badge>
                        <span className="font-medium">₹{selectedBusiness.dailyPass.price}</span>
                      </div>
                    ) : (
                      <Badge variant="secondary">Disabled</Badge>
                    )}
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Weekly Pass:</span>
                    {selectedBusiness.weeklyPass.enabled ? (
                      <div className="flex items-center gap-2">
                        <Badge variant="success">Active</Badge>
                        <span className="font-medium">₹{selectedBusiness.weeklyPass.price}</span>
                      </div>
                    ) : (
                      <Badge variant="secondary">Disabled</Badge>
                    )}
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Monthly Pass:</span>
                    {selectedBusiness.monthlyPass.enabled ? (
                      <div className="flex items-center gap-2">
                        <Badge variant="success">Active</Badge>
                        <span className="font-medium">₹{selectedBusiness.monthlyPass.price}</span>
                      </div>
                    ) : (
                      <Badge variant="secondary">Disabled</Badge>
                    )}
                  </div>
                  <div className="pt-2 border-t">
                    <div className="flex justify-between mb-2">
                      <span className="text-muted-foreground">Business Type:</span>
                      <Badge variant="secondary" className="capitalize">
                        {selectedBusiness.businessType}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Verification:</span>
                      <Badge variant={selectedBusiness.verificationStatus === 'verified' ? "success" : selectedBusiness.verificationStatus === 'rejected' ? "destructive" : "warning"}>
                        {selectedBusiness.verificationStatus}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
