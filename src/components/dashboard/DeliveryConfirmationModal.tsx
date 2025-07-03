
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, Clock, Package, AlertTriangle, Calendar } from "lucide-react";
import { PaymentMethodSelector } from "./PaymentMethodSelector";
import { RefundSystem } from "./RefundSystem";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

interface DeliveryConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchaseRequestId: string;
  userType: 'buyer' | 'seller';
  bookTitle: string;
  bookPrice: number;
}

interface DeliveryConfirmation {
  id: string;
  otp_verified_at: string | null;
  buyer_confirmed_delivery: boolean;
  seller_confirmed_delivery: boolean;
  buyer_confirmed_payment: boolean;
  seller_confirmed_payment: boolean;
  payment_method: string | null;
  final_payout_processed: boolean;
  expected_delivery_date: string | null;
  otp_sent_at: string | null;
}

export const DeliveryConfirmationModal = ({
  isOpen,
  onClose,
  purchaseRequestId,
  userType,
  bookTitle,
  bookPrice
}: DeliveryConfirmationModalProps) => {
  const [otpCode, setOtpCode] = useState("");
  const [confirmation, setConfirmation] = useState<DeliveryConfirmation | null>(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [showPaymentSelector, setShowPaymentSelector] = useState(false);
  const [showRefundSystem, setShowRefundSystem] = useState(false);
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchConfirmation = async () => {
    try {
      // First get the expected delivery date from purchase request
      const { data: purchaseRequest, error: prError } = await supabase
        .from('purchase_requests')
        .select('expected_delivery_date')
        .eq('id', purchaseRequestId)
        .single();

      if (prError) throw prError;
      setExpectedDeliveryDate(purchaseRequest?.expected_delivery_date || null);

      const { data, error } = await supabase
        .from('delivery_confirmations')
        .select('*')
        .eq('purchase_request_id', purchaseRequestId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      setConfirmation(data);
    } catch (error: any) {
      console.error('Error fetching confirmation:', error);
      toast({
        title: "Error",
        description: "Failed to fetch delivery confirmation details",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchConfirmation();
    }
  }, [isOpen, purchaseRequestId]);

  const sendOTP = async () => {
    setSending(true);
    try {
      console.log('Sending OTP for purchase request:', purchaseRequestId);
      
      const { data, error } = await supabase.functions.invoke('send-delivery-otp', {
        body: { purchaseRequestId }
      });

      if (error) {
        console.error('OTP sending error:', error);
        throw error;
      }

      console.log('OTP sent successfully:', data);

      toast({
        title: "OTP Sent Successfully!",
        description: "Please check your email and notifications for the delivery OTP code.",
      });

      // Force refresh the confirmation data
      await fetchConfirmation();
    } catch (error: any) {
      console.error('Failed to send OTP:', error);
      toast({
        title: "Failed to Send OTP",
        description: error.message || "There was an error sending the OTP. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const verifyOTP = async () => {
    if (!otpCode || otpCode.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter a valid 6-digit OTP code.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      console.log('Verifying OTP:', otpCode, 'for purchase request:', purchaseRequestId);
      
      const { data, error } = await supabase.functions.invoke('verify-delivery-otp', {
        body: { purchaseRequestId, otpCode }
      });

      if (error) {
        console.error('OTP verification error:', error);
        throw error;
      }

      console.log('OTP verified successfully:', data);

      toast({
        title: "Delivery Confirmed!",
        description: "OTP verified successfully. Delivery has been confirmed.",
      });

      setOtpCode("");
      await fetchConfirmation();
    } catch (error: any) {
      console.error('Failed to verify OTP:', error);
      toast({
        title: "OTP Verification Failed",
        description: error.message || "Invalid or expired OTP. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentMethodSelect = async (paymentMethod: string) => {
    setLoading(true);
    try {
      if (paymentMethod === 'stripe') {
        const { data, error } = await supabase.functions.invoke('create-book-payment', {
          body: { 
            purchaseRequestId, 
            amount: bookPrice 
          }
        });

        if (error) throw error;

        if (data.url) {
          window.open(data.url, '_blank');
          
          await supabase.functions.invoke('process-final-payment', {
            body: { 
              purchaseRequestId, 
              buyerConfirmed: true, 
              paymentMethod: 'stripe' 
            }
          });

          fetchConfirmation();
          setShowPaymentSelector(false);
        }
      } else {
        // Handle other payment methods
        await supabase.functions.invoke('process-final-payment', {
          body: { 
            purchaseRequestId, 
            buyerConfirmed: true, 
            paymentMethod 
          }
        });

        toast({
          title: "Payment Confirmed",
          description: `Payment confirmed via ${paymentMethod}`,
        });

        fetchConfirmation();
        setShowPaymentSelector(false);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const confirmPayment = async (paymentMethod: string) => {
    setLoading(true);
    try {
      const updates = userType === 'buyer' 
        ? { buyerConfirmed: true, paymentMethod }
        : { sellerConfirmed: true };

      const { data, error } = await supabase.functions.invoke('process-final-payment', {
        body: { purchaseRequestId, ...updates }
      });

      if (error) throw error;

      // If seller is confirming payment, decrease book quantity
      if (userType === 'seller' && !confirmation?.seller_confirmed_delivery) {
        // Get the book ID from the purchase request
        const { data: purchaseRequest, error: prError } = await supabase
          .from('purchase_requests')
          .select('book_id')
          .eq('id', purchaseRequestId)
          .single();

        if (prError) {
          console.error('Error fetching purchase request:', prError);
        } else if (purchaseRequest?.book_id) {
          // Get current book quantity
          const { data: book, error: bookError } = await supabase
            .from('books')
            .select('quantity')
            .eq('id', purchaseRequest.book_id)
            .single();

          if (bookError) {
            console.error('Error fetching book:', bookError);
          } else if (book && book.quantity > 0) {
            // Decrease quantity by 1
            const newQuantity = book.quantity - 1;
            const { error: updateError } = await supabase
              .from('books')
              .update({ 
                quantity: newQuantity,
                status: newQuantity === 0 ? 'sold' : 'available'
              })
              .eq('id', purchaseRequest.book_id);

            if (updateError) {
              console.error('Error updating book quantity:', updateError);
            } else {
              console.log(`Book quantity decreased to ${newQuantity}`);
            }
          }
        }
      }

      toast({
        title: "Success",
        description: `Payment ${userType === 'buyer' ? 'confirmed' : 'acknowledged'} successfully!`,
      });

      fetchConfirmation();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStepStatus = (step: number) => {
    if (!confirmation) return 'pending';
    
    switch (step) {
      case 1:
        return confirmation.otp_verified_at ? 'completed' : 'pending';
      case 2:
        return confirmation.buyer_confirmed_delivery && confirmation.seller_confirmed_delivery ? 'completed' : 'pending';
      case 3:
        return confirmation.buyer_confirmed_payment && confirmation.seller_confirmed_payment ? 'completed' : 'pending';
      case 4:
        return confirmation.final_payout_processed ? 'completed' : 'pending';
      default:
        return 'pending';
    }
  };

  const StatusIcon = ({ status }: { status: string }) => {
    if (status === 'completed') {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
    return <Clock className="h-5 w-5 text-gray-400" />;
  };

  const formatDeliveryDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const isOTPExpired = (sentAt: string | null) => {
    if (!sentAt) return false;
    const sentTime = new Date(sentAt).getTime();
    const currentTime = Date.now();
    const tenMinutes = 10 * 60 * 1000;
    return (currentTime - sentTime) > tenMinutes;
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Delivery Confirmation</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div className="text-center">
              <h3 className="font-semibold">{bookTitle}</h3>
              <p className="text-sm text-gray-600">Price: ₹{bookPrice}</p>
              
              {/* Show expected delivery date */}
              {expectedDeliveryDate && (
                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-center space-x-2">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">
                      Expected Delivery: {formatDeliveryDate(expectedDeliveryDate)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {/* Step 1: OTP Verification */}
              <div className="flex items-start space-x-3">
                <StatusIcon status={getStepStatus(1)} />
                <div className="flex-1">
                  <h4 className="font-medium">1. Delivery OTP Verification</h4>
                  <p className="text-sm text-gray-600">Buyer confirms receipt with OTP</p>
                  
                  {userType === 'buyer' && !confirmation?.otp_verified_at && (
                    <div className="mt-2 space-y-3">
                      {!confirmation || !confirmation.otp_sent_at ? (
                        <Button 
                          size="sm" 
                          onClick={sendOTP} 
                          disabled={sending}
                          className="w-full"
                        >
                          {sending ? "Sending OTP..." : "Get Delivery OTP"}
                        </Button>
                      ) : (
                        <div className="space-y-3">
                          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                            <p className="text-sm text-green-800 font-medium">
                              OTP sent to your email and notifications!
                            </p>
                            <p className="text-xs text-green-600 mt-1">
                              Check your email and app notifications for the 6-digit code
                            </p>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="otp">Enter 6-digit OTP</Label>
                            <InputOTP
                              maxLength={6}
                              value={otpCode}
                              onChange={setOtpCode}
                            >
                              <InputOTPGroup>
                                <InputOTPSlot index={0} />
                                <InputOTPSlot index={1} />
                                <InputOTPSlot index={2} />
                                <InputOTPSlot index={3} />
                                <InputOTPSlot index={4} />
                                <InputOTPSlot index={5} />
                              </InputOTPGroup>
                            </InputOTP>
                            
                            <Button 
                              size="sm" 
                              onClick={verifyOTP} 
                              disabled={loading || otpCode.length !== 6}
                              className="w-full"
                            >
                              {loading ? "Verifying..." : "Verify OTP"}
                            </Button>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <Button
                              size="sm"
                              variant="link"
                              onClick={sendOTP}
                              disabled={sending}
                              className="p-0 h-auto text-xs"
                            >
                              {sending ? "Sending..." : "Resend OTP"}
                            </Button>
                            
                            {confirmation.otp_sent_at && (
                              <span className="text-xs text-gray-500">
                                {isOTPExpired(confirmation.otp_sent_at) ? 
                                  "OTP expired" : 
                                  "Valid for 10 minutes"
                                }
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Step 2: Delivery Confirmation */}
              <div className="flex items-start space-x-3">
                <StatusIcon status={getStepStatus(2)} />
                <div className="flex-1">
                  <h4 className="font-medium">2. Delivery Confirmation</h4>
                  <p className="text-sm text-gray-600">Both parties confirm delivery</p>
                  
                  {confirmation?.otp_verified_at && (
                    <div className="mt-2 space-y-1">
                      <Badge variant={confirmation.buyer_confirmed_delivery ? "default" : "secondary"}>
                        Buyer: {confirmation.buyer_confirmed_delivery ? "Confirmed" : "Pending"}
                      </Badge>
                      <Badge variant={confirmation.seller_confirmed_delivery ? "default" : "secondary"}>
                        Seller: {confirmation.seller_confirmed_delivery ? "Confirmed" : "Pending"}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Step 3: Payment */}
              <div className="flex items-start space-x-3">
                <StatusIcon status={getStepStatus(3)} />
                <div className="flex-1">
                  <h4 className="font-medium">3. Payment</h4>
                  <p className="text-sm text-gray-600">Complete payment to seller</p>
                  
                  {confirmation?.otp_verified_at && (
                    <div className="mt-2 space-y-2">
                      {userType === 'buyer' && !confirmation.buyer_confirmed_payment && (
                        <div className="space-y-2">
                          <Button 
                            size="sm" 
                            onClick={() => setShowPaymentSelector(true)} 
                            disabled={loading}
                            className="w-full"
                          >
                            Choose Payment Method
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => confirmPayment('other')} 
                            disabled={loading}
                            className="w-full"
                          >
                            Paid Outside App
                          </Button>
                        </div>
                      )}
                      
                      {userType === 'seller' && confirmation.buyer_confirmed_payment && !confirmation.seller_confirmed_payment && (
                        <Button size="sm" onClick={() => confirmPayment('confirmed')} disabled={loading}>
                          <Package className="h-4 w-4 mr-1" />
                          Confirm Payment Received
                        </Button>
                      )}
                      
                      <div className="space-y-1">
                        <Badge variant={confirmation.buyer_confirmed_payment ? "default" : "secondary"}>
                          Buyer Payment: {confirmation.buyer_confirmed_payment ? "Confirmed" : "Pending"}
                        </Badge>
                        <Badge variant={confirmation.seller_confirmed_payment ? "default" : "secondary"}>
                          Seller Confirmation: {confirmation.seller_confirmed_payment ? "Confirmed" : "Pending"}
                        </Badge>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Step 4: Final Payout */}
              <div className="flex items-start space-x-3">
                <StatusIcon status={getStepStatus(4)} />
                <div className="flex-1">
                  <h4 className="font-medium">4. Final Payout</h4>
                  <p className="text-sm text-gray-600">
                    Seller receives ₹{bookPrice + 30} (₹{bookPrice} + ₹30 BookEx bonus)
                  </p>
                  
                  {confirmation?.final_payout_processed && (
                    <Badge className="mt-2">Completed</Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Refund Option for Buyers */}
            {userType === 'buyer' && confirmation?.buyer_confirmed_payment && (
              <div className="bg-orange-50 p-3 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <span className="text-sm font-medium text-orange-800">Issue with your order?</span>
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => setShowRefundSystem(true)}
                  className="w-full"
                >
                  Request Refund
                </Button>
              </div>
            )}

            <Button variant="outline" onClick={onClose} className="w-full">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Method Selector Modal */}
      <Dialog open={showPaymentSelector} onOpenChange={setShowPaymentSelector}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Select Payment Method</DialogTitle>
          </DialogHeader>
          <PaymentMethodSelector
            onPaymentMethodSelect={handlePaymentMethodSelect}
            loading={loading}
            amount={bookPrice}
          />
        </DialogContent>
      </Dialog>

      {/* Refund System Modal */}
      <RefundSystem
        isOpen={showRefundSystem}
        onClose={() => setShowRefundSystem(false)}
        purchaseRequestId={purchaseRequestId}
        bookTitle={bookTitle}
        amount={bookPrice}
      />
    </>
  );
};
