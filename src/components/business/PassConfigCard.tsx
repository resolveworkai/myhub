import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { 
  IndianRupee, 
  Save, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import { usePassConfigStore, PassConfig } from "@/store/passConfigStore";
import { cn } from "@/lib/utils";

interface PassConfigCardProps {
  businessId: string;
}

export function PassConfigCard({ businessId }: PassConfigCardProps) {
  const { getConfig, updatePassConfig, requestPassApproval } = usePassConfigStore();
  const config = getConfig(businessId);
  
  const [localConfig, setLocalConfig] = useState<PassConfig>(config);
  const [isSaving, setIsSaving] = useState(false);
  
  // Sync with store changes
  useEffect(() => {
    setLocalConfig(getConfig(businessId));
  }, [businessId, getConfig]);

  const handleTogglePass = (passType: 'daily' | 'weekly' | 'monthly', enabled: boolean) => {
    const key = `${passType}PassEnabled` as keyof PassConfig;
    setLocalConfig(prev => ({ ...prev, [key]: enabled }));
  };

  const handlePriceChange = (passType: 'daily' | 'weekly' | 'monthly', price: number) => {
    const key = `${passType}Price` as keyof PassConfig;
    setLocalConfig(prev => ({ ...prev, [key]: price }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    // Check if any pass was newly enabled that needs approval
    const needsApproval = 
      (localConfig.dailyPassEnabled && !config.dailyAdminApproved && !config.dailyPassEnabled) ||
      (localConfig.weeklyPassEnabled && !config.weeklyAdminApproved && !config.weeklyPassEnabled) ||
      (localConfig.monthlyPassEnabled && !config.monthlyAdminApproved && !config.monthlyPassEnabled);
    
    // Update config
    updatePassConfig(businessId, {
      ...localConfig,
      pendingApproval: needsApproval || config.pendingApproval,
    });
    
    await new Promise(resolve => setTimeout(resolve, 500));
    setIsSaving(false);
    
    if (needsApproval) {
      toast.success("Pass configuration saved! Awaiting admin approval for new pass types.");
    } else {
      toast.success("Pass configuration saved successfully!");
    }
  };

  const getPassStatus = (enabled: boolean, approved: boolean) => {
    if (!enabled) return { label: "Disabled", variant: "secondary" as const, icon: null };
    if (approved) return { label: "Active", variant: "success" as const, icon: CheckCircle2 };
    return { label: "Pending Approval", variant: "warning" as const, icon: Clock };
  };

  const passes = [
    {
      type: 'daily' as const,
      label: 'Daily Pass',
      duration: '1 day access',
      badge: '1D',
      enabled: localConfig.dailyPassEnabled,
      approved: localConfig.dailyAdminApproved,
      price: localConfig.dailyPrice,
      originalEnabled: config.dailyPassEnabled,
    },
    {
      type: 'weekly' as const,
      label: 'Weekly Pass',
      duration: '7 days access',
      badge: '7D',
      enabled: localConfig.weeklyPassEnabled,
      approved: localConfig.weeklyAdminApproved,
      price: localConfig.weeklyPrice,
      originalEnabled: config.weeklyPassEnabled,
    },
    {
      type: 'monthly' as const,
      label: 'Monthly Pass',
      duration: '30 days access',
      badge: '30D',
      enabled: localConfig.monthlyPassEnabled,
      approved: localConfig.monthlyAdminApproved,
      price: localConfig.monthlyPrice,
      originalEnabled: config.monthlyPassEnabled,
      popular: true,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IndianRupee className="h-5 w-5" />
          Pass Configuration
        </CardTitle>
        <CardDescription>
          Enable/disable pass types and set pricing. New pass types require admin approval before becoming active.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Pending Approval Notice */}
        {config.pendingApproval && (
          <div className="p-4 rounded-xl bg-warning/10 border border-warning/30 flex items-start gap-3">
            <Clock className="h-5 w-5 text-warning shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-warning">Pending Admin Approval</p>
              <p className="text-sm text-muted-foreground">
                Your pass configuration changes are awaiting admin review. Active passes will continue working.
              </p>
            </div>
          </div>
        )}

        {/* Pass Cards */}
        <div className="grid gap-4">
          {passes.map((pass) => {
            const status = getPassStatus(pass.enabled, pass.approved);
            
            return (
              <div 
                key={pass.type}
                className={cn(
                  "p-4 rounded-xl border-2 space-y-4 transition-all",
                  pass.enabled ? "border-primary/50 bg-primary/5" : "border-border",
                  pass.popular && pass.enabled && "ring-2 ring-primary/20"
                )}
              >
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm",
                      pass.enabled ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                    )}>
                      {pass.badge}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{pass.label}</p>
                        {pass.popular && (
                          <Badge variant="default" className="text-xs">Popular</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{pass.duration}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Badge variant={status.variant} className="text-xs">
                      {status.icon && <status.icon className="h-3 w-3 mr-1" />}
                      {status.label}
                    </Badge>
                    <Switch
                      checked={pass.enabled}
                      onCheckedChange={(checked) => handleTogglePass(pass.type, checked)}
                    />
                  </div>
                </div>
                
                {/* Price Input */}
                {pass.enabled && (
                  <div className="flex items-center gap-4">
                    <Label className="text-sm shrink-0">Price:</Label>
                    <div className="relative flex-1 max-w-[150px]">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                      <Input
                        type="number"
                        value={pass.price}
                        onChange={(e) => handlePriceChange(pass.type, parseInt(e.target.value) || 0)}
                        className="pl-8"
                        min={0}
                      />
                    </div>
                    
                    {/* Show savings for weekly/monthly */}
                    {pass.type !== 'daily' && localConfig.dailyPrice > 0 && (
                      <span className="text-xs text-success">
                        {Math.round((1 - pass.price / (localConfig.dailyPrice * (pass.type === 'weekly' ? 7 : 30))) * 100)}% savings
                      </span>
                    )}
                  </div>
                )}
                
                {/* Info message for newly enabled passes */}
                {pass.enabled && !pass.approved && !pass.originalEnabled && (
                  <div className="flex items-center gap-2 text-xs text-warning">
                    <AlertCircle className="h-3 w-3" />
                    Will be active after admin approval
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Daily Pass Info */}
        <div className="p-4 rounded-lg bg-muted/50 text-sm text-muted-foreground">
          <p>
            <strong>Note:</strong> When daily pass is disabled, users can book 1 free session per day at your venue. 
            Enable daily pass to require payment for each visit.
          </p>
        </div>

        <Button onClick={handleSave} disabled={isSaving} className="w-full sm:w-auto">
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Configuration
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
