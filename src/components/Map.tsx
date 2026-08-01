"use client";

import React, { useEffect, useState, useRef } from "react";
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
  const [prevCenterCity, setPrevCenterCity] = useState(centerCity);
  const [prevSelectedProperty, setPrevSelectedProperty] = useState(selectedProperty);

  const [center, setCenter] = useState<[number, number]>(cityCenters.all);
  const [zoom, setZoom] = useState(5);

  const [mapHeight, setMapHeight] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Measure actual height of the container DOM element dynamically using ResizeObserver
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver(() => {
      if (containerRef.current) {
        setMapHeight(containerRef.current.clientHeight || 500);
      }
    });

    observer.observe(containerRef.current);
    return () => {
      observer.disconnect();
    };
  }, []);

  // Sync centerCity prop change during render
  if (centerCity !== prevCenterCity) {
    setPrevCenterCity(centerCity);
    const cityCenter = cityCenters[centerCity] || cityCenters.all;
    setCenter(cityCenter);
    setZoom(centerCity === "all" ? 5 : 12);
  }

  // Sync selectedProperty prop change during render
  if (selectedProperty !== prevSelectedProperty) {
    setPrevSelectedProperty(selectedProperty);
    if (selectedProperty) {
      setCenter([selectedProperty.lat, selectedProperty.lng]);
      setZoom(14);
    }
  }

  // Format currency helper
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div ref={containerRef} className="w-full h-full relative overflow-hidden bg-slate-900">
      {mapHeight > 0 && (
        <Map
          height={mapHeight}
          center={center}
          zoom={zoom}
          onBoundsChanged={({ center: newCenter, zoom: newZoom }) => {
            const isCenterDifferent = Math.abs(newCenter[0] - center[0]) > 0.0001 || 
                                      Math.abs(newCenter[1] - center[1]) > 0.0001;
            const isZoomDifferent = newZoom !== zoom;
            if (isCenterDifferent || isZoomDifferent) {
              setCenter(newCenter);
              setZoom(newZoom);
            }
          }}
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
