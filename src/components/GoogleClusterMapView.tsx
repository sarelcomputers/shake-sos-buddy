import { useEffect, useRef } from 'react';
import { MarkerClusterer } from '@googlemaps/markerclusterer';

interface Location {
  id: string;
  latitude: number;
  longitude: number;
  message: string;
  timestamp: string;
  contacts_count: number;
}

interface GoogleClusterMapViewProps {
  locations: Location[];
  onMarkerClick?: (id: string) => void;
}

const GOOGLE_MAPS_API_KEY = 'AIzaSyBpsCYESmSNFPKNnzh4WWyuArYeN_BSb88';

declare global {
  interface Window {
    google: typeof google;
  }
}

export const GoogleClusterMapView = ({ locations, onMarkerClick }: GoogleClusterMapViewProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const clustererRef = useRef<MarkerClusterer | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);

  useEffect(() => {
    // Load Google Maps script if not already loaded
    if (!window.google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}`;
      script.async = true;
      script.defer = true;
      script.onload = initializeMap;
      document.head.appendChild(script);
    } else {
      initializeMap();
    }

    return () => {
      // Cleanup
      if (clustererRef.current) {
        clustererRef.current.clearMarkers();
      }
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];
    };
  }, []);

  useEffect(() => {
    if (mapInstanceRef.current && locations.length > 0) {
      updateMarkers();
    }
  }, [locations]);

  const initializeMap = () => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const center = locations.length > 0 
      ? { lat: locations[0].latitude, lng: locations[0].longitude }
      : { lat: 0, lng: 0 };
    
    mapInstanceRef.current = new google.maps.Map(mapRef.current, {
      center,
      zoom: 5,
      mapTypeControl: true,
      streetViewControl: true,
      fullscreenControl: true,
    });

    if (locations.length > 0) {
      updateMarkers();
    }
  };

  const updateMarkers = () => {
    if (!mapInstanceRef.current) return;

    // Clear existing markers
    if (clustererRef.current) {
      clustererRef.current.clearMarkers();
    }
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Create new markers
    const markers = locations.map(location => {
      const marker = new google.maps.Marker({
        position: { lat: location.latitude, lng: location.longitude },
        title: location.message,
      });

      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="padding: 8px; min-width: 200px;">
            <p style="font-weight: 600; margin-bottom: 4px;">${location.timestamp}</p>
            <p style="font-size: 14px; color: #666; margin-bottom: 4px;">${location.message}</p>
            <p style="font-size: 12px; color: #999;">${location.contacts_count} contacts notified</p>
          </div>
        `,
      });

      marker.addListener('click', () => {
        infoWindow.open(mapInstanceRef.current!, marker);
        onMarkerClick?.(location.id);
      });

      return marker;
    });

    markersRef.current = markers;

    // Create marker clusterer
    if (window.google && (window as any).markerClusterer) {
      clustererRef.current = new MarkerClusterer({
        map: mapInstanceRef.current,
        markers,
      });
    } else {
      // If MarkerClusterer is not available, just add markers directly
      markers.forEach(marker => marker.setMap(mapInstanceRef.current));
    }

    // Fit bounds to show all markers
    if (markers.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      locations.forEach(location => {
        bounds.extend({ lat: location.latitude, lng: location.longitude });
      });
      mapInstanceRef.current.fitBounds(bounds);
    }
  };

  return (
    <div 
      ref={mapRef} 
      style={{ 
        height: '100%', 
        width: '100%', 
        minHeight: '400px' 
      }} 
    />
  );
};
