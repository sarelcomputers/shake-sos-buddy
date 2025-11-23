import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
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

interface MapViewProps {
  latitude: number;
  longitude: number;
  message: string;
  timestamp: string;
}

export const MapView = ({ latitude, longitude, message, timestamp }: MapViewProps) => {
  return (
    <MapContainer
      // @ts-ignore - react-leaflet types issue with center prop
      center={[latitude, longitude]}
      zoom={13}
      style={{ height: '100%', width: '100%', minHeight: '400px' }}
      className="z-0"
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <Marker 
        // @ts-ignore - react-leaflet types issue with position prop
        position={[latitude, longitude]}
      >
        <Popup>
          <div className="p-2">
            <p className="font-semibold">{timestamp}</p>
            <p className="text-sm text-muted-foreground mt-1">{message}</p>
          </div>
        </Popup>
      </Marker>
    </MapContainer>
  );
};
