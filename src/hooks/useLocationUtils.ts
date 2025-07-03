
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
          setLoading(false);
          return;
        }

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
      } finally {
        setLoading(false);
      }
    };

    getUserLocation();
  }, []);

  return { userLocation, loading };
};

export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
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
