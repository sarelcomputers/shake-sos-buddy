import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet';
import { Icon } from 'leaflet';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, Activity } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

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

const currentLocationIcon = new Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const pastLocationIcon = new Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [20, 33],
  iconAnchor: [10, 33],
  popupAnchor: [1, -28],
  shadowSize: [33, 33]
});

export default function LiveTracking() {
  const { sosId } = useParams<{ sosId: string }>();
  const [locations, setLocations] = useState<LocationPoint[]>([]);
  const [sosData, setSOSData] = useState<SOSData | null>(null);
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sosId) return;

    // Fetch SOS data and initial locations
    const fetchData = async () => {
      const { data: sos } = await supabase
        .from('sos_history')
        .select('*')
        .eq('id', sosId)
        .single();

      if (sos) {
        setSOSData(sos);
      }

      const { data: locs } = await supabase
        .from('location_tracking')
        .select('*')
        .eq('sos_history_id', sosId)
        .order('timestamp', { ascending: true });

      if (locs) {
        setLocations(locs);
      }

      setLoading(false);
    };

    fetchData();

    // Subscribe to real-time location updates
    const channel = supabase
      .channel('location-tracking')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'location_tracking',
          filter: `sos_history_id=eq.${sosId}`
        },
        (payload) => {
          setLocations(prev => [...prev, payload.new as LocationPoint]);
        }
      )
      .subscribe();

    // Check if tracking is still active (within 5 minutes)
    if (sosData) {
      const sosTime = new Date(sosData.triggered_at).getTime();
      const now = Date.now();
      const fiveMinutes = 5 * 60 * 1000;
      setIsActive(now - sosTime < fiveMinutes);

      const interval = setInterval(() => {
        const currentTime = Date.now();
        setIsActive(currentTime - sosTime < fiveMinutes);
      }, 10000);

      return () => {
        clearInterval(interval);
        supabase.removeChannel(channel);
      };
    }

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sosId, sosData?.triggered_at]);

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

  if (!sosData || locations.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="p-8 text-center">
          <MapPin className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold mb-2">No Location Data</h2>
          <p className="text-muted-foreground">Waiting for location updates...</p>
        </Card>
      </div>
    );
  }

  const currentLocation = locations[locations.length - 1];
  const pathCoordinates = locations.map(loc => [loc.latitude, loc.longitude] as [number, number]);

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
      <div className="h-[calc(100vh-120px)]">
        <MapContainer
          // @ts-ignore - react-leaflet types issue with center prop
          center={[currentLocation.latitude, currentLocation.longitude]}
          zoom={15}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          
          {/* Path polyline */}
          {pathCoordinates.length > 1 && (
            <Polyline
              positions={pathCoordinates}
              pathOptions={{ color: 'blue', weight: 3, opacity: 0.7 }}
            />
          )}

          {/* All location markers */}
          {locations.map((loc, index) => {
            const MarkerAny = Marker as any;
            return (
              <MarkerAny
                key={loc.id}
                position={[loc.latitude, loc.longitude]}
                icon={index === locations.length - 1 ? currentLocationIcon : pastLocationIcon}
              >
                <Popup>
                  <div className="text-sm">
                    <p className="font-semibold mb-1">
                      {index === locations.length - 1 ? 'Current Location' : `Point ${index + 1}`}
                    </p>
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {new Date(loc.timestamp).toLocaleTimeString()}
                    </p>
                    {loc.speed && (
                      <p className="text-xs mt-1">Speed: {(loc.speed * 3.6).toFixed(1)} km/h</p>
                    )}
                    {loc.accuracy && (
                      <p className="text-xs">Accuracy: ±{loc.accuracy.toFixed(0)}m</p>
                    )}
                  </div>
                </Popup>
              </MarkerAny>
            );
          })}
        </MapContainer>
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
