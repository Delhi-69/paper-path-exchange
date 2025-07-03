
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Search, Truck, Star, Clock } from 'lucide-react';
import { toast } from 'sonner';
import BookCard from './BookCard';

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

interface UserLocation {
  latitude: number;
  longitude: number;
}

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

const calculateDeliveryCharge = (distance: number): number => {
  if (distance <= 5) return 0;
  if (distance <= 7) return 50;
  if (distance <= 10) return 75;
  return 100;
};

const BookDiscovery: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string>('');
  const [selectedCondition, setSelectedCondition] = useState<string>('');
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [sortBy, setSortBy] = useState<string>('distance');

  useEffect(() => {
    const getUserLocation = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabase
          .from('profiles')
          .select('latitude, longitude')
          .eq('id', user.id)
          .single();

        if (profile?.latitude && profile?.longitude) {
          setUserLocation({
            latitude: profile.latitude,
            longitude: profile.longitude
          });
        }
      } catch (error) {
        console.error('Error getting user location:', error);
      }
    };

    getUserLocation();
  }, []);

  const { data: books = [], isLoading, refetch } = useQuery({
    queryKey: ['books', searchQuery, selectedGenre, selectedCondition, userLocation],
    queryFn: async () => {
      let query = supabase
        .from('books')
        .select(`
          *,
          seller:profiles!books_seller_id_fkey(full_name, average_rating, review_count)
        `)
        .eq('status', 'available');

      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,author.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
      }

      if (selectedGenre) {
        query = query.eq('genre', selectedGenre);
      }

      if (selectedCondition) {
        query = query.eq('condition', selectedCondition);
      }

      const { data, error } = await query;

      if (error) throw error;

      if (!userLocation) return data || [];

      // Filter books within 10km and calculate distances
      const booksWithDistance = (data || [])
        .map((book: any) => {
          if (!book.latitude || !book.longitude) return null;
          
          const distance = calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            book.latitude,
            book.longitude
          );

          if (distance > 10) return null;

          return {
            ...book,
            distance: Math.round(distance * 10) / 10,
            delivery_charge: calculateDeliveryCharge(distance)
          };
        })
        .filter(Boolean);

      // Sort books
      return booksWithDistance.sort((a: Book, b: Book) => {
        switch (sortBy) {
          case 'distance':
            return (a.distance || 0) - (b.distance || 0);
          case 'price_low':
            return a.price_range - b.price_range;
          case 'price_high':
            return b.price_range - a.price_range;
          case 'newest':
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          case 'rating':
            return (b.seller?.average_rating || 0) - (a.seller?.average_rating || 0);
          default:
            return 0;
        }
      });
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl font-bold">Discover Books</h1>
          <p className="text-muted-foreground">
            {userLocation ? 'Books within 10km of your location' : 'Set your location to see nearby books'}
          </p>
        </div>
        <Badge variant="outline" className="flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          {books.length} books found
        </Badge>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search by title, author, or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button type="submit">Search</Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                <SelectTrigger>
                  <SelectValue placeholder="Genre" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Genres</SelectItem>
                  {genres.map(genre => (
                    <SelectItem key={genre} value={genre}>{genre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedCondition} onValueChange={setSelectedCondition}>
                <SelectTrigger>
                  <SelectValue placeholder="Condition" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Conditions</SelectItem>
                  {conditions.map(condition => (
                    <SelectItem key={condition} value={condition}>{condition}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="distance">Distance</SelectItem>
                  <SelectItem value="price_low">Price: Low to High</SelectItem>
                  <SelectItem value="price_high">Price: High to Low</SelectItem>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="rating">Seller Rating</SelectItem>
                </SelectContent>
              </Select>

              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setSearchQuery('');
                  setSelectedGenre('');
                  setSelectedCondition('');
                  setSortBy('distance');
                }}
              >
                Clear Filters
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Location Warning */}
      {!userLocation && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-yellow-800">
              <MapPin className="h-4 w-4" />
              <span className="text-sm">
                Set your location in your profile to see distance and delivery charges for books near you.
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Books Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-48 bg-gray-200 rounded-t-lg"></div>
              <CardContent className="p-4 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : books.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="space-y-2">
              <h3 className="text-lg font-medium">No books found</h3>
              <p className="text-muted-foreground">
                {userLocation 
                  ? "No books match your search criteria within 10km of your location."
                  : "Try adjusting your search filters or set your location to see nearby books."
                }
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {books.map((book: Book) => (
            <Card key={book.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative">
                {book.images && book.images.length > 0 ? (
                  <img 
                    src={book.images[0]} 
                    alt={book.title}
                    className="w-full h-48 object-cover"
                  />
                ) : (
                  <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-400">No image</span>
                  </div>
                )}
                
                {/* Distance and Delivery Badge */}
                {book.distance !== undefined && (
                  <div className="absolute top-2 left-2 space-y-1">
                    <Badge variant="secondary" className="bg-white/90 text-xs">
                      <MapPin className="h-3 w-3 mr-1" />
                      {book.distance}km away
                    </Badge>
                    {book.delivery_charge !== undefined && (
                      <Badge 
                        variant={book.delivery_charge === 0 ? "default" : "outline"} 
                        className="bg-white/90 text-xs block"
                      >
                        <Truck className="h-3 w-3 mr-1" />
                        {book.delivery_charge === 0 ? 'Free Delivery' : `₹${book.delivery_charge} Delivery`}
                      </Badge>
                    )}
                  </div>
                )}

                {/* Condition Badge */}
                <Badge 
                  variant="outline" 
                  className="absolute top-2 right-2 bg-white/90"
                >
                  {book.condition}
                </Badge>
              </div>

              <CardContent className="p-4">
                <div className="space-y-2">
                  <div>
                    <h3 className="font-semibold line-clamp-1">{book.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-1">by {book.author}</p>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-green-600">
                      ₹{book.price_range}
                      {book.delivery_charge !== undefined && book.delivery_charge > 0 && (
                        <span className="text-sm text-muted-foreground font-normal">
                          + ₹{book.delivery_charge} delivery
                        </span>
                      )}
                    </span>
                    
                    {book.seller?.average_rating && (
                      <div className="flex items-center gap-1 text-sm">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span>{book.seller.average_rating.toFixed(1)}</span>
                        <span className="text-muted-foreground">
                          ({book.seller.review_count})
                        </span>
                      </div>
                    )}
                  </div>

                  {book.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {book.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>Listed {new Date(book.created_at).toLocaleDateString()}</span>
                    </div>
                    
                    <BookCard 
                      book={book} 
                      onPurchaseRequest={() => {
                        toast.success('Purchase request sent!');
                        refetch();
                      }}
                    />
                  </div>

                  {book.location_address && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground pt-1">
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
  );
};

export default BookDiscovery;
