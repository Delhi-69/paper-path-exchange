
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Star, Clock, Eye, Heart, MessageCircle } from 'lucide-react';
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
        <Card className="w-full bg-gray-800 border-gray-700 text-white">
          <CardHeader className="pb-4">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl text-white">{book.title}</CardTitle>
                <p className="text-gray-400 text-lg mt-1">by {book.author}</p>
              </div>
              <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                {book.condition}
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Images */}
            {book.images && book.images.length > 0 && (
              <div className="grid grid-cols-2 gap-3">
                {book.images.slice(0, 4).map((image, index) => (
                  <img
                    key={index}
                    src={image}
                    alt={`${book.title} ${index + 1}`}
                    className="w-full h-40 object-cover rounded-lg"
                  />
                ))}
              </div>
            )}

            {/* Description */}
            {book.description && (
              <div className="bg-gray-700/50 p-4 rounded-lg">
                <p className="text-gray-300">{book.description}</p>
              </div>
            )}

            {/* Price and Distance */}
            <div className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg">
              <div>
                <span className="text-3xl font-bold text-green-400">₹{book.price_range}</span>
                {book.delivery_charge !== undefined && book.delivery_charge > 0 && (
                  <p className="text-gray-400 mt-1">
                    + ₹{book.delivery_charge} delivery
                  </p>
                )}
              </div>
              
              {book.distance !== undefined && (
                <div className="text-right">
                  <div className="flex items-center gap-2 text-gray-300">
                    <MapPin className="h-4 w-4" />
                    <span className="font-medium">{book.distance}km away</span>
                  </div>
                  {book.delivery_charge !== undefined && (
                    <p className="text-sm text-gray-400 mt-1">
                      {book.delivery_charge === 0 ? 'Free delivery' : `₹${book.delivery_charge} delivery`}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Seller Info */}
            {book.seller && (
              <div className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg">
                <div>
                  <p className="font-medium text-white">{book.seller.full_name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-white">{book.seller.average_rating.toFixed(1)}</span>
                    <span className="text-gray-400">
                      ({book.seller.review_count} reviews)
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <Button 
                onClick={handlePurchaseRequest}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white h-12 text-lg font-medium"
              >
                <MessageCircle className="h-5 w-5 mr-2" />
                Make Offer
              </Button>
              <Button variant="outline" size="icon" className="border-gray-600 hover:bg-gray-700 h-12 w-12">
                <Heart className="h-5 w-5" />
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
        onClick={handlePurchaseRequest}
        className="bg-green-500 hover:bg-green-600 text-white font-medium px-4 py-2 rounded-lg transition-all duration-200 hover:shadow-lg"
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
