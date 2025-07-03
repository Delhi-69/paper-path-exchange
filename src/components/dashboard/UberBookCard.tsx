import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  Star, 
  Clock, 
  Heart, 
  Share, 
  Route,
  Navigation,
  Truck,
  User
} from 'lucide-react';

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

interface UberBookCardProps {
  book: Book;
  onInterest: (bookId: string) => void;
  onShare?: (bookId: string) => void;
  compact?: boolean;
}

export const UberBookCard: React.FC<UberBookCardProps> = ({ 
  book, 
  onInterest, 
  onShare,
  compact = false 
}) => {
  const [isLiked, setIsLiked] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const getDistanceColor = (distance: number) => {
    if (distance <= 2) return "bg-green-500";
    if (distance <= 5) return "bg-blue-500";
    if (distance <= 10) return "bg-orange-500";
    return "bg-red-500";
  };

  const estimateTravelTime = (distance: number) => {
    const minutes = Math.round((distance / 30) * 60);
    return minutes < 60 ? `${minutes}m` : `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
  };

  if (compact) {
    return (
      <Card className="group overflow-hidden bg-white hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-0 shadow-md">
        <div className="relative">
          {/* Image */}
          <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
            {book.images && book.images.length > 0 ? (
              <>
                <img 
                  src={book.images[0]} 
                  alt={book.title}
                  className={`w-full h-full object-cover transition-all duration-500 ${
                    imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-110'
                  }`}
                  onLoad={() => setImageLoaded(true)}
                />
                {!imageLoaded && (
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-purple-100 animate-pulse" />
                )}
              </>
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                <span className="text-gray-400 text-sm">No image</span>
              </div>
            )}
            
            {/* Floating badges */}
            <div className="absolute top-3 left-3 space-y-2">
              {book.distance !== undefined && (
                <Badge className={`${getDistanceColor(book.distance)} text-white border-0 shadow-lg backdrop-blur-sm`}>
                  <Route className="h-3 w-3 mr-1" />
                  {book.distance}km
                </Badge>
              )}
              
              <Badge className="bg-white/90 text-gray-800 border-0 shadow-lg backdrop-blur-sm">
                {book.condition}
              </Badge>
            </div>

            {/* Action buttons */}
            <div className="absolute top-3 right-3 space-y-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsLiked(!isLiked);
                }}
                className={`w-8 h-8 p-0 rounded-full shadow-lg backdrop-blur-sm transition-all duration-200 ${
                  isLiked 
                    ? 'bg-red-500 text-white hover:bg-red-600' 
                    : 'bg-white/90 text-gray-600 hover:bg-white'
                }`}
              >
                <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
              </Button>
              
              {onShare && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={(e) => {
                    e.stopPropagation();
                    onShare(book.id);
                  }}
                  className="w-8 h-8 p-0 rounded-full bg-white/90 text-gray-600 hover:bg-white shadow-lg backdrop-blur-sm"
                >
                  <Share className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Price badge */}
            <div className="absolute bottom-3 left-3">
              <Badge className="bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold px-3 py-1 text-sm shadow-lg">
                ₹{book.price_range}
              </Badge>
            </div>

            {/* Delivery info */}
            {book.delivery_charge !== undefined && (
              <div className="absolute bottom-3 right-3">
                <Badge className={`${
                  book.delivery_charge === 0 
                    ? 'bg-green-500' 
                    : 'bg-orange-500'
                } text-white border-0 shadow-lg backdrop-blur-sm`}>
                  <Truck className="h-3 w-3 mr-1" />
                  {book.delivery_charge === 0 ? 'Free' : `₹${book.delivery_charge}`}
                </Badge>
              </div>
            )}
          </div>

          <CardContent className="p-4">
            <div className="space-y-3">
              {/* Title and Author */}
              <div>
                <h3 className="font-bold text-lg text-gray-900 line-clamp-1 group-hover:text-blue-600 transition-colors">
                  {book.title}
                </h3>
                <p className="text-gray-600 text-sm line-clamp-1">by {book.author}</p>
              </div>

              {/* Seller info */}
              {book.seller && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                      <User className="h-3 w-3 text-white" />
                    </div>
                    <span className="text-sm text-gray-600">{book.seller.full_name}</span>
                  </div>
                  
                  {book.seller.average_rating > 0 && (
                    <div className="flex items-center space-x-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium">{book.seller.average_rating.toFixed(1)}</span>
                      <span className="text-xs text-gray-500">({book.seller.review_count})</span>
                    </div>
                  )}
                </div>
              )}

              {/* Distance and time info */}
              {book.distance !== undefined && (
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-1 text-gray-600">
                    <Navigation className="h-3 w-3" />
                    <span>{book.distance} km away</span>
                  </div>
                  <div className="flex items-center space-x-1 text-gray-600">
                    <Clock className="h-3 w-3" />
                    <span>{estimateTravelTime(book.distance)}</span>
                  </div>
                </div>
              )}

              {/* Location */}
              {book.location_address && (
                <div className="flex items-center space-x-1 text-xs text-gray-500">
                  <MapPin className="h-3 w-3" />
                  <span className="line-clamp-1">{book.location_address}</span>
                </div>
              )}

              {/* Action button */}
              <Button
                onClick={() => onInterest(book.id)}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-2 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                I'm Interested
              </Button>
            </div>
          </CardContent>
        </div>
      </Card>
    );
  }

  // Full detailed view (for modals, etc.)
  return (
    <Card className="w-full max-w-md mx-auto overflow-hidden bg-white shadow-2xl border-0">
      {/* ... Full view implementation similar to compact but with more details ... */}
    </Card>
  );
};