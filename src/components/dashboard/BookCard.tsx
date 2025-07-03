
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Star, Clock, Eye, Heart } from 'lucide-react';
import PurchaseRequestModal from './PurchaseRequestModal';

interface Book {
  id: string;
  title: string;
  author: string;
  price_range: number;
  condition: string;
  description: string;
  images: string[];
  location_address: string;
  seller_id: string;
  created_at: string;
  distance?: number;
  delivery_charge?: number;
  seller?: {
    full_name: string;
    average_rating: number;
    review_count: number;
  };
}

interface BookCardProps {
  book: Book;
  onPurchaseRequest?: () => void;
  showFullDetails?: boolean;
}

const BookCard: React.FC<BookCardProps> = ({ 
  book, 
  onPurchaseRequest,
  showFullDetails = false 
}) => {
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);

  const handlePurchaseRequest = () => {
    setShowPurchaseModal(true);
  };

  const handlePurchaseSuccess = () => {
    onPurchaseRequest?.();
    setShowPurchaseModal(false);
  };

  if (showFullDetails) {
    return (
      <>
        <Card className="w-full">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-xl">{book.title}</CardTitle>
                <p className="text-muted-foreground">by {book.author}</p>
              </div>
              <Badge variant="outline">{book.condition}</Badge>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Images */}
            {book.images && book.images.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                {book.images.slice(0, 4).map((image, index) => (
                  <img
                    key={index}
                    src={image}
                    alt={`${book.title} ${index + 1}`}
                    className="w-full h-32 object-cover rounded-md"
                  />
                ))}
              </div>
            )}

            {/* Description */}
            {book.description && (
              <p className="text-sm text-muted-foreground">{book.description}</p>
            )}

            {/* Price and Distance */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-2xl font-bold text-green-600">₹{book.price_range}</span>
                {book.delivery_charge !== undefined && book.delivery_charge > 0 && (
                  <p className="text-sm text-muted-foreground">
                    + ₹{book.delivery_charge} delivery
                  </p>
                )}
              </div>
              
              {book.distance !== undefined && (
                <div className="text-right">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    <span>{book.distance}km away</span>
                  </div>
                  {book.delivery_charge !== undefined && (
                    <p className="text-xs text-muted-foreground">
                      {book.delivery_charge === 0 ? 'Free delivery' : `₹${book.delivery_charge} delivery`}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Seller Info */}
            {book.seller && (
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">{book.seller.full_name}</p>
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm">{book.seller.average_rating.toFixed(1)}</span>
                    <span className="text-xs text-muted-foreground">
                      ({book.seller.review_count} reviews)
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <Button 
                onClick={handlePurchaseRequest}
                className="flex-1"
              >
                Make Offer
              </Button>
              <Button variant="outline" size="icon">
                <Heart className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <PurchaseRequestModal
          isOpen={showPurchaseModal}
          onClose={() => setShowPurchaseModal(false)}
          book={book}
          onSuccess={handlePurchaseSuccess}
        />
      </>
    );
  }

  // Compact view for grid display
  return (
    <>
      <Button 
        variant="default" 
        size="sm" 
        onClick={handlePurchaseRequest}
        className="w-full"
      >
        Make Offer
      </Button>

      <PurchaseRequestModal
        isOpen={showPurchaseModal}
        onClose={() => setShowPurchaseModal(false)}
        book={book}
        onSuccess={handlePurchaseSuccess}
      />
    </>
  );
};

export default BookCard;
