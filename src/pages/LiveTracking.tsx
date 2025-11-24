import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { publicSupabase } from '@/integrations/supabase/publicClient';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, Activity, AlertCircle } from 'lucide-react';

interface LocationPoint {
  id: string;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  speed: number | null;
  timestamp: string;
}

interface SOSData {
  id: string;
  user_id: string;
  message: string;
  triggered_at: string;
  personal_info: any;
}

const GOOGLE_MAPS_API_KEY = 'AIzaSyBpsCYESmSNFPKNnzh4WWyuArYeN_BSb88';

declare global {
  interface Window {
    google: typeof google;
  }
}

export default function LiveTracking() {
  const { sosId } = useParams<{ sosId: string }>();
  const [locations, setLocations] = useState<LocationPoint[]>([]);
  const [sosData, setSOSData] = useState<SOSData | null>(null);
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const polylineRef = useRef<google.maps.Polyline | null>(null);

  // Load Google Maps script
  useEffect(() => {
    if (!window.google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}`;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
  }, []);

  // Initialize map when locations change
  useEffect(() => {
    if (!mapRef.current || locations.length === 0 || !window.google) return;

    if (!mapInstanceRef.current) {
      const currentLocation = locations[locations.length - 1];
      mapInstanceRef.current = new google.maps.Map(mapRef.current, {
        center: { lat: currentLocation.latitude, lng: currentLocation.longitude },
        zoom: 15,
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
      });
    }

    // Clear existing markers and polyline
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];
    if (polylineRef.current) polylineRef.current.setMap(null);

    // Add markers for all locations
    locations.forEach((loc, index) => {
      const marker = new google.maps.Marker({
        position: { lat: loc.latitude, lng: loc.longitude },
        map: mapInstanceRef.current!,
        title: index === locations.length - 1 ? 'Current Location' : `Point ${index + 1}`,
        icon: index === locations.length - 1 
          ? 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
          : 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
      });

      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="padding: 8px;">
            <p style="font-weight: 600; margin-bottom: 4px;">
              ${index === locations.length - 1 ? 'Current Location' : `Point ${index + 1}`}
            </p>
            <p style="font-size: 12px; color: #666;">
              ${new Date(loc.timestamp).toLocaleTimeString()}
            </p>
            ${loc.speed ? `<p style="font-size: 12px;">Speed: ${(loc.speed * 3.6).toFixed(1)} km/h</p>` : ''}
            ${loc.accuracy ? `<p style="font-size: 12px;">Accuracy: ±${loc.accuracy.toFixed(0)}m</p>` : ''}
          </div>
        `,
      });

      marker.addListener('click', () => {
        infoWindow.open(mapInstanceRef.current!, marker);
      });

      markersRef.current.push(marker);
    });

    // Draw polyline path
    if (locations.length > 1) {
      const path = locations.map(loc => ({ lat: loc.latitude, lng: loc.longitude }));
      polylineRef.current = new google.maps.Polyline({
        path,
        geodesic: true,
        strokeColor: '#0000FF',
        strokeOpacity: 0.7,
        strokeWeight: 3,
        map: mapInstanceRef.current!,
      });
    }

    // Center map on current location
    const currentLocation = locations[locations.length - 1];
    mapInstanceRef.current.setCenter({ lat: currentLocation.latitude, lng: currentLocation.longitude });
  }, [locations]);

  useEffect(() => {
    if (!sosId) {
      setError('Invalid tracking link');
      setLoading(false);
      return;
    }

    let channel: any;
    let interval: any;

    // Fetch SOS data and initial locations
    const fetchData = async () => {
      try {
        console.log('LiveTracking: Fetching data for SOS ID:', sosId);
        
        const { data: sos, error: sosError } = await publicSupabase
          .from('sos_history')
          .select('*')
          .eq('id', sosId)
          .single();

        if (sosError) {
          console.error('Error fetching SOS data:', sosError);
          setError('Failed to load emergency alert data');
          setLoading(false);
          return;
        }

        if (!sos) {
          console.log('LiveTracking: No SOS data found');
          setError('Emergency alert not found');
          setLoading(false);
          return;
        }

        console.log('LiveTracking: SOS data found:', sos);
        setSOSData(sos);
        
        // Set up activity check based on fetched data
        const sosTime = new Date(sos.triggered_at).getTime();
        const now = Date.now();
        const fiveMinutes = 5 * 60 * 1000;
        setIsActive(now - sosTime < fiveMinutes);

        // Update active status every 10 seconds
        interval = setInterval(() => {
          const currentTime = Date.now();
          setIsActive(currentTime - sosTime < fiveMinutes);
        }, 10000);

        const { data: locs, error: locsError } = await publicSupabase
          .from('location_tracking')
          .select('*')
          .eq('sos_history_id', sosId)
          .order('timestamp', { ascending: true });

        if (locsError) {
          console.error('Error fetching locations:', locsError);
        } else {
          console.log('LiveTracking: Locations found:', locs?.length || 0);
          setLocations(locs || []);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error in fetchData:', error);
        setError('An unexpected error occurred');
        setLoading(false);
      }
    };

    fetchData();

    // Subscribe to real-time location updates
    console.log('LiveTracking: Setting up realtime subscription for SOS ID:', sosId);
    channel = publicSupabase
      .channel(`location-tracking-${sosId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'location_tracking',
          filter: `sos_history_id=eq.${sosId}`
        },
        (payload) => {
          console.log('LiveTracking: New location received:', payload.new);
          setLocations(prev => [...prev, payload.new as LocationPoint]);
        }
      )
      .subscribe((status) => {
        console.log('LiveTracking: Subscription status:', status);
      });

    return () => {
      console.log('LiveTracking: Cleaning up subscriptions');
      if (interval) clearInterval(interval);
      if (channel) publicSupabase.removeChannel(channel);
    };
  }, [sosId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="p-8">
          <div className="flex items-center gap-3">
            <Activity className="w-6 h-6 animate-spin text-primary" />
            <p className="text-lg">Loading live tracking...</p>
          </div>
        </Card>
      </div>
    );
  }

  if (error || !sosData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="p-8 text-center max-w-md">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
          <h2 className="text-xl font-semibold mb-2">
            {error || 'Emergency Alert Not Found'}
          </h2>
          <p className="text-muted-foreground mb-4">
            {error 
              ? 'There was a problem loading the tracking information.' 
              : 'This emergency alert could not be found or may have been deleted.'}
          </p>
          <p className="text-sm text-muted-foreground">
            Please verify the tracking link or contact support if the problem persists.
          </p>
        </Card>
      </div>
    );
  }

  if (locations.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="p-8 text-center">
          <Activity className="w-12 h-12 mx-auto mb-4 text-primary animate-pulse" />
          <h2 className="text-xl font-semibold mb-2">Waiting for Location Data</h2>
          <p className="text-muted-foreground mb-4">Location tracking is starting up...</p>
          <p className="text-sm text-muted-foreground">Alert triggered: {new Date(sosData.triggered_at).toLocaleString()}</p>
        </Card>
      </div>
    );
  }

  const currentLocation = locations[locations.length - 1];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <Activity className={isActive ? "animate-pulse text-destructive" : "text-muted-foreground"} />
                Live SOS Tracking
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {sosData.personal_info?.name || 'Emergency Alert'} - {new Date(sosData.triggered_at).toLocaleString()}
              </p>
            </div>
            <Badge variant={isActive ? "destructive" : "secondary"} className="text-sm py-1 px-3">
              {isActive ? 'TRACKING ACTIVE' : 'TRACKING ENDED'}
            </Badge>
          </div>
        </div>
      </div>

      {/* Map */}
      <div 
        ref={mapRef} 
        className="h-[calc(100vh-180px)]"
        style={{ minHeight: '400px' }}
      />

      {/* Info Panel */}
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:w-80 z-[1000]">
        <Card className="p-4 bg-card/95 backdrop-blur">
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-destructive mt-0.5" />
              <div className="flex-1 text-sm">
                <p className="font-medium">Current Position</p>
                <p className="text-xs text-muted-foreground">
                  {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <Clock className="w-4 h-4 text-primary mt-0.5" />
              <div className="flex-1 text-sm">
                <p className="font-medium">Last Update</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(currentLocation.timestamp).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="pt-2 border-t">
              <p className="text-xs font-medium mb-1">Tracking Points: {locations.length}</p>
              <p className="text-xs text-muted-foreground">
                {isActive 
                  ? 'Tracking will continue for 5 minutes from alert trigger'
                  : 'Tracking has ended'}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
