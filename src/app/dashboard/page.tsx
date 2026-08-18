"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { 
  Building, Phone, Mail, MapPin, User, LogOut, LayoutGrid, 
  Trash2, Plus, Users, Landmark, BarChart3, Bell, ArrowUpRight, 
  ChevronRight, Calendar, Sparkles, X, PlusCircle, Check,
  Clock, FileText, CheckSquare, Square, AlertCircle, ArrowRightLeft, DollarSign,
  TrendingUp, Award, Activity
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getCombinedListings, addCustomListing, deleteListing, Property } from "@/data/listingsHelper";

interface Lead {
  id: string;
  propertyId: string;
  propertyTitle: string;
  propertyImage: string;
  agentEmail: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  timestamp: string;
  status: "new" | "contacted" | "closed";
}

interface LeadNote {
  id: string;
  text: string;
  timestamp: string;
}

interface Appointment {
  id: string;
  propertyId: string;
  propertyTitle: string;
  clientName: string;
  clientEmail: string;
  dateTime: string;
  type: "Showing" | "Contract Review" | "Inspection" | "Listing Presentation" | "Closing Meeting";
  notes: string;
}

interface AgentTask {
  id: string;
  text: string;
  completed: boolean;
  dueDate: string;
  priority: "high" | "medium" | "low";
}

