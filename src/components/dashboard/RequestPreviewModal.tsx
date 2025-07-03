import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EnhancedLocationDisplay } from './EnhancedLocationDisplay';
import { DeliveryDateSelector } from './DeliveryDateSelector';
import { 
  User, 
  Book, 
  MapPin, 
  Calendar, 
  MessageSquare, 
  CheckCircle, 
  XCircle,
  Route,
  Clock,
  Truck,
  AlertTriangle
} from 'lucide-react';

interface RequestPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: {
    id: string;
    book_title?: string;
    book_price?: number;
    buyer_name?: string;
    buyer_location?: string;
    buyer_latitude?: number;
    buyer_longitude?: number;
    seller_latitude?: number;
    seller_longitude?: number;
    offered_price?: number;
    transfer_mode?: string;
    message?: string;
    created_at: string;
  };
  onAccept: (requestId: string, deliveryDate: string) => void;
  onReject: (requestId: string) => void;
  loading?: boolean;
}

export const RequestPreviewModal: React.FC<RequestPreviewModalProps> = ({
  isOpen,
  onClose,
  request,
  onAccept,
  onReject,
  loading = false
}) => {
  const [showDateSelector, setShowDateSelector] = useState(false);

  const buyerLocation = request.buyer_latitude && request.buyer_longitude ? {
    latitude: request.buyer_latitude,
    longitude: request.buyer_longitude,
    address: request.buyer_location
  } : undefined;

  const sellerLocation = request.seller_latitude && request.seller_longitude ? {
    latitude: request.seller_latitude,
    longitude: request.seller_longitude
  } : undefined;

  const handleAccept = () => {
    setShowDateSelector(true);
  };

  const handleDateSelect = (date: string) => {
    onAccept(request.id, date);
    setShowDateSelector(false);
    onClose();
  };

  const handleReject = () => {
    onReject(request.id);
    onClose();
  };

  if (showDateSelector) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Set Expected Delivery Date</DialogTitle>
          </DialogHeader>
          <DeliveryDateSelector
            onDateSelect={handleDateSelect}
            onCancel={() => setShowDateSelector(false)}
            loading={loading}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Purchase Request Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Book and Buyer Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Book className="h-5 w-5 text-blue-600" />
                  <span className="font-medium text-blue-900">Book Details</span>
                </div>
                <div className="space-y-2">
                  <p className="font-semibold text-gray-900">{request.book_title}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Listed Price:</span>
                    <Badge variant="outline">₹{request.book_price}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Offered Price:</span>
                    <Badge className="bg-green-600 text-white">₹{request.offered_price}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <User className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-green-900">Buyer Information</span>
                </div>
                <div className="space-y-2">
                  <p className="font-semibold text-gray-900">{request.buyer_name || 'Unknown Buyer'}</p>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      {request.buyer_location || 'Location not provided'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      Requested: {new Date(request.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Transfer Mode and Message */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Truck className="h-5 w-5 text-purple-600" />
                  <span className="font-medium text-purple-900">Transfer Method</span>
                </div>
                <Badge 
                  variant="outline" 
                  className="bg-purple-50 text-purple-700 border-purple-200 capitalize"
                >
                  {request.transfer_mode?.replace('-', ' ') || 'Not specified'}
                </Badge>
              </CardContent>
            </Card>

            {request.message && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <MessageSquare className="h-5 w-5 text-orange-600" />
                    <span className="font-medium text-orange-900">Buyer's Message</span>
                  </div>
                  <p className="text-sm text-gray-700 italic">"{request.message}"</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Enhanced Location Display */}
          {buyerLocation && sellerLocation && (
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Route className="h-5 w-5 text-blue-600" />
                Distance & Route Analysis
              </h3>
              <EnhancedLocationDisplay
                buyerLocation={buyerLocation}
                sellerLocation={sellerLocation}
                showRoute={true}
                compact={false}
              />
            </div>
          )}

          {/* Distance Warning */}
          {buyerLocation && sellerLocation && (() => {
            const distance = Math.sqrt(
              Math.pow(buyerLocation.latitude - sellerLocation.latitude, 2) + 
              Math.pow(buyerLocation.longitude - sellerLocation.longitude, 2)
            ) * 111; // Rough conversion to km
            
            if (distance > 15) {
              return (
                <Card className="border-red-200 bg-red-50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-red-700">
                      <AlertTriangle className="h-5 w-5" />
                      <span className="font-medium">Long Distance Notice</span>
                    </div>
                    <p className="text-sm text-red-600 mt-2">
                      This buyer is quite far from your location. Consider if the distance is manageable for delivery or if pickup would be more practical.
                    </p>
                  </CardContent>
                </Card>
              );
            }
            return null;
          })()}

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4 border-t">
            <Button
              onClick={handleAccept}
              disabled={loading}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              {loading ? 'Processing...' : 'Accept Request'}
            </Button>
            
            <Button
              onClick={handleReject}
              disabled={loading}
              variant="outline"
              className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Decline Request
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};