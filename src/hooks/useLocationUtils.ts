
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UserLocation {
  latitude: number;
  longitude: number;
}

export const useUserLocation = () => {
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUserLocation = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.log('No authenticated user found');
          setLoading(false);
          return;
        }

        const { data: profile, error } = await supabase
          .from('profiles')
          .select('latitude, longitude')
          .eq('id', user.id)
          .single();

        if (error) {
          console.log('Error fetching user profile:', error);
          setLoading(false);
          return;
        }

        if (profile?.latitude && profile?.longitude) {
          console.log('User location found in profile:', { latitude: profile.latitude, longitude: profile.longitude });
          setUserLocation({
            latitude: Number(profile.latitude),
            longitude: Number(profile.longitude)
          });
        } else {
          console.log('No location coordinates found in user profile');
        }
      } catch (error) {
        console.error('Error getting user location:', error);
      } finally {
        setLoading(false);
      }
    };

    getUserLocation();
  }, []);

  return { userLocation, loading };
};

// More accurate Haversine distance calculation
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Earth's radius in kilometers
  const toRad = (value: number) => (value * Math.PI) / 180;
  
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance * 10) / 10; // Round to 1 decimal place
};

export const calculateDeliveryCharge = (distance: number): number => {
  if (distance <= 5) return 0; // Free delivery within 5km
  if (distance <= 7) return 50; // ₹50 for 5-7km
  if (distance <= 10) return 75; // ₹75 for 7-10km
  return 100; // ₹100 for 10km+ (if needed)
};

export const getDeliveryInfo = (distance: number) => {
  const charge = calculateDeliveryCharge(distance);
  return {
    charge,
    isFree: charge === 0,
    message: charge === 0 
      ? 'Free delivery' 
      : `₹${charge} delivery charge`
  };
};
