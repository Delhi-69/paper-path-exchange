
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, MapPin, Truck, Calculator, CreditCard } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Book {
  id: string;
  title: string;
  author: string;
  price_range: number;
  seller_id: string;
  location_address?: string;
  latitude?: number;
  longitude?: number;
  distance?: number;
  delivery_charge?: number;
}

interface PurchaseRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  book: Book;
  onSuccess: () => void;
}

const PurchaseRequestModal: React.FC<PurchaseRequestModalProps> = ({
  isOpen,
  onClose,
  book,
  onSuccess,
}) => {
  const [offeredPrice, setOfferedPrice] = useState(book.price_range);
  const [message, setMessage] = useState('');
  const [transferMode, setTransferMode] = useState<'pickup' | 'delivery'>('pickup');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState<Date>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate total price including delivery charges
  const deliveryCharge = transferMode === 'delivery' ? (book.delivery_charge || 0) : 0;
  const totalPrice = offeredPrice + deliveryCharge;

  useEffect(() => {
    if (book.distance && book.distance > 5) {
      setTransferMode('delivery');
    } else {
      setTransferMode('pickup');
    }
  }, [book.distance]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please log in to make a purchase request');
        return;
      }

      // Ensure transfer_mode is exactly one of the allowed values
      const validTransferMode = transferMode === 'delivery' ? 'delivery' : 'pickup';
      
      console.log('Creating purchase request with transfer_mode:', validTransferMode);
      console.log('All request data:', {
        book_id: book.id,
        buyer_id: user.id,
        seller_id: book.seller_id,
        offered_price: offeredPrice,
        transfer_mode: validTransferMode,
        message,
        expected_delivery_date: expectedDeliveryDate?.toISOString().split('T')[0],
      });

      const { error } = await supabase.from('purchase_requests').insert({
        book_id: book.id,
        buyer_id: user.id,
        seller_id: book.seller_id,
        offered_price: offeredPrice,
        transfer_mode: validTransferMode,
        message,
        expected_delivery_date: expectedDeliveryDate?.toISOString().split('T')[0],
      });

      if (error) {
        console.error('Purchase request error:', error);
        throw error;
      }

      // Create notification for seller
      const { error: notificationError } = await supabase.from('notifications').insert({
        user_id: book.seller_id,
        type: 'purchase_request',
        title: 'New Purchase Request',
        message: `Someone wants to buy "${book.title}" for ₹${totalPrice}${deliveryCharge > 0 ? ` (including ₹${deliveryCharge} delivery)` : ''}`,
        related_id: book.id,
        priority: 'high'
      });

      if (notificationError) {
        console.error('Notification error:', notificationError);
        // Don't throw here, just log the error
      }

      toast.success('Purchase request sent successfully!');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error creating purchase request:', error);
      toast.error(error.message || 'Failed to send purchase request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setOfferedPrice(book.price_range);
    setMessage('');
    setTransferMode(book.distance && book.distance > 5 ? 'delivery' : 'pickup');
    setExpectedDeliveryDate(undefined);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        onClose();
        resetForm();
      }
    }}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Purchase Request
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Book Info */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <h3 className="font-medium">{book.title}</h3>
            <p className="text-sm text-muted-foreground">by {book.author}</p>
            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
              <MapPin className="h-3 w-3" />
              <span>
                Listed at ₹{book.price_range}
                {book.distance && (
                  <span className="ml-2">• {book.distance}km away</span>
                )}
              </span>
            </div>
          </div>

          {/* Offered Price */}
          <div className="space-y-2">
            <Label htmlFor="price">Your Offer (₹)</Label>
            <Input
              id="price"
              type="number"
              value={offeredPrice}
              onChange={(e) => setOfferedPrice(Number(e.target.value))}
              min={1}
              max={book.price_range * 1.5}
              required
            />
            <p className="text-xs text-muted-foreground">
              Listed price: ₹{book.price_range}
            </p>
          </div>

          {/* Transfer Mode */}
          <div className="space-y-3">
            <Label>Transfer Method</Label>
            <RadioGroup 
              value={transferMode} 
              onValueChange={(value: 'pickup' | 'delivery') => setTransferMode(value)}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pickup" id="pickup" />
                <Label htmlFor="pickup" className="flex items-center gap-2 cursor-pointer">
                  <MapPin className="h-4 w-4" />
                  Pickup (Free)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem 
                  value="delivery" 
                  id="delivery" 
                  disabled={!book.delivery_charge && book.delivery_charge !== 0}
                />
                <Label 
                  htmlFor="delivery" 
                  className={cn(
                    "flex items-center gap-2 cursor-pointer",
                    (!book.delivery_charge && book.delivery_charge !== 0) && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <Truck className="h-4 w-4" />
                  Delivery 
                  {book.delivery_charge !== undefined && (
                    <span className="text-sm">
                      ({book.delivery_charge === 0 ? 'Free' : `₹${book.delivery_charge}`})
                    </span>
                  )}
                </Label>
              </div>
            </RadioGroup>
            
            {book.distance && book.distance > 5 && (
              <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
                Delivery recommended for distances over 5km
              </p>
            )}
          </div>

          {/* Expected Delivery Date */}
          {transferMode === 'delivery' && (
            <div className="space-y-2">
              <Label>Expected Delivery Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !expectedDeliveryDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {expectedDeliveryDate ? format(expectedDeliveryDate, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={expectedDeliveryDate}
                    onSelect={setExpectedDeliveryDate}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Message (Optional)</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add a personal message to the seller..."
              rows={3}
            />
          </div>

          {/* Price Breakdown */}
          <div className="bg-blue-50 p-3 rounded-lg space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-blue-800">
              <Calculator className="h-4 w-4" />
              Price Breakdown
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Book Price:</span>
                <span>₹{offeredPrice}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Charge:</span>
                <span>₹{deliveryCharge}</span>
              </div>
              <div className="flex justify-between font-medium text-blue-800 pt-1 border-t border-blue-200">
                <span>Total:</span>
                <span>₹{totalPrice}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onClose();
                resetForm();
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? 'Sending...' : `Send Request (₹${totalPrice})`}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PurchaseRequestModal;
