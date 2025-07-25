
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchaseRequestId: string;
  reviewedUserId: string;
  reviewedUserName: string;
  bookTitle: string;
  reviewType: 'buyer_to_seller' | 'seller_to_buyer';
  onReviewSubmitted?: () => void;
}

export const ReviewModal = ({
  isOpen,
  onClose,
  purchaseRequestId,
  reviewedUserId,
  reviewedUserName,
  bookTitle,
  reviewType,
  onReviewSubmitted
}: ReviewModalProps) => {
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const submitReview = async () => {
    if (rating === 0) {
      toast({
        title: "Error",
        description: "Please select a rating",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get book_id from purchase request
      const { data: request, error: requestError } = await supabase
        .from('purchase_requests')
        .select('book_id')
        .eq('id', purchaseRequestId)
        .single();

      if (requestError) {
        console.error('Error fetching purchase request:', requestError);
        throw new Error('Could not find purchase request');
      }

      console.log('Submitting review with data:', {
        reviewer_id: user.id,
        reviewed_user_id: reviewedUserId,
        book_id: request?.book_id,
        purchase_request_id: purchaseRequestId,
        rating,
        review_text: reviewText.trim() || null,
        review_type: reviewType
      });

      const { data, error } = await supabase.functions.invoke('create-review', {
        body: {
          reviewer_id: user.id,
          reviewed_user_id: reviewedUserId,
          book_id: request?.book_id,
          purchase_request_id: purchaseRequestId,
          rating,
          review_text: reviewText.trim() || null,
          review_type: reviewType
        }
      });

      if (error) {
        console.error('Review submission error:', error);
        throw error;
      }

      console.log('Review submitted successfully:', data);

      toast({
        title: "Success",
        description: "Review submitted successfully",
      });

      // Call the callback to refresh reviews
      if (onReviewSubmitted) {
        onReviewSubmitted();
      }

      onClose();
      setRating(0);
      setReviewText("");
    } catch (error: any) {
      console.error('Error submitting review:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit review",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            Rate {reviewType === 'buyer_to_seller' ? 'Seller' : 'Buyer'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">
              How was your experience with {reviewedUserName}?
            </p>
            <p className="font-medium">{bookTitle}</p>
          </div>

          <div className="flex justify-center space-x-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`h-8 w-8 cursor-pointer transition-colors ${
                  star <= rating
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-gray-300 hover:text-yellow-400"
                }`}
                onClick={() => setRating(star)}
              />
            ))}
          </div>

          <Textarea
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            placeholder="Share your experience (optional)"
            rows={3}
          />

          <div className="flex space-x-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button onClick={submitReview} disabled={loading} className="flex-1">
              {loading ? "Submitting..." : "Submit Review"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
