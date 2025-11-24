import { useEffect, useRef } from 'react';

interface GoogleMapViewProps {
  latitude: number;
  longitude: number;
  message: string;
  timestamp: string;
}

const GOOGLE_MAPS_API_KEY = 'AIzaSyBpsCYESmSNFPKNnzh4WWyuArYeN_BSb88';

declare global {
  interface Window {
    google: typeof google;
  }
}

export const GoogleMapView = ({ latitude, longitude, message, timestamp }: GoogleMapViewProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);

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
      // Cleanup marker
      if (markerRef.current) {
        markerRef.current.setMap(null);
      }
    };
  }, []);

  useEffect(() => {
    // Update map when coordinates change
    if (mapInstanceRef.current) {
      const position = { lat: latitude, lng: longitude };
      mapInstanceRef.current.setCenter(position);
      
      // Update or create marker
      if (markerRef.current) {
        markerRef.current.setPosition(position);
      } else {
        createMarker(position);
      }
    }
  }, [latitude, longitude]);

  const initializeMap = () => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const position = { lat: latitude, lng: longitude };
    
    mapInstanceRef.current = new google.maps.Map(mapRef.current, {
      center: position,
      zoom: 13,
      mapTypeControl: true,
      streetViewControl: true,
      fullscreenControl: true,
    });

    createMarker(position);
  };

  const createMarker = (position: { lat: number; lng: number }) => {
    if (!mapInstanceRef.current) return;

    markerRef.current = new google.maps.Marker({
      position,
      map: mapInstanceRef.current,
      title: message,
    });

    const infoWindow = new google.maps.InfoWindow({
      content: `
        <div style="padding: 8px;">
          <p style="font-weight: 600; margin-bottom: 4px;">${timestamp}</p>
          <p style="font-size: 14px; color: #666;">${message}</p>
        </div>
      `,
    });

    markerRef.current.addListener('click', () => {
      infoWindow.open(mapInstanceRef.current!, markerRef.current!);
    });
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
