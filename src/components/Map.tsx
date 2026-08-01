"use client";

import React, { useEffect, useState } from "react";
import { GoogleMap, useJsApiLoader, MarkerF, InfoWindowF } from "@react-google-maps/api";
import { MapPin } from "lucide-react";

interface Property {
  id: string;
  title: string;
  price: number;
  address: string;
  city: string;
  beds: number;
  baths: number;
  sqft: number;
  lat: number;
  lng: number;
  images: string[];
  type: string;
  description: string;
  features: string[];
  zestimate: number;
}

interface MapProps {
  properties: Property[];
  selectedProperty: Property | null;
  onSelectProperty: (property: Property | null) => void;
  centerCity: string;
}

const mapContainerStyle = {
  width: "100%",
  height: "100%",
};

// Default coordinates in India
const cityCenters: { [key: string]: { lat: number; lng: number } } = {
  Mumbai: { lat: 19.03, lng: 72.82 },
  Bangalore: { lat: 12.96, lng: 77.63 },
  Delhi: { lat: 28.56, lng: 77.16 },
  Goa: { lat: 15.59, lng: 73.74 },
  all: { lat: 18.99, lng: 75.0 }, // Central India
};

export default function Map({ properties, selectedProperty, onSelectProperty, centerCity }: MapProps) {
  // Read API Key from env
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
  
  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: apiKey,
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);

  // Pan to active property if parent selects a property (e.g. from card click)
  useEffect(() => {
    if (selectedProperty && map) {
      map.panTo({ lat: selectedProperty.lat, lng: selectedProperty.lng });
      map.setZoom(14);
    }
  }, [selectedProperty, map]);

  // Pan to center of city when user switches filters
  useEffect(() => {
    if (map && centerCity) {
      const center = cityCenters[centerCity] || cityCenters.all;
      map.panTo(center);
      map.setZoom(centerCity === "all" ? 6 : 12);
    }
  }, [centerCity, map]);

  const onLoad = React.useCallback((mapInstance: google.maps.Map) => {
    setMap(mapInstance);
  }, []);

  const onUnmount = React.useCallback(() => {
    setMap(null);
  }, []);

  // Format currency helper
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  // If there is no API key, display a beautiful placeholder map that displays properties mock locations
  if (!apiKey || loadError) {
    return (
      <div className="w-full h-full bg-slate-900 border border-slate-800 flex flex-col items-center justify-center p-6 text-center space-y-4 relative overflow-hidden">
        {/* Mock Map Background Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:30px_30px] opacity-30"></div>
        
        {/* Glow effect */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full bg-blue-600/10 blur-[80px] pointer-events-none"></div>

        <div className="relative z-10 space-y-3 max-w-sm">
          <div className="mx-auto w-12 h-12 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 flex items-center justify-center">
            <MapPin className="h-6 w-6 animate-bounce" />
          </div>
          <h4 className="font-extrabold text-white text-base">Google Maps API Setup Required</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            This map will display listing pins on Google Maps. Add your API key to `.env.local` to render:
          </p>
          <div className="bg-black/40 border border-white/5 rounded-xl p-3 font-mono text-[10px] text-emerald-400 select-all text-left">
            {'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="your_api_key_here"'}
          </div>
        </div>

        {/* Visual mock showing listings pins */}
        <div className="relative z-10 w-full max-w-sm bg-slate-950/70 border border-white/5 rounded-2xl p-4 text-left space-y-3 backdrop-blur-md">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active Search Markers ({properties.length})</p>
          <div className="max-h-36 overflow-y-auto space-y-2 pr-1">
            {properties.map((p) => (
              <div 
                key={p.id}
                onClick={() => onSelectProperty(p)}
                className={`p-2 rounded-xl border text-[11px] flex justify-between items-center cursor-pointer transition-all ${
                  selectedProperty?.id === p.id 
                    ? "bg-blue-600/20 border-blue-500 text-white" 
                    : "bg-slate-900/50 border-white/5 text-slate-300 hover:bg-slate-900"
                }`}
              >
                <span className="font-bold truncate max-w-[180px]">{p.title}</span>
                <span className="font-mono text-emerald-400 font-extrabold">{formatCurrency(p.price)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // If loading Google Maps script
  if (!isLoaded) {
    return (
      <div className="w-full h-full bg-slate-900 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-slate-700 border-t-blue-500 animate-spin"></div>
      </div>
    );
  }

  const mapCenter = centerCity ? (cityCenters[centerCity] || cityCenters.all) : cityCenters.all;

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      center={mapCenter}
      zoom={centerCity === "all" ? 6 : 12}
      onLoad={onLoad}
      onUnmount={onUnmount}
      options={{
        styles: darkMapStyles, // Apply sleek, dark UI styles to the Google map
        mapTypeControl: false,
        streetViewControl: false,
      }}
    >
      {properties.map((prop) => (
        <MarkerF
          key={prop.id}
          position={{ lat: prop.lat, lng: prop.lng }}
          onClick={() => {
            onSelectProperty(prop);
          }}
          icon={{
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: selectedProperty?.id === prop.id ? "#2563eb" : "#ef4444",
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 1.5,
            scale: 8,
          }}
        />
      ))}

      {selectedProperty && (
        <InfoWindowF
          position={{ lat: selectedProperty.lat, lng: selectedProperty.lng }}
          onCloseClick={() => {
            onSelectProperty(null);
          }}
        >
          <div className="p-2 text-slate-900 font-sans max-w-[180px] space-y-1.5">
            {selectedProperty.images?.[0] && (
              <img
                src={selectedProperty.images[0]}
                alt={selectedProperty.title}
                className="w-full h-20 object-cover rounded-lg"
              />
            )}
            <h5 className="font-extrabold text-xs leading-snug truncate">{selectedProperty.title}</h5>
            <p className="text-[10px] text-slate-500 leading-none truncate">{selectedProperty.address}</p>
            <p className="font-black text-blue-600 text-xs">{formatCurrency(selectedProperty.price)}</p>
          </div>
        </InfoWindowF>
      )}
    </GoogleMap>
  );
}

// Sleek dark-mode styling config for Google Maps
const darkMapStyles = [
  { elementType: "geometry", stylers: [{ color: "#1e293b" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#1e293b" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#64748b" }] },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#94a3b8" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#64748b" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#0f172a" }],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [{ color: "#64748b" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#334155" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#1e293b" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#64748b" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#475569" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#1e293b" }],
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [{ color: "#94a3b8" }],
  },
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#1e293b" }],
  },
  {
    featureType: "transit.station",
    elementType: "labels.text.fill",
    stylers: [{ color: "#64748b" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#0f172a" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#475569" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.stroke",
    stylers: [{ color: "#0f172a" }],
  },
];