export default function Dashboard() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [agentEmail, setAgentEmail] = useState("");
  const [agentName, setAgentName] = useState("");
  
  // Navigation Tabs: overview, listings, leads, calendar, commission
  const [activeTab, setActiveTab] = useState<"overview" | "listings" | "leads" | "calendar" | "commission">("overview");

  // CRM State
  const [myListings, setMyListings] = useState<Property[]>([]);
  const [inquiries, setInquiries] = useState<Lead[]>([]);
  const [dealStages, setDealStages] = useState<{ [key: string]: "listing" | "offer" | "escrow" | "closed" }>({});
  const [leadNotes, setLeadNotes] = useState<{ [leadId: string]: LeadNote[] }>({});
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [tasks, setTasks] = useState<AgentTask[]>([]);

  // Selection states for Lead Panel
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [newNoteText, setNewNoteText] = useState("");

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);

  // New Listing Form state
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

  // New Appointment Form state
  const [apptClient, setApptClient] = useState("");
  const [apptPropertyId, setApptPropertyId] = useState("");
  const [apptDateTime, setApptDateTime] = useState("");
  const [apptType, setApptType] = useState<"Showing" | "Contract Review" | "Inspection" | "Listing Presentation" | "Closing Meeting">("Showing");
  const [apptNotes, setApptNotes] = useState("");
  const [apptError, setApptError] = useState("");

  // New Task Form state
  const [taskText, setTaskText] = useState("");
  const [taskPriority, setTaskPriority] = useState<"high" | "medium" | "low">("medium");
  const [taskDueDate, setTaskDueDate] = useState("");

  const availableFeatures = [
    "Sea View", "Private Elevator", "Wrap-around Terrace", 
    "Smart Home Tech", "Concierge Service", "Infinity Pool",
    "Central Courtyard", "Rooftop Garden", "Home Office",
    "Modular Kitchen", "Clubhouse Access", "Staff Quarters"
  ];

  // Load auth state and CRM data on mount
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

        // 1. Fetch Listings
        const allListings = getCombinedListings();
        const agentListings = allListings.filter(
          (p) => p.agent.email.toLowerCase() === email.toLowerCase()
        );
        setMyListings(agentListings);

        // 2. Load Deal Stages Mapping
        let savedStages = {};
        try {
          const stagesStr = localStorage.getItem("homespire_deal_stages");
          if (stagesStr) {
            savedStages = JSON.parse(stagesStr);
          } else {
            // Seed stages
            savedStages = {
              "prop-1": "listing", // Seaside Luxury Penthouse
              "prop-6": "offer",   // Designer Duplex Penthouse
            };
            localStorage.setItem("homespire_deal_stages", JSON.stringify(savedStages));
          }
        } catch (e) {
          console.error(e);
        }
        setDealStages(savedStages);

        // 3. Fetch Leads/Inquiries
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

        // Set default selected lead if available
        if (agentInqs.length > 0 && !selectedLeadId) {
          setSelectedLeadId(agentInqs[0].id);
        }

        // 4. Fetch Client Lead Notes/History Logs
        let savedNotes = {};
        try {
          const notesStr = localStorage.getItem("homespire_lead_notes");
          if (notesStr) {
            savedNotes = JSON.parse(notesStr);
          } else {
            // Seed timeline notes for demo
            savedNotes = {
              "inq-mock-1": [
                { id: "note-1", text: "Received website inquiry form for Seaside Penthouse.", timestamp: new Date(Date.now() - 3600000 * 3).toISOString() }
              ],
              "inq-mock-2": [
                { id: "note-2", text: "Received website contact request for Carter Road.", timestamp: new Date(Date.now() - 3600000 * 25).toISOString() },
                { id: "note-3", text: "Followed up via phone. Meera mentioned her buyer is a high-profile executive looking to close within 3 weeks. Emailed draft transaction brochure.", timestamp: new Date(Date.now() - 3600000 * 23).toISOString() }
              ]
            };
            localStorage.setItem("homespire_lead_notes", JSON.stringify(savedNotes));
          }
        } catch (e) {
          console.error(e);
        }
        setLeadNotes(savedNotes);

        // 5. Fetch Calendar Appointments
        let savedAppts = [];
        try {
          const apptsStr = localStorage.getItem("homespire_appointments");
          if (apptsStr) {
            savedAppts = JSON.parse(apptsStr);
          } else {
            // Seed calendar appointments
            if (email === "rajesh@luxuryhomes.in") {
              const defaultAppts: Appointment[] = [
                {
                  id: "appt-1",
                  propertyId: "prop-1",
                  propertyTitle: "Seaside Luxury Penthouse",
                  clientName: "Aarav Sharma",
                  clientEmail: "aarav.sharma@gmail.com",
                  dateTime: new Date(Date.now() + 86400000).toISOString().split("T")[0] + "T10:00", // Tomorrow at 10:00 AM
                  type: "Showing",
                  notes: "Private walkthrough. Client is arriving with architect to review interior renovation potential."
                },
                {
                  id: "appt-2",
                  propertyId: "prop-6",
                  propertyTitle: "Designer Duplex Penthouse",
                  clientName: "Meera Sen",
                  clientEmail: "meera.sen@outlook.com",
                  dateTime: new Date(Date.now() + 172800000).toISOString().split("T")[0] + "T14:30", // Day after tomorrow at 2:30 PM
                  type: "Contract Review",
                  notes: "Reviewing initial pricing offer and token terms at corporate office."
                }
              ];
              localStorage.setItem("homespire_appointments", JSON.stringify(defaultAppts));
              savedAppts = defaultAppts;
            }
          }
        } catch (e) {
          console.error(e);
        }
        setAppointments(savedAppts);

        // 6. Fetch Tasks Checklist
        let savedTasks = [];
        try {
          const tasksStr = localStorage.getItem("homespire_tasks");
          if (tasksStr) {
            savedTasks = JSON.parse(tasksStr);
          } else {
            // Seed tasks
            savedTasks = [
              { id: "task-1", text: "Verify Worli Penthouse registration and title documents", completed: true, dueDate: new Date().toISOString().split("T")[0], priority: "high" },
              { id: "task-2", text: "Confirm Aarav Sharma showing for Saturday morning", completed: false, dueDate: new Date().toISOString().split("T")[0], priority: "high" },
              { id: "task-3", text: "Request structural stability certificate for Bandra listing", completed: false, dueDate: new Date(Date.now() + 86400000 * 2).toISOString().split("T")[0], priority: "medium" },
              { id: "task-4", text: "Prepare draft Sales Agreement for Carter Road promenade penthouse", completed: false, dueDate: new Date(Date.now() + 86400000 * 3).toISOString().split("T")[0], priority: "high" },
              { id: "task-5", text: "Upload new sunset high-res photos for Indiranagar Villa", completed: false, dueDate: new Date(Date.now() + 86400000 * 5).toISOString().split("T")[0], priority: "low" }
            ];
            localStorage.setItem("homespire_tasks", JSON.stringify(savedTasks));
          }
        } catch (e) {
          console.error(e);
        }
        setTasks(savedTasks);

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
    window.location.reload();
  };

  const handleSignOut = () => {
    localStorage.removeItem("homespire_user");
    localStorage.removeItem("homespire_user_email");
    localStorage.removeItem("homespire_user_role");
    window.location.reload();
  };

  // Pipeline math & counts
  const pipelineCounts = useMemo(() => {
    const counts = { listing: 0, offer: 0, escrow: 0, closed: 0 };
    myListings.forEach((item) => {
      const stage = dealStages[item.id] || "listing";
      counts[stage] += 1;
    });
    return counts;
  }, [myListings, dealStages]);

  const pipelineValue = useMemo(() => {
    const values = { listing: 0, offer: 0, escrow: 0, closed: 0 };
    myListings.forEach((item) => {
      const stage = dealStages[item.id] || "listing";
      values[stage] += item.price;
    });
    return values;
  }, [myListings, dealStages]);

  // Active Deals: listing, offer, escrow. Closed Deals: closed.
  const activePipelineValueSum = useMemo(() => {
    return pipelineValue.listing + pipelineValue.offer + pipelineValue.escrow;
  }, [pipelineValue]);

  const totalPortfolioValue = useMemo(() => {
    return myListings.reduce((sum, item) => sum + item.price, 0);
  }, [myListings]);

  // Commissions projection (Standard 2.5% agent commission fee)
  const potentialCommission = useMemo(() => {
    return Math.round(activePipelineValueSum * 0.025);
  }, [activePipelineValueSum]);

  const earnedCommission = useMemo(() => {
    return Math.round(pipelineValue.closed * 0.025);
  }, [pipelineValue]);

  const pendingLeadsCount = useMemo(() => {
    return inquiries.filter(inq => inq.status === "new").length;
  }, [inquiries]);

  // Update status and stages
  const updatePropertyStage = (id: string, stage: "listing" | "offer" | "escrow" | "closed") => {
    const updatedStages = { ...dealStages, [id]: stage };
    localStorage.setItem("homespire_deal_stages", JSON.stringify(updatedStages));
    setDealStages(updatedStages);

    confetti({
      particleCount: 80,
      spread: 60,
      colors: ["#3b82f6", "#10b981"]
    });
  };

  // Lead logs / notes helper
  const addLeadNote = (leadId: string) => {
    if (!newNoteText.trim()) return;

    const newNote: LeadNote = {
      id: "note-" + Date.now(),
      text: newNoteText.trim(),
      timestamp: new Date().toISOString()
    };

    const leadTimeline = leadNotes[leadId] || [];
    const updatedNotes = {
      ...leadNotes,
      [leadId]: [...leadTimeline, newNote]
    };

    localStorage.setItem("homespire_lead_notes", JSON.stringify(updatedNotes));
    setLeadNotes(updatedNotes);
    setNewNoteText("");

    confetti({
      particleCount: 30,
      spread: 30,
      colors: ["#3b82f6"]
    });
  };

  // Handle lead status change
  const handleLeadStatusChange = (leadId: string, newStatus: "new" | "contacted" | "closed") => {
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

      // Log automatically to timeline
      const systemNote: LeadNote = {
        id: "note-sys-" + Date.now(),
        text: `Inquiry status changed to: ${newStatus.toUpperCase()}`,
        timestamp: new Date().toISOString()
      };
      const leadTimeline = leadNotes[leadId] || [];
      const updatedNotes = {
        ...leadNotes,
        [leadId]: [...leadTimeline, systemNote]
      };
      localStorage.setItem("homespire_lead_notes", JSON.stringify(updatedNotes));
      setLeadNotes(updatedNotes);
    } catch (e) {
      console.error(e);
    }
  };

  // Appointments handler
  const handleAddAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    setApptError("");

    if (!apptClient || !apptPropertyId || !apptDateTime) {
      setApptError("Please enter client name, select property, and choose date/time.");
      return;
    }

    const prop = myListings.find(p => p.id === apptPropertyId);
    if (!prop) return;

    const newAppt: Appointment = {
      id: "appt-" + Date.now(),
      propertyId: apptPropertyId,
      propertyTitle: prop.title,
      clientName: apptClient,
      clientEmail: inquiries.find(inq => inq.name === apptClient)?.email || "client@email.com",
      dateTime: apptDateTime,
      type: apptType,
      notes: apptNotes
    };

    const updatedAppts = [...appointments, newAppt];
    localStorage.setItem("homespire_appointments", JSON.stringify(updatedAppts));
    setAppointments(updatedAppts);
    
    // Reset Form
    setApptClient("");
    setApptPropertyId("");
    setApptDateTime("");
    setApptType("Showing");
    setApptNotes("");
    setIsAppointmentModalOpen(false);

    confetti({
      particleCount: 100,
      spread: 50,
      colors: ["#10b981"]
    });
  };

  const handleDeleteAppointment = (id: string) => {
    if (confirm("Cancel this appointment scheduled?")) {
      const updated = appointments.filter(a => a.id !== id);
      localStorage.setItem("homespire_appointments", JSON.stringify(updated));
      setAppointments(updated);
    }
  };

  // Task lists helper
  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskText.trim()) return;

    const newTask: AgentTask = {
      id: "task-" + Date.now(),
      text: taskText.trim(),
      completed: false,
      dueDate: taskDueDate || new Date().toISOString().split("T")[0],
      priority: taskPriority
    };

    const updated = [newTask, ...tasks];
    localStorage.setItem("homespire_tasks", JSON.stringify(updated));
    setTasks(updated);
    
    setTaskText("");
    setTaskDueDate("");
    setTaskPriority("medium");
  };

  const handleToggleTask = (id: string) => {
    const updated = tasks.map((t) => {
      if (t.id === id) {
        return { ...t, completed: !t.completed };
      }
      return t;
    });
    localStorage.setItem("homespire_tasks", JSON.stringify(updated));
    setTasks(updated);
  };

  const handleDeleteTask = (id: string) => {
    const updated = tasks.filter(t => t.id !== id);
    localStorage.setItem("homespire_tasks", JSON.stringify(updated));
    setTasks(updated);
  };

  // Property Deletion
  const handleDeleteListing = (id: string) => {
    if (confirm("Are you sure you want to remove this property listing from the public portal?")) {
      deleteListing(id);
      setMyListings(prev => prev.filter(p => p.id !== id));
      
      // Clean up stages
      const stagesCopy = { ...dealStages };
      delete stagesCopy[id];
      localStorage.setItem("homespire_deal_stages", JSON.stringify(stagesCopy));
      setDealStages(stagesCopy);

      confetti({
        particleCount: 40,
        spread: 30,
        colors: ["#ef4444"]
      });
    }
  };

  // Add Listing Modal features
  const handleFeatureToggle = (feature: string) => {
    setFormFeatures(prev => 
      prev.includes(feature) 
        ? prev.filter(f => f !== feature) 
        : [...prev, feature]
    );
  };

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

    // Default coords based on city
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

    // Save listing
    addCustomListing(newProp);

    // Save stage as active Listing
    const updatedStages = { ...dealStages, [newProp.id]: "listing" as const };
    localStorage.setItem("homespire_deal_stages", JSON.stringify(updatedStages));
    setDealStages(updatedStages);

    // Update listings
    setMyListings(prev => [newProp, ...prev]);

    // Reset Form
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
      return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
    }
  };

  // Find active lead by ID
  const selectedLead = useMemo(() => {
    return inquiries.find(inq => inq.id === selectedLeadId) || null;
  }, [inquiries, selectedLeadId]);

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
          /* Locked State - Banner */
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
                className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer border-none"
              >
                <Sparkles className="h-4 w-4" /> Demo Access as Rajesh Mehta
              </button>
            </div>
          </div>
        ) : (
          /* Professional Active Dashboard */
          <div className="space-y-8">
            
            {/* Agent Greeting Header Card */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-205 dark:border-slate-850 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white font-black text-lg flex items-center justify-center shadow-md select-none">
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
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-750 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/10 flex items-center gap-2 cursor-pointer border-none"
                >
                  <Plus className="h-4 w-4" /> Create New Listing
                </button>
                <button
                  onClick={handleSignOut}
                  className="p-2.5 rounded-xl border border-slate-205 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-950 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer bg-transparent"
                  title="Sign Out"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Metric widgets row */}
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
                    {inquiries.length} {pendingLeadsCount > 0 && <span className="text-[9px] font-bold text-red-500 bg-red-50 dark:bg-red-950/40 px-2 py-0.5 rounded-full ml-1.5">+{pendingLeadsCount} New</span>}
                  </p>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/50 dark:border-slate-850 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-emerald-650/10 text-emerald-500 rounded-xl"><Landmark className="h-5 w-5" /></div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Est. Commission</p>
                  <p className="text-xl font-black text-emerald-600 dark:text-emerald-450 mt-1 truncate max-w-[150px]" title={formatCurrency(potentialCommission)}>
                    {formatCurrency(potentialCommission)}
                  </p>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/50 dark:border-slate-850 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-violet-650/10 text-violet-500 rounded-xl"><BarChart3 className="h-5 w-5" /></div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Pipeline</p>
                  <p className="text-xl font-black text-slate-900 dark:text-white mt-1 truncate" title={formatCurrency(activePipelineValueSum)}>
                    {formatCurrency(activePipelineValueSum)}
                  </p>
                </div>
              </div>
            </div>

            {/* Tab selector */}
            <div className="space-y-6">
              
              <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6 overflow-x-auto whitespace-nowrap pb-1">
                <button
                  onClick={() => setActiveTab("overview")}
                  className={`pb-3 text-xs font-extrabold uppercase tracking-widest transition-all relative cursor-pointer border-none bg-transparent ${
                    activeTab === "overview" 
                      ? "text-blue-600" 
                      : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  }`}
                >
                  {activeTab === "overview" && (
                    <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                  )}
                  Overview & Pipeline
                </button>
                <button
                  onClick={() => setActiveTab("listings")}
                  className={`pb-3 text-xs font-extrabold uppercase tracking-widest transition-all relative cursor-pointer border-none bg-transparent ${
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
                  className={`pb-3 text-xs font-extrabold uppercase tracking-widest transition-all relative cursor-pointer border-none bg-transparent ${
                    activeTab === "leads" 
                      ? "text-blue-600" 
                      : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  }`}
                >
                  {activeTab === "leads" && (
                    <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                  )}
                  CRM Leads Inbox ({inquiries.length})
                </button>
                <button
                  onClick={() => setActiveTab("calendar")}
                  className={`pb-3 text-xs font-extrabold uppercase tracking-widest transition-all relative cursor-pointer border-none bg-transparent ${
                    activeTab === "calendar" 
                      ? "text-blue-600" 
                      : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  }`}
                >
                  {activeTab === "calendar" && (
                    <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                  )}
                  Calendar & Tasks ({appointments.length + tasks.filter(t => !t.completed).length})
                </button>
                <button
                  onClick={() => setActiveTab("commission")}
                  className={`pb-3 text-xs font-extrabold uppercase tracking-widest transition-all relative cursor-pointer border-none bg-transparent ${
                    activeTab === "commission" 
                      ? "text-blue-600" 
                      : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  }`}
                >
                  {activeTab === "commission" && (
                    <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                  )}
                  Commissions Ledger
                </button>
              </div>

              {/* Sub-view switcher */}
              <div className="min-h-[400px]">
                <AnimatePresence mode="wait">
                  
                  {/* TAB 1: OVERVIEW & PIPELINE */}
                  {activeTab === "overview" && (
                    <motion.div
                      key="overview-tab"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-6"
                    >
                      {/* Active Transactions Deal Pipeline */}
                      <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-850 p-6 rounded-3xl shadow-sm space-y-6 text-left">
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="font-extrabold text-sm text-slate-950 dark:text-white flex items-center gap-2">
                              <Activity className="h-4.5 w-4.5 text-blue-500" /> Transaction Pipeline Tracker
                            </h3>
                            <p className="text-[10px] text-slate-400 font-light mt-0.5">Stage progression of active deals in Rajesh Mehta&apos;s portfolio</p>
                          </div>
                        </div>

                        {/* Interactive Pipeline Lanes */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          
                          {/* Lane 1: Active Listing */}
                          <div className="bg-slate-50 dark:bg-slate-950/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-850 space-y-3">
                            <div className="flex justify-between items-center pb-2 border-b border-slate-200/50 dark:border-slate-800">
                              <span className="text-[10px] font-black uppercase text-blue-550 dark:text-blue-450 tracking-wider">Active Listing</span>
                              <span className="text-[10px] font-bold text-slate-400 bg-slate-200 dark:bg-slate-900 px-2 py-0.5 rounded-full">{pipelineCounts.listing}</span>
                            </div>
                            <div className="space-y-2.5">
                              {myListings.filter(p => (dealStages[p.id] || "listing") === "listing").map(listing => (
                                <div key={listing.id} className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200/40 dark:border-slate-800/80 shadow-xs text-xs space-y-2">
                                  <h4 className="font-extrabold text-slate-850 dark:text-slate-100 line-clamp-1">{listing.title}</h4>
                                  <p className="font-black text-blue-600 dark:text-blue-450">{formatCurrency(listing.price)}</p>
                                  <div className="flex justify-end gap-1 pt-1.5 border-t border-slate-100 dark:border-slate-850">
                                    <button 
                                      onClick={() => updatePropertyStage(listing.id, "offer")}
                                      className="px-2 py-1 bg-blue-600/10 text-blue-500 rounded text-[9px] font-bold hover:bg-blue-600/20 cursor-pointer border-none"
                                    >
                                      Move to Offer ➔
                                    </button>
                                  </div>
                                </div>
                              ))}
                              {pipelineCounts.listing === 0 && (
                                <p className="text-[10px] text-slate-400 dark:text-slate-650 text-center py-4 font-bold">No deals in listing.</p>
                              )}
                            </div>
                          </div>

                          {/* Lane 2: Under Offer */}
                          <div className="bg-slate-50 dark:bg-slate-950/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-850 space-y-3">
                            <div className="flex justify-between items-center pb-2 border-b border-slate-200/50 dark:border-slate-800">
                              <span className="text-[10px] font-black uppercase text-amber-500 tracking-wider">Under Offer</span>
                              <span className="text-[10px] font-bold text-slate-400 bg-slate-200 dark:bg-slate-900 px-2 py-0.5 rounded-full">{pipelineCounts.offer}</span>
                            </div>
                            <div className="space-y-2.5">
                              {myListings.filter(p => dealStages[p.id] === "offer").map(listing => (
                                <div key={listing.id} className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200/40 dark:border-slate-800/80 shadow-xs text-xs space-y-2">
                                  <h4 className="font-extrabold text-slate-850 dark:text-slate-100 line-clamp-1">{listing.title}</h4>
                                  <p className="font-black text-amber-500">{formatCurrency(listing.price)}</p>
                                  <div className="flex justify-between gap-1 pt-1.5 border-t border-slate-100 dark:border-slate-850">
                                    <button 
                                      onClick={() => updatePropertyStage(listing.id, "listing")}
                                      className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-450 rounded text-[9px] font-bold cursor-pointer border-none"
                                    >
                                      🠔 Back
                                    </button>
                                    <button 
                                      onClick={() => updatePropertyStage(listing.id, "escrow")}
                                      className="px-2 py-1 bg-amber-500/10 text-amber-550 rounded text-[9px] font-bold hover:bg-amber-550/20 cursor-pointer border-none"
                                    >
                                      To Escrow ➔
                                    </button>
                                  </div>
                                </div>
                              ))}
                              {pipelineCounts.offer === 0 && (
                                <p className="text-[10px] text-slate-400 dark:text-slate-650 text-center py-4 font-bold">No active offers.</p>
                              )}
                            </div>
                          </div>

                          {/* Lane 3: In Escrow */}
                          <div className="bg-slate-50 dark:bg-slate-950/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-850 space-y-3">
                            <div className="flex justify-between items-center pb-2 border-b border-slate-200/50 dark:border-slate-800">
                              <span className="text-[10px] font-black uppercase text-indigo-500 tracking-wider">In Escrow</span>
                              <span className="text-[10px] font-bold text-slate-400 bg-slate-200 dark:bg-slate-900 px-2 py-0.5 rounded-full">{pipelineCounts.escrow}</span>
                            </div>
                            <div className="space-y-2.5">
                              {myListings.filter(p => dealStages[p.id] === "escrow").map(listing => (
                                <div key={listing.id} className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200/40 dark:border-slate-800/80 shadow-xs text-xs space-y-2">
                                  <h4 className="font-extrabold text-slate-850 dark:text-slate-100 line-clamp-1">{listing.title}</h4>
                                  <p className="font-black text-indigo-550">{formatCurrency(listing.price)}</p>
                                  <div className="flex justify-between gap-1 pt-1.5 border-t border-slate-100 dark:border-slate-850">
                                    <button 
                                      onClick={() => updatePropertyStage(listing.id, "offer")}
                                      className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-450 rounded text-[9px] font-bold cursor-pointer border-none"
                                    >
                                      🠔 Back
                                    </button>
                                    <button 
                                      onClick={() => updatePropertyStage(listing.id, "closed")}
                                      className="px-2 py-1 bg-indigo-500/10 text-indigo-500 rounded text-[9px] font-bold hover:bg-indigo-550/20 cursor-pointer border-none"
                                    >
                                      Close Deal ✓
                                    </button>
                                  </div>
                                </div>
                              ))}
                              {pipelineCounts.escrow === 0 && (
                                <p className="text-[10px] text-slate-400 dark:text-slate-650 text-center py-4 font-bold">No deals in escrow.</p>
                              )}
                            </div>
                          </div>

                          {/* Lane 4: Closed / Sold */}
                          <div className="bg-slate-50 dark:bg-slate-950/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-850 space-y-3">
                            <div className="flex justify-between items-center pb-2 border-b border-slate-200/50 dark:border-slate-800">
                              <span className="text-[10px] font-black uppercase text-emerald-500 tracking-wider">Closed / Sold</span>
                              <span className="text-[10px] font-bold text-slate-400 bg-slate-200 dark:bg-slate-900 px-2 py-0.5 rounded-full">{pipelineCounts.closed}</span>
                            </div>
                            <div className="space-y-2.5">
                              {myListings.filter(p => dealStages[p.id] === "closed").map(listing => (
                                <div key={listing.id} className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200/40 dark:border-slate-800/80 shadow-xs text-xs space-y-2 relative overflow-hidden">
                                  <div className="absolute top-0 right-0 p-1 bg-emerald-500 text-white rounded-bl">
                                    <Check className="h-3 w-3 stroke-[3]" />
                                  </div>
                                  <h4 className="font-extrabold text-slate-850 dark:text-slate-100 line-clamp-1 pr-4">{listing.title}</h4>
                                  <p className="font-black text-emerald-600 dark:text-emerald-450">{formatCurrency(listing.price)}</p>
                                  <div className="flex justify-start gap-1 pt-1.5 border-t border-slate-100 dark:border-slate-850">
                                    <button 
                                      onClick={() => updatePropertyStage(listing.id, "escrow")}
                                      className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-450 rounded text-[9px] font-bold cursor-pointer border-none"
                                    >
                                      Re-open Escrow
                                    </button>
                                  </div>
                                </div>
                              ))}
                              {pipelineCounts.closed === 0 && (
                                <p className="text-[10px] text-slate-400 dark:text-slate-650 text-center py-4 font-bold">No closed deals.</p>
                              )}
                            </div>
                          </div>

                        </div>
                      </div>

                      {/* Secondary row: Schedule & Tasks Checklist */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-left">
                        
                        {/* Upcoming Schedule Widget */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-850 p-6 rounded-3xl shadow-sm space-y-4">
                          <div className="flex justify-between items-center">
                            <h3 className="font-extrabold text-sm text-slate-950 dark:text-white flex items-center gap-2">
                              <Calendar className="h-4.5 w-4.5 text-blue-500" /> Agenda & Showings
                            </h3>
                            <button
                              onClick={() => {
                                setApptClient(inquiries[0]?.name || "");
                                setApptPropertyId(myListings[0]?.id || "");
                                setIsAppointmentModalOpen(true);
                              }}
                              className="text-[10px] font-bold text-blue-500 bg-blue-500/10 px-2.5 py-1.5 rounded-lg hover:bg-blue-600/20 transition-colors border-none cursor-pointer"
                            >
                              + New Event
                            </button>
                          </div>

                          <div className="space-y-3.5 pt-2">
                            {appointments.map((appt) => (
                              <div key={appt.id} className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-100 dark:border-slate-850 flex justify-between items-start gap-4 text-xs">
                                <div className="space-y-1.5">
                                  <div className="flex items-center gap-2">
                                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-blue-600/10 text-blue-500">
                                      {appt.type}
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                                      <Clock className="h-3.5 w-3.5" /> {formatRelativeDate(appt.dateTime)}
                                    </span>
                                  </div>
                                  <p className="font-bold text-slate-900 dark:text-white">
                                    Client: {appt.clientName}
                                  </p>
                                  <p className="text-slate-450 dark:text-slate-400 text-[10px] line-clamp-1" title={appt.propertyTitle}>
                                    Listing: {appt.propertyTitle}
                                  </p>
                                  {appt.notes && (
                                    <p className="text-[10px] text-slate-500 dark:text-slate-450 italic">&ldquo;{appt.notes}&rdquo;</p>
                                  )}
                                </div>
                                <button
                                  onClick={() => handleDeleteAppointment(appt.id)}
                                  className="p-1 text-slate-400 hover:text-red-500 cursor-pointer bg-transparent border-none"
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                            {appointments.length === 0 && (
                              <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-12 font-bold">
                                No scheduled showings or appointments.
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Recent Tasks Widget */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-850 p-6 rounded-3xl shadow-sm space-y-4">
                          <h3 className="font-extrabold text-sm text-slate-950 dark:text-white flex items-center gap-2">
                            <CheckSquare className="h-4.5 w-4.5 text-blue-500" /> Action Items / Tasks
                          </h3>

                          {/* Quick Add Task */}
                          <form onSubmit={handleAddTask} className="flex gap-2">
                            <input
                              type="text"
                              value={taskText}
                              onChange={(e) => setTaskText(e.target.value)}
                              placeholder="Add action item (e.g. Schedule floor planner)..."
                              required
                              className="bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-850 text-slate-850 dark:text-white placeholder-slate-400 outline-none w-full"
                            />
                            <button
                              type="submit"
                              className="px-4 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors border-none cursor-pointer"
                            >
                              Add
                            </button>
                          </form>

                          <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                            {tasks.map((task) => (
                              <div key={task.id} className="flex justify-between items-center p-2 hover:bg-slate-50 dark:hover:bg-slate-950 rounded-xl transition-colors text-xs">
                                <button
                                  type="button"
                                  onClick={() => handleToggleTask(task.id)}
                                  className="flex items-center gap-3 text-left font-semibold text-slate-800 dark:text-slate-250 cursor-pointer bg-transparent border-none outline-none"
                                >
                                  {task.completed ? (
                                    <CheckSquare className="h-4.5 w-4.5 text-emerald-500 flex-shrink-0" />
                                  ) : (
                                    <Square className="h-4.5 w-4.5 text-slate-400 dark:text-slate-650 flex-shrink-0" />
                                  )}
                                  <span className={task.completed ? "line-through text-slate-400 dark:text-slate-600 font-light" : ""}>
                                    {task.text}
                                  </span>
                                </button>
                                <button
                                  onClick={() => handleDeleteTask(task.id)}
                                  className="p-1 text-slate-400 hover:text-red-500 cursor-pointer bg-transparent border-none"
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                            {tasks.length === 0 && (
                              <p className="text-xs text-slate-450 dark:text-slate-600 text-center py-8 font-bold">
                                No outstanding checklist tasks.
                              </p>
                            )}
                          </div>
                        </div>

                      </div>
                    </motion.div>
                  )}

                  {/* TAB 2: PROPERTY LISTINGS */}
                  {activeTab === "listings" && (
                    <motion.div
                      key="listings-tab"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-6"
                    >
                      <div className="flex justify-between items-center mb-2 text-left">
                        <div>
                          <h3 className="font-extrabold text-sm text-slate-950 dark:text-white">Active Portal Listings</h3>
                          <p className="text-[10px] text-slate-400">Manage listing details, stage pipelines, or remove outdated entries</p>
                        </div>
                        <button
                          onClick={() => setIsAddModalOpen(true)}
                          className="px-3 py-2 rounded-xl bg-blue-600/10 hover:bg-blue-600/25 text-blue-500 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border-none"
                        >
                          <PlusCircle className="h-4 w-4" /> Add Listing
                        </button>
                      </div>

                      {myListings.length === 0 ? (
                        <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-850 rounded-3xl space-y-4">
                          <p className="text-xs font-bold text-slate-450">You don&apos;t have any active listings yet.</p>
                          <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold transition-all shadow-md hover:bg-blue-700 cursor-pointer border-none"
                          >
                            Create Your First Listing
                          </button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {myListings.map((listing) => {
                            const stage = dealStages[listing.id] || "listing";
                            return (
                              <div 
                                key={listing.id}
                                className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-200/60 dark:border-slate-850 shadow-sm flex flex-col hover:shadow-md transition-shadow relative group text-left"
                              >
                                <div className="h-44 bg-slate-100 relative overflow-hidden">
                                  <img 
                                    src={listing.images[0] || "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=600&q=80"} 
                                    alt={listing.title}
                                    className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
                                  />
                                  
                                  {/* Type and Stage badges */}
                                  <div className="absolute top-3 left-3 flex gap-2">
                                    <span className="px-2 py-0.5 rounded-full bg-slate-900/85 backdrop-blur-md text-[9px] font-black uppercase text-white tracking-widest border border-white/10">
                                      {listing.type}
                                    </span>
                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                      stage === "listing"
                                        ? "bg-blue-600/90 text-white"
                                        : stage === "offer"
                                        ? "bg-amber-500/90 text-slate-950"
                                        : stage === "escrow"
                                        ? "bg-indigo-600/90 text-white"
                                        : "bg-emerald-600/90 text-white"
                                    }`}>
                                      {stage === "listing" ? "Active" : stage === "offer" ? "Offer" : stage === "escrow" ? "Escrow" : "Closed"}
                                    </span>
                                  </div>
                                </div>

                                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                                  <div className="space-y-1">
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1">
                                      <MapPin className="h-3 w-3 text-blue-500 flex-shrink-0" /> {listing.city}
                                    </p>
                                    <h4 className="font-extrabold text-sm text-slate-800 dark:text-white line-clamp-1">{listing.title}</h4>
                                    <h3 className="font-black text-base text-blue-600 dark:text-blue-450 mt-1">{formatCurrency(listing.price)}</h3>
                                  </div>

                                  <div className="pt-3 border-t border-slate-100 dark:border-slate-850 space-y-3">
                                    
                                    {/* Action to change deal pipeline stage */}
                                    <div className="flex justify-between items-center text-[10px] font-bold">
                                      <span className="text-slate-400">PIPE STAGE:</span>
                                      <select
                                        value={stage}
                                        onChange={(e) => updatePropertyStage(listing.id, e.target.value as any)}
                                        className="bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-850 px-2 py-1 rounded text-[10px] font-extrabold outline-none cursor-pointer text-slate-800 dark:text-white"
                                      >
                                        <option value="listing">Active Listing</option>
                                        <option value="offer">Under Offer</option>
                                        <option value="escrow">In Escrow</option>
                                        <option value="closed">Closed Deal</option>
                                      </select>
                                    </div>

                                    <div className="flex justify-between items-center pt-2">
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
                                          className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/40 text-red-500 transition-colors cursor-pointer border-none"
                                          title="Delete Listing"
                                        >
                                          <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                      </div>
                                    </div>

                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* TAB 3: CLIENT CRM LEADS & ACTIVITY NOTES */}
                  {activeTab === "leads" && (
                    <motion.div
                      key="leads-tab"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-6 text-left"
                    >
                      <div>
                        <h3 className="font-extrabold text-sm text-slate-950 dark:text-white">CRM Client Database</h3>
                        <p className="text-[10px] text-slate-400">Access client history logs, follow-up timelines, and schedule showings</p>
                      </div>

                      {inquiries.length === 0 ? (
                        <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-850 rounded-3xl">
                          <p className="text-xs font-bold text-slate-400">No CRM client accounts available yet.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                          
                          {/* Leads List Panel */}
                          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-850 rounded-3xl overflow-hidden shadow-sm divide-y divide-slate-100 dark:divide-slate-850 lg:col-span-1">
                            {inquiries.map((lead) => (
                              <button
                                key={lead.id}
                                onClick={() => setSelectedLeadId(lead.id)}
                                className={`w-full p-4 flex gap-3 text-left transition-colors border-none outline-none cursor-pointer ${
                                  selectedLeadId === lead.id
                                    ? "bg-blue-600/5 dark:bg-blue-650/10 border-l-4 border-l-blue-600"
                                    : "bg-transparent hover:bg-slate-50/50 dark:hover:bg-slate-950/20"
                                }`}
                              >
                                <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-200/30">
                                  <img src={lead.propertyImage} alt={lead.propertyTitle} className="w-full h-full object-cover" />
                                </div>
                                <div className="space-y-1 min-w-0 flex-1">
                                  <div className="flex justify-between items-center gap-1">
                                    <span className="text-xs font-black text-slate-900 dark:text-white truncate">{lead.name}</span>
                                    <span className="text-[8px] text-slate-400 flex-shrink-0">{formatRelativeDate(lead.timestamp).split(" at")[0]}</span>
                                  </div>
                                  <p className="text-[9px] font-bold text-slate-450 dark:text-slate-400 truncate">{lead.propertyTitle}</p>
                                  <span className={`inline-block px-1.5 py-0.5 rounded-full text-[8px] font-bold uppercase ${
                                    lead.status === "new"
                                      ? "bg-red-500/10 text-red-500"
                                      : lead.status === "contacted"
                                      ? "bg-blue-600/10 text-blue-500"
                                      : "bg-emerald-500/10 text-emerald-500"
                                  }`}>
                                    {lead.status === "new" ? "New" : lead.status === "contacted" ? "Contacted" : "Closed"}
                                  </span>
                                </div>
                              </button>
                            ))}
                          </div>

                          {/* Lead Detail & Timeline log */}
                          <div className="lg:col-span-2">
                            {selectedLead ? (
                              <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-850 p-6 rounded-3xl shadow-sm space-y-6">
                                
                                {/* Lead Details Header */}
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100 dark:border-slate-850">
                                  <div>
                                    <h4 className="text-base font-black text-slate-900 dark:text-white">{selectedLead.name}</h4>
                                    <p className="text-[10px] text-slate-450 dark:text-slate-400 mt-0.5 flex items-center gap-1.5 font-bold">
                                      Interested in: <Link href={`/properties/${selectedLead.propertyId}`} className="text-blue-500 hover:underline">{selectedLead.propertyTitle}</Link>
                                    </p>
                                  </div>

                                  {/* Update lead status */}
                                  <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 p-1.5 rounded-xl border border-slate-200/40 dark:border-slate-850">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1.5">Stage:</span>
                                    <select
                                      value={selectedLead.status}
                                      onChange={(e) => handleLeadStatusChange(selectedLead.id, e.target.value as any)}
                                      className="bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 px-2 py-1 rounded-lg text-[9px] font-extrabold outline-none cursor-pointer text-slate-800 dark:text-white"
                                    >
                                      <option value="new">New Inquiry</option>
                                      <option value="contacted">Contacted</option>
                                      <option value="closed">Closed / Nurture</option>
                                    </select>
                                  </div>
                                </div>

                                {/* Contact Methods */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
                                  <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-850 space-y-1">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Email Address</span>
                                    <a href={`mailto:${selectedLead.email}`} className="text-slate-800 dark:text-slate-200 hover:text-blue-500 flex items-center gap-2 font-bold break-all">
                                      <Mail className="h-4 w-4 text-slate-400 flex-shrink-0" /> {selectedLead.email}
                                    </a>
                                  </div>
                                  <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-850 space-y-1">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Phone Number</span>
                                    <a href={`tel:${selectedLead.phone}`} className="text-slate-800 dark:text-slate-200 hover:text-blue-500 flex items-center gap-2 font-bold">
                                      <Phone className="h-4 w-4 text-slate-400 flex-shrink-0" /> {selectedLead.phone || "No phone listed"}
                                    </a>
                                  </div>
                                </div>

                                {/* Lead Original Message */}
                                <div className="space-y-1.5">
                                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Web Form Message</span>
                                  <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-850 text-xs text-slate-650 dark:text-slate-350 leading-relaxed font-light italic">
                                    &ldquo;{selectedLead.message}&rdquo;
                                  </div>
                                </div>

                                {/* Dynamic Lead Activity Timeline Logs */}
                                <div className="space-y-3">
                                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Activity Logs & Notes</span>
                                  
                                  {/* Add note Form */}
                                  <div className="flex gap-2">
                                    <input
                                      type="text"
                                      value={newNoteText}
                                      onChange={(e) => setNewNoteText(e.target.value)}
                                      placeholder="Log details (e.g. Called client, sent contract)..."
                                      className="flex-1 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-850 text-xs text-slate-800 dark:text-white placeholder-slate-400 outline-none w-full"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => addLeadNote(selectedLead.id)}
                                      className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all border-none cursor-pointer flex items-center gap-1.5"
                                    >
                                      Log Note
                                    </button>
                                  </div>

                                  {/* Timeline visual representation */}
                                  <div className="pt-4 border-l-2 border-slate-200 dark:border-slate-800 pl-4 space-y-4">
                                    {(leadNotes[selectedLead.id] || []).map((note) => (
                                      <div key={note.id} className="relative text-xs space-y-1">
                                        {/* Dot ornament */}
                                        <div className="absolute w-2.5 h-2.5 rounded-full bg-blue-600 -left-[21.5px] top-1.5 border border-white dark:border-slate-900" />
                                        <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold">
                                          <span>Agent Note</span>
                                          <span>{formatRelativeDate(note.timestamp)}</span>
                                        </div>
                                        <p className="text-slate-700 dark:text-slate-300 font-light leading-relaxed">{note.text}</p>
                                      </div>
                                    ))}
                                    {(leadNotes[selectedLead.id] || []).length === 0 && (
                                      <p className="text-xs text-slate-400 font-bold py-2">No custom activity logs registered.</p>
                                    )}
                                  </div>
                                </div>

                              </div>
                            ) : (
                              <div className="p-12 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-850 rounded-3xl text-center text-slate-450">
                                Select a lead from the list to view timeline details.
                              </div>
                            )}
                          </div>

                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* TAB 4: CALENDAR & TASKS PLANNER */}
                  {activeTab === "calendar" && (
                    <motion.div
                      key="calendar-tab"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-6 text-left"
                    >
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                        
                        {/* Appointments Planner */}
                        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-850 p-6 rounded-3xl shadow-sm space-y-6">
                          <div className="flex justify-between items-center">
                            <div>
                              <h3 className="font-extrabold text-sm text-slate-950 dark:text-white">Showing & Appointments Scheduler</h3>
                              <p className="text-[10px] text-slate-450 dark:text-slate-400">Total of {appointments.length} active scheduled appointments</p>
                            </div>
                            <button
                              onClick={() => setIsAppointmentModalOpen(true)}
                              className="px-3 py-2 rounded-xl bg-blue-600/10 hover:bg-blue-600/25 text-blue-500 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border-none"
                            >
                              <PlusCircle className="h-4 w-4" /> Schedule Appointment
                            </button>
                          </div>

                          <div className="space-y-4">
                            {appointments.map((appt) => (
                              <div key={appt.id} className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-850 flex justify-between items-start gap-4">
                                <div className="space-y-2.5 text-xs">
                                  <div className="flex items-center gap-2">
                                    <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-blue-600/10 text-blue-500">
                                      {appt.type}
                                    </span>
                                    <span className="text-[10px] text-slate-450 font-bold flex items-center gap-1">
                                      <Clock className="h-3.5 w-3.5 text-slate-400" /> {new Date(appt.dateTime).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                                    </span>
                                  </div>
                                  
                                  <div className="space-y-1">
                                    <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">Client: {appt.clientName}</h4>
                                    <p className="text-slate-450 text-[10px] font-bold">Property: {appt.propertyTitle}</p>
                                    <p className="text-slate-450 text-[10px] font-semibold">Contact: {appt.clientEmail}</p>
                                  </div>

                                  {appt.notes && (
                                    <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-100 dark:border-slate-850/60 text-[10px] font-light text-slate-500 dark:text-slate-400 italic">
                                      Notes: &ldquo;{appt.notes}&rdquo;
                                    </div>
                                  )}
                                </div>

                                <button
                                  onClick={() => handleDeleteAppointment(appt.id)}
                                  className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-950/20 text-red-500 transition-colors cursor-pointer border-none"
                                  title="Cancel Appointment"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            ))}

                            {appointments.length === 0 && (
                              <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-12 font-bold">
                                No showings or appointments scheduled.
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Full-width Tasks checklist */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-850 p-6 rounded-3xl shadow-sm space-y-6">
                          <h3 className="font-extrabold text-sm text-slate-950 dark:text-white">CRM Checklist Tasks</h3>
                          
                          {/* Detailed task form */}
                          <form onSubmit={handleAddTask} className="space-y-3">
                            <input
                              type="text"
                              value={taskText}
                              onChange={(e) => setTaskText(e.target.value)}
                              placeholder="Create a task (e.g. Call Rajesh)..."
                              required
                              className="bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-850 text-slate-850 dark:text-white outline-none w-full"
                            />
                            
                            <div className="grid grid-cols-2 gap-2">
                              <select
                                value={taskPriority}
                                onChange={(e: any) => setTaskPriority(e.target.value)}
                                className="bg-slate-50 dark:bg-slate-950 px-3 py-2 text-[10px] font-bold rounded-xl border border-slate-200 dark:border-slate-850 text-slate-800 dark:text-white"
                              >
                                <option value="high">High Priority</option>
                                <option value="medium">Medium Priority</option>
                                <option value="low">Low Priority</option>
                              </select>
                              <input
                                type="date"
                                value={taskDueDate}
                                onChange={(e) => setTaskDueDate(e.target.value)}
                                className="bg-slate-50 dark:bg-slate-950 px-3 py-2 text-[10px] rounded-xl border border-slate-200 dark:border-slate-850 text-slate-800 dark:text-white outline-none"
                              />
                            </div>
                            
                            <button
                              type="submit"
                              className="w-full py-2.5 bg-blue-600 hover:bg-blue-750 text-white rounded-xl text-xs font-bold transition-all border-none cursor-pointer"
                            >
                              Add Action Task
                            </button>
                          </form>

                          <div className="space-y-2 pt-2">
                            {tasks.map((task) => (
                              <div key={task.id} className="flex justify-between items-center p-2.5 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-100 dark:border-slate-850 text-xs">
                                <button
                                  type="button"
                                  onClick={() => handleToggleTask(task.id)}
                                  className="flex items-center gap-3 text-left font-semibold text-slate-850 dark:text-slate-200 cursor-pointer bg-transparent border-none outline-none w-full"
                                >
                                  {task.completed ? (
                                    <CheckSquare className="h-4.5 w-4.5 text-emerald-500 flex-shrink-0" />
                                  ) : (
                                    <Square className="h-4.5 w-4.5 text-slate-400 dark:text-slate-650 flex-shrink-0" />
                                  )}
                                  <div className="space-y-0.5">
                                    <p className={task.completed ? "line-through text-slate-400 dark:text-slate-600 font-light" : "font-bold text-slate-800 dark:text-white"}>
                                      {task.text}
                                    </p>
                                    <p className="text-[9px] text-slate-400">
                                      Due: {task.dueDate} • <span className={`uppercase font-black ${
                                        task.priority === "high" ? "text-red-500" : task.priority === "medium" ? "text-amber-500" : "text-slate-400"
                                      }`}>{task.priority}</span>
                                    </p>
                                  </div>
                                </button>
                                <button
                                  onClick={() => handleDeleteTask(task.id)}
                                  className="p-1.5 text-slate-400 hover:text-red-550 cursor-pointer bg-transparent border-none"
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>

                      </div>
                    </motion.div>
                  )}

                  {/* TAB 5: COMMISSION LEDGER */}
                  {activeTab === "commission" && (
                    <motion.div
                      key="commission-tab"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-6 text-left"
                    >
                      {/* Financial Projection Dashboard */}
                      <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-850 p-6 rounded-3xl shadow-sm space-y-6">
                        
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="font-extrabold text-sm text-slate-950 dark:text-white flex items-center gap-2">
                              <Award className="h-4.5 w-4.5 text-blue-500" /> Revenue & Commission Calculator
                            </h3>
                            <p className="text-[10px] text-slate-450 dark:text-slate-400 font-light">Calculated at a standard 2.5% agency commission rate on property closures</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          
                          <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-100 dark:border-slate-850 space-y-1">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Earned Commission</span>
                            <h2 className="text-2xl font-black text-emerald-600 dark:text-emerald-450">{formatCurrency(earnedCommission)}</h2>
                            <p className="text-[9px] text-slate-400 mt-1">From deals successfully closed ({pipelineCounts.closed} properties)</p>
                          </div>

                          <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-100 dark:border-slate-850 space-y-1">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Potential Pipeline Commission</span>
                            <h2 className="text-2xl font-black text-blue-600 dark:text-blue-450">{formatCurrency(potentialCommission)}</h2>
                            <p className="text-[9px] text-slate-400 mt-1">From Active/Offer/Escrow properties ({myListings.length - pipelineCounts.closed} items)</p>
                          </div>

                          <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-100 dark:border-slate-850 space-y-1">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Valuation Potential</span>
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white">{formatCurrency(totalPortfolioValue)}</h2>
                            <p className="text-[9px] text-slate-400 mt-1">Total asking values in Rajesh Mehta&apos;s active portfolio</p>
                          </div>

                        </div>

                        {/* Forecast ledger list */}
                        <div className="space-y-4">
                          <h4 className="font-extrabold text-xs text-slate-900 dark:text-white uppercase tracking-wider">Revenue Breakdown by Property</h4>
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs text-left border-collapse">
                              <thead>
                                <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                                  <th className="py-2.5">Listing Title</th>
                                  <th className="py-2.5">City</th>
                                  <th className="py-2.5">Deal Status</th>
                                  <th className="py-2.5 text-right">Property Price</th>
                                  <th className="py-2.5 text-right">Projected Commission (2.5%)</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 dark:divide-slate-850 font-medium">
                                {myListings.map((listing) => {
                                  const stage = dealStages[listing.id] || "listing";
                                  const commission = Math.round(listing.price * 0.025);
                                  return (
                                    <tr key={listing.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-colors">
                                      <td className="py-3 font-bold text-slate-900 dark:text-white">{listing.title}</td>
                                      <td className="py-3 text-slate-455">{listing.city}</td>
                                      <td className="py-3">
                                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                          stage === "listing" ? "bg-blue-600/10 text-blue-500" :
                                          stage === "offer" ? "bg-amber-500/10 text-amber-500" :
                                          stage === "escrow" ? "bg-indigo-650/10 text-indigo-500" :
                                          "bg-emerald-500/10 text-emerald-500"
                                        }`}>
                                          {stage === "listing" ? "Active" : stage === "offer" ? "Offer" : stage === "escrow" ? "Escrow" : "Closed"}
                                        </span>
                                      </td>
                                      <td className="py-3 text-right text-slate-900 dark:text-white">{formatCurrency(listing.price)}</td>
                                      <td className={`py-3 text-right font-black ${stage === "closed" ? "text-emerald-500" : "text-blue-500"}`}>{formatCurrency(commission)}</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>

                      </div>
                    </motion.div>
                  )}

                </AnimatePresence>
              </div>

            </div>

          </div>
        )}
      </main>

      {/* MODAL 1: CREATE PROPERTY LISTING */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl p-6 shadow-2xl space-y-6 relative overflow-hidden animate-in zoom-in-95 duration-200 my-8 max-h-[90vh] flex flex-col">
            
            {/* Title & Close */}
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-850">
              <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Building className="h-5 w-5 text-blue-500" /> Create New Property Listing
              </h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-350 hover:text-slate-800 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer border-none bg-transparent"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 text-red-650 dark:text-red-400 text-xs font-bold rounded-xl text-center">
                {formError}
              </div>
            )}

            <form onSubmit={handleAddListingSubmit} className="space-y-5 overflow-y-auto pr-1 flex-1 text-left">
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Property Title *</label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g. Waterfront Oceanview Duplex"
                    required
                    className="w-full bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-850 text-xs text-slate-800 dark:text-white placeholder-slate-400 outline-none"
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
                    className="w-full bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-850 text-xs text-slate-800 dark:text-white placeholder-slate-400 outline-none"
                  />
                </div>
              </div>

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
                    className="w-full bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-850 text-xs text-slate-800 dark:text-white outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Image URLs *</label>
                <input
                  type="text"
                  value={formImages}
                  onChange={(e) => setFormImages(e.target.value)}
                  required
                  className="w-full bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-850 text-xs text-slate-800 dark:text-white outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Description *</label>
                <textarea
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  rows={3}
                  required
                  className="w-full bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-850 text-xs text-slate-800 dark:text-white placeholder-slate-400 outline-none resize-none font-sans"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Amenities & Features</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-850">
                  {availableFeatures.map((feat) => {
                    const isChecked = formFeatures.includes(feat);
                    return (
                      <button
                        key={feat}
                        type="button"
                        onClick={() => handleFeatureToggle(feat)}
                        className={`flex items-center gap-2 p-2 rounded-xl text-[9px] font-bold text-left transition-colors border select-none cursor-pointer ${
                          isChecked
                            ? "bg-blue-600/10 border-blue-500/30 text-blue-500"
                            : "bg-white dark:bg-slate-900 border-slate-200/50 dark:border-slate-800 text-slate-650 dark:text-slate-405"
                        }`}
                      >
                        <div className={`w-3.5 h-3.5 rounded flex items-center justify-center border transition-all ${
                          isChecked ? "bg-blue-600 border-blue-500 text-white" : "border-slate-300 dark:border-slate-750 bg-transparent"
                        }`}>
                          {isChecked && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                        </div>
                        {feat}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-3 pt-3 border-t border-slate-100 dark:border-slate-850">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-805 text-xs font-bold text-slate-650 dark:text-slate-350 cursor-pointer bg-transparent"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-[2] py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs uppercase tracking-wider shadow-md cursor-pointer border-none"
                >
                  Publish Listing
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: SCHEDULE APPOINTMENT */}
      {isAppointmentModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-6 relative overflow-hidden animate-in zoom-in-95 duration-200 text-left">
            
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-850">
              <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-500" /> Schedule Appointment
              </h2>
              <button
                onClick={() => setIsAppointmentModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-350 hover:text-slate-800 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer border-none bg-transparent"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {apptError && (
              <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 text-red-650 dark:text-red-400 text-xs font-bold rounded-xl text-center">
                {apptError}
              </div>
            )}

            <form onSubmit={handleAddAppointment} className="space-y-4">
              
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Client (Lead Name) *</label>
                <select
                  value={apptClient}
                  onChange={(e) => setApptClient(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-850 text-xs text-slate-800 dark:text-white cursor-pointer outline-none"
                >
                  <option value="">Select a Client Lead</option>
                  {inquiries.map(inq => (
                    <option key={inq.id} value={inq.name}>{inq.name} ({inq.email})</option>
                  ))}
                  {inquiries.length === 0 && <option value="Walk-in Client">Walk-in Client</option>}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Property of Interest *</label>
                <select
                  value={apptPropertyId}
                  onChange={(e) => setApptPropertyId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-850 text-xs text-slate-800 dark:text-white cursor-pointer outline-none"
                >
                  <option value="">Select Property</option>
                  {myListings.map(prop => (
                    <option key={prop.id} value={prop.id}>{prop.title}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Appointment Type</label>
                  <select
                    value={apptType}
                    onChange={(e: any) => setApptType(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-850 text-xs text-slate-800 dark:text-white cursor-pointer outline-none"
                  >
                    <option value="Showing">Property Showing</option>
                    <option value="Contract Review">Contract Review</option>
                    <option value="Inspection">Property Inspection</option>
                    <option value="Listing Presentation">Listing Presentation</option>
                    <option value="Closing Meeting">Closing Meeting</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Date & Time *</label>
                  <input
                    type="datetime-local"
                    value={apptDateTime}
                    onChange={(e) => setApptDateTime(e.target.value)}
                    required
                    className="w-full bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-850 text-xs text-slate-800 dark:text-white outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Meeting Agenda Notes</label>
                <textarea
                  value={apptNotes}
                  onChange={(e) => setApptNotes(e.target.value)}
                  placeholder="Details of showing, client preferences, token discussion agenda..."
                  rows={2}
                  className="w-full bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-850 text-xs text-slate-800 dark:text-white placeholder-slate-400 outline-none resize-none font-sans"
                />
              </div>

              <div className="flex gap-3 pt-3 border-t border-slate-100 dark:border-slate-850">
                <button
                  type="button"
                  onClick={() => setIsAppointmentModalOpen(false)}
                  className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-805 text-xs font-bold text-slate-650 dark:text-slate-350 cursor-pointer bg-transparent"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-[2] py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs uppercase tracking-wider shadow-md cursor-pointer border-none"
                >
                  Schedule Event
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
