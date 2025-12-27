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

// Helper function to format time ago
function getTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  
  if (seconds < 60) return `${seconds} seconds ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  return `${Math.floor(seconds / 86400)} days ago`;
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

  const [mapLoaded, setMapLoaded] = useState(false);

  // Load Google Maps script
  useEffect(() => {
    if (window.google) {
      setMapLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      console.log('Google Maps loaded successfully');
      setMapLoaded(true);
    };
    script.onerror = (error) => {
      console.error('Failed to load Google Maps:', error);
      setError('Failed to load map. Please refresh the page.');
    };
    document.head.appendChild(script);

    return () => {
      script.remove();
    };
  }, []);

  // Initialize map when locations change
  useEffect(() => {
    if (!mapRef.current || locations.length === 0 || !mapLoaded || !window.google) {
      console.log('Map init check:', { 
        hasMapRef: !!mapRef.current, 
        locationsCount: locations.length, 
        mapLoaded, 
        hasGoogle: !!window.google 
      });
      return;
    }

    console.log('Initializing map with locations:', locations.length);

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

    // Add markers for all locations with trail effect
    locations.forEach((loc, index) => {
      const isCurrentLocation = index === locations.length - 1;
      const isFirstLocation = index === 0;
      
      // Create custom marker icons
      let markerIcon: google.maps.Symbol | google.maps.Icon;
      
      if (isCurrentLocation) {
        // Current location - large red pulsing marker
        markerIcon = {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 12,
          fillColor: '#FF0000',
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 3,
        };
      } else if (isFirstLocation) {
        // Start location - green marker
        markerIcon = {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: '#00FF00',
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 2,
        };
      } else {
        // Trail markers - small blue dots
        markerIcon = {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 6,
          fillColor: '#0066FF',
          fillOpacity: 0.8,
          strokeColor: '#FFFFFF',
          strokeWeight: 1,
        };
      }

      const marker = new google.maps.Marker({
        position: { lat: loc.latitude, lng: loc.longitude },
        map: mapInstanceRef.current!,
        title: isCurrentLocation ? 'Current Location' : isFirstLocation ? 'Start Location' : `Point ${index + 1}`,
        icon: markerIcon,
        zIndex: isCurrentLocation ? 1000 : isFirstLocation ? 999 : index,
      });

      const timeAgo = getTimeAgo(new Date(loc.timestamp));
      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="padding: 10px; min-width: 150px;">
            <p style="font-weight: 700; margin-bottom: 6px; font-size: 14px; color: ${isCurrentLocation ? '#FF0000' : isFirstLocation ? '#00AA00' : '#0066FF'};">
              ${isCurrentLocation ? '📍 Current Location' : isFirstLocation ? '🟢 Start Location' : `📌 Point ${index + 1}`}
            </p>
            <p style="font-size: 12px; color: #333; margin-bottom: 4px;">
              <strong>Time:</strong> ${new Date(loc.timestamp).toLocaleTimeString()}
            </p>
            <p style="font-size: 11px; color: #666; margin-bottom: 4px;">
              ${timeAgo}
            </p>
            ${loc.speed ? `<p style="font-size: 12px; color: #333;"><strong>Speed:</strong> ${(loc.speed * 3.6).toFixed(1)} km/h</p>` : ''}
            ${loc.accuracy ? `<p style="font-size: 12px; color: #333;"><strong>Accuracy:</strong> ±${loc.accuracy.toFixed(0)}m</p>` : ''}
            <p style="font-size: 11px; color: #999; margin-top: 6px;">
              ${loc.latitude.toFixed(6)}, ${loc.longitude.toFixed(6)}
            </p>
          </div>
        `,
      });

      marker.addListener('click', () => {
        infoWindow.open(mapInstanceRef.current!, marker);
      });

      markersRef.current.push(marker);
    });

    // Draw polyline path with gradient effect
    if (locations.length > 1) {
      const path = locations.map(loc => ({ lat: loc.latitude, lng: loc.longitude }));
      polylineRef.current = new google.maps.Polyline({
        path,
        geodesic: true,
        strokeColor: '#0066FF',
        strokeOpacity: 0.8,
        strokeWeight: 4,
        map: mapInstanceRef.current!,
        icons: [{
          icon: {
            path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
            scale: 3,
            strokeColor: '#0066FF',
          },
          offset: '100%',
          repeat: '100px'
        }]
      });
    }

    // Center map on current location
    const currentLocation = locations[locations.length - 1];
    mapInstanceRef.current.setCenter({ lat: currentLocation.latitude, lng: currentLocation.longitude });
  }, [locations, mapLoaded]);

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
        
        // Initial activity check - will be updated when locations load
        const sosTime = new Date(sos.triggered_at).getTime();
        const now = Date.now();
        const oneHour = 60 * 60 * 1000;
        setIsActive(now - sosTime < oneHour);

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
          
          // Determine active status based on most recent location update
          // Tracking is active if last location update was within the last 1 hour
          if (locs && locs.length > 0) {
            const lastLocation = locs[locs.length - 1];
            const lastUpdateTime = new Date(lastLocation.timestamp).getTime();
            const oneHour = 60 * 60 * 1000;
            setIsActive(Date.now() - lastUpdateTime < oneHour);
          }
        }
        
        // Update active status every 10 seconds based on latest location
        interval = setInterval(() => {
          setLocations(currentLocs => {
            if (currentLocs.length > 0) {
              const lastLoc = currentLocs[currentLocs.length - 1];
              const lastUpdateTime = new Date(lastLoc.timestamp).getTime();
              const oneHour = 60 * 60 * 1000;
              // Consider active if last update was within 2 minutes (for real-time feel)
              // or if the SOS was triggered within 1 hour and we're expecting more updates
              const sosTime = new Date(sos.triggered_at).getTime();
              const isWithinTrackingWindow = Date.now() - sosTime < oneHour;
              const hasRecentUpdate = Date.now() - lastUpdateTime < 2 * 60 * 1000; // 2 minutes
              setIsActive(isWithinTrackingWindow || hasRecentUpdate);
            }
            return currentLocs;
          });
        }, 10000);
        
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
        className="h-[calc(100vh-180px)] w-full relative bg-muted"
        style={{ minHeight: '400px' }}
      >
        {!mapLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="text-center">
              <Activity className="w-8 h-8 mx-auto mb-2 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading map...</p>
            </div>
          </div>
        )}
      </div>

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
                  ? 'Tracking will continue for 1 hour from alert trigger'
                  : 'Tracking has ended'}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
