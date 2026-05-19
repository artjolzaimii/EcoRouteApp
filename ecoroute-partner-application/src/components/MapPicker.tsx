import { useCallback, useEffect, useRef, useState } from "react";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";

const MAPS_KEY = (import.meta.env.VITE_GOOGLE_MAPS_KEY as string | undefined) ?? "";
const DEFAULT_CENTER = { lat: 52.3676, lng: 4.9041 }; // Amsterdam fallback

interface Props {
  onLocationChange: (lat: number, lng: number, address: string) => void;
}

export default function MapPicker({ onLocationChange }: Props) {
  const { isLoaded } = useJsApiLoader({ googleMapsApiKey: MAPS_KEY });
  const [center, setCenter] = useState<google.maps.LatLngLiteral>(DEFAULT_CENTER);
  const [markerPos, setMarkerPos] = useState<google.maps.LatLngLiteral | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);

  useEffect(() => {
    if (!isLoaded) return;
    navigator.geolocation?.getCurrentPosition(
      (pos) => setCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
    );
  }, [isLoaded]);

  const reverseGeocode = useCallback(
    (pos: google.maps.LatLngLiteral) => {
      if (!geocoderRef.current) geocoderRef.current = new google.maps.Geocoder();
      geocoderRef.current.geocode({ location: pos }, (results, status) => {
        const address = status === "OK" && results?.[0] ? results[0].formatted_address : "";
        onLocationChange(pos.lat, pos.lng, address);
      });
    },
    [onLocationChange],
  );

  const handleMapClick = useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (!e.latLng) return;
      const pos = { lat: e.latLng.lat(), lng: e.latLng.lng() };
      setMarkerPos(pos);
      reverseGeocode(pos);
    },
    [reverseGeocode],
  );

  const handleDragEnd = useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (!e.latLng) return;
      const pos = { lat: e.latLng.lat(), lng: e.latLng.lng() };
      setMarkerPos(pos);
      reverseGeocode(pos);
    },
    [reverseGeocode],
  );

  if (!isLoaded) {
    return (
      <div className="w-full h-64 bg-gray-100 rounded-xl flex items-center justify-center text-sm text-gray-400">
        Loading map…
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <GoogleMap
        mapContainerClassName="w-full h-64 rounded-xl overflow-hidden border border-gray-200"
        center={center}
        zoom={13}
        onClick={handleMapClick}
        options={{
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
          zoomControlOptions: { position: google.maps.ControlPosition.RIGHT_CENTER },
        }}
      >
        {markerPos && (
          <Marker position={markerPos} draggable onDragEnd={handleDragEnd} />
        )}
      </GoogleMap>
      {!markerPos && (
        <p className="text-xs text-gray-400 text-center">
          Click anywhere on the map to drop your pin
        </p>
      )}
    </div>
  );
}
