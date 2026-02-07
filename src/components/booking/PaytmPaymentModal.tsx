import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  CreditCard,
  Smartphone,
  Shield,
  Loader2,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';
import { useBookingStore } from '@/store/bookingStore';
import type { PassType } from '@/types/booking';

interface PaytmPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  passType: PassType;
  businessId: string;
  businessName: string;
  onSuccess: (transactionId: string) => void;
}

// Paytm staging credentials (for demo)
const PAYTM_CONFIG = {
  mid: 'YOUR_MERCHANT_ID', // Replace with actual Paytm MID
  website: 'WEBSTAGING',
  industryType: 'Retail',
  channelId: 'WEB',
  isStaging: true,
};

export function PaytmPaymentModal({
  isOpen,
  onClose,
  amount,
  passType,
  businessId,
  businessName,
  onSuccess,
}: PaytmPaymentModalProps) {
  const { user } = useAuthStore();
  const { createTransaction, updateTransaction } = useBookingStore();

  const [paymentMethod, setPaymentMethod] = useState<'card' | 'upi'>('upi');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'failed'>('idle');
  
  // Form states
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState('');
  const [upiId, setUpiId] = useState('');
  const [selectedUpiApp, setSelectedUpiApp] = useState<string>('paytm');

  const upiApps = [
    { id: 'paytm', name: 'Paytm', color: 'bg-[#00BAF2]' },
    { id: 'gpay', name: 'GPay', color: 'bg-[#4285F4]' },
    { id: 'phonepe', name: 'PhonePe', color: 'bg-[#5F259F]' },
    { id: 'other', name: 'Other', color: 'bg-muted' },
  ];

  const generateOrderId = () => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `ORD_${timestamp}_${random}`;
  };

  const handlePayment = async () => {
    if (!user) {
      toast.error('Please login to continue');
      return;
    }

    // Validate inputs
    if (paymentMethod === 'card') {
      if (!cardNumber || !cardExpiry || !cardCvv || !cardName) {
        toast.error('Please fill all card details');
        return;
      }
    } else {
      if (!upiId && selectedUpiApp === 'other') {
        toast.error('Please enter UPI ID');
        return;
      }
    }

    setIsProcessing(true);
    setPaymentStatus('processing');

    const orderId = generateOrderId();

    // Create transaction record
    const transaction = createTransaction({
      orderId,
      userId: user.id,
      userEmail: user.email,
      businessId,
      passType,
      amount,
      currency: 'INR',
      status: 'pending',
    });

    try {
      // Simulate Paytm payment processing
      // In production, this would integrate with actual Paytm Checkout JS
      await new Promise((resolve) => setTimeout(resolve, 2500));

      // Simulate random success/failure (90% success rate for demo)
      const isSuccess = Math.random() > 0.1;

      if (isSuccess) {
        const paytmTxnId = `PAYTM_TXN_${Date.now()}`;
        
        // Update transaction with success
        updateTransaction(transaction.id, {
          transactionId: paytmTxnId,
          status: 'success',
          completedAt: new Date().toISOString(),
          paytmResponse: {
            TXNID: paytmTxnId,
            BANKTXNID: `BANK_${Date.now()}`,
            STATUS: 'TXN_SUCCESS',
            RESPMSG: 'Txn Success',
            ORDERID: orderId,
            TXNAMOUNT: amount.toString(),
          },
        });

        setPaymentStatus('success');
        
        setTimeout(() => {
          onSuccess(transaction.id);
        }, 1500);
      } else {
        // Update transaction with failure
        updateTransaction(transaction.id, {
          status: 'failed',
          paytmResponse: {
            STATUS: 'TXN_FAILURE',
            RESPMSG: 'Payment failed. Please try again.',
          },
        });

        setPaymentStatus('failed');
        toast.error('Payment failed. Please try again.');
      }
    } catch (error) {
      updateTransaction(transaction.id, {
        status: 'failed',
        paytmResponse: {
          STATUS: 'TXN_FAILURE',
          RESPMSG: 'Network error',
        },
      });
      setPaymentStatus('failed');
      toast.error('Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const resetAndClose = () => {
    setPaymentStatus('idle');
    setCardNumber('');
    setCardExpiry('');
    setCardCvv('');
    setCardName('');
    setUpiId('');
    onClose();
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    return parts.length ? parts.join(' ') : value;
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  return (
    <Dialog open={isOpen} onOpenChange={resetAndClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <img 
              src="https://upload.wikimedia.org/wikipedia/commons/2/24/Paytm_Logo_%28standalone%29.svg" 
              alt="Paytm" 
              className="h-6"
            />
            Pay with Paytm
          </DialogTitle>
          <DialogDescription>
            Secure payment for {passType} pass at {businessName}
          </DialogDescription>
        </DialogHeader>

        {paymentStatus === 'success' ? (
          <div className="text-center py-8 space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-success/10 flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-success" />
            </div>
            <h3 className="text-xl font-bold text-success">Payment Successful!</h3>
            <p className="text-muted-foreground">
              ₹{amount} paid successfully
            </p>
          </div>
        ) : paymentStatus === 'failed' ? (
          <div className="text-center py-8 space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="h-10 w-10 text-destructive" />
            </div>
            <h3 className="text-xl font-bold text-destructive">Payment Failed</h3>
            <p className="text-muted-foreground">
              Please try again
            </p>
            <Button onClick={() => setPaymentStatus('idle')}>
              Try Again
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Amount */}
            <div className="p-4 rounded-xl bg-muted/50 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Amount to Pay</p>
                <p className="text-2xl font-bold">₹{amount}</p>
              </div>
              <Badge>{passType.charAt(0).toUpperCase() + passType.slice(1)} Pass</Badge>
            </div>

            {/* Payment Methods */}
            <Tabs value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as 'card' | 'upi')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="upi">
                  <Smartphone className="h-4 w-4 mr-2" />
                  UPI
                </TabsTrigger>
                <TabsTrigger value="card">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Card
                </TabsTrigger>
              </TabsList>

              <TabsContent value="upi" className="space-y-4 mt-4">
                {/* UPI App Selection */}
                <div className="grid grid-cols-4 gap-2">
                  {upiApps.map((app) => (
                    <button
                      key={app.id}
                      onClick={() => setSelectedUpiApp(app.id)}
                      className={cn(
                        'p-3 rounded-lg border-2 text-center transition-all text-xs font-medium',
                        selectedUpiApp === app.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      )}
                    >
                      {app.name}
                    </button>
                  ))}
                </div>

                {/* UPI ID Input (for "Other") */}
                {selectedUpiApp === 'other' && (
                  <div className="space-y-2">
                    <Label>UPI ID</Label>
                    <Input
                      placeholder="yourname@upi"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                    />
                  </div>
                )}

                {selectedUpiApp !== 'other' && (
                  <div className="p-3 rounded-lg bg-info/10 text-info text-sm">
                    You will be redirected to {upiApps.find(a => a.id === selectedUpiApp)?.name} to complete payment
                  </div>
                )}
              </TabsContent>

              <TabsContent value="card" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Card Number</Label>
                  <Input
                    placeholder="1234 5678 9012 3456"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                    maxLength={19}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Cardholder Name</Label>
                  <Input
                    placeholder="Name on card"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Expiry</Label>
                    <Input
                      placeholder="MM/YY"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                      maxLength={5}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>CVV</Label>
                    <Input
                      type="password"
                      placeholder="•••"
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      maxLength={4}
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            {/* Security Notice */}
            <div className="flex items-center gap-2 p-3 rounded-lg bg-success/10 border border-success/20">
              <Shield className="h-5 w-5 text-success" />
              <span className="text-sm text-success font-medium">
                Secured by Paytm Payment Gateway
              </span>
            </div>

            {/* Demo Notice */}
            <div className="p-3 rounded-lg bg-warning/10 border border-warning/20 text-xs text-warning">
              <p className="font-medium">⚠️ Demo Mode</p>
              <p>This is a simulated payment. No real charges will be made.</p>
            </div>

            {/* Pay Button */}
            <Button
              variant="gradient"
              className="w-full h-12"
              onClick={handlePayment}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                `Pay ₹${amount}`
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
