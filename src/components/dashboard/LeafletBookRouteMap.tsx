
import React, { useRef, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Polyline, Popup, Tooltip, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { locationService } from "@/services/locationService";
import { calculateDistance } from "@/hooks/useLocationUtils";
import { MapPin, Navigation, Clock, Car, AlertTriangle, Layers, ZoomIn, ZoomOut, Maximize2, RotateCcw, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Fix for default markers in Leaflet with Webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface Point {
  latitude: number;
  longitude: number;
}

interface LeafletBookRouteMapProps {
  buyer?: Point | null;
  seller?: Point | null;
  showUserLocation?: boolean;
  bookTitle?: string;
  sellerName?: string;
  buyerName?: string;
}

// Custom icons for buyer and seller
const buyerIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const sellerIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const userIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Estimate travel time (assuming average speed of 40 km/h in city)
function estimateTravelTime(distanceKm: number) {
  const avgSpeedKmh = 40;
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
}

// Get cardinal direction
function getDirection(lat1: number, lon1: number, lat2: number, lon2: number) {
  const dLon = lon2 - lon1;
  const dLat = lat2 - lat1;
  const angle = Math.atan2(dLon, dLat) * (180 / Math.PI);
  
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(((angle + 360) % 360) / 45) % 8;
  return directions[index];
}

// Get zoom level based on distance
function getZoomLevel(distKm: number) {
  if (distKm < 1) return 16;
  if (distKm < 3) return 14;
  if (distKm < 10) return 12;
  if (distKm < 25) return 10;
  if (distKm < 50) return 9;
  if (distKm < 100) return 8;
  return 7;
}

// Map controls component
const MapControls: React.FC<{ onLayerChange?: (layer: string) => void }> = ({ onLayerChange }) => {
  const map = useMap();
  
  const zoomIn = () => map.zoomIn();
  const zoomOut = () => map.zoomOut();
  const resetView = () => map.setView(map.getCenter(), 12);
  const toggleFullscreen = () => {
    if (map.getContainer().requestFullscreen) {
      map.getContainer().requestFullscreen();
    }
  };

  return (
    <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
      <div className="bg-white rounded-lg shadow-lg border p-2 space-y-1">
        <Button size="sm" variant="ghost" onClick={zoomIn} className="w-8 h-8 p-0">
          <ZoomIn className="w-4 h-4" />
        </Button>
        <Button size="sm" variant="ghost" onClick={zoomOut} className="w-8 h-8 p-0">
          <ZoomOut className="w-4 h-4" />
        </Button>
        <Button size="sm" variant="ghost" onClick={resetView} className="w-8 h-8 p-0">
          <RotateCcw className="w-4 h-4" />
        </Button>
        <Button size="sm" variant="ghost" onClick={toggleFullscreen} className="w-8 h-8 p-0">
          <Maximize2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export const LeafletBookRouteMap: React.FC<LeafletBookRouteMapProps> = ({
  buyer,
  seller,
  showUserLocation = true,
  bookTitle,
  sellerName,
  buyerName,
}) => {
  console.log('LeafletBookRouteMap rendered with:', { buyer, seller, showUserLocation });

  const userLocation = locationService.getCachedLocation();

  // Error state when locations are missing
  if (!buyer || !seller) {
    return (
      <div className="p-6 bg-yellow-50 text-yellow-800 rounded-lg border border-yellow-200">
        <div className="flex items-center gap-3 mb-3">
          <AlertTriangle className="w-6 h-6 text-yellow-600" />
          <span className="font-semibold text-lg">Location Information Required</span>
        </div>
        <div className="space-y-2">
          <p className="flex items-center gap-2">
            <span className={buyer ? "text-green-600" : "text-red-600"}>
              {buyer ? "✓" : "✗"}
            </span>
            Buyer Location: {buyer ? "Available" : "Missing"}
          </p>
          <p className="flex items-center gap-2">
            <span className={seller ? "text-green-600" : "text-red-600"}>
              {seller ? "✓" : "✗"}
            </span>
            Seller Location: {seller ? "Available" : "Missing"}
          </p>
        </div>
        {userLocation && (
          <p className="text-sm text-green-700 mt-3 p-2 bg-green-50 rounded border border-green-200">
            📍 Your current location is available for when both buyer and seller locations are provided.
          </p>
        )}
      </div>
    );
  }

  const positions: [number, number][] = [
    [buyer.latitude, buyer.longitude],
    [seller.latitude, seller.longitude],
  ];
  
  const center: [number, number] = [
    (buyer.latitude + seller.latitude) / 2,
    (buyer.longitude + seller.longitude) / 2,
  ];
  
  // Use the consistent distance calculation function
  const distance = calculateDistance(
    buyer.latitude,
    buyer.longitude,
    seller.latitude,
    seller.longitude
  );

  const travelTime = estimateTravelTime(distance);
  const direction = getDirection(
    buyer.latitude,
    buyer.longitude,
    seller.latitude,
    seller.longitude
  );

  // Calculate distances from user location if available
  let distanceFromUser = null;
  let distanceFromUserToSeller = null;
  if (userLocation) {
    distanceFromUser = calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      buyer.latitude,
      buyer.longitude
    );
    distanceFromUserToSeller = calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      seller.latitude,
      seller.longitude
    );
  }

  const zoomLevel = getZoomLevel(distance);

  console.log('Map rendering with data:', { 
    distance: distance.toFixed(1),
    travelTime,
    direction,
    zoom: zoomLevel,
    buyerCoords: [buyer.latitude, buyer.longitude],
    sellerCoords: [seller.latitude, seller.longitude]
  });

  return (
    <div className="w-full space-y-4">
      {/* Map Header with Transaction Details */}
      {(bookTitle || sellerName || buyerName) && (
        <div className="bg-gradient-to-r from-blue-50 via-purple-50 to-green-50 rounded-lg border p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              Delivery Route Map
            </h3>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              {distance.toFixed(1)} km apart
            </Badge>
          </div>
          {bookTitle && (
            <p className="text-sm text-gray-600 mb-1">
              <strong>Book:</strong> {bookTitle}
            </p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            {buyerName && (
              <p className="text-blue-700">
                <strong>Buyer:</strong> {buyerName}
              </p>
            )}
            {sellerName && (
              <p className="text-green-700">
                <strong>Seller:</strong> {sellerName}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Enhanced Distance and Route Information */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-gradient-to-r from-blue-50 via-purple-50 to-green-50 rounded-lg border shadow-sm">
        <div className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm">
          <div className="p-2 bg-purple-100 rounded-full">
            <Navigation className="w-4 h-4 text-purple-700" />
          </div>
          <div>
            <p className="text-xs text-gray-600 font-medium">Distance</p>
            <p className="font-bold text-lg text-purple-700">{distance.toFixed(1)} km</p>
            <p className="text-xs text-gray-500">Direct</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm">
          <div className="p-2 bg-blue-100 rounded-full">
            <Clock className="w-4 h-4 text-blue-700" />
          </div>
          <div>
            <p className="text-xs text-gray-600 font-medium">Est. Time</p>
            <p className="font-bold text-lg text-blue-700">{travelTime}</p>
            <p className="text-xs text-gray-500">By road</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm">
          <div className="p-2 bg-green-100 rounded-full">
            <Car className="w-4 h-4 text-green-700" />
          </div>
          <div>
            <p className="text-xs text-gray-600 font-medium">Direction</p>
            <p className="font-bold text-lg text-green-700">{direction}</p>
            <p className="text-xs text-gray-500">From buyer</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm">
          <div className="p-2 bg-amber-100 rounded-full">
            <Info className="w-4 h-4 text-amber-700" />
          </div>
          <div>
            <p className="text-xs text-gray-600 font-medium">Zoom</p>
            <p className="font-bold text-lg text-amber-700">{zoomLevel}x</p>
            <p className="text-xs text-gray-500">Level</p>
          </div>
        </div>
      </div>

      {/* User Location Distance Info */}
      {userLocation && (distanceFromUser !== null || distanceFromUserToSeller !== null) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gradient-to-r from-orange-50 to-pink-50 rounded-lg border border-orange-200">
          <div className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm">
            <div className="p-2 bg-orange-100 rounded-full">
              <MapPin className="w-5 h-5 text-orange-700" />
            </div>
            <div>
              <p className="text-sm text-gray-600 font-medium">You to Buyer</p>
              <p className="font-bold text-lg text-orange-700">{distanceFromUser?.toFixed(1)} km</p>
              <p className="text-xs text-gray-500">From your location</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm">
            <div className="p-2 bg-pink-100 rounded-full">
              <MapPin className="w-5 h-5 text-pink-700" />
            </div>
            <div>
              <p className="text-sm text-gray-600 font-medium">You to Seller</p>
              <p className="font-bold text-lg text-pink-700">{distanceFromUserToSeller?.toFixed(1)} km</p>
              <p className="text-xs text-gray-500">From your location</p>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Map with Enhanced Details */}
      <div className="relative w-full h-[500px] rounded-xl border-2 border-gray-200 overflow-hidden bg-gray-100 shadow-xl">
        <MapContainer
          center={center}
          zoom={zoomLevel}
          scrollWheelZoom={true}
          zoomControl={false}
          style={{ height: "100%", width: "100%" }}
          className="z-0"
        >
          {/* High Quality Tile Layer */}
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            maxZoom={19}
            minZoom={3}
          />
          
          {/* Custom Map Controls */}
          <MapControls />
          
          {/* User Location Marker */}
          {userLocation && showUserLocation && (
            <Marker 
              position={[userLocation.latitude, userLocation.longitude]} 
              icon={userIcon}
            >
              <Popup className="custom-popup">
                <div className="p-2">
                  <div className="font-bold text-red-700 mb-2">📍 Your Current Location</div>
                  <div className="text-sm space-y-1">
                    <p><strong>Coordinates:</strong></p>
                    <p className="font-mono">{userLocation.latitude.toFixed(6)}, {userLocation.longitude.toFixed(6)}</p>
                    {userLocation.accuracy && (
                      <p className="text-red-600 text-xs">
                        <strong>Accuracy:</strong> ±{Math.round(userLocation.accuracy)}m
                      </p>
                    )}
                  </div>
                </div>
              </Popup>
              <Tooltip direction="top" offset={[0, -41]} opacity={1}>
                <span className="font-semibold">Your Location</span>
              </Tooltip>
            </Marker>
          )}
          
          {/* Buyer Marker with Enhanced Popup */}
          <Marker position={positions[0]} icon={buyerIcon}>
            <Popup className="custom-popup" maxWidth={300}>
              <div className="p-3">
                <div className="font-bold text-blue-700 mb-3 flex items-center gap-2">
                  🛒 Buyer Location
                  <Badge variant="outline" className="text-xs">Pickup Point</Badge>
                </div>
                <div className="space-y-2 text-sm">
                  {buyerName && (
                    <p className="flex items-center gap-2">
                      <strong>Buyer:</strong> {buyerName}
                    </p>
                  )}
                  <div className="bg-blue-50 p-2 rounded">
                    <p><strong>Coordinates:</strong></p>
                    <p className="font-mono text-xs">{positions[0][0].toFixed(6)}, {positions[0][1].toFixed(6)}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-gray-50 p-2 rounded">
                      <p className="font-semibold">To Seller</p>
                      <p className="text-purple-600">{distance.toFixed(1)} km</p>
                    </div>
                    <div className="bg-gray-50 p-2 rounded">
                      <p className="font-semibold">Est. Time</p>
                      <p className="text-blue-600">{travelTime}</p>
                    </div>
                  </div>
                  {userLocation && distanceFromUser && (
                    <p className="text-orange-600 text-xs">
                      <strong>From your location:</strong> {distanceFromUser.toFixed(1)} km
                    </p>
                  )}
                </div>
              </div>
            </Popup>
            <Tooltip direction="top" offset={[0, -41]} opacity={0.9} className="bg-blue-600 text-white">
              <span className="font-semibold">🛒 Buyer - {buyerName || 'Unknown'}</span>
            </Tooltip>
          </Marker>
          
          {/* Seller Marker with Enhanced Popup */}
          <Marker position={positions[1]} icon={sellerIcon}>
            <Popup className="custom-popup" maxWidth={300}>
              <div className="p-3">
                <div className="font-bold text-green-700 mb-3 flex items-center gap-2">
                  📚 Seller Location
                  <Badge variant="outline" className="text-xs">Delivery Point</Badge>
                </div>
                <div className="space-y-2 text-sm">
                  {sellerName && (
                    <p className="flex items-center gap-2">
                      <strong>Seller:</strong> {sellerName}
                    </p>
                  )}
                  {bookTitle && (
                    <p className="bg-green-50 p-2 rounded text-xs">
                      <strong>Book:</strong> {bookTitle}
                    </p>
                  )}
                  <div className="bg-green-50 p-2 rounded">
                    <p><strong>Coordinates:</strong></p>
                    <p className="font-mono text-xs">{positions[1][0].toFixed(6)}, {positions[1][1].toFixed(6)}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-gray-50 p-2 rounded">
                      <p className="font-semibold">To Buyer</p>
                      <p className="text-purple-600">{distance.toFixed(1)} km</p>
                    </div>
                    <div className="bg-gray-50 p-2 rounded">
                      <p className="font-semibold">Direction</p>
                      <p className="text-green-600">{direction}</p>
                    </div>
                  </div>
                  {userLocation && distanceFromUserToSeller && (
                    <p className="text-pink-600 text-xs">
                      <strong>From your location:</strong> {distanceFromUserToSeller.toFixed(1)} km
                    </p>
                  )}
                </div>
              </div>
            </Popup>
            <Tooltip direction="top" offset={[0, -41]} opacity={0.9} className="bg-green-600 text-white">
              <span className="font-semibold">📚 Seller - {sellerName || 'Unknown'}</span>
            </Tooltip>
          </Marker>
          
          {/* Enhanced Route Line with Animation Effect */}
          <Polyline 
            positions={positions} 
            color="#6366f1" 
            weight={5} 
            opacity={0.9}
            dashArray="15,10"
            className="animate-pulse"
          />
          
          {/* Route Shadow for Better Visibility */}
          <Polyline 
            positions={positions} 
            color="#000000" 
            weight={7} 
            opacity={0.2}
          />
        </MapContainer>
      </div>
      
      {/* Enhanced Footer with Map Legend */}
      <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <Navigation className="w-4 h-4" />
              Map Information
            </h4>
            <p className="text-sm text-gray-600 mb-1">
              Direct distance: <strong>{distance.toFixed(1)} km</strong>
            </p>
            <p className="text-xs text-gray-500">
              Actual travel route may vary based on roads, traffic, and transportation method.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <Layers className="w-4 h-4" />
              Map Legend
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span>Buyer Location</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>Seller Location</span>
              </div>
              {userLocation && (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span>Your Location</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <div className="w-4 h-0.5 bg-indigo-500" style={{clipPath: "polygon(0 0, 60% 0, 60% 100%, 0 100%)"}}></div>
                <span>Route Path</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
