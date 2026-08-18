"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { 
  Building, Phone, Mail, MapPin, User, LogOut, LayoutGrid, 
  Trash2, Plus, Users, Landmark, BarChart3, Bell, ArrowUpRight, 
  ChevronRight, Calendar, Sparkles, X, PlusCircle, Check
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getCombinedListings, addCustomListing, deleteListing, Property } from "@/data/listingsHelper";

export default function Dashboard() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [agentEmail, setAgentEmail] = useState("");
  const [agentName, setAgentName] = useState("");
  
  // Navigation Tabs: overview, listings, leads
  const [activeTab, setActiveTab] = useState<"overview" | "listings" | "leads">("overview");

  // Listings state
  const [myListings, setMyListings] = useState<Property[]>([]);
  const [inquiries, setInquiries] = useState<any[]>([]);

  // Add Listing Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formType, setFormType] = useState("Apartment");
  const [formAddress, setFormAddress] = useState("");
  const [formCity, setFormCity] = useState("Mumbai");
  const [formState, setFormState] = useState("");
  const [formZip, setFormZip] = useState("");
  const [formBeds, setFormBeds] = useState("3");
  const [formBaths, setFormBaths] = useState("3");
  const [formSqft, setFormSqft] = useState("1800");
  const [formYear, setFormYear] = useState("2023");
  const [formImages, setFormImages] = useState("https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80");
  const [formDesc, setFormDesc] = useState("");
  const [formFeatures, setFormFeatures] = useState<string[]>([]);
  const [formError, setFormError] = useState("");

  const availableFeatures = [
    "Sea View", "Private Elevator", "Wrap-around Terrace", 
    "Smart Home Tech", "Concierge Service", "Infinity Pool",
    "Central Courtyard", "Rooftop Garden", "Home Office",
    "Modular Kitchen", "Clubhouse Access", "Staff Quarters"
  ];

  // Load auth state and listings on mount
  useEffect(() => {
    const checkAuthAndLoad = () => {
      const user = localStorage.getItem("homespire_user");
      const email = localStorage.getItem("homespire_user_email");
      const role = localStorage.getItem("homespire_user_role") || "Buyer";
      
      if (user && email && role === "Agent") {
        setIsLoggedIn(true);
        setAgentEmail(email);
        
        // Resolve Name
        if (email === "rajesh@luxuryhomes.in") {
          setAgentName("Rajesh Mehta");
        } else if (email === "priyanka@luxuryhomes.in") {
          setAgentName("Priyanka Nair");
        } else if (email === "amit@luxuryhomes.in") {
          setAgentName("Amit Sharma");
        } else {
          const resolvedName = email.split("@")[0].replace(/[\._\-]/g, " ");
          setAgentName(resolvedName.replace(/\b\w/g, c => c.toUpperCase()));
        }

        // Fetch listings
        const allListings = getCombinedListings();
        const agentListings = allListings.filter(
          (p) => p.agent.email.toLowerCase() === email.toLowerCase()
        );
        setMyListings(agentListings);

        // Fetch leads
        let savedInqs = [];
        try {
          const inqsStr = localStorage.getItem("homespire_inquiries");
          if (inqsStr) {
            savedInqs = JSON.parse(inqsStr);
          } else {
            // Seed initial mock inquiries for demo agents if none exist
            if (email === "rajesh@luxuryhomes.in") {
              const mockInqs = [
                {
                  id: "inq-mock-1",
                  propertyId: "prop-1",
                  propertyTitle: "Seaside Luxury Penthouse",
                  propertyImage: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80",
                  agentEmail: "rajesh@luxuryhomes.in",
                  name: "Aarav Sharma",
                  email: "aarav.sharma@gmail.com",
                  phone: "+91 98765 43210",
                  message: "Hi Rajesh, I'm very interested in the Seaside Luxury Penthouse in Worli. Can we schedule a private viewing this Saturday afternoon?",
                  timestamp: new Date(Date.now() - 3600000 * 3).toISOString(), // 3 hours ago
                  status: "new"
                },
                {
                  id: "inq-mock-2",
                  propertyId: "prop-6",
                  propertyTitle: "Designer Duplex Penthouse",
                  propertyImage: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=80",
                  agentEmail: "rajesh@luxuryhomes.in",
                  name: "Meera Sen",
                  email: "meera.sen@outlook.com",
                  phone: "+91 99100 87654",
                  message: "Is the price negotiable for the Bandra duplex penthouse? I am representing a buyer who is looking to make an immediate offer. Please get back to me.",
                  timestamp: new Date(Date.now() - 3600000 * 25).toISOString(), // ~1 day ago
                  status: "contacted"
                }
              ];
              localStorage.setItem("homespire_inquiries", JSON.stringify(mockInqs));
              savedInqs = mockInqs;
            }
          }
        } catch (e) {
          console.error("Error seeding inquiries:", e);
        }

        const agentInqs = savedInqs.filter(
          (inq: any) => inq.agentEmail.toLowerCase() === email.toLowerCase()
        );
        setInquiries(agentInqs);
      } else {
        setIsLoggedIn(false);
      }
      setIsLoading(false);
    };

    checkAuthAndLoad();

    // Listen to localstorage updates if dynamic sync is needed
    const handleStorageChange = () => {
      checkAuthAndLoad();
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Demo Partner Login Helper
  const handleDemoLogin = () => {
    localStorage.setItem("homespire_user", "true");
    localStorage.setItem("homespire_user_email", "rajesh@luxuryhomes.in");
    localStorage.setItem("homespire_user_role", "Agent");
    // Reload page to re-trigger states
    window.location.reload();
  };

  const handleSignOut = () => {
    localStorage.removeItem("homespire_user");
    localStorage.removeItem("homespire_user_email");
    localStorage.removeItem("homespire_user_role");
    window.location.reload();
  };

  // Analytics Math
  const totalPortfolioValue = useMemo(() => {
    return myListings.reduce((sum, item) => sum + item.price, 0);
  }, [myListings]);

  const avgPricePerSqft = useMemo(() => {
    if (myListings.length === 0) return 0;
    const totalSqft = myListings.reduce((sum, item) => sum + item.sqft, 0);
    return Math.round(totalPortfolioValue / totalSqft);
  }, [myListings, totalPortfolioValue]);

  const pendingLeadsCount = useMemo(() => {
    return inquiries.filter(inq => inq.status === "new").length;
  }, [inquiries]);

  // Handle inquiry status change
  const handleLeadStatusChange = (leadId: string, newStatus: string) => {
    try {
      const allInqs = JSON.parse(localStorage.getItem("homespire_inquiries") || "[]");
      const updatedInqs = allInqs.map((inq: any) => {
        if (inq.id === leadId) {
          return { ...inq, status: newStatus };
        }
        return inq;
      });
      localStorage.setItem("homespire_inquiries", JSON.stringify(updatedInqs));
      
      // Update local state
      setInquiries(prev => 
        prev.map(inq => inq.id === leadId ? { ...inq, status: newStatus } : inq)
      );
    } catch (e) {
      console.error(e);
    }
  };

  // Handle listing deletion
  const handleDeleteListing = (id: string) => {
    if (confirm("Are you sure you want to remove this property listing from the public portal?")) {
      deleteListing(id);
      
      // Update state
      setMyListings(prev => prev.filter(p => p.id !== id));
      
      // Also trigger success toast/notif or feedback
      confetti({
        particleCount: 50,
        spread: 40,
        colors: ["#ef4444", "#f87171"]
      });
    }
  };

  // Handle Feature Checkbox Change
  const handleFeatureToggle = (feature: string) => {
    setFormFeatures(prev => 
      prev.includes(feature) 
        ? prev.filter(f => f !== feature) 
        : [...prev, feature]
    );
  };

  // Handle new Listing Submission
  const handleAddListingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!formTitle || !formPrice || !formAddress || !formDesc) {
      setFormError("Please fill out all required fields.");
      return;
    }

    const priceNum = Number(formPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      setFormError("Please enter a valid asking price.");
      return;
    }

    // Set coordinates based on city
    let lat = 19.0760;
    let lng = 72.8777;
    if (formCity === "Bangalore") {
      lat = 12.9716;
      lng = 77.5946;
    } else if (formCity === "Delhi") {
      lat = 28.6139;
      lng = 77.2090;
    } else if (formCity === "Goa") {
      lat = 15.2993;
      lng = 74.1240;
    }

    const imagesArray = formImages
      .split(",")
      .map(url => url.trim())
      .filter(url => url !== "");

    if (imagesArray.length === 0) {
      setFormError("Please provide at least one image URL.");
      return;
    }

    const newProp: Property = {
      id: "prop-custom-" + Date.now(),
      title: formTitle,
      price: priceNum,
      address: formAddress,
      city: formCity,
      state: formState || (formCity === "Mumbai" ? "Maharashtra" : formCity === "Bangalore" ? "Karnataka" : formCity === "Delhi" ? "Delhi" : "Goa"),
      zipCode: formZip || "400001",
      beds: Number(formBeds),
      baths: Number(formBaths),
      sqft: Number(formSqft),
      type: formType,
      yearBuilt: Number(formYear),
      lat,
      lng,
      images: imagesArray,
      description: formDesc,
      features: formFeatures,
      zestimate: Math.round(priceNum * 1.008),
      agent: {
        name: agentName,
        phone: "+91 98200 12345",
        email: agentEmail,
        image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=300&q=80"
      }
    };

    // Save to helper
    addCustomListing(newProp);

    // Update listings list
    setMyListings(prev => [newProp, ...prev]);

    // Reset Form & Close Modal
    setFormTitle("");
    setFormPrice("");
    setFormAddress("");
    setFormState("");
    setFormZip("");
    setFormBeds("3");
    setFormBaths("3");
    setFormSqft("1800");
    setFormYear("2023");
    setFormImages("https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80");
    setFormDesc("");
    setFormFeatures([]);
    setIsAddModalOpen(false);

    // Celebrate!
    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.5 }
    });
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const formatRelativeDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.round(diffMs / 60000);
    const diffHours = Math.round(diffMs / 3600000);

    if (diffMins < 60) {
      return `${diffMins} min${diffMins !== 1 ? "s" : ""} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
    } else {
      return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#090d16] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-slate-700 border-t-blue-500 animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090d16] flex flex-col font-sans transition-colors duration-300">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto px-6 py-24 w-full">
        {!isLoggedIn ? (
          /* Non Logged In State - Display Prompt & Quick Login */
          <div className="max-w-xl mx-auto my-12 p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl text-center space-y-6">
            <div className="w-16 h-16 rounded-3xl bg-blue-600/10 text-blue-500 flex items-center justify-center mx-auto shadow-md">
              <Landmark className="h-8 w-8" />
            </div>
            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full bg-blue-600/10 border border-blue-500/20 text-blue-500 text-[10px] font-black uppercase tracking-widest">
                Partner Portal
              </span>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white">Homespire Agent Center</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                Log in to your verified agent credentials to manage properties, inspect client leads, and track marketplace statistics.
              </p>
            </div>
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <button
                onClick={handleDemoLogin}
                className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-755 text-white font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="h-4 w-4" /> Demo Access as Rajesh Mehta
              </button>
              <p className="text-[10px] font-bold text-slate-400">
                Or sign in using the "Sign In" menu option at the top right of the screen.
              </p>
            </div>
          </div>
        ) : (
          /* Logged In Dashboard Container */
          <div className="space-y-8">
            
            {/* Greeting & Header section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/65 dark:border-slate-850 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white font-black text-lg flex items-center justify-center shadow-md">
                  {agentName.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl font-black text-slate-900 dark:text-white">Welcome back, {agentName}</h1>
                    <span className="px-2 py-0.5 rounded-full bg-blue-600/10 text-blue-500 text-[9px] font-black uppercase tracking-widest">
                      Spire Agent
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-light mt-0.5">{agentEmail}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/10 flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="h-4 w-4" /> Create New Listing
                </button>
                <button
                  onClick={handleSignOut}
                  className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-950 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Metrics cards row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/50 dark:border-slate-850 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-blue-600/10 text-blue-500 rounded-xl"><Building className="h-5 w-5" /></div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Listings</p>
                  <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{myListings.length}</p>
                </div>
              </div>
              
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/50 dark:border-slate-850 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-indigo-650/10 text-indigo-500 rounded-xl"><Users className="h-5 w-5" /></div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Client Leads</p>
                  <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                    {inquiries.length} {pendingLeadsCount > 0 && <span className="text-[10px] font-bold text-red-500 bg-red-100 dark:bg-red-950/40 px-2 py-0.5 rounded-full ml-1.5">+{pendingLeadsCount} New</span>}
                  </p>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/50 dark:border-slate-850 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-emerald-650/10 text-emerald-500 rounded-xl"><Landmark className="h-5 w-5" /></div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Portfolio Value</p>
                  <p className="text-xl font-black text-slate-900 dark:text-white mt-1 truncate max-w-[150px]" title={formatCurrency(totalPortfolioValue)}>
                    {formatCurrency(totalPortfolioValue)}
                  </p>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/50 dark:border-slate-850 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-violet-650/10 text-violet-500 rounded-xl"><BarChart3 className="h-5 w-5" /></div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Avg. Price/Sqft</p>
                  <p className="text-xl font-black text-slate-900 dark:text-white mt-1 truncate">
                    {myListings.length > 0 ? `${formatCurrency(avgPricePerSqft)}/sqft` : "—"}
                  </p>
                </div>
              </div>
            </div>

            {/* Tabs Selector & Sub-View Container */}
            <div className="space-y-6">
              
              {/* Tab headers */}
              <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6">
                <button
                  onClick={() => setActiveTab("overview")}
                  className={`pb-3.5 text-xs font-extrabold uppercase tracking-widest transition-all relative cursor-pointer ${
                    activeTab === "overview" 
                      ? "text-blue-600" 
                      : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  }`}
                >
                  {activeTab === "overview" && (
                    <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                  )}
                  Overview & Performance
                </button>
                <button
                  onClick={() => setActiveTab("listings")}
                  className={`pb-3.5 text-xs font-extrabold uppercase tracking-widest transition-all relative cursor-pointer ${
                    activeTab === "listings" 
                      ? "text-blue-600" 
                      : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  }`}
                >
                  {activeTab === "listings" && (
                    <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                  )}
                  My Listings ({myListings.length})
                </button>
                <button
                  onClick={() => setActiveTab("leads")}
                  className={`pb-3.5 text-xs font-extrabold uppercase tracking-widest transition-all relative cursor-pointer ${
                    activeTab === "leads" 
                      ? "text-blue-600" 
                      : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  }`}
                >
                  {activeTab === "leads" && (
                    <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                  )}
                  Client Inquiries ({inquiries.length})
                </button>
              </div>

              {/* Sub-view switcher */}
              <div className="min-h-[300px]">
                <AnimatePresence mode="wait">
                  {activeTab === "overview" && (
                    <motion.div
                      key="overview-tab"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-6"
                    >
                      {/* Overview & Performance Statistics */}
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        
                        {/* Traffic Performance Widget */}
                        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-850 p-6 rounded-3xl shadow-sm space-y-6">
                          <div className="flex justify-between items-center">
                            <div>
                              <h3 className="font-extrabold text-sm text-slate-950 dark:text-white">Property Traffic Analytics</h3>
                              <p className="text-[10px] text-slate-400 font-light mt-0.5">Views on your active property listings (last 30 days)</p>
                            </div>
                            <span className="text-[10px] font-bold text-emerald-500 bg-emerald-100 dark:bg-emerald-950/40 px-2.5 py-1 rounded-lg flex items-center gap-1">
                              <ArrowUpRight className="h-3 w-3" /> +14.2% MoM
                            </span>
                          </div>

                          {/* Beautiful CSS bar graph */}
                          <div className="space-y-4 pt-2">
                            {myListings.length === 0 ? (
                              <div className="text-center py-8 text-xs font-bold text-slate-400 dark:text-slate-500">
                                No active listings to display views traffic.
                              </div>
                            ) : (
                              myListings.slice(0, 4).map((listing, idx) => {
                                // simulated views count based on prices
                                const views = Math.round((listing.sqft * 3.5) + (idx * 243) + 321);
                                const percentage = Math.min(100, Math.max(25, (views / 2500) * 100));
                                
                                return (
                                  <div key={listing.id} className="space-y-1.5">
                                    <div className="flex justify-between text-xs font-bold">
                                      <span className="text-slate-700 dark:text-slate-300 truncate max-w-[280px]">{listing.title}</span>
                                      <span className="text-slate-500">{views.toLocaleString()} views</span>
                                    </div>
                                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                                      <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${percentage}%` }}
                                        transition={{ duration: 0.6, delay: idx * 0.1 }}
                                        className="bg-blue-600 h-full rounded-full"
                                      />
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>

                        {/* Recent Activity Logs */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-850 p-6 rounded-3xl shadow-sm space-y-4">
                          <h3 className="font-extrabold text-sm text-slate-950 dark:text-white">Recent Activities</h3>
                          
                          <div className="space-y-4">
                            {inquiries.slice(0, 3).map((inq, index) => (
                              <div key={inq.id} className="flex gap-3 text-xs">
                                <div className="p-2 h-fit bg-indigo-500/10 text-indigo-500 rounded-xl mt-0.5 flex-shrink-0">
                                  <Bell className="h-3.5 w-3.5" />
                                </div>
                                <div className="space-y-1 select-none">
                                  <p className="text-slate-800 dark:text-slate-200 font-bold">
                                    New Inquiry from {inq.name}
                                  </p>
                                  <p className="text-slate-450 dark:text-slate-400 font-light truncate max-w-[200px]" title={inq.propertyTitle}>
                                    Property: {inq.propertyTitle}
                                  </p>
                                  <p className="text-[10px] text-slate-400">{formatRelativeDate(inq.timestamp)}</p>
                                </div>
                              </div>
                            ))}

                            {myListings.slice(0, 2).map((list, index) => (
                              <div key={list.id} className="flex gap-3 text-xs">
                                <div className="p-2 h-fit bg-emerald-500/10 text-emerald-500 rounded-xl mt-0.5 flex-shrink-0">
                                  <Building className="h-3.5 w-3.5" />
                                </div>
                                <div className="space-y-1 select-none">
                                  <p className="text-slate-800 dark:text-slate-200 font-bold">
                                    Listing Published
                                  </p>
                                  <p className="text-slate-450 dark:text-slate-400 font-light truncate max-w-[200px]" title={list.title}>
                                    {list.title} in {list.city}
                                  </p>
                                  <p className="text-[10px] text-slate-400">Recently active</p>
                                </div>
                              </div>
                            ))}

                            {inquiries.length === 0 && myListings.length === 0 && (
                              <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-12 font-bold">
                                No recent portal activities.
                              </p>
                            )}
                          </div>
                        </div>

                      </div>
                    </motion.div>
                  )}

                  {activeTab === "listings" && (
                    <motion.div
                      key="listings-tab"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-6"
                    >
                      {/* Active Listings Grid */}
                      <div className="flex justify-between items-center mb-2">
                        <div>
                          <h3 className="font-extrabold text-sm text-slate-950 dark:text-white">All Active Property Listings</h3>
                          <p className="text-[10px] text-slate-450 dark:text-slate-400">Total of {myListings.length} luxury properties currently live on Spire Home</p>
                        </div>
                        <button
                          onClick={() => setIsAddModalOpen(true)}
                          className="px-3 py-2 rounded-xl bg-blue-600/10 hover:bg-blue-600/25 text-blue-500 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <PlusCircle className="h-4 w-4" /> Add Listing
                        </button>
                      </div>

                      {myListings.length === 0 ? (
                        <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-850 rounded-3xl space-y-4">
                          <p className="text-xs font-bold text-slate-400 dark:text-slate-500">You don&apos;t have any active property listings yet.</p>
                          <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold transition-all shadow-md hover:bg-blue-700 cursor-pointer"
                          >
                            Create Your First Listing
                          </button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {myListings.map((listing) => (
                            <div 
                              key={listing.id}
                              className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-200/60 dark:border-slate-850 shadow-sm flex flex-col hover:shadow-md transition-shadow relative group"
                            >
                              <div className="h-44 bg-slate-100 relative overflow-hidden">
                                <img 
                                  src={listing.images[0] || "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=600&q=80"} 
                                  alt={listing.title}
                                  className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
                                />
                                <span className="absolute top-3 left-3 px-2 py-0.5 rounded-full bg-slate-900/85 backdrop-blur-md text-[9px] font-black uppercase text-white tracking-widest border border-white/10">
                                  {listing.type}
                                </span>
                              </div>

                              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                                <div className="space-y-1">
                                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1">
                                    <MapPin className="h-3 w-3 text-blue-500 flex-shrink-0" /> {listing.city}
                                  </p>
                                  <h4 className="font-extrabold text-sm text-slate-800 dark:text-white line-clamp-1">{listing.title}</h4>
                                  <h3 className="font-black text-base text-blue-600 dark:text-blue-450 mt-1">{formatCurrency(listing.price)}</h3>
                                </div>

                                <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-slate-850">
                                  <span className="text-[10px] font-bold text-slate-450 dark:text-slate-400">
                                    {listing.beds} BHK • {listing.sqft.toLocaleString()} sqft
                                  </span>

                                  <div className="flex items-center gap-2">
                                    <Link 
                                      href={`/properties/${listing.id}`}
                                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-350 transition-colors"
                                      title="View Listing Details"
                                    >
                                      <ArrowUpRight className="h-3.5 w-3.5" />
                                    </Link>
                                    <button 
                                      onClick={() => handleDeleteListing(listing.id)}
                                      className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/40 text-red-500 transition-colors cursor-pointer"
                                      title="Delete Listing"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}

                  {activeTab === "leads" && (
                    <motion.div
                      key="leads-tab"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-6"
                    >
                      {/* Client Inquiries Inbox */}
                      <div>
                        <h3 className="font-extrabold text-sm text-slate-950 dark:text-white">Client Contacts & Inquiries</h3>
                        <p className="text-[10px] text-slate-450 dark:text-slate-400">Inquiries generated directly from the property details contact form</p>
                      </div>

                      {inquiries.length === 0 ? (
                        <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-850 rounded-3xl">
                          <p className="text-xs font-bold text-slate-400 dark:text-slate-500">No client inquiries found for your properties yet.</p>
                          <p className="text-[10px] text-slate-400/80 mt-1 max-w-xs mx-auto">Submit a contact form from any of your property detail pages to test real-time routing.</p>
                        </div>
                      ) : (
                        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-850 rounded-3xl overflow-hidden shadow-sm divide-y divide-slate-100 dark:divide-slate-850">
                          {inquiries.map((lead) => (
                            <div key={lead.id} className="p-6 flex flex-col lg:flex-row gap-6 justify-between hover:bg-slate-50/50 dark:hover:bg-slate-950/30 transition-colors">
                              
                              {/* Left Panel: Property of Interest & Client Name */}
                              <div className="flex gap-4 items-start flex-1 min-w-0">
                                <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-200/30 dark:border-slate-800">
                                  <img src={lead.propertyImage} alt={lead.propertyTitle} className="w-full h-full object-cover" />
                                </div>
                                <div className="space-y-1.5 flex-1 min-w-0">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-xs font-black text-slate-900 dark:text-white">{lead.name}</span>
                                    <span className="text-[9px] text-slate-400">{formatRelativeDate(lead.timestamp)}</span>
                                    
                                    {/* Status Badge */}
                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                      lead.status === "new"
                                        ? "bg-red-500/10 text-red-500"
                                        : lead.status === "contacted"
                                        ? "bg-blue-600/10 text-blue-500"
                                        : "bg-emerald-500/10 text-emerald-500"
                                    }`}>
                                      {lead.status === "new" ? "New" : lead.status === "contacted" ? "Contacted" : "Closed"}
                                    </span>
                                  </div>
                                  <p className="text-[10px] font-bold text-slate-450 dark:text-slate-400 truncate" title={lead.propertyTitle}>
                                    Interested in: <Link href={`/properties/${lead.propertyId}`} className="text-blue-500 hover:underline">{lead.propertyTitle}</Link>
                                  </p>
                                  
                                  {/* Custom client message box */}
                                  <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-850 mt-2 text-xs font-light text-slate-600 dark:text-slate-350 leading-relaxed italic">
                                    &ldquo;{lead.message}&rdquo;
                                  </div>
                                </div>
                              </div>

                              {/* Right Panel: Client Contact Details & Action buttons */}
                              <div className="flex flex-col sm:flex-row lg:flex-col justify-between items-start sm:items-center lg:items-end gap-4 min-w-[200px]">
                                <div className="space-y-1.5 text-xs text-left lg:text-right w-full">
                                  <p className="font-semibold text-slate-700 dark:text-slate-300 flex items-center lg:justify-end gap-1.5">
                                    <Mail className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" /> {lead.email}
                                  </p>
                                  {lead.phone && (
                                    <p className="font-semibold text-slate-700 dark:text-slate-300 flex items-center lg:justify-end gap-1.5">
                                      <Phone className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" /> {lead.phone}
                                    </p>
                                  )}
                                </div>

                                <div className="flex items-center gap-2">
                                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-1">Status:</label>
                                  <select
                                    value={lead.status}
                                    onChange={(e) => handleLeadStatusChange(lead.id, e.target.value)}
                                    className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 px-2.5 py-1.5 rounded-lg text-[10px] font-extrabold outline-none cursor-pointer text-slate-800 dark:text-white"
                                  >
                                    <option value="new">Mark New</option>
                                    <option value="contacted">Mark Contacted</option>
                                    <option value="closed">Mark Closed</option>
                                  </select>
                                </div>
                              </div>

                            </div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

            </div>

          </div>
        )}
      </main>

      {/* Add Property Listing Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl p-6 shadow-2xl space-y-6 relative overflow-hidden animate-in zoom-in-95 duration-200 my-8 max-h-[90vh] flex flex-col">
            
            {/* Modal Title & Close */}
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-850">
              <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Building className="h-5 w-5 text-blue-500" /> Create New Property Listing
              </h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-350 hover:text-slate-800 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Error Message */}
            {formError && (
              <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 text-red-650 dark:text-red-400 text-xs font-bold rounded-xl text-center">
                {formError}
              </div>
            )}

            {/* Scrollable Form Body */}
            <form onSubmit={handleAddListingSubmit} className="space-y-5 overflow-y-auto pr-1 flex-1 text-left">
              
              {/* Basic Details Block */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Property Title *</label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g. Waterfront Oceanview Duplex"
                    required
                    className="w-full bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-850 text-xs text-slate-800 dark:text-white placeholder-slate-400 outline-none focus:ring-1 focus:ring-blue-550"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Asking Price (INR) *</label>
                  <input
                    type="number"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    placeholder="e.g. 75000000"
                    required
                    className="w-full bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-850 text-xs text-slate-800 dark:text-white placeholder-slate-400 outline-none focus:ring-1 focus:ring-blue-550"
                  />
                </div>
              </div>

              {/* Specs & Type Block */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Property Type</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-850 text-xs text-slate-800 dark:text-white outline-none cursor-pointer"
                  >
                    <option value="Apartment">Apartment</option>
                    <option value="Penthouse">Penthouse</option>
                    <option value="Villa">Villa</option>
                    <option value="House">House</option>
                    <option value="Condo">Condo</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Bedrooms</label>
                  <input
                    type="number"
                    value={formBeds}
                    onChange={(e) => setFormBeds(e.target.value)}
                    required
                    className="w-full bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-850 text-xs text-slate-800 dark:text-white outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Bathrooms</label>
                  <input
                    type="number"
                    value={formBaths}
                    onChange={(e) => setFormBaths(e.target.value)}
                    required
                    className="w-full bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-850 text-xs text-slate-800 dark:text-white outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Size (Sq. Ft.)</label>
                  <input
                    type="number"
                    value={formSqft}
                    onChange={(e) => setFormSqft(e.target.value)}
                    required
                    className="w-full bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-850 text-xs text-slate-800 dark:text-white outline-none"
                  />
                </div>
                <div className="space-y-1 col-span-2 md:col-span-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Year Built</label>
                  <input
                    type="number"
                    value={formYear}
                    onChange={(e) => setFormYear(e.target.value)}
                    required
                    className="w-full bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-850 text-xs text-slate-800 dark:text-white outline-none"
                  />
                </div>
              </div>

              {/* Location Block */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2 space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Address *</label>
                  <input
                    type="text"
                    value={formAddress}
                    onChange={(e) => setFormAddress(e.target.value)}
                    placeholder="e.g. 45 Carter Road, Bandra West"
                    required
                    className="w-full bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-850 text-xs text-slate-800 dark:text-white placeholder-slate-400 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">City</label>
                  <select
                    value={formCity}
                    onChange={(e) => setFormCity(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-850 text-xs text-slate-800 dark:text-white outline-none cursor-pointer"
                  >
                    <option value="Mumbai">Mumbai</option>
                    <option value="Bangalore">Bangalore</option>
                    <option value="Delhi">Delhi NCR</option>
                    <option value="Goa">Goa</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Zip Code</label>
                  <input
                    type="text"
                    value={formZip}
                    onChange={(e) => setFormZip(e.target.value)}
                    placeholder="e.g. 400050"
                    className="w-full bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-850 text-xs text-slate-800 dark:text-white placeholder-slate-400 outline-none"
                  />
                </div>
              </div>

              {/* Images block */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Image URLs (comma separated for multiple) *</label>
                <input
                  type="text"
                  value={formImages}
                  onChange={(e) => setFormImages(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-... , https://images.unsplash.com/photo-..."
                  required
                  className="w-full bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-850 text-xs text-slate-800 dark:text-white placeholder-slate-400 outline-none"
                />
              </div>

              {/* Description block */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Description *</label>
                <textarea
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Detailed description of the penthouse/villa specifications and highlights..."
                  rows={4}
                  required
                  className="w-full bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-850 text-xs text-slate-800 dark:text-white placeholder-slate-400 outline-none resize-none font-sans"
                />
              </div>

              {/* Features list checkboxes */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Amenities & Features</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-850">
                  {availableFeatures.map((feat) => {
                    const isChecked = formFeatures.includes(feat);
                    return (
                      <button
                        key={feat}
                        type="button"
                        onClick={() => handleFeatureToggle(feat)}
                        className={`flex items-center gap-2 p-2 rounded-xl text-[10px] font-bold text-left transition-colors border select-none cursor-pointer ${
                          isChecked
                            ? "bg-blue-600/10 border-blue-500/30 text-blue-500"
                            : "bg-white dark:bg-slate-900 border-slate-200/50 dark:border-slate-800 text-slate-650 dark:text-slate-400"
                        }`}
                      >
                        <div className={`w-3.5 h-3.5 rounded flex items-center justify-center border transition-all ${
                          isChecked ? "bg-blue-600 border-blue-500 text-white" : "border-slate-300 dark:border-slate-700 bg-transparent"
                        }`}>
                          {isChecked && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                        </div>
                        {feat}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-3 border-t border-slate-100 dark:border-slate-850">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-950 transition-colors text-xs font-bold text-slate-650 dark:text-slate-350 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-[2] py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs uppercase tracking-wider shadow-md shadow-blue-500/10 transition-all cursor-pointer"
                >
                  Publish Listing
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
