import React from 'react';
import { MapPin, Navigation, Route, Clock, Car, Truck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
}

interface EnhancedLocationDisplayProps {
  buyerLocation?: LocationData;
  sellerLocation?: LocationData;
  userLocation?: LocationData;
  showRoute?: boolean;
  compact?: boolean;
  className?: string;
}

// Calculate distance using Haversine formula
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Estimate travel time (assuming average speed of 30 km/h in city)
const estimateTravelTime = (distanceKm: number): string => {
  const avgSpeedKmh = 30;
  const timeHours = distanceKm / avgSpeedKmh;
  const minutes = Math.round(timeHours * 60);
  
  if (minutes < 60) {
    return `${minutes} min`;
  } else {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) {
      return `${hours}h`;
    }
    return `${hours}h ${remainingMinutes}m`;
  }
};

// Calculate delivery charge based on distance
const calculateDeliveryCharge = (distance: number): number => {
  if (distance <= 5) return 0; // Free delivery within 5km
  if (distance <= 7) return 50; // ₹50 for 5-7km
  if (distance <= 10) return 75; // ₹75 for 7-10km
  return 100; // ₹100 for 10km+
};

export const EnhancedLocationDisplay: React.FC<EnhancedLocationDisplayProps> = ({
  buyerLocation,
  sellerLocation,
  userLocation,
  showRoute = true,
  compact = false,
  className = ""
}) => {
  // Calculate distances
  const buyerSellerDistance = buyerLocation && sellerLocation 
    ? calculateDistance(buyerLocation.latitude, buyerLocation.longitude, sellerLocation.latitude, sellerLocation.longitude)
    : null;

  const userToBuyerDistance = userLocation && buyerLocation
    ? calculateDistance(userLocation.latitude, userLocation.longitude, buyerLocation.latitude, buyerLocation.longitude)
    : null;

  const userToSellerDistance = userLocation && sellerLocation
    ? calculateDistance(userLocation.latitude, userLocation.longitude, sellerLocation.latitude, sellerLocation.longitude)
    : null;

  const deliveryCharge = buyerSellerDistance ? calculateDeliveryCharge(buyerSellerDistance) : 0;
  const travelTime = buyerSellerDistance ? estimateTravelTime(buyerSellerDistance) : null;

  if (compact) {
    return (
      <div className={`space-y-2 ${className}`}>
        {buyerSellerDistance && (
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Route className="h-4 w-4 text-blue-600" />
              <span className="text-gray-700">Distance:</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                {buyerSellerDistance.toFixed(1)} km
              </Badge>
              {travelTime && (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  <Clock className="h-3 w-3 mr-1" />
                  {travelTime}
                </Badge>
              )}
            </div>
          </div>
        )}
        
        {deliveryCharge !== undefined && (
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-orange-600" />
              <span className="text-gray-700">Delivery:</span>
            </div>
            <Badge 
              variant="outline" 
              className={deliveryCharge === 0 
                ? "bg-green-50 text-green-700 border-green-200" 
                : "bg-orange-50 text-orange-700 border-orange-200"
              }
            >
              {deliveryCharge === 0 ? 'Free' : `₹${deliveryCharge}`}
            </Badge>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main Distance Card */}
      {buyerSellerDistance && (
        <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Route className="h-5 w-5 text-blue-600" />
                <span className="font-medium text-blue-900">Buyer ↔ Seller Distance</span>
              </div>
              <Badge className="bg-blue-600 text-white">
                {buyerSellerDistance.toFixed(1)} km
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-600" />
                <div>
                  <p className="text-xs text-gray-600">Est. Travel Time</p>
                  <p className="font-medium text-gray-900">{travelTime}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-gray-600" />
                <div>
                  <p className="text-xs text-gray-600">Delivery Charge</p>
                  <p className={`font-medium ${deliveryCharge === 0 ? 'text-green-600' : 'text-orange-600'}`}>
                    {deliveryCharge === 0 ? 'Free' : `₹${deliveryCharge}`}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* User Distance Information */}
      {userLocation && (userToBuyerDistance || userToSellerDistance) && (
        <Card className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Navigation className="h-5 w-5 text-green-600" />
              <span className="font-medium text-green-900">Your Distance</span>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {userToBuyerDistance && (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <div>
                    <p className="text-xs text-gray-600">To Buyer</p>
                    <p className="font-medium text-gray-900">{userToBuyerDistance.toFixed(1)} km</p>
                  </div>
                </div>
              )}
              
              {userToSellerDistance && (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <div>
                    <p className="text-xs text-gray-600">To Seller</p>
                    <p className="font-medium text-gray-900">{userToSellerDistance.toFixed(1)} km</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Location Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {buyerLocation && (
          <Card className="border-blue-200">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm font-medium text-blue-900">Buyer Location</span>
              </div>
              {buyerLocation.address && (
                <p className="text-xs text-gray-600 mb-1">{buyerLocation.address}</p>
              )}
              <p className="text-xs text-gray-500 font-mono">
                {buyerLocation.latitude.toFixed(4)}, {buyerLocation.longitude.toFixed(4)}
              </p>
            </CardContent>
          </Card>
        )}

        {sellerLocation && (
          <Card className="border-green-200">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-green-900">Seller Location</span>
              </div>
              {sellerLocation.address && (
                <p className="text-xs text-gray-600 mb-1">{sellerLocation.address}</p>
              )}
              <p className="text-xs text-gray-500 font-mono">
                {sellerLocation.latitude.toFixed(4)}, {sellerLocation.longitude.toFixed(4)}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Route Recommendations */}
      {buyerSellerDistance && (
        <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Car className="h-5 w-5 text-purple-600" />
              <span className="font-medium text-purple-900">Route Recommendations</span>
            </div>
            
            <div className="space-y-2 text-sm">
              {buyerSellerDistance <= 2 && (
                <div className="flex items-center gap-2 text-green-700">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Very close distance - perfect for quick pickup</span>
                </div>
              )}
              
              {buyerSellerDistance > 2 && buyerSellerDistance <= 5 && (
                <div className="flex items-center gap-2 text-blue-700">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Moderate distance - consider pickup or free delivery</span>
                </div>
              )}
              
              {buyerSellerDistance > 5 && buyerSellerDistance <= 10 && (
                <div className="flex items-center gap-2 text-orange-700">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span>Longer distance - delivery recommended (₹{deliveryCharge} charge)</span>
                </div>
              )}
              
              {buyerSellerDistance > 10 && (
                <div className="flex items-center gap-2 text-red-700">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span>Long distance - consider if worth the travel time</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};