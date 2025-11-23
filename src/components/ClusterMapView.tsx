import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';

// Fix for default marker icons in Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface AlertLocation {
  id: string;
  latitude: number;
  longitude: number;
  message: string;
  timestamp: string;
  contacts_count: number;
}

interface ClusterMapViewProps {
  locations: AlertLocation[];
  onMarkerClick?: (id: string) => void;
}

export const ClusterMapView = ({ locations, onMarkerClick }: ClusterMapViewProps) => {
  // Calculate center of all locations
  const getCenter = (): [number, number] => {
    if (locations.length === 0) return [0, 0];
    
    const avgLat = locations.reduce((sum, loc) => sum + loc.latitude, 0) / locations.length;
    const avgLng = locations.reduce((sum, loc) => sum + loc.longitude, 0) / locations.length;
    
    return [avgLat, avgLng];
  };

  // Calculate appropriate zoom level based on locations spread
  const getZoom = (): number => {
    if (locations.length === 1) return 13;
    if (locations.length === 0) return 2;
    
    const lats = locations.map(l => l.latitude);
    const lngs = locations.map(l => l.longitude);
    
    const latSpread = Math.max(...lats) - Math.min(...lats);
    const lngSpread = Math.max(...lngs) - Math.min(...lngs);
    const maxSpread = Math.max(latSpread, lngSpread);
    
    if (maxSpread > 50) return 3;
    if (maxSpread > 20) return 5;
    if (maxSpread > 10) return 6;
    if (maxSpread > 5) return 7;
    if (maxSpread > 2) return 8;
    if (maxSpread > 1) return 9;
    return 10;
  };

  return (
    <MapContainer
      // @ts-ignore - react-leaflet types issue with center prop
      center={getCenter()}
      zoom={getZoom()}
      style={{ height: '100%', width: '100%', minHeight: '400px' }}
      className="z-0"
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      
      <MarkerClusterGroup
        chunkedLoading
        maxClusterRadius={50}
      >
        {locations.map((location) => (
          <Marker
            key={location.id}
            // @ts-ignore - react-leaflet types issue with position prop
            position={[location.latitude, location.longitude]}
            eventHandlers={{
              click: () => onMarkerClick?.(location.id),
            }}
          >
            <Popup>
              <div className="p-2 min-w-[200px]">
                <p className="font-semibold text-sm">{location.timestamp}</p>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {location.message}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  {location.contacts_count} contact{location.contacts_count !== 1 ? 's' : ''} notified
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MarkerClusterGroup>
    </MapContainer>
  );
};
