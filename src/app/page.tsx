"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Search, MapPin, Calculator, TrendingUp, Key, Sparkles, Building, Phone, ArrowRight } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getCombinedListings } from "@/data/listingsHelper";

export default function Home() {
  const router = useRouter();
  
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchCity, setSearchCity] = useState("all");
  const [searchType, setSearchType] = useState("buy");

  // Valuation Estimator state
  const [estSqft, setEstSqft] = useState(1500);
  const [estCity, setEstCity] = useState("Mumbai");
  const [estBeds, setEstBeds] = useState(3);
  const [estCondition, setEstCondition] = useState("premium");
  const [valuationResult, setValuationResult] = useState<number | null>(null);

  // Mortgage Calculator state
  const [homePrice, setHomePrice] = useState(50000000); // 5 Cr
  const [downPaymentPercent, setDownPaymentPercent] = useState(20);
  const [interestRate, setInterestRate] = useState(8.5);
  const [loanTermYears, setLoanTermYears] = useState(20);

  // Dynamic listings state
  const [listings, setListings] = useState<any[]>([]);

  React.useEffect(() => {
    setListings(getCombinedListings());
  }, []);

  // Handle Search Submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let url = `/search?type=${searchType}`;
    if (searchQuery) url += `&query=${encodeURIComponent(searchQuery)}`;
    if (searchCity !== "all") url += `&city=${encodeURIComponent(searchCity)}`;
    router.push(url);
  };

  // Zestimate Calculation Formula
  const calculateValuation = () => {
    // Realistic base prices per sqft in India
    let basePricePerSqft = 10000; // default (e.g. Bangalore/Suburbs)
    if (estCity === "Mumbai") basePricePerSqft = 22000;
    else if (estCity === "Delhi") basePricePerSqft = 16000;
    else if (estCity === "Goa") basePricePerSqft = 12000;

    let multiplier = 1.0;
    if (estCondition === "luxury") multiplier = 1.4;
    else if (estCondition === "premium") multiplier = 1.15;
    else if (estCondition === "standard") multiplier = 0.95;

    const bedsBonus = estBeds * 200000; // 2 Lakh extra per bed
    const totalEstimate = estSqft * basePricePerSqft * multiplier + bedsBonus;
    setValuationResult(Math.round(totalEstimate));
  };

  // Mortgage Payment Calculation Formula
  // M = P * [i * (1 + i)^n] / [(1 + i)^n - 1]
  const calculateMonthlyPayment = () => {
    const principal = homePrice * (1 - downPaymentPercent / 100);
    const monthlyRate = interestRate / 12 / 100;
    const numberOfPayments = loanTermYears * 12;

    if (monthlyRate === 0) return principal / numberOfPayments;

    const monthlyPayment =
      (principal * (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments))) /
      (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
    
    return isNaN(monthlyPayment) ? 0 : Math.round(monthlyPayment);
  };

  const monthlyPayment = calculateMonthlyPayment();
  const downPaymentAmount = Math.round(homePrice * (downPaymentPercent / 100));
  const loanAmount = homePrice - downPaymentAmount;

  // Format currency helper
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Curated list of 3 featured properties
  const featuredListings = listings.slice(0, 3);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090d16] flex flex-col font-sans transition-colors duration-300">
      <Header />

      {/* Hero Section */}
      <section className="relative h-[85vh] min-h-[600px] flex items-center justify-center bg-slate-900 overflow-hidden pt-16">
        {/* Background Image Overlay */}
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1920&q=80')] bg-cover bg-center opacity-40 mix-blend-overlay"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent"></div>

        <div className="relative max-w-5xl mx-auto px-6 text-center z-10 space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-4"
          >
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest">
              <Sparkles className="h-3 w-3" /> Real Estate Reimagined
            </span>
            <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight leading-tight">
              Discover Your Spire Home
            </h1>
            <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto font-light leading-relaxed">
              Find verified luxury apartments, houses, and penthouses in India&apos;s prime metropolitan enclaves.
            </p>
          </motion.div>

          {/* Search Box */}
          <motion.form
            onSubmit={handleSearchSubmit}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="bg-white/95 dark:bg-slate-900/95 p-4 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-2xl flex flex-col md:flex-row gap-3 items-center backdrop-blur-md max-w-4xl mx-auto"
          >
            {/* Buy / Rent Switch */}
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-full w-full md:w-auto">
              <button
                type="button"
                onClick={() => setSearchType("buy")}
                className={`flex-1 md:flex-none px-6 py-2 rounded-full text-xs font-bold tracking-wider uppercase transition-all ${
                  searchType === "buy"
                    ? "bg-blue-600 text-white shadow-md"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                }`}
              >
                Buy
              </button>
              <button
                type="button"
                onClick={() => setSearchType("rent")}
                className={`flex-1 md:flex-none px-6 py-2 rounded-full text-xs font-bold tracking-wider uppercase transition-all ${
                  searchType === "rent"
                    ? "bg-blue-600 text-white shadow-md"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                }`}
              >
                Rent
              </button>
            </div>

            {/* City Selector */}
            <div className="w-full md:w-44 border-r border-slate-200 dark:border-slate-800 pr-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest text-left pl-3 mb-1">
                Select City
              </label>
              <select
                value={searchCity}
                onChange={(e) => setSearchCity(e.target.value)}
                className="w-full bg-transparent text-sm font-semibold text-slate-800 dark:text-slate-100 border-none outline-none focus:ring-0 cursor-pointer"
              >
                <option value="all" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">All India</option>
                <option value="Mumbai" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Mumbai</option>
                <option value="Bangalore" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Bangalore</option>
                <option value="Delhi" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Delhi NCR</option>
                <option value="Goa" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Goa</option>
              </select>
            </div>

            {/* Address Search */}
            <div className="flex-1 w-full flex items-center gap-2 pl-3">
              <Search className="h-5 w-5 text-slate-400 flex-shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search neighborhood, project, or key stats..."
                className="w-full bg-transparent border-none text-sm font-medium outline-none text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:ring-0"
              />
            </div>

            <button
              type="submit"
              className="w-full md:w-auto px-8 py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm tracking-wide transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2"
            >
              Search
            </button>
          </motion.form>
        </div>
      </section>

      {/* Featured Properties Grid */}
      <section className="py-24 max-w-7xl mx-auto px-6 w-full">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12">
          <div className="space-y-2">
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Featured Luxury Listings
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-lg font-light leading-relaxed">
              Carefully curated signature properties showcasing state-of-the-art architectures and premium finishes.
            </p>
          </div>
          <Link
            href="/search"
            className="group mt-4 md:mt-0 text-sm font-bold text-blue-600 flex items-center gap-1.5 hover:gap-2.5 transition-all"
          >
            View All Properties <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {featuredListings.map((prop, idx) => (
            <motion.div
              key={prop.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-200/50 dark:border-slate-800/50 shadow-xl group hover:shadow-2xl transition-all hover:scale-[1.01]"
            >
              {/* Image Carousel Mock */}
              <div className="relative h-64 overflow-hidden bg-slate-100">
                <img
                  src={prop.images[0]}
                  alt={prop.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-slate-950/60 backdrop-blur-md border border-white/10 text-white text-[10px] font-black uppercase tracking-widest">
                  {prop.type}
                </div>
                <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                  <div className="bg-slate-950/70 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/5">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Price</p>
                    <p className="text-sm font-black text-white">{formatCurrency(prop.price)}</p>
                  </div>
                </div>
              </div>

              {/* Text Info */}
              <div className="p-6 space-y-4">
                <div className="space-y-1">
                  <h3 className="font-extrabold text-lg text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                    {prop.title}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <MapPin className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
                    <span className="truncate">{prop.address}, {prop.city}</span>
                  </div>
                </div>

                {/* Specs */}
                <div className="grid grid-cols-3 gap-2 py-3 border-t border-b border-slate-100 dark:border-slate-800 text-center">
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Beds</p>
                    <p className="text-sm font-extrabold text-slate-800 dark:text-slate-100">{prop.beds}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Baths</p>
                    <p className="text-sm font-extrabold text-slate-800 dark:text-slate-100">{prop.baths}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Area</p>
                    <p className="text-sm font-extrabold text-slate-800 dark:text-slate-100">{prop.sqft} sqft</p>
                  </div>
                </div>

                {/* View Details CTA */}
                <Link
                  href={`/properties/${prop.id}`}
                  className="w-full py-3 rounded-2xl bg-slate-50 hover:bg-blue-50 text-slate-900 hover:text-blue-600 dark:bg-slate-800 dark:hover:bg-blue-950/30 dark:text-slate-200 dark:hover:text-blue-400 font-bold text-xs tracking-wider uppercase text-center block transition-all border border-slate-200/40 dark:border-slate-850"
                >
                  View Details
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Estimator (Zestimate-like) Section */}
      <section id="estimator" className="py-24 bg-white dark:bg-[#0c1220] border-t border-b border-slate-200/40 dark:border-slate-900/40">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest">
              <TrendingUp className="h-3.5 w-3.5" /> Spire Estimate Engine
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
              Get an instant valuation estimate for any property
            </h2>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed font-light text-base">
              Wondering how much your home is worth? Or verifying the pricing of a listing you saw? Enter the parameters below and our simulated &quot;Zestimate&quot; engine will calculate the automated current valuation model.
            </p>
            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="flex gap-3">
                <div className="p-3 rounded-xl bg-blue-600/10 text-blue-500 h-fit"><Building className="h-5 w-5" /></div>
                <div>
                  <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">Granular Models</h4>
                  <p className="text-xs text-slate-500">Formulated on region-specific land valuations.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="p-3 rounded-xl bg-emerald-600/10 text-emerald-500 h-fit"><Calculator className="h-5 w-5" /></div>
                <div>
                  <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">Smart Auto-Calculation</h4>
                  <p className="text-xs text-slate-500">Estimates adjust dynamically to size & quality specs.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Calculator Widget */}
          <div className="bg-slate-50 dark:bg-slate-900 p-8 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-2xl space-y-6">
            <h3 className="font-extrabold text-xl text-slate-900 dark:text-white tracking-tight">Valuation Calculator</h3>

            <div className="space-y-4">
              {/* City Selection */}
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">City Location</label>
                <select
                  value={estCity}
                  onChange={(e) => setEstCity(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-3.5 rounded-xl text-sm font-semibold text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500/25 outline-none transition-all cursor-pointer"
                >
                  <option value="Mumbai">Mumbai (Worli/Bandra average)</option>
                  <option value="Bangalore">Bangalore (Indiranagar/Koramangala average)</option>
                  <option value="Delhi">Delhi NCR average</option>
                  <option value="Goa">Goa (Anjuna/Baga average)</option>
                </select>
              </div>

              {/* Area size slider */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Built-up Area</label>
                  <span className="text-xs font-black text-blue-600">{estSqft} sqft</span>
                </div>
                <input
                  type="range"
                  min="500"
                  max="8000"
                  step="50"
                  value={estSqft}
                  onChange={(e) => setEstSqft(parseInt(e.target.value))}
                  className="w-full accent-blue-600 cursor-ew-resize"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Bedrooms */}
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Bedrooms</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={estBeds}
                    onChange={(e) => setEstBeds(parseInt(e.target.value))}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-3.5 rounded-xl text-sm font-semibold text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500/25 outline-none transition-all"
                  />
                </div>
                {/* Quality/Condition */}
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Quality / Finish</label>
                  <select
                    value={estCondition}
                    onChange={(e) => setEstCondition(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-3.5 rounded-xl text-sm font-semibold text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500/25 outline-none transition-all cursor-pointer"
                  >
                    <option value="luxury">Ultra-Luxury</option>
                    <option value="premium">Premium Designer</option>
                    <option value="standard">Standard Finished</option>
                  </select>
                </div>
              </div>

              {/* Estimate Button */}
              <button
                type="button"
                onClick={calculateValuation}
                className="w-full py-4 rounded-xl bg-slate-950 hover:bg-slate-900 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-extrabold text-xs tracking-wider uppercase transition-colors"
              >
                Calculate Spire Estimate
              </button>

              {/* Valuation Result display */}
              {valuationResult !== null && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-5 rounded-2xl bg-blue-600/10 border border-blue-500/20 text-center space-y-1.5"
                >
                  <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Spire Value Estimate</p>
                  <h4 className="text-2xl md:text-3xl font-extrabold text-blue-600 dark:text-blue-400">
                    {formatCurrency(valuationResult)}
                  </h4>
                  <p className="text-[9px] text-slate-500 dark:text-slate-400">
                    Estimated range: {formatCurrency(valuationResult * 0.95)} - {formatCurrency(valuationResult * 1.05)}
                  </p>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Mortgage Calculator Section */}
      <section id="mortgage-calculator" className="py-24 max-w-7xl mx-auto px-6 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Card calculations */}
          <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-2xl order-2 lg:order-1 space-y-6">
            <h3 className="font-extrabold text-xl text-slate-900 dark:text-white tracking-tight">Mortgage Estimator</h3>
            
            <div className="space-y-4">
              {/* Home Price Input */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Property Value</label>
                  <span className="text-xs font-black text-blue-600">{formatCurrency(homePrice)}</span>
                </div>
                <input
                  type="range"
                  min="2000000"
                  max="200000000"
                  step="1000000"
                  value={homePrice}
                  onChange={(e) => setHomePrice(parseInt(e.target.value))}
                  className="w-full accent-blue-600 cursor-ew-resize"
                />
              </div>

              {/* Down Payment slider */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Down Payment</label>
                  <span className="text-xs font-black text-slate-800 dark:text-white">
                    {downPaymentPercent}% ({formatCurrency(downPaymentAmount)})
                  </span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="80"
                  step="5"
                  value={downPaymentPercent}
                  onChange={(e) => setDownPaymentPercent(parseInt(e.target.value))}
                  className="w-full accent-blue-600 cursor-ew-resize"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Interest Rate */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Interest Rate</label>
                    <span className="text-xs font-bold text-blue-600">{interestRate}%</span>
                  </div>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    step="0.1"
                    value={interestRate}
                    onChange={(e) => setInterestRate(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-3 rounded-xl text-sm font-semibold text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500/25 outline-none transition-all"
                  />
                </div>

                {/* Term */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Loan Term</label>
                    <span className="text-xs font-bold text-blue-600">{loanTermYears} Years</span>
                  </div>
                  <select
                    value={loanTermYears}
                    onChange={(e) => setLoanTermYears(parseInt(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-3 rounded-xl text-sm font-semibold text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500/25 outline-none transition-all cursor-pointer"
                  >
                    <option value={10}>10 Years</option>
                    <option value={15}>15 Years</option>
                    <option value={20}>20 Years</option>
                    <option value={30}>30 Years</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Calculations break out */}
            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 flex flex-col items-center justify-center text-center">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Monthly Mortgage Payment</p>
              <h4 className="text-3xl font-black text-slate-900 dark:text-white">{formatCurrency(monthlyPayment)}</h4>
              <div className="w-full border-t border-slate-200 dark:border-slate-800 my-4"></div>
              <div className="grid grid-cols-2 gap-8 text-left w-full text-xs">
                <div>
                  <span className="text-slate-400 font-medium">Principal & Interest</span>
                  <p className="font-extrabold text-slate-800 dark:text-white">{formatCurrency(monthlyPayment)}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Total Loan Amount</span>
                  <p className="font-extrabold text-slate-800 dark:text-white">{formatCurrency(loanAmount)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Calculator explanations */}
          <div className="space-y-6 order-1 lg:order-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-widest">
              <Key className="h-3.5 w-3.5" /> Mortgage Analytics
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
              Detailed financial estimations, optimized
            </h2>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed font-light text-base">
              Calculate your budget easily by understanding exactly how down payments, property price, and interest rates affect your ongoing monthly outlays. The calculator uses standard mathematical loan amortization models.
            </p>
            <div className="flex gap-4">
              <div className="p-3 rounded-xl bg-blue-600/10 text-blue-500 h-fit"><Phone className="h-5 w-5" /></div>
              <div className="space-y-1">
                <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">Connect with our Agents</h4>
                <p className="text-xs text-slate-500 max-w-sm">Ready to buy? Our agents can put you in touch with leading mortgage consultants in India for low interest rate lock-ins.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
