"use client";

import React, { useEffect, useState } from "react";
import { Map, Overlay } from "pigeon-maps";

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
  Worli: [19.002, 72.815], // Worli neighborhood center
  all: [20.5937, 78.9629], // Central India
};

// Coordinate boundaries to simulate the City Boundary Highlight exactly like Zillow State Outline
const cityBoundaries: { [key: string]: [number, number][] } = {
  Mumbai: [
    [19.26, 72.82],
    [19.24, 72.90],
    [19.16, 72.98],
    [18.98, 72.96],
    [18.90, 72.88],
    [18.88, 72.81],
    [18.94, 72.70],
    [19.06, 72.74],
    [19.20, 72.76],
  ],
  Bangalore: [
    [13.12, 77.50],
    [13.14, 77.64],
    [13.06, 77.76],
    [12.90, 77.78],
    [12.80, 77.66],
    [12.82, 77.44],
    [12.98, 77.42],
  ],
  Delhi: [
    [28.84, 77.06],
    [28.82, 77.28],
    [28.68, 77.38],
    [28.48, 77.34],
    [28.42, 77.10],
    [28.50, 76.92],
    [28.74, 76.96],
  ],
  Goa: [
    [15.86, 73.66],
    [15.80, 73.92],
    [15.52, 74.06],
    [15.18, 73.98],
    [15.24, 73.70],
    [15.66, 73.60],
  ],
  Worli: [
    [19.022, 72.812], // North coast (Sea link entry)
    [19.022, 72.816], // Koliwada point
    [19.014, 72.824], // Boundary near Dadar
    [19.002, 72.828], // East boundary near Senapati Bapat Marg
    [18.988, 72.824], // South-east near Racecourse
    [18.980, 72.820], // South-east corner near Racecourse entrance
    [18.976, 72.808], // South-west corner near Haji Ali Dargah
    [18.992, 72.796], // West coast Worli Sea Face
    [19.010, 72.800], // West coast Sea Link
  ],
};

interface BoundaryProps {
  coordinates: [number, number][];
  latLngToPixel?: (latLng: [number, number]) => [number, number];
}

// Custom City Outline Overlay Component
function CityBoundary({ coordinates, latLngToPixel }: BoundaryProps) {
  if (!latLngToPixel || !coordinates || coordinates.length === 0) return null;

  const points = coordinates
    .map((coord) => latLngToPixel(coord))
    .map((pixel) => pixel.join(","))
    .join(" ");

  return (
    <div className="absolute inset-0 pointer-events-none w-full h-full z-0">
      <svg className="w-full h-full absolute inset-0">
        <polygon
          points={points}
          fill="rgba(59, 130, 246, 0.08)"
          stroke="#3b82f6"
          strokeWidth="3"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

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

  // Format short price tag (e.g. ₹6.50 Cr, ₹4.20 Cr) exactly like Zillow's K/M price tags
  const formatShortPrice = (val: number) => {
    if (val >= 10000000) {
      return `₹${(val / 10000000).toFixed(2)} Cr`;
    } else if (val >= 100000) {
      return `₹${(val / 100000).toFixed(0)} L`;
    }
    return `₹${val.toLocaleString("en-IN")}`;
  };

  // Determine initial center and zoom based only on the selected city (remains still on hover)
  const defaultCenter = cityCenters[centerCity] || cityCenters.all;
  const defaultZoom = centerCity === "all" ? 5 : centerCity === "Worli" ? 14 : 12;

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
          {/* City Boundary Polygon Outline */}
          {centerCity !== "all" && cityBoundaries[centerCity] && (
            <CityBoundary coordinates={cityBoundaries[centerCity]} />
          )}

          {/* Zillow-style Price Tag Markers */}
          {properties.map((prop) => {
            const isSelected = selectedProperty?.id === prop.id;
            return (
              <Overlay
                key={prop.id}
                anchor={[prop.lat, prop.lng]}
                offset={[0, 0]}
              >
                <button
                  onClick={() => onSelectProperty(prop)}
                  className={`px-2 py-1 rounded-md text-[9px] font-extrabold shadow-md border transition-all pointer-events-auto ${
                    isSelected
                      ? "bg-blue-600 border-blue-700 text-white scale-110 z-30"
                      : "bg-white border-slate-200 text-slate-800 hover:bg-slate-50 dark:bg-slate-950 dark:border-slate-800 dark:text-white dark:hover:bg-slate-900"
                  }`}
                >
                  {formatShortPrice(prop.price)}
                </button>
              </Overlay>
            );
          })}

          {selectedProperty && (
            <Overlay anchor={[selectedProperty.lat, selectedProperty.lng]} offset={[0, -20]}>
              <div className="p-3 bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-[190px] text-left space-y-2 pointer-events-auto relative z-40">
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
