"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { 
  ArrowLeft, MapPin, Bed, Bath, LayoutGrid, Calendar, 
  Calculator, Sparkles, Send, CheckCircle2, ShieldCheck, Mail, Phone 
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import listingsData from "@/data/listings.json";

interface Property {
  id: string;
  title: string;
  price: number;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  beds: number;
  baths: number;
  sqft: number;
  type: string;
  yearBuilt: number;
  lat: number;
  lng: number;
  images: string[];
  description: string;
  features: string[];
  zestimate: number;
  agent: {
    name: string;
    phone: string;
    email: string;
    image: string;
  };
}

export default function PropertyDetails() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  // Load listing detail data on the fly (avoiding setState in useEffect cascading renders)
  const property = useMemo(() => {
    return (listingsData.find((p) => p.id === id) as Property) || null;
  }, [id]);

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const activeImage = selectedImage ?? property?.images[0] ?? "";

  // Lead form states
  const [leadName, setLeadName] = useState("");
  const [leadPhone, setLeadPhone] = useState("");
  const [leadEmail, setLeadEmail] = useState("");
  
  const defaultMessage = useMemo(() => {
    return property 
      ? `Hi, I am interested in viewing your listing "${property.title}" (${property.address}). Please contact me at your earliest convenience.`
      : "";
  }, [property]);

  const [customMessage, setCustomMessage] = useState<string | null>(null);
  const leadMessage = customMessage ?? defaultMessage;
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Mortgage Calculator states (allow override of default property price)
  const [priceOverride, setPriceOverride] = useState<number | null>(null);
  const homePrice = priceOverride ?? property?.price ?? 0;
  const [downPaymentPercent, setDownPaymentPercent] = useState(20);
  const [interestRate, setInterestRate] = useState(8.5);
  const [loanTermYears, setLoanTermYears] = useState(20);

  if (!property) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#090d16] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-slate-700 border-t-blue-500 animate-spin"></div>
      </div>
    );
  }

  // Currency Formatter
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Lead Submit Handler
  const handleLeadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadName || !leadEmail) return;

    setIsSubmitted(true);
    
    // Play confetti explosion for premium UX
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  // Calculate Monthly Amortized Payments
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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090d16] flex flex-col font-sans transition-colors duration-300">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto px-6 py-24 w-full space-y-10">
        
        {/* Back Link */}
        <Link 
          href="/search" 
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-blue-600 transition-colors w-fit"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Search Map
        </Link>

        {/* Title Header Section */}
        <section className="flex flex-col md:flex-row justify-between items-start gap-4">
          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full bg-blue-600/10 border border-blue-500/20 text-blue-500 text-[10px] font-black uppercase tracking-widest">
              {property.type}
            </span>
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
              {property.title}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-light">
              <MapPin className="h-4 w-4 text-blue-500 flex-shrink-0" />
              {property.address}, {property.city}, {property.state} {property.zipCode}
            </p>
          </div>
          
          <div className="bg-slate-900/5 dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 flex-shrink-0 text-left min-w-[200px]">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Asking Price</p>
            <h2 className="text-3xl font-black text-blue-600 dark:text-blue-400">{formatCurrency(property.price)}</h2>
          </div>
        </section>

        {/* Image Gallery */}
        <section className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Main Large Image */}
          <div className="lg:col-span-3 h-[450px] rounded-3xl overflow-hidden bg-slate-100 border border-slate-200/30 dark:border-slate-850">
            <img 
              src={activeImage} 
              alt={property.title} 
              className="w-full h-full object-cover" 
            />
          </div>
          {/* Thumbnails Sidebar */}
          <div className="flex lg:flex-col gap-3 overflow-x-auto lg:overflow-x-visible">
            {property.images.map((img, index) => (
              <button
                key={index}
                onClick={() => setSelectedImage(img)}
                className={`h-24 lg:h-32 w-32 lg:w-full rounded-2xl overflow-hidden border-2 transition-all flex-shrink-0 ${
                  activeImage === img ? "border-blue-600 shadow-md scale-[0.98]" : "border-transparent opacity-70 hover:opacity-100"
                }`}
              >
                <img src={img} alt={`property preview ${index + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </section>

        {/* Core Layout Specs Grid */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4 py-6 border-t border-b border-slate-200/50 dark:border-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-blue-600/10 text-blue-500"><Bed className="h-5 w-5" /></div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Bedrooms</p>
              <p className="font-extrabold text-slate-800 dark:text-white">{property.beds}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-blue-600/10 text-blue-500"><Bath className="h-5 w-5" /></div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Bathrooms</p>
              <p className="font-extrabold text-slate-800 dark:text-white">{property.baths}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-blue-600/10 text-blue-500"><LayoutGrid className="h-5 w-5" /></div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Built Area</p>
              <p className="font-extrabold text-slate-800 dark:text-white">{property.sqft} sqft</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-blue-600/10 text-blue-500"><Calendar className="h-5 w-5" /></div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Year Built</p>
              <p className="font-extrabold text-slate-800 dark:text-white">{property.yearBuilt}</p>
            </div>
          </div>
        </section>

        {/* Details & Contact Sidebar layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* Left Columns: description, features, mortgage, Zestimate */}
          <div className="lg:col-span-2 space-y-12">
            
            {/* Description */}
            <div className="space-y-4">
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">Property Description</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-light">
                {property.description}
              </p>
            </div>

            {/* Features list */}
            <div className="space-y-4">
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">Key Amenities</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {property.features.map((feat, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <ShieldCheck className="h-4.5 w-4.5 text-blue-500 flex-shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Zestimate valuation segment */}
            <div className="p-6 rounded-3xl bg-blue-600/5 dark:bg-slate-900 border border-blue-500/10 dark:border-slate-800/80 space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <span className="px-3 py-1 rounded-full bg-blue-600/10 text-blue-500 text-[8px] font-black uppercase tracking-widest flex items-center gap-1 w-fit">
                    <Sparkles className="h-3 w-3" /> Auto Estimate
                  </span>
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">Spire estimate (&quot;Zestimate&quot;)</h3>
                </div>
                <div className="text-right">
                  <h4 className="text-xl font-black text-blue-600 dark:text-blue-400">{formatCurrency(property.zestimate)}</h4>
                  <p className="text-[9px] text-slate-400">Market-updated 1 day ago</p>
                </div>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-light">
                The Spire Estimate model utilizes spatial interpolation and recent local closing data in {property.city} to formulate this automated price guide. 
              </p>
            </div>

            {/* Local Mortgage Estimator widget */}
            <div id="mortgage-estimator" className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 shadow-lg space-y-6">
              <div className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-blue-500" />
                <h3 className="font-extrabold text-xl text-slate-900 dark:text-white tracking-tight">Listing Mortgage Calculator</h3>
              </div>

              <div className="space-y-5">
                {/* Value slider */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-sans">Home Price</label>
                    <span className="text-xs font-black text-blue-600">{formatCurrency(homePrice)}</span>
                  </div>
                  <input
                    type="range"
                    min={property.price * 0.7}
                    max={property.price * 1.5}
                    step="500000"
                    value={homePrice}
                    onChange={(e) => setPriceOverride(parseInt(e.target.value))}
                    className="w-full accent-blue-600 cursor-ew-resize"
                  />
                </div>

                {/* Down Payment slider */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-sans">Down Payment</label>
                    <span className="text-xs font-black text-slate-800 dark:text-white">
                      {downPaymentPercent}% ({formatCurrency(downPaymentAmount)})
                    </span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="80"
                    step="5"
                    value={downPaymentPercent}
                    onChange={(e) => setDownPaymentPercent(parseInt(e.target.value))}
                    className="w-full accent-blue-600 cursor-ew-resize"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Rate */}
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Interest Rate</label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      step="0.1"
                      value={interestRate}
                      onChange={(e) => setInterestRate(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-3.5 rounded-xl text-sm font-semibold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/25 transition-all"
                    />
                  </div>
                  {/* Years */}
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Loan Term</label>
                    <select
                      value={loanTermYears}
                      onChange={(e) => setLoanTermYears(parseInt(e.target.value))}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-3.5 rounded-xl text-sm font-semibold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/25 transition-all cursor-pointer"
                    >
                      <option value={10}>10 Years</option>
                      <option value={15}>15 Years</option>
                      <option value={20}>20 Years</option>
                      <option value={30}>30 Years</option>
                    </select>
                  </div>
                </div>

                {/* Final Mortgage Output Display */}
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 grid grid-cols-1 md:grid-cols-3 gap-6 text-center md:text-left items-center">
                  <div className="md:col-span-2 space-y-0.5">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Est. Monthly Mortgage Payment</p>
                    <h4 className="text-2xl font-black text-blue-600 dark:text-blue-400">{formatCurrency(monthlyPayment)}</h4>
                  </div>
                  <div className="text-right md:border-l border-slate-200 dark:border-slate-800 pl-4 space-y-1 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block leading-none mb-0.5">Loan Principal</span>
                      <span className="font-extrabold text-slate-800 dark:text-white">{formatCurrency(loanAmount)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Floating Agent Contact Card */}
          <div className="space-y-6">
            <div className="sticky top-28 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-6 shadow-xl space-y-6">
              <h3 className="font-extrabold text-lg text-slate-900 dark:text-white tracking-tight">Contact Property Agent</h3>

              {/* Agent Bio Header */}
              <div className="flex gap-4 items-center">
                <img 
                  src={property.agent.image} 
                  alt={property.agent.name} 
                  className="w-16 h-16 rounded-full object-cover shadow-inner" 
                />
                <div className="space-y-1">
                  <h4 className="font-extrabold text-slate-900 dark:text-white text-sm leading-none">{property.agent.name}</h4>
                  <p className="text-xs text-slate-400">Homespire Luxury Executive</p>
                  <div className="flex gap-2 pt-1">
                    <a href={`tel:${property.agent.phone}`} className="p-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-blue-600/10 text-slate-600 dark:text-slate-300 hover:text-blue-500 transition-colors"><Phone className="h-3.5 w-3.5" /></a>
                    <a href={`mailto:${property.agent.email}`} className="p-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-blue-600/10 text-slate-600 dark:text-slate-300 hover:text-blue-500 transition-colors"><Mail className="h-3.5 w-3.5" /></a>
                  </div>
                </div>
              </div>

              {/* Contact Lead Intake Form */}
              <AnimatePresence mode="wait">
                {!isSubmitted ? (
                  <motion.form 
                    onSubmit={handleLeadSubmit}
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-4"
                  >
                    <div>
                      <input 
                        type="text" 
                        required
                        placeholder="Your Name" 
                        value={leadName}
                        onChange={(e) => setLeadName(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-3.5 rounded-xl text-xs font-semibold text-slate-800 dark:text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-blue-500/25 transition-all"
                      />
                    </div>
                    <div>
                      <input 
                        type="email" 
                        required
                        placeholder="Email Address" 
                        value={leadEmail}
                        onChange={(e) => setLeadEmail(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-3.5 rounded-xl text-xs font-semibold text-slate-800 dark:text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-blue-500/25 transition-all"
                      />
                    </div>
                    <div>
                      <input 
                        type="tel" 
                        placeholder="Phone Number" 
                        value={leadPhone}
                        onChange={(e) => setLeadPhone(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-3.5 rounded-xl text-xs font-semibold text-slate-800 dark:text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-blue-500/25 transition-all"
                      />
                    </div>
                    <div>
                      <textarea 
                        rows={4}
                        placeholder="Inquiry message..." 
                        value={leadMessage}
                        onChange={(e) => setCustomMessage(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-3.5 rounded-xl text-xs font-semibold text-slate-800 dark:text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-blue-500/25 transition-all resize-none"
                      />
                    </div>
                    
                    <button
                      type="submit"
                      className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs tracking-wider uppercase transition-colors shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
                    >
                      <Send className="h-3.5 w-3.5" /> Submit Inquiry
                    </button>
                  </motion.form>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-3"
                  >
                    <div className="mx-auto w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
                      <CheckCircle2 className="h-6 w-6" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">Inquiry Sent Successfully!</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-light">
                        Thank you, <span className="font-bold text-slate-700 dark:text-slate-200">{leadName}</span>. {property.agent.name} will contact you shortly at <span className="font-bold text-slate-700 dark:text-slate-200">{leadEmail}</span>.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
