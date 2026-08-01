"use client";

import React, { useEffect, useState } from "react";
import { Map, Marker, Overlay } from "pigeon-maps";

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

// Default coordinates in India for map viewport centers
const cityCenters: { [key: string]: [number, number] } = {
  Mumbai: [19.03, 72.82],
  Bangalore: [12.96, 77.63],
  Delhi: [28.56, 77.16],
  Goa: [15.59, 73.74],
  all: [20.5937, 78.9629], // Central India
};

export default function CustomMap({ properties, selectedProperty, onSelectProperty, centerCity }: MapProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [mapHeight, setMapHeight] = useState<number>(600);

  // Set isMounted to true on client mount to prevent SSR hydration mismatches
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMounted(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Calculate actual height of the map based on viewport size, preventing layout feedback loops
  useEffect(() => {
    if (!isMounted) return;

    const handleResize = () => {
      // Viewport height minus the navigation and filters header heights (approx 140px)
      const computedHeight = window.innerHeight - 140;
      setMapHeight(Math.max(400, computedHeight));
    };

    // Initial measurement
    handleResize();

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [isMounted]);

  // Format currency helper
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Determine initial center and zoom based only on the selected city (remains still on hover)
  const defaultCenter = cityCenters[centerCity] || cityCenters.all;
  const defaultZoom = centerCity === "all" ? 5 : 12;

  // Change key to force a clean remount ONLY when changing the city filter
  const mapKey = centerCity;

  return (
    <div className="w-full h-full relative overflow-hidden bg-slate-900">
      {isMounted && (
        <Map
          key={mapKey}
          height={mapHeight}
          defaultCenter={defaultCenter}
          defaultZoom={defaultZoom}
        >
          {properties.map((prop) => (
            <Marker
              key={prop.id}
              anchor={[prop.lat, prop.lng]}
              color={selectedProperty?.id === prop.id ? "#3b82f6" : "#ef4444"}
              onClick={() => onSelectProperty(prop)}
            />
          ))}

          {selectedProperty && (
            <Overlay anchor={[selectedProperty.lat, selectedProperty.lng]} offset={[0, -20]}>
              <div className="p-3 bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-[190px] text-left space-y-2 pointer-events-auto relative">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectProperty(null);
                  }}
                  className="absolute top-2 right-2 w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-700 dark:text-slate-300 dark:hover:text-white text-[10px] font-bold flex items-center justify-center transition-colors"
                >
                  ✕
                </button>
                {selectedProperty.images?.[0] && (
                  <img
                    src={selectedProperty.images[0]}
                    alt={selectedProperty.title}
                    className="w-full h-20 object-cover rounded-lg"
                  />
                )}
                <h5 className="font-extrabold text-xs text-slate-900 dark:text-white leading-snug truncate pr-4">{selectedProperty.title}</h5>
                <p className="text-[9px] text-slate-500 dark:text-slate-400 leading-none truncate">{selectedProperty.address}</p>
                <p className="font-black text-blue-600 dark:text-blue-400 text-xs">{formatCurrency(selectedProperty.price)}</p>
              </div>
            </Overlay>
          )}
        </Map>
      )}
    </div>
  );
}
