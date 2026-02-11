import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { usePlatformStore } from "@/store/platformStore";
import { toast } from "sonner";
import { Search, CheckCircle2 } from "lucide-react";
import { format, addDays } from "date-fns";

export default function AdminManualPassCreation() {
  const { businesses, studentPasses, createStudentPass } = usePlatformStore();

  const [studentSearch, setStudentSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<{ userId: string; userName: string; userEmail: string; userPhone?: string } | null>(null);
  const [selectedBusinessId, setSelectedBusinessId] = useState("");
  const [passType, setPassType] = useState<'coaching' | 'gym' | 'library' | ''>("");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [selectedDuration, setSelectedDuration] = useState<number>(1);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [startDate, setStartDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [paymentOption, setPaymentOption] = useState<'paid' | 'waived'>('paid');
  const [reason, setReason] = useState("");
  const [created, setCreated] = useState(false);
  const [createdPassInfo, setCreatedPassInfo] = useState<any>(null);

  // Search existing users from passes
  const allUsers = useMemo(() => {
    const map = new Map<string, { userId: string; userName: string; userEmail: string; userPhone?: string }>();
    studentPasses.forEach(p => {
      if (!map.has(p.userId)) {
        map.set(p.userId, { userId: p.userId, userName: p.userName, userEmail: p.userEmail, userPhone: p.userPhone });
      }
    });
    return Array.from(map.values());
  }, [studentPasses]);

  const filteredUsers = useMemo(() => {
    if (!studentSearch) return [];
    const q = studentSearch.toLowerCase();
    return allUsers.filter(u =>
      u.userName.toLowerCase().includes(q) || u.userEmail.toLowerCase().includes(q)
    );
  }, [allUsers, studentSearch]);

  const approvedBusinesses = businesses.filter(b => b.status === 'approved');
  const selectedBusiness = businesses.find(b => b.id === selectedBusinessId);
  const selectedSubject = selectedBusiness?.subjects?.find(s => s.id === selectedSubjectId);
  const selectedBatch = selectedSubject?.batches.find(b => b.id === selectedBatchId);
  const selectedTemplate = selectedBusiness?.passTemplates?.find(t => t.id === selectedTemplateId);

  const price = useMemo(() => {
    if (passType === 'coaching' && selectedSubject && selectedBatch) {
      const tier = selectedBatch.customPricing?.find(p => p.durationHours === selectedDuration)
        || selectedSubject.pricingTiers.find(p => p.durationHours === selectedDuration);
      return tier?.price || 0;
    }
    if (selectedTemplate) return selectedTemplate.price;
    return 0;
  }, [passType, selectedSubject, selectedBatch, selectedDuration, selectedTemplate]);

  const endDate = useMemo(() => {
    return format(addDays(new Date(startDate), 30), "yyyy-MM-dd");
  }, [startDate]);

  const canCreate = selectedStudent && selectedBusinessId && reason.trim() &&
    ((passType === 'coaching' && selectedBatchId) || (passType !== 'coaching' && passType && selectedTemplateId));

  const handleCreate = () => {
    if (!canCreate || !selectedStudent || !selectedBusiness) return;

    const passData: any = {
      userId: selectedStudent.userId,
      userName: selectedStudent.userName,
      userEmail: selectedStudent.userEmail,
      userPhone: selectedStudent.userPhone,
      businessId: selectedBusinessId,
      businessName: selectedBusiness.name,
      businessVertical: selectedBusiness.vertical,
      price: paymentOption === 'waived' ? 0 : price,
      startDate,
      endDate,
      totalOperatingDays: 30,
      autoRenew: false,
      transactionId: `MANUAL-${Date.now()}`,
    };

    if (passType === 'coaching' && selectedBatch && selectedSubject) {
      passData.subjectId = selectedSubjectId;
      passData.subjectName = selectedSubject.name;
      passData.batchId = selectedBatchId;
      passData.batchName = selectedBatch.name;
      passData.schedulePattern = selectedBatch.schedulePattern;
      passData.slotStartTime = selectedBatch.startTime;
      passData.slotEndTime = selectedBatch.endTime;
      passData.instructorName = selectedBatch.instructorName;
      passData.durationHours = selectedDuration;
    } else if (selectedTemplate) {
      passData.passTemplateId = selectedTemplateId;
      passData.timeSegmentName = selectedTemplate.timeSegmentName;
    }

    const newPass = createStudentPass(passData);
    setCreatedPassInfo({
      studentName: selectedStudent.userName,
      passDescription: passType === 'coaching'
        ? `${selectedSubject?.name} ${selectedBatch?.name} ${selectedBatch?.startTime}-${selectedBatch?.endTime}`
        : `${selectedTemplate?.name}`,
      startDate,
      endDate,
      payment: paymentOption === 'paid' ? `Marked as Paid (₹${price})` : 'Waived (Free)',
    });
    setCreated(true);
    toast.success("Manual pass created successfully");
  };

  const handleReset = () => {
    setCreated(false);
    setCreatedPassInfo(null);
    setSelectedStudent(null);
    setStudentSearch("");
    setSelectedBusinessId("");
    setPassType("");
    setSelectedSubjectId("");
    setSelectedBatchId("");
    setSelectedTemplateId("");
    setReason("");
    setPaymentOption('paid');
  };

  if (created && createdPassInfo) {
    return (
      <div className="space-y-6">
        <h1 className="font-display text-2xl font-bold">Manual Pass Creation</h1>
        <div className="bg-card rounded-2xl border border-success/50 p-8 text-center max-w-lg mx-auto">
          <CheckCircle2 className="h-12 w-12 text-success mx-auto mb-4" />
          <h2 className="font-display text-xl font-bold mb-4">✅ Pass Created Successfully</h2>
          <div className="text-left space-y-2 text-sm">
            <p><span className="text-muted-foreground">Student:</span> <span className="font-medium">{createdPassInfo.studentName}</span></p>
            <p><span className="text-muted-foreground">Pass:</span> <span className="font-medium">{createdPassInfo.passDescription}</span></p>
            <p><span className="text-muted-foreground">Valid:</span> <span className="font-medium">{createdPassInfo.startDate} → {createdPassInfo.endDate}</span></p>
            <p><span className="text-muted-foreground">Payment:</span> <span className="font-medium">{createdPassInfo.payment}</span></p>
          </div>
          <p className="text-sm text-muted-foreground mt-4">Student has been notified via email.</p>
          <div className="flex gap-3 mt-6 justify-center">
            <Button variant="outline" onClick={handleReset}>Create Another</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Manual Pass Creation</h1>
        <p className="text-sm text-muted-foreground">For customer support escalations</p>
      </div>

      <div className="bg-card rounded-2xl border border-border p-6 space-y-5 max-w-2xl">
        {/* Student Search */}
        <div>
          <p className="text-sm font-medium mb-2">Student</p>
          {selectedStudent ? (
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
              <div>
                <p className="font-medium text-sm">{selectedStudent.userName}</p>
                <p className="text-xs text-muted-foreground">{selectedStudent.userEmail} {selectedStudent.userPhone && `• ${selectedStudent.userPhone}`}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => { setSelectedStudent(null); setStudentSearch(""); }}>
                Change
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  className="pl-10"
                  value={studentSearch}
                  onChange={e => setStudentSearch(e.target.value)}
                />
              </div>
              {filteredUsers.length > 0 && (
                <div className="border border-border rounded-lg max-h-40 overflow-y-auto">
                  {filteredUsers.map(u => (
                    <button
                      key={u.userId}
                      className="w-full text-left px-3 py-2 hover:bg-muted/50 text-sm border-b border-border last:border-0"
                      onClick={() => { setSelectedStudent(u); setStudentSearch(""); }}
                    >
                      <span className="font-medium">{u.userName}</span>
                      <span className="text-muted-foreground ml-2">{u.userEmail}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Business */}
        <div>
          <p className="text-sm font-medium mb-2">Business</p>
          <Select value={selectedBusinessId} onValueChange={v => {
            setSelectedBusinessId(v);
            const biz = businesses.find(b => b.id === v);
            setPassType(biz?.vertical === 'coaching' ? 'coaching' : biz?.vertical || '');
            setSelectedSubjectId("");
            setSelectedBatchId("");
            setSelectedTemplateId("");
          }}>
            <SelectTrigger><SelectValue placeholder="Select business" /></SelectTrigger>
            <SelectContent>
              {approvedBusinesses.map(b => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name} — {b.address.area}, {b.address.city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Pass Type indicator */}
        {passType && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Pass Type:</span>
            <Badge variant="secondary" className="capitalize">{passType === 'coaching' ? 'Coaching Batch' : passType === 'gym' ? 'Gym Access Pass' : 'Library Pass'}</Badge>
          </div>
        )}

        {/* Coaching: Subject/Batch/Duration */}
        {passType === 'coaching' && selectedBusiness?.subjects && (
          <>
            <div>
              <p className="text-sm font-medium mb-2">Subject</p>
              <Select value={selectedSubjectId} onValueChange={v => { setSelectedSubjectId(v); setSelectedBatchId(""); }}>
                <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                <SelectContent>
                  {selectedBusiness.subjects.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedSubject && (
              <div>
                <p className="text-sm font-medium mb-2">Batch</p>
                <Select value={selectedBatchId} onValueChange={setSelectedBatchId}>
                  <SelectTrigger><SelectValue placeholder="Select batch" /></SelectTrigger>
                  <SelectContent>
                    {selectedSubject.batches.filter(b => !b.isPaused).map(b => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name} {b.schedulePattern.toUpperCase()} {b.startTime}-{b.endTime} ({b.enrolled}/{b.capacity})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {selectedBatch && (
              <div>
                <p className="text-sm font-medium mb-2">Duration</p>
                <Select value={String(selectedDuration)} onValueChange={v => setSelectedDuration(+v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(selectedBatch.customPricing || selectedSubject!.pricingTiers).map(t => (
                      <SelectItem key={t.durationHours} value={String(t.durationHours)}>
                        {t.durationHours} hour{t.durationHours > 1 ? 's' : ''} — ₹{t.price}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </>
        )}

        {/* Gym/Library: Pass Template */}
        {passType && passType !== 'coaching' && selectedBusiness?.passTemplates && (
          <div>
            <p className="text-sm font-medium mb-2">Pass Template</p>
            <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
              <SelectTrigger><SelectValue placeholder="Select pass" /></SelectTrigger>
              <SelectContent>
                {selectedBusiness.passTemplates.filter(t => t.isActive).map(t => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name} ({t.duration}) — ₹{t.price}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Start Date */}
        <div>
          <p className="text-sm font-medium mb-2">Start Date</p>
          <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-48" />
          <p className="text-xs text-muted-foreground mt-1">End Date: {endDate} (auto-calculated)</p>
        </div>

        {/* Payment */}
        <div>
          <p className="text-sm font-medium mb-2">Payment</p>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="radio"
                name="payment"
                checked={paymentOption === 'paid'}
                onChange={() => setPaymentOption('paid')}
                className="accent-primary"
              />
              Mark as Paid {price > 0 && `(₹${price})`}
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="radio"
                name="payment"
                checked={paymentOption === 'waived'}
                onChange={() => setPaymentOption('waived')}
                className="accent-primary"
              />
              Waive Payment (free)
            </label>
          </div>
        </div>

        {/* Reason */}
        <div>
          <p className="text-sm font-medium mb-2">Reason (required)</p>
          <Textarea
            placeholder="e.g., Customer support resolution - original booking failed due to payment gateway error..."
            value={reason}
            onChange={e => setReason(e.target.value)}
            rows={3}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button onClick={handleCreate} disabled={!canCreate}>Create Pass</Button>
          <Button variant="outline" onClick={handleReset}>Cancel</Button>
        </div>
      </div>
    </div>
  );
}
