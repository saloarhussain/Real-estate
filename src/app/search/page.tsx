"use client";

import React, { useState, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Grid, Bed, Bath, ArrowUpRight, Search as SearchIcon, X } from "lucide-react";
import Map from "@/components/Map";
import listingsData from "@/data/listings.json";

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

function SearchContent() {
  const searchParams = useSearchParams();

  // Initial values from query string
  const initialCity = searchParams.get("city") || "all";
  const initialQuery = searchParams.get("query") || "";

  // Core filter states
  const [city, setCity] = useState(initialCity);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [maxPrice, setMaxPrice] = useState<number>(150000000); // 15 Cr max
  const [minBeds, setMinBeds] = useState<number>(0);
  const [propType, setPropType] = useState<string>("all");

  // Selection states for map interaction
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  // View state (mobile toggle between list and map)
  const [showMobileMap, setShowMobileMap] = useState(false);

  // Filter listings dynamically using useMemo (avoiding setState in useEffect cascading renders)
  const filteredProperties = useMemo(() => {
    let listings = listingsData as Property[];

    // 1. Filter by City
    if (city !== "all") {
      listings = listings.filter((p) => p.city.toLowerCase() === city.toLowerCase());
    }

    // 2. Filter by search query text (match title, address, description)
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      listings = listings.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.address.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      );
    }

    // 3. Filter by Max Price
    listings = listings.filter((p) => p.price <= maxPrice);

    // 4. Filter by Minimum Bedrooms
    if (minBeds > 0) {
      listings = listings.filter((p) => p.beds >= minBeds);
    }

    // 5. Filter by Property Type
    if (propType !== "all") {
      listings = listings.filter((p) => p.type.toLowerCase() === propType.toLowerCase());
    }

    return listings;
  }, [city, searchQuery, maxPrice, minBeds, propType]);

  // Format currency helper
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden pt-16 bg-white dark:bg-[#090d16]">
      {/* Search Header Panel */}
      <section className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200/50 dark:border-slate-800/50 py-4 px-6 z-20 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-3 items-center w-full md:w-auto">
          {/* Search bar inside header */}
          <div className="flex items-center gap-2 bg-white dark:bg-slate-950 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-850 flex-1 md:w-80">
            <SearchIcon className="h-4 w-4 text-slate-400 flex-shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search address, listing name..."
              className="bg-transparent border-none text-xs outline-none focus:ring-0 text-slate-800 dark:text-white placeholder-slate-400 w-full"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="text-slate-400 hover:text-slate-600">
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* City Select */}
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-800 dark:text-white outline-none cursor-pointer"
          >
            <option value="all">All India</option>
            <option value="Mumbai">Mumbai</option>
            <option value="Bangalore">Bangalore</option>
            <option value="Delhi">Delhi NCR</option>
            <option value="Goa">Goa</option>
          </select>

          {/* Property Type Select */}
          <select
            value={propType}
            onChange={(e) => setPropType(e.target.value)}
            className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-800 dark:text-white outline-none cursor-pointer"
          >
            <option value="all">All Types</option>
            <option value="Penthouse">Penthouse</option>
            <option value="Villa">Villa</option>
            <option value="Apartment">Apartment</option>
          </select>
        </div>

        {/* Sliders & Numeric Filters */}
        <div className="flex flex-wrap gap-4 items-center w-full md:w-auto justify-between md:justify-end">
          {/* Max Price slider */}
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Max Price</span>
            <div className="flex flex-col">
              <input
                type="range"
                min="20000000" // 2 Cr
                max="150000000" // 15 Cr
                step="10000000" // 1 Cr
                value={maxPrice}
                onChange={(e) => setMaxPrice(parseInt(e.target.value))}
                className="w-32 accent-blue-600 cursor-ew-resize"
              />
              <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 text-right">
                {formatCurrency(maxPrice)}
              </span>
            </div>
          </div>

          {/* Beds filter switches */}
          <div className="flex items-center gap-1.5 bg-white dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-850">
            <button
              onClick={() => setMinBeds(0)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${
                minBeds === 0 ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" : "text-slate-500"
              }`}
            >
              Any Beds
            </button>
            {[2, 3, 4].map((num) => (
              <button
                key={num}
                onClick={() => setMinBeds(num)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${
                  minBeds === num ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" : "text-slate-500"
                }`}
              >
                {num}+
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Main Split Pane Layout */}
      <div className="flex flex-1 relative overflow-hidden">
        
        {/* Left Side: Interactive Map */}
        <div
          className={`absolute md:relative inset-0 md:w-1/2 lg:w-3/5 h-full transition-all duration-300 z-10 ${
            showMobileMap ? "translate-x-0" : "translate-x-full md:translate-x-0"
          }`}
        >
          <Map
            properties={filteredProperties}
            selectedProperty={selectedProperty}
            onSelectProperty={setSelectedProperty}
            centerCity={city}
          />
        </div>

        {/* Right Side: Properties List Grid */}
        <div className="w-full md:w-1/2 lg:w-2/5 h-full overflow-y-auto bg-white dark:bg-[#090d16] p-6 space-y-6">
          <div className="flex justify-between items-center">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
              Found <span className="text-blue-600 font-extrabold">{filteredProperties.length}</span> matching properties
            </p>
            {filteredProperties.length === 0 && (
              <button
                onClick={() => {
                  setCity("all");
                  setSearchQuery("");
                  setMaxPrice(150000000);
                  setMinBeds(0);
                  setPropType("all");
                }}
                className="text-xs font-bold text-blue-600 hover:underline"
              >
                Reset Filters
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-6 pb-24">
            <AnimatePresence mode="popLayout">
              {filteredProperties.map((prop) => (
                <motion.div
                  key={prop.id}
                  layout
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  onMouseEnter={() => setSelectedProperty(prop)}
                  className={`bg-white dark:bg-slate-900 rounded-2xl border overflow-hidden transition-all shadow-md group hover:shadow-xl cursor-pointer ${
                    selectedProperty?.id === prop.id
                      ? "border-blue-500 ring-2 ring-blue-500/10"
                      : "border-slate-200/50 dark:border-slate-800/50"
                  }`}
                >
                  <Link href={`/properties/${prop.id}`} className="flex flex-col sm:flex-row h-full">
                    {/* Thumbnail Image */}
                    <div className="w-full sm:w-44 h-48 sm:h-auto overflow-hidden relative bg-slate-100 flex-shrink-0">
                      <img
                        src={prop.images[0]}
                        alt={prop.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-3 left-3 px-2 py-0.5 rounded-full bg-slate-950/60 backdrop-blur-sm text-[8px] font-black text-white uppercase tracking-widest">
                        {prop.type}
                      </div>
                    </div>

                    {/* Details Info */}
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-1">
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="font-extrabold text-sm text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors leading-snug">
                            {prop.title}
                          </h4>
                          <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all flex-shrink-0" />
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-blue-500" /> {prop.address}, {prop.city}
                        </p>
                      </div>

                      {/* Info Row */}
                      <div className="flex gap-4 items-center text-[11px] font-medium text-slate-600 dark:text-slate-300">
                        <span className="flex items-center gap-1"><Bed className="h-3.5 w-3.5 text-slate-400" /> {prop.beds} Beds</span>
                        <span className="flex items-center gap-1"><Bath className="h-3.5 w-3.5 text-slate-400" /> {prop.baths} Baths</span>
                        <span className="font-mono">{prop.sqft} sqft</span>
                      </div>

                      {/* Bottom row: Zestimate and Price */}
                      <div className="flex justify-between items-end pt-3 border-t border-slate-100 dark:border-slate-800">
                        <div>
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Spire Estimate</p>
                          <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                            {formatCurrency(prop.zestimate)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Price</p>
                          <p className="text-sm font-black text-blue-600 dark:text-blue-400">
                            {formatCurrency(prop.price)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Floating Toggle Button for Mobile View */}
      <button
        onClick={() => setShowMobileMap(!showMobileMap)}
        className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-30 inline-flex items-center gap-2 px-6 py-3 rounded-full bg-slate-900/90 backdrop-blur-md hover:bg-slate-950 text-white font-bold text-xs tracking-wider uppercase shadow-xl"
      >
        {showMobileMap ? (
          <>
            <Grid className="h-4 w-4" /> List View
          </>
        ) : (
          <>
            <MapPin className="h-4 w-4" /> Map View
          </>
        )}
      </button>
    </div>
  );
}

export default function Search() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white dark:bg-[#090d16] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-slate-700 border-t-blue-500 animate-spin"></div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
