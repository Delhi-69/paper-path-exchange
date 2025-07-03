import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Filter, 
  MapPin, 
  Sliders,
  X,
  Route,
  Star,
  Clock,
  Truck,
  User,
  Heart,
  Share
} from 'lucide-react';
import { toast } from 'sonner';
import { UberBookCard } from './UberBookCard';
import { useUserLocation, calculateDistance, calculateDeliveryCharge } from '@/hooks/useLocationUtils';

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
  const [showFilters, setShowFilters] = useState(false);
  const { userLocation } = useUserLocation();

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

      if (selectedGenre && selectedGenre !== 'all') {
        query = query.eq('genre', selectedGenre);
      }

      if (selectedCondition && selectedCondition !== 'all') {
        query = query.eq('condition', selectedCondition);
      }

      const { data, error } = await query;

      if (error) throw error;

      if (!userLocation) return data || [];

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

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedGenre('all');
    setSelectedCondition('all');
    setSortBy('distance');
  };

  const genres = ['Fiction', 'Non-Fiction', 'Science', 'History', 'Biography', 'Technology', 'Business', 'Self-Help', 'Romance', 'Mystery', 'Fantasy', 'Horror'];
  const conditions = ['New', 'Like New', 'Very Good', 'Good', 'Fair'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Uber-style Header */}
        <div className="text-center space-y-4">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Discover Books
            </h1>
            <p className="text-gray-600 text-lg">
              {userLocation ? `${books.length} books within 10km` : 'Set location to see nearby books'}
            </p>
          </div>
          
          {books.length > 0 && (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 px-4 py-2 text-sm">
              <MapPin className="h-4 w-4 mr-2" />
              {books.length} available nearby
            </Badge>
          )}
        </div>

        {/* Uber-style Search Bar */}
        <Card className="bg-white/80 backdrop-blur-md border-0 shadow-xl">
          <CardContent className="p-6">
            <form onSubmit={handleSearch} className="space-y-4">
              {/* Main Search */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  placeholder="Search for books, authors, or topics..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 pr-20 h-14 text-lg bg-gray-50 border-0 rounded-2xl focus:bg-white transition-all duration-200"
                />
                <Button 
                  type="button"
                  variant="ghost"
                  onClick={() => setShowFilters(!showFilters)}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-10 px-4 rounded-xl"
                >
                  <Sliders className="h-4 w-4 mr-2" />
                  Filters
                </Button>
              </div>
              
              {/* Expandable Filters */}
              {showFilters && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-gray-100">
                  <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                    <SelectTrigger className="h-12 rounded-xl border-0 bg-gray-50">
                      <SelectValue placeholder="Genre" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Genres</SelectItem>
                      {genres.map(genre => (
                        <SelectItem key={genre} value={genre}>{genre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={selectedCondition} onValueChange={setSelectedCondition}>
                    <SelectTrigger className="h-12 rounded-xl border-0 bg-gray-50">
                      <SelectValue placeholder="Condition" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Conditions</SelectItem>
                      {conditions.map(condition => (
                        <SelectItem key={condition} value={condition}>{condition}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="h-12 rounded-xl border-0 bg-gray-50">
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
                    onClick={clearFilters}
                    className="h-12 rounded-xl border-0 bg-gray-50 hover:bg-gray-100"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Clear
                  </Button>
                </div>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Location Warning */}
        {!userLocation && (
          <Card className="border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 text-yellow-700">
                <MapPin className="h-5 w-5" />
                <span className="font-medium">Enable location to see distance and delivery charges</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Books Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="animate-pulse bg-white border-0 shadow-md">
                <div className="h-48 bg-gray-200 rounded-t-lg"></div>
                <CardContent className="p-4 space-y-3">
                  <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : books.length === 0 ? (
          <Card className="bg-white border-0 shadow-xl">
            <CardContent className="p-12 text-center">
              <div className="space-y-4">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto">
                  <Search className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">No books found</h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  {userLocation 
                    ? "No books match your search within 10km. Try adjusting your filters."
                    : "Set your location to discover books near you."
                  }
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {books.map((book: Book) => (
              <UberBookCard
                key={book.id}
                book={book}
                onInterest={(bookId) => {
                  toast.success('Interest registered! Contact the seller to proceed.');
                  // Handle interest logic here
                }}
                onShare={(bookId) => {
                  if (navigator.share) {
                    navigator.share({
                      title: `${book.title} by ${book.author}`,
                      text: `Check out this book for ₹${book.price_range}`,
                      url: window.location.href
                    });
                  } else {
                    navigator.clipboard.writeText(window.location.href);
                    toast.success('Link copied to clipboard!');
                  }
                }}
                compact={true}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BookDiscovery;