import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { Label } from "@/components/ui/label";
import {
  Search,
  Plus,
  Trash2,
  UserPlus,
  Filter,
  Download,
  MoreHorizontal,
  Mail,
  Phone,
  Lock,
  Calendar,
  Crown,
  AlertTriangle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import { useAuthStore, BusinessUser } from "@/store/authStore";
import { cancelMembership as cancelMembershipAPI, getBusinessMembers } from "@/lib/apiService";
import { AssignMembershipModal } from "@/components/business/AssignMembershipModal";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface BusinessMember {
  id: string;
  userId: string;
  name: string;
  email: string | null;
  phone: string | null;
  avatar: string | null;
  assignedAt: string;
  membershipStatus: string;
  membershipEndDate: string;
  membershipType: string;
  price: number;
  startDate: string;
  status: string;
  notes: string | null;
}

const typeColors = {
  daily: "bg-muted text-muted-foreground",
  weekly: "bg-info/10 text-info",
  monthly: "bg-primary/10 text-primary",
};

const statusColors = {
  active: "success",
  expired: "destructive",
  cancelled: "warning",
} as const;

export default function BusinessMembers() {
  const { user } = useAuthStore();
  const businessUser = user as BusinessUser | null;
  const venueId = businessUser?.id || "g1";
  const venueName = businessUser?.businessName || "My Business";
  
  const [members, setMembers] = useState<BusinessMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<BusinessMember | null>(null);

  // Fetch members from API
  useEffect(() => {
    const fetchMembers = async () => {
      setLoading(true);
      try {
        const result = await getBusinessMembers(1, 100);
        setMembers(result.members || []);
      } catch (error) {
        console.error("Failed to fetch members:", error);
        toast.error("Failed to load members");
      } finally {
        setLoading(false);
      }
    };
    fetchMembers();
  }, []);

  // Refresh members after adding
  const refreshMembers = async () => {
    try {
      const result = await getBusinessMembers(1, 100);
      setMembers(result.members || []);
    } catch (error) {
      console.error("Failed to refresh members:", error);
    }
  };

  const allSubscriptions = members.map(m => ({
    id: m.id,
    userName: m.name,
    userEmail: m.email || "",
    userPhone: m.phone || "",
    venueId,
    venueName,
    type: m.membershipType as 'daily' | 'weekly' | 'monthly',
    price: m.price,
    startDate: m.startDate,
    endDate: m.membershipEndDate,
    status: m.status as 'active' | 'expired' | 'cancelled',
  }));

  const activeCount = allSubscriptions.filter(s => s.status === 'active').length;

  const filteredSubscriptions = useMemo(() => {
    return allSubscriptions.filter((sub) => {
      const matchesSearch =
        sub.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sub.userEmail.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = filterStatus === "all" || sub.status === filterStatus;
      const matchesType = filterType === "all" || sub.type === filterType;
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [allSubscriptions, searchQuery, filterStatus, filterType]);

  const handleDelete = async () => {
    if (!selectedMember) return;
    
    // Check if monthly membership can be cancelled (30-day lock)
    if (selectedMember.membershipType === 'monthly') {
      const startDate = new Date(selectedMember.startDate);
      const daysSinceStart = Math.floor((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysSinceStart < 30) {
        toast.error(`Monthly memberships cannot be cancelled within 30 days. ${30 - daysSinceStart} days remaining.`);
        setIsDeleteOpen(false);
        return;
      }
    }
    
    try {
      // Call API to cancel membership - use the member ID
      await cancelMembershipAPI(selectedMember.id);
      
      // Refresh members list
      await refreshMembers();
      
      setIsDeleteOpen(false);
      setSelectedMember(null);
      toast.success("Subscription cancelled successfully");
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || "Failed to cancel subscription");
      setIsDeleteOpen(false);
    }
  };

  const openDelete = (member: BusinessMember) => {
    setSelectedMember(member);
    setIsDeleteOpen(true);
  };

  const pricing = {
    daily: businessUser?.dailyPackagePrice || 299,
    weekly: businessUser?.weeklyPackagePrice || 1499,
    monthly: businessUser?.monthlyPackagePrice || 4999,
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-xl sm:text-2xl font-bold">Members</h1>
          <p className="text-sm text-muted-foreground">
            {activeCount} active subscription{activeCount !== 1 ? "s" : ""}
          </p>
        </div>
        <Button variant="gradient" onClick={() => setIsAssignOpen(true)} className="w-full sm:w-auto">
          <UserPlus className="h-4 w-4 mr-2" />
          Assign Membership
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <div className="p-3 sm:p-4 rounded-xl bg-muted/50 text-center">
          <p className="text-xl sm:text-2xl font-bold">{allSubscriptions.filter(s => s.type === 'daily').length}</p>
          <p className="text-xs text-muted-foreground">Daily</p>
        </div>
        <div className="p-3 sm:p-4 rounded-xl bg-info/10 text-center">
          <p className="text-xl sm:text-2xl font-bold text-info">{allSubscriptions.filter(s => s.type === 'weekly').length}</p>
          <p className="text-xs text-muted-foreground">Weekly</p>
        </div>
        <div className="p-3 sm:p-4 rounded-xl bg-primary/10 text-center">
          <p className="text-xl sm:text-2xl font-bold text-primary">{allSubscriptions.filter(s => s.type === 'monthly').length}</p>
          <p className="text-xs text-muted-foreground">Monthly</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search members..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full sm:w-[130px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-full sm:w-[130px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            size="icon" 
            className="hidden sm:flex"
            onClick={() => {
              // Export to Excel
              const headers = ['Name', 'Email', 'Phone', 'Type', 'Status', 'Start Date', 'End Date', 'Price'];
              const rows = filteredSubscriptions.map(sub => [
                sub.userName,
                sub.userEmail,
                sub.userPhone || '',
                sub.type,
                sub.status,
                format(new Date(sub.startDate), 'yyyy-MM-dd'),
                format(new Date(sub.endDate), 'yyyy-MM-dd'),
                sub.price.toString()
              ]);
              
              const csvContent = [
                headers.join(','),
                ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
              ].join('\n');
              
              const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
              const link = document.createElement('a');
              const url = URL.createObjectURL(blob);
              link.setAttribute('href', url);
              link.setAttribute('download', `members_${format(new Date(), 'yyyy-MM-dd')}.csv`);
              link.style.visibility = 'hidden';
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              toast.success('Members exported successfully');
            }}
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Members Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {/* Mobile Card View */}
        <div className="sm:hidden space-y-2 p-3">
          {filteredSubscriptions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No members found. Click "Assign Membership" to add walk-in customers.
            </div>
          ) : (
            filteredSubscriptions.map((sub) => {
              const member = members.find(m => m.id === sub.id);
              const startDate = member ? new Date(member.startDate) : new Date(sub.startDate);
              const daysSinceStart = Math.floor((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24));
              const canDelete = sub.membershipType !== 'monthly' || daysSinceStart >= 30;
              return (
                <div key={sub.id} className="p-3 rounded-lg bg-muted/30 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{sub.userName}</p>
                      <p className="text-xs text-muted-foreground">{sub.userEmail}</p>
                    </div>
                    <Badge variant={statusColors[sub.status]} className="capitalize text-xs">
                      {sub.status}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium capitalize", typeColors[sub.type])}>
                      {sub.type}
                    </span>
                    <span className="text-muted-foreground">₹{sub.price}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Expires: {format(new Date(sub.endDate), "MMM d, yyyy")}
                    </span>
                    {sub.type === 'monthly' && !canDelete && (
                      <span className="flex items-center gap-1 text-warning">
                        <Lock className="h-3 w-3" />
                        {30 - daysSinceStart}d lock
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2 pt-2 border-t border-border">
                    {sub.userPhone && (
                      <Button variant="ghost" size="sm" className="flex-1 text-xs h-8" asChild>
                        <a href={`tel:${sub.userPhone}`}>
                          <Phone className="h-3 w-3 mr-1" />
                          Call
                        </a>
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn("flex-1 text-xs h-8", canDelete ? "text-destructive" : "text-muted-foreground")}
                      onClick={() => member && openDelete(member)}
                      disabled={!canDelete}
                    >
                      {canDelete ? (
                        <>
                          <Trash2 className="h-3 w-3 mr-1" />
                          Cancel
                        </>
                      ) : (
                        <>
                          <Lock className="h-3 w-3 mr-1" />
                          Locked
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden sm:block overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Valid Until</TableHead>
                <TableHead>Price</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSubscriptions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No members found. Click "Assign Membership" to add walk-in customers.
                  </TableCell>
                </TableRow>
              ) : (
                filteredSubscriptions.map((sub) => {
                  const member = members.find(m => m.id === sub.id);
                  const startDate = member ? new Date(member.startDate) : new Date(sub.startDate);
                  const daysSinceStart = Math.floor((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24));
                  const canDelete = sub.membershipType !== 'monthly' || daysSinceStart >= 30;
                  return (
                    <TableRow key={sub.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-primary font-medium">
                              {sub.userName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium flex items-center gap-2">
                              {sub.userName}
                              {sub.type === 'monthly' && (
                                <Crown className="h-3 w-3 text-warning" />
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Since {format(new Date(sub.startDate), "MMM d, yyyy")}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-sm">
                            <Mail className="h-3 w-3" /> {sub.userEmail}
                          </div>
                          {sub.userPhone && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Phone className="h-3 w-3" /> {sub.userPhone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={cn("px-2 py-1 rounded-full text-xs font-medium capitalize", typeColors[sub.type])}>
                          {sub.type}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusColors[sub.status]} className="capitalize">
                          {sub.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(sub.endDate), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="font-medium">₹{sub.price}</TableCell>
                      <TableCell className="text-right">
                        <TooltipProvider>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon-sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {canDelete ? (
                                <DropdownMenuItem
                                  onClick={() => member && openDelete(member)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" /> Cancel Subscription
                                </DropdownMenuItem>
                              ) : (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <DropdownMenuItem disabled className="text-muted-foreground">
                                      <Lock className="h-4 w-4 mr-2" />
                                      Locked ({30 - daysSinceStart}d remaining)
                                    </DropdownMenuItem>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Monthly members cannot be removed for 30 days</p>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TooltipProvider>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Delete Confirmation */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Cancel Subscription
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel {selectedMember?.name}'s {selectedMember?.membershipType} subscription?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)} className="w-full sm:w-auto">
              Keep Subscription
            </Button>
            <Button variant="destructive" onClick={handleDelete} className="w-full sm:w-auto">
              <Trash2 className="h-4 w-4 mr-2" />
              Cancel Subscription
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Membership Modal */}
      <AssignMembershipModal
        open={isAssignOpen}
        onOpenChange={(open) => {
          setIsAssignOpen(open);
          if (!open) {
            // Refresh members when modal closes
            refreshMembers();
          }
        }}
        venueId={venueId}
        venueName={venueName}
        pricing={pricing}
      />
    </div>
  );
}
