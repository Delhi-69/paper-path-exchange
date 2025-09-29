import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Search, Truck, Star, Clock, Filter, Navigation } from 'lucide-react';
import { toast } from 'sonner';
import BookCard from './BookCard';
import { useUserLocation, calculateDistance, calculateDeliveryCharge } from '@/hooks/useLocationUtils';
import { LocationPermissionDialog } from '@/components/location/LocationPermissionDialog';
import { LocationData } from '@/services/locationService';

interface Book {
  id: string;
  title: string;
  author: string;
  price_range: number;
  condition: string;
  description: string;
  images: string[];
  location_address: string;
  latitude: number;
  longitude: number;
  seller_id: string;
  created_at: string;
  seller?: {
    full_name: string;
    average_rating: number;
    review_count: number;
  };
  distance?: number;
  delivery_charge?: number;
}

const BookDiscovery: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [selectedCondition, setSelectedCondition] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('distance');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [manualLocation, setManualLocation] = useState<LocationData | null>(null);
  const [locationDialogShown, setLocationDialogShown] = useState(false);
  const { userLocation: profileLocation } = useUserLocation();
  
  // Use manual location (from GPS) if available, otherwise fall back to profile location
  const userLocation = manualLocation || profileLocation;

  // Fetch current user ID and check for location
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
      
      // Show location dialog if no location is available and not shown before
      if (user && !userLocation && !locationDialogShown) {
        setTimeout(() => setLocationDialogShown(true), 2000);
      }
    };
    getCurrentUser();
  }, [userLocation, locationDialogShown]);

  const handleLocationGranted = async (location: LocationData) => {
    console.log('Location granted:', location);
    setManualLocation(location);
    setLocationDialogShown(false);
    
    // Also update user profile with the location
    if (currentUserId) {
      await supabase
        .from('profiles')
        .update({
          latitude: location.latitude,
          longitude: location.longitude
        })
        .eq('id', currentUserId);
    }
    
    toast.success('Location access granted! You can now see nearby books.');
  };

  const handleLocationDenied = () => {
    console.log('Location denied');
    setLocationDialogShown(false);
    toast.error('Location access denied. You can still browse all books but won\'t see distance information.');
  };

  const { data: books = [], isLoading, refetch } = useQuery({
    queryKey: ['books', searchQuery, selectedGenre, selectedCondition, userLocation],
    queryFn: async () => {
      console.log('Fetching books with user location:', userLocation);
      
      let query = supabase
        .from('books')
        .select(`
          *,
          seller:profiles!books_seller_id_fkey(full_name, average_rating, review_count)
        `)
        .eq('status', 'available')
        .eq('listing_paid', true); // Only show books where seller paid security deposit

      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,author.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
      }

      if (selectedGenre && selectedGenre !== 'all') {
        query = query.eq('genre', selectedGenre);
      }

      if (selectedCondition && selectedCondition !== 'all') {
        query = query.eq('condition', selectedCondition);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching books:', error);
        throw error;
      }

      console.log('Raw books data:', data);

      if (!userLocation) {
        console.log('No user location, returning books without distance');
        return data || [];
      }

      // Calculate distances and filter books within 10km, then sort by distance
      const booksWithDistance = (data || [])
        .map((book: any) => {
          if (!book.latitude || !book.longitude) {
            console.log('Book missing coordinates:', book.title);
            return null;
          }
          
          const distance = calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            book.latitude,
            book.longitude
          );

          console.log(`Distance for ${book.title}: ${distance}km`);

          // Filter out books beyond 10km
          if (distance > 10) {
            console.log(`Book ${book.title} is too far: ${distance}km`);
            return null;
          }

          return {
            ...book,
            distance: Math.round(distance * 10) / 10, // Round to 1 decimal
            delivery_charge: calculateDeliveryCharge(distance)
          };
        })
        .filter(Boolean); // Remove null entries

      console.log('Books with distance:', booksWithDistance);

      // Sort books based on sortBy parameter
      const sortedBooks = [...booksWithDistance].sort((a: Book, b: Book) => {
        switch (sortBy) {
          case 'distance':
            return (a.distance || 0) - (b.distance || 0); // Sort by distance (low to high)
          case 'price_low':
            return a.price_range - b.price_range;
          case 'price_high':
            return b.price_range - a.price_range;
          case 'newest':
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          case 'rating':
            return (b.seller?.average_rating || 0) - (a.seller?.average_rating || 0);
          default:
            return (a.distance || 0) - (b.distance || 0); // Default to distance
        }
      });

      console.log('Final sorted books:', sortedBooks);
      return sortedBooks;
    },
    enabled: true
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    refetch();
  };

  const genres = ['Fiction', 'Non-Fiction', 'Science', 'History', 'Biography', 'Technology', 'Business', 'Self-Help', 'Romance', 'Mystery', 'Fantasy', 'Horror'];
  const conditions = ['New', 'Like New', 'Very Good', 'Good', 'Fair'];

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div>
            <h1 className="text-3xl font-bold text-white">Find Books Near You</h1>
            <div className="flex items-center gap-3 mt-2">
              <p className="text-gray-400">
                {userLocation ? `${books.length} books within 10km (sorted by distance - nearest first)` : 'Enable location to see nearby books with distances'}
              </p>
              {!userLocation && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => setLocationDialogShown(true)}
                  className="border-green-500 text-green-400 hover:bg-green-500/10"
                >
                  <Navigation className="h-4 w-4 mr-1" />
                  Enable Location
                </Button>
              )}
            </div>
          </div>
          <Badge variant="outline" className="flex items-center gap-2 bg-green-500/10 text-green-400 border-green-500/20 px-4 py-2">
            <MapPin className="h-4 w-4" />
            {books.length} available
          </Badge>
        </div>

        {/* Search and Filters */}
        <Card className="bg-gray-800 border-gray-700 shadow-xl">
          <CardContent className="p-6">
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input
                    placeholder="Search books, authors, or keywords..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 h-12 text-lg"
                  />
                </div>
                <Button type="submit" className="bg-green-500 hover:bg-green-600 px-8 h-12">
                  Search
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue placeholder="Genre" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="all" className="text-white">All Genres</SelectItem>
                    {genres.map(genre => (
                      <SelectItem key={genre} value={genre} className="text-white">{genre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedCondition} onValueChange={setSelectedCondition}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue placeholder="Condition" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="all" className="text-white">All Conditions</SelectItem>
                    {conditions.map(condition => (
                      <SelectItem key={condition} value={condition} className="text-white">{condition}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="distance" className="text-white">Distance (Nearest First)</SelectItem>
                    <SelectItem value="price_low" className="text-white">Price: Low to High</SelectItem>
                    <SelectItem value="price_high" className="text-white">Price: High to Low</SelectItem>
                    <SelectItem value="newest" className="text-white">Newest First</SelectItem>
                    <SelectItem value="rating" className="text-white">Seller Rating</SelectItem>
                  </SelectContent>
                </Select>

                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedGenre('all');
                    setSelectedCondition('all');
                    setSortBy('distance');
                  }}
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Location Warning */}
        {!userLocation && (
          <Card className="border-yellow-500/20 bg-yellow-500/10">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-yellow-400">
                <MapPin className="h-5 w-5" />
                <span>Set your location in profile to see distance and delivery charges</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Books Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="animate-pulse bg-gray-800 border-gray-700">
                <div className="h-56 bg-gray-700 rounded-t-lg"></div>
                <CardContent className="p-4 space-y-3">
                  <div className="h-5 bg-gray-700 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-700 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-700 rounded w-1/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : books.length === 0 ? (
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-12 text-center">
              <div className="space-y-4">
                <Search className="h-16 w-16 text-gray-500 mx-auto" />
                <h3 className="text-xl font-medium text-white">No books found</h3>
                <p className="text-gray-400 max-w-md mx-auto">
                  {userLocation 
                    ? "No books match your search within 10km. Try adjusting your filters."
                    : "Set your location to discover books near you."
                  }
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {books.map((book: Book) => (
              <Card key={book.id} className="overflow-hidden hover:shadow-2xl transition-all duration-300 bg-gray-800 border-gray-700 hover:border-green-500/30 group">
                <div className="relative">
                  {book.images && book.images.length > 0 ? (
                    <img 
                      src={book.images[0]} 
                      alt={book.title}
                      className="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-56 bg-gray-700 flex items-center justify-center">
                      <span className="text-gray-400 text-lg">No image</span>
                    </div>
                  )}
                  
                  {/* Distance and Delivery Badge */}
                  {book.distance !== undefined && (
                    <div className="absolute top-3 left-3 space-y-2">
                      <Badge className="bg-black/80 text-white border-0 backdrop-blur">
                        <MapPin className="h-3 w-3 mr-1" />
                        {book.distance}km away
                      </Badge>
                      {book.delivery_charge !== undefined && (
                        <Badge 
                          className={`block ${
                            book.delivery_charge === 0 
                              ? 'bg-green-500/90 text-white border-0' 
                              : 'bg-orange-500/90 text-white border-0'
                          } backdrop-blur`}
                        >
                          <Truck className="h-3 w-3 mr-1" />
                          {book.delivery_charge === 0 ? 'Free delivery' : `₹${book.delivery_charge} delivery`}
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Condition Badge */}
                  <Badge className="absolute top-3 right-3 bg-blue-500/90 text-white border-0 backdrop-blur">
                    {book.condition}
                  </Badge>
                </div>

                <CardContent className="p-5">
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-semibold text-lg text-white line-clamp-1 group-hover:text-green-400 transition-colors">
                        {book.title}
                      </h3>
                      <p className="text-gray-400 line-clamp-1">by {book.author}</p>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-2xl font-bold text-green-400">
                          ₹{book.price_range}
                        </span>
                        {book.delivery_charge !== undefined && book.delivery_charge > 0 && (
                          <p className="text-sm text-gray-400">
                            + ₹{book.delivery_charge} delivery
                          </p>
                        )}
                      </div>
                      
                      {book.seller?.average_rating && (
                        <div className="flex items-center gap-1 bg-gray-700 px-2 py-1 rounded-full">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm text-white">{book.seller.average_rating.toFixed(1)}</span>
                          <span className="text-xs text-gray-400">({book.seller.review_count})</span>
                        </div>
                      )}
                    </div>

                    {book.description && (
                      <p className="text-sm text-gray-400 line-clamp-2">
                        {book.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-gray-700">
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="h-3 w-3" />
                        <span>{new Date(book.created_at).toLocaleDateString()}</span>
                      </div>
                      
                      {/* Only show BookCard if current user is not the seller */}
                      {currentUserId && currentUserId !== book.seller_id ? (
                        <BookCard 
                          book={book} 
                          onPurchaseRequest={() => {
                            toast.success('Purchase request sent!');
                            refetch();
                          }}
                        />
                      ) : (
                        <Badge variant="outline" className="text-gray-500">
                          {currentUserId === book.seller_id ? 'Your Book' : 'Login to Request'}
                        </Badge>
                      )}
                    </div>

                    {book.location_address && (
                      <div className="flex items-center gap-1 text-xs text-gray-500 pt-1">
                        <MapPin className="h-3 w-3" />
                        <span className="line-clamp-1">{book.location_address}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      
      {/* Location Permission Dialog */}
      {locationDialogShown && (
        <LocationPermissionDialog
          onLocationGranted={handleLocationGranted}
          onLocationDenied={handleLocationDenied}
        />
      )}
    </div>
  );
};

export default BookDiscovery;
