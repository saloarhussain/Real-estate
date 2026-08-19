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
  
  // Navigation Tabs: dashboard, crm-leads, messages, my-listings, analytics, calendar, marketing-kit, settings
  const [activeTab, setActiveTab] = useState<"dashboard" | "crm-leads" | "messages" | "my-listings" | "analytics" | "calendar" | "marketing-kit" | "settings">("messages");

  // Chat / Messages States
  const [chatSearchQuery, setChatSearchQuery] = useState("");
  const [chatSegment, setChatSegment] = useState<"all" | "unread" | "starred">("all");
  const [chatMessages, setChatMessages] = useState<Array<{
    id: string;
    sender: "buyer" | "agent" | "system";
    senderName: string;
    avatar?: string;
    text: string;
    time: string;
    interactiveCard?: {
      title: string;
      date: string;
      time: string;
      confirmed: boolean;
    };
  }>>([
    {
      id: "msg-1",
      sender: "system",
      senderName: "System",
      text: "Anjali Sharma viewed the 'Seaside Luxury Penthouse' brochure.",
      time: ""
    },
    {
      id: "msg-2",
      sender: "buyer",
      senderName: "Anjali Sharma",
      avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuDGYoG4vgbL7-JHZCMEuudI4tzD5zAA6h4W5K3xQrf9_qXawwzjjkX2C4bqSz4m7LV924amhr1xF8z58qQ4NT0vxMeSUe1xiYj37BXvZoKrLmnWlj5ld0TX873rzLaA_D6FtMCnQeczA_xxSeBYcplvJYvhW0M-TAGzoy2pSX9KS484Tjp2QFsFCBbdC9qo9uTIJGlD8xArD7IqTDYki8XMqFqAvSsY-yjUBQcZsXEjaPrF6jJu134",
      text: "Hi JD, I've reviewed the brochure for the Seaside Penthouse. The layout looks perfect. Is there availability to view it this Thursday?",
      time: "10:42 AM"
    },
    {
      id: "msg-3",
      sender: "agent",
      senderName: "JD",
      text: "Hello Anjali, I'm glad you liked the layout. The panoramic views are even more impressive in person.",
      time: "10:45 AM"
    },
    {
      id: "msg-4",
      sender: "agent",
      senderName: "JD",
      text: "I can arrange a private showing for Thursday. Would 2:00 PM or 4:30 PM work better for your schedule?",
      time: "10:45 AM"
    },
    {
      id: "msg-5",
      sender: "agent",
      senderName: "JD",
      text: "Showing Proposed",
      time: "10:46 AM",
      interactiveCard: {
        title: "Showing Proposed",
        date: "Thu, Oct 24",
        time: "2:00 PM",
        confirmed: false
      }
    }
  ]);
  const [typedMessage, setTypedMessage] = useState("");
  const [selectedConversationId, setSelectedConversationId] = useState("anjali");

  const conversationsList = [
    {
      id: "anjali",
      name: "Anjali Sharma",
      property: "Seaside Luxury Penthouse",
      pincodeColor: "text-vibrant-blue",
      avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuB0eEJyvRfzjnkVFAgMtdUWhhzVo69mDX3gr2_VMKI12IZEwRmoTj09eUwF30YEXIifjma8-_YxVPeYYk_DlI6iuioLMYZifBG16HfeDHh6V_xMF_fPzEC8i4EbwrTAdujvKhfpnqTnirtrkKCTHzN9qP6DPnBmyJ21MmqEKyL_NUlOL_GciZrcSR9SeaPsaydBfdNP3c1-H2b9mpwvUbKoyXMxgpzcahX6gY6pcCoFnzz0aqOHBxc",
      lastMsg: "The layout looks perfect. Is there availability to view it this Thursday?",
      time: "10:42 AM",
      unread: true,
      starred: false,
      online: true,
    },
    {
      id: "julian",
      name: "Julian Blackwood",
      property: "The Spire Residences, Unit 4B",
      pincodeColor: "text-outline",
      avatar: "JB",
      lastMsg: "I'll have my financial team review the HOA documents.",
      time: "Yesterday",
      unread: false,
      starred: false,
      online: false,
    },
    {
      id: "marcus",
      name: "Marcus Chen",
      property: "101 Park Ave Portfolio",
      pincodeColor: "text-outline",
      avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuC6pG44Wa0Nhtvr_JMTlUt7HF_OAeqNoNIrKFmyCOaeg-0v33o52qKIy6dabvu71viUHixo2-m2mN0iNx1WM0lZRhIJUgbgekbSfqDtDjCtTLsSvjF0YlVtvtipoWmQw6SPK0qrc60-7JzS4F4ZptelO8bg1dd0zLl9o5lG6PCGS2ppR11fcW0EzQji6LF96OqCwhx0srbjIJAQZ5Igf1qjv1RSf7UrPpp3vWRfZgEo5cOSVyK7LGs",
      lastMsg: "Thanks for the market analysis. We're holding for now.",
      time: "Tue",
      unread: false,
      starred: true,
      online: false,
    },
    {
      id: "elena",
      name: "Elena Rostova",
      property: "VIP Client",
      pincodeColor: "text-accent-gold",
      avatar: "ER",
      lastMsg: "Please find the wire transfer confirmation attached.",
      time: "Mon",
      unread: true,
      starred: false,
      online: false,
    }
  ];

  const getSelectedConversationMessages = () => {
    if (selectedConversationId === "anjali") {
      return chatMessages;
    }
    if (selectedConversationId === "julian") {
      return [
        {
          id: "msg-j-1",
          sender: "buyer" as const,
          senderName: "Julian Blackwood",
          text: "Hi Rajesh, I looked over the Unit 4B listing. I'll have my financial team review the HOA documents.",
          time: "Yesterday"
        }
      ];
    }
    if (selectedConversationId === "marcus") {
      return [
        {
          id: "msg-m-1",
          sender: "buyer" as const,
          senderName: "Marcus Chen",
          text: "Thanks for the market analysis. We're holding for now.",
          time: "Tue"
        }
      ];
    }
    if (selectedConversationId === "elena") {
      return [
        {
          id: "msg-e-1",
          sender: "system" as const,
          senderName: "System",
          text: "Elena Rostova shared a file: Wire_Transfer_Confirmation.pdf",
          time: ""
        },
        {
          id: "msg-e-2",
          sender: "buyer" as const,
          senderName: "Elena Rostova",
          text: "Please find the wire transfer confirmation attached.",
          time: "Mon"
        }
      ];
    }
    return [];
  };

  const handleSendChatMessage = () => {
    if (!typedMessage.trim()) return;
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newMsg = {
      id: "msg-custom-" + Date.now(),
      sender: "agent" as const,
      senderName: "JD",
      text: typedMessage.trim(),
      time: timeStr
    };
    setChatMessages(prev => [...prev, newMsg]);
    setTypedMessage("");
    setTimeout(() => {
      const container = document.getElementById("chat-container");
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }, 50);
  };

  const handleConfirmShowing = (msgId: string) => {
    setChatMessages(prev => prev.map(msg => {
      if (msg.id === msgId && msg.interactiveCard) {
        return {
          ...msg,
          interactiveCard: {
            ...msg.interactiveCard,
            confirmed: true
          }
        };
      }
      return msg;
    }));
    confetti({
      particleCount: 80,
      spread: 50,
      colors: ["#10b981"]
    });
  };

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
    <div className="min-h-screen bg-[#0b1326] text-[#dae2fd] font-sans flex flex-col transition-colors duration-300">
      {!isLoggedIn ? (
        <>
          <Header />
          <main className="flex-1 max-w-7xl mx-auto px-6 py-24 w-full flex items-center justify-center">
            {/* Locked State - Banner */}
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
          </main>
          <Footer />
        </>
      ) : (
        /* Agent Central portal layout when logged in */
        <div className="bg-surface font-body-md text-on-surface flex flex-col flex-1">
          {/* Header */}
          <header className="fixed top-0 w-full h-16 z-50 bg-deep-navy/90 backdrop-blur-md border-b border-outline-variant/10">
            <div className="h-16 px-gutter flex items-center justify-between">
              <div className="flex items-center gap-4 pl-6">
                <span className="material-symbols-outlined text-data-white">grid_view</span>
                <span className="font-headline-md text-data-white tracking-tight">Agent Central</span>
              </div>
              <div className="flex items-center gap-6 pr-6">
                <div className="flex items-center gap-2 px-3 py-1 bg-surface-container rounded-full border border-outline-variant/20">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                  <span className="font-label-caps text-[10px] text-on-surface-variant uppercase">Market Active</span>
                </div>
                <button className="material-symbols-outlined text-on-surface-variant hover:text-vibrant-blue transition-colors bg-transparent border-none cursor-pointer">notifications</button>
                <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-data-white font-label-caps text-xs">
                  {agentName ? agentName.split(" ").map(n => n[0]).join("") : "JD"}
                </div>
                <button
                  onClick={handleSignOut}
                  className="font-label-caps text-xs text-on-surface-variant hover:text-red-500 transition-colors bg-transparent border-none cursor-pointer ml-2"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </header>

          {/* Sidebar */}
          <aside className="fixed left-0 top-16 w-64 h-[calc(100vh-64px)] bg-surface-container-low border-r border-outline-variant/10 py-8 z-20">
            <nav className="flex flex-col gap-1">
              <button
                onClick={() => setActiveTab("dashboard")}
                className={`flex items-center px-6 py-3 font-label-caps text-sm tracking-wide text-left border-none cursor-pointer transition-all w-full bg-transparent ${
                  activeTab === "dashboard"
                    ? "bg-vibrant-blue/10 text-vibrant-blue border-r-2 border-vibrant-blue"
                    : "text-on-surface-variant hover:bg-surface-container-high"
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setActiveTab("crm-leads")}
                className={`flex items-center px-6 py-3 font-label-caps text-sm tracking-wide text-left border-none cursor-pointer transition-all w-full bg-transparent ${
                  activeTab === "crm-leads"
                    ? "bg-vibrant-blue/10 text-vibrant-blue border-r-2 border-vibrant-blue"
                    : "text-on-surface-variant hover:bg-surface-container-high"
                }`}
              >
                CRM Leads
              </button>
              <button
                onClick={() => setActiveTab("messages")}
                className={`flex items-center px-6 py-3 font-label-caps text-sm tracking-wide text-left border-none cursor-pointer transition-all w-full bg-transparent ${
                  activeTab === "messages"
                    ? "bg-vibrant-blue/10 text-vibrant-blue border-r-2 border-vibrant-blue"
                    : "text-on-surface-variant hover:bg-surface-container-high"
                }`}
              >
                Messages
              </button>
              <button
                onClick={() => setActiveTab("my-listings")}
                className={`flex items-center px-6 py-3 font-label-caps text-sm tracking-wide text-left border-none cursor-pointer transition-all w-full bg-transparent ${
                  activeTab === "my-listings"
                    ? "bg-vibrant-blue/10 text-vibrant-blue border-r-2 border-vibrant-blue"
                    : "text-on-surface-variant hover:bg-surface-container-high"
                }`}
              >
                My Listings
              </button>
              <button
                onClick={() => setActiveTab("analytics")}
                className={`flex items-center px-6 py-3 font-label-caps text-sm tracking-wide text-left border-none cursor-pointer transition-all w-full bg-transparent ${
                  activeTab === "analytics"
                    ? "bg-vibrant-blue/10 text-vibrant-blue border-r-2 border-vibrant-blue"
                    : "text-on-surface-variant hover:bg-surface-container-high"
                }`}
              >
                Analytics
              </button>

              <div className="mt-8 px-6 mb-2">
                <p className="font-label-caps text-[10px] text-outline uppercase tracking-[0.2em] text-left">Resources</p>
              </div>
              <button
                onClick={() => setActiveTab("marketing-kit")}
                className={`flex items-center px-6 py-3 font-label-caps text-sm tracking-wide text-left border-none cursor-pointer transition-all w-full bg-transparent ${
                  activeTab === "marketing-kit"
                    ? "bg-vibrant-blue/10 text-vibrant-blue border-r-2 border-vibrant-blue"
                    : "text-on-surface-variant hover:bg-surface-container-high"
                }`}
              >
                Marketing Kit
              </button>
              <button
                onClick={() => setActiveTab("settings")}
                className={`flex items-center px-6 py-3 font-label-caps text-sm tracking-wide text-left border-none cursor-pointer transition-all w-full bg-transparent ${
                  activeTab === "settings"
                    ? "bg-vibrant-blue/10 text-vibrant-blue border-r-2 border-vibrant-blue"
                    : "text-on-surface-variant hover:bg-surface-container-high"
                }`}
              >
                Settings
              </button>
            </nav>
          </aside>

          {/* Main Area */}
          
          {/* Main Area */}
          <main className="pl-64 pt-16 min-h-[calc(100vh-64px)] flex-1 bg-surface relative flex flex-col">
            <AnimatePresence mode="wait">
              {activeTab === "messages" && (
                /* MESSAGES SUB-VIEW */
                <motion.div
                  key="messages-tab"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col w-full h-[calc(100vh-64px)] font-body-md overflow-hidden bg-surface text-on-surface"
                >
                  <div className="flex flex-1 overflow-hidden h-full">
                    {/* Left Sidebar: Conversation List */}
                    <div className="w-1/3 min-w-[320px] max-w-[400px] bg-surface-container flex flex-col shadow-[4px_0_24px_-4px_rgba(2,6,23,0.4)] z-10">
                      {/* List Header */}
                      <div className="p-6 pb-4 text-left">
                        <h1 className="font-headline-md text-headline-md text-data-white mb-6">Messages</h1>
                        <div className="relative group">
                          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-vibrant-blue transition-colors">search</span>
                          <input 
                            className="w-full bg-surface py-3 pl-12 pr-4 rounded-full text-data-white font-body-md text-body-md border border-slate-surface focus:outline-none focus:border-vibrant-blue focus:shadow-[0_0_12px_rgba(37,99,235,0.2)] transition-all placeholder:text-outline" 
                            placeholder="Search buyers, properties..." 
                            type="text"
                            value={chatSearchQuery}
                            onChange={(e) => setChatSearchQuery(e.target.value)}
                          />
                        </div>
                      </div>
                      {/* Segmented Control */}
                      <div className="px-6 mb-4 flex gap-2">
                        <button 
                          onClick={() => setChatSegment("all")}
                          className={`flex-1 py-1.5 px-3 font-label-caps text-label-caps rounded-full text-center transition-colors border ${
                            chatSegment === "all" ? "bg-vibrant-blue text-data-white border-vibrant-blue" : "bg-surface hover:bg-surface-container-high text-on-surface-variant border-slate-surface"
                          }`}
                        >
                          All
                        </button>
                        <button 
                          onClick={() => setChatSegment("unread")}
                          className={`flex-1 py-1.5 px-3 font-label-caps text-label-caps rounded-full text-center transition-colors border ${
                            chatSegment === "unread" ? "bg-vibrant-blue text-data-white border-vibrant-blue" : "bg-surface hover:bg-surface-container-high text-on-surface-variant border-slate-surface"
                          }`}
                        >
                          Unread <span className="bg-vibrant-blue text-data-white text-[10px] px-1.5 py-0.5 rounded-full ml-1">2</span>
                        </button>
                        <button 
                          onClick={() => setChatSegment("starred")}
                          className={`flex-1 py-1.5 px-3 font-label-caps text-label-caps rounded-full text-center transition-colors border ${
                            chatSegment === "starred" ? "bg-vibrant-blue text-data-white border-vibrant-blue" : "bg-surface hover:bg-surface-container-high text-on-surface-variant border-slate-surface"
                          }`}
                        >
                          Starred
                        </button>
                      </div>
                      {/* Conversation List Scrollable Area */}
                      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
                        {conversationsList
                          .filter(c => {
                            if (chatSearchQuery.trim()) {
                              const q = chatSearchQuery.toLowerCase();
                              return c.name.toLowerCase().includes(q) || c.property.toLowerCase().includes(q);
                            }
                            return true;
                          })
                          .filter(c => {
                            if (chatSegment === "unread") return c.unread;
                            if (chatSegment === "starred") return c.starred;
                            return true;
                          })
                          .map((c) => (
                            <button
                              key={c.id}
                              onClick={() => setSelectedConversationId(c.id)}
                              className={`w-full text-left p-4 rounded-xl flex flex-col gap-2 relative transition-transform hover:scale-[1.01] border-none bg-transparent cursor-pointer ${
                                selectedConversationId === c.id ? "bg-surface-container-high" : "hover:bg-surface-container-highest"
                              }`}
                            >
                              {selectedConversationId === c.id && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-12 bg-vibrant-blue rounded-r-full"></div>
                              )}
                              <div className="flex justify-between items-start pl-2">
                                <div className="flex items-center gap-3">
                                  <div className="relative">
                                    {c.avatar.startsWith("http") ? (
                                      <img className="w-10 h-10 rounded-full object-cover" src={c.avatar} alt={c.name} />
                                    ) : (
                                      <div className="w-10 h-10 rounded-full bg-slate-surface flex items-center justify-center text-data-white font-headline-md text-sm">
                                        {c.avatar}
                                      </div>
                                    )}
                                    {c.online && (
                                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-surface-container-high"></div>
                                    )}
                                  </div>
                                  <div>
                                    <h3 className="font-body-md font-semibold text-data-white">{c.name}</h3>
                                    <p className={`font-data-mono text-data-mono text-[11px] ${c.pincodeColor}`}>{c.property}</p>
                                  </div>
                                </div>
                                <span className={`font-label-caps text-[10px] ${c.unread ? "text-vibrant-blue" : "text-outline"}`}>{c.time}</span>
                              </div>
                              <div className="pl-2 flex justify-between items-end gap-4 mt-1">
                                <p className="font-body-md text-sm text-data-white truncate">{c.lastMsg}</p>
                                {c.unread && (
                                  <div className="w-2 h-2 rounded-full bg-vibrant-blue flex-shrink-0 animate-pulse"></div>
                                )}
                              </div>
                            </button>
                          ))
                        }
                      </div>
                    </div>
                    {/* Right Panel: Active Thread */}
                    <div className="flex-1 flex flex-col bg-surface relative">
                      {/* Thread Header */}
                      <div className="h-20 border-b border-slate-surface flex items-center justify-between px-8 bg-surface/90 backdrop-blur-md z-20">
                        <div className="flex items-center gap-4 text-left">
                          {selectedConversationId === "anjali" ? (
                            <>
                              <img className="w-12 h-12 rounded-full object-cover ring-2 ring-vibrant-blue/20" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAwqc_MyOlNPcIky46j5IagA5MKKy9MIgc9CoPyYyN8mvwrOUEhCAVAmJuSwxPqkl2pJHaTJ-IGmLggOChJZQfLILifUIi52ap6GXHEN_jzgqZSFAJ_3QErbVBSsutH0oFjfUKaislFnChVyVkQGRl262dSI5gBYhFhSQBm_-aong-XF1cmWf3QatrLEm8w5rVbmZK_ZIMuoX_plpLUyXkmm4aXt2aqempr-2_AgiTfILLjJlLGjjQ" alt="Anjali Sharma" />
                              <div>
                                <h2 className="font-headline-md text-xl text-data-white">Anjali Sharma</h2>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                  <span className="font-label-caps text-xs text-on-surface-variant">Online</span>
                                </div>
                              </div>
                            </>
                          ) : selectedConversationId === "julian" ? (
                            <>
                              <div className="w-12 h-12 rounded-full bg-slate-surface flex items-center justify-center text-data-white font-headline-md text-sm ring-2 ring-vibrant-blue/20">JB</div>
                              <div>
                                <h2 className="font-headline-md text-xl text-data-white">Julian Blackwood</h2>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                                  <span className="font-label-caps text-xs text-on-surface-variant">Offline</span>
                                </div>
                              </div>
                            </>
                          ) : selectedConversationId === "marcus" ? (
                            <>
                              <img className="w-12 h-12 rounded-full object-cover ring-2 ring-vibrant-blue/20" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC6pG44Wa0Nhtvr_JMTlUt7HF_OAeqNoNIrKFmyCOaeg-0v33o52qKIy6dabvu71viUHixo2-m2mN0iNx1WM0lZRhIJUgbgekbSfqDtDjCtTLsSvjF0YlVtvtipoWmQw6SPK0qrc60-7JzS4F4ZptelO8bg1dd0zLl9o5lG6PCGS2ppR11fcW0EzQji6LF96OqCwhx0srbjIJAQZ5Igf1qjv1RSf7UrPpp3vWRfZgEo5cOSVyK7LGs" alt="Marcus Chen" />
                              <div>
                                <h2 className="font-headline-md text-xl text-data-white">Marcus Chen</h2>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                                  <span className="font-label-caps text-xs text-on-surface-variant">Offline</span>
                                </div>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="w-12 h-12 rounded-full bg-slate-surface flex items-center justify-center text-data-white font-headline-md text-sm ring-2 ring-vibrant-blue/20">ER</div>
                              <div>
                                <h2 className="font-headline-md text-xl text-data-white">Elena Rostova</h2>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                                  <span className="font-label-caps text-xs text-on-surface-variant">Offline</span>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-6">
                          {/* Context Card */}
                          <div className="flex items-center gap-3 bg-surface-container py-2 px-4 rounded-xl border border-slate-surface">
                            <div className="w-10 h-10 rounded-lg overflow-hidden bg-surface">
                              <img className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA5XHFwZwUT6DWQaay4YqVrKrrOWVZIwOIwcTSdZdP_vWiHwuk52M9LFFC0sYMkfE_KVR3_wdokHYWaWzy_cGvcmj21_zKuN5j2uWnxTjYpA6cakU-7_Er7RfmoCCwXkncXAFKMK2bmzAUOGg_GFLZ07-_Q2EckeIilFJImxef2GvrR0T0091mEd8ePMAZff0F4_vlpOsFTz9c2_L-HkFwWCZLj8Cre-UX2e0ddGQcat4inXmUg8ws" alt="Listing Context" />
                            </div>
                            <div className="flex flex-col text-left font-sans">
                              <span className="font-body-md font-semibold text-sm text-data-white">Seaside Luxury Penthouse</span>
                              <span className="font-data-mono text-xs text-outline">₹6,50,00,000</span>
                            </div>
                            <Link className="ml-4 p-2 text-vibrant-blue hover:bg-vibrant-blue/10 rounded-full transition-colors flex items-center justify-center" href="/properties/prop-1">
                              <span className="material-symbols-outlined text-[20px]">open_in_new</span>
                            </Link>
                          </div>
                          <div className="h-8 w-px bg-slate-surface"></div>
                          <button className="text-outline hover:text-data-white transition-colors bg-transparent border-none cursor-pointer">
                            <span className="material-symbols-outlined">more_vert</span>
                          </button>
                        </div>
                      </div>
                      {/* Messages Area */}
                      <div className="flex-1 overflow-y-auto p-8 space-y-6 flex flex-col" id="chat-container">
                        {/* Date Divider */}
                        <div className="flex items-center justify-center gap-4 my-4">
                          <div className="h-px bg-slate-surface flex-1"></div>
                          <span className="font-label-caps text-xs text-outline px-4 py-1 bg-surface-container rounded-full border border-slate-surface">Today</span>
                          <div className="h-px bg-slate-surface flex-1"></div>
                        </div>

                        {getSelectedConversationMessages().map((msg) => {
                          if (msg.sender === "system") {
                            return (
                              <div key={msg.id} className="flex justify-center">
                                <div className="bg-surface-container-high/50 px-4 py-2 rounded-xl border border-slate-surface/50 text-center max-w-md">
                                  <span className="material-symbols-outlined text-vibrant-blue text-[16px] inline-block align-middle mr-1">info</span>
                                  <span className="font-body-md text-xs text-on-surface-variant">{msg.text}</span>
                                </div>
                              </div>
                            );
                          }

                          if (msg.sender === "buyer") {
                            return (
                              <div key={msg.id} className="flex gap-4 max-w-[80%] items-start text-left">
                                {msg.avatar ? (
                                  <img className="w-8 h-8 rounded-full object-cover flex-shrink-0 mt-1" src={msg.avatar} alt={msg.senderName} />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-slate-surface flex items-center justify-center text-white text-xs mt-1">{msg.senderName.split(" ").map(n => n[0]).join("")}</div>
                                )}
                                <div className="flex flex-col gap-1 items-start">
                                  <div className="bg-surface-container text-data-white p-4 rounded-2xl rounded-tl-sm border border-slate-surface shadow-sm font-body-md text-body-md">
                                    <p>{msg.text}</p>
                                  </div>
                                  <span className="font-label-caps text-[10px] text-outline ml-1">{msg.time}</span>
                                </div>
                              </div>
                            );
                          }

                          // Agent Sender
                          return (
                            <div key={msg.id} className="flex gap-4 max-w-[80%] self-end items-start justify-end text-right w-full">
                              <div className="flex flex-col gap-1 items-end w-full">
                                {msg.interactiveCard ? (
                                  <div className="bg-surface-container border border-slate-surface rounded-2xl rounded-tr-sm overflow-hidden w-full max-w-sm shadow-lg text-left">
                                    <div className="h-24 bg-surface-container relative">
                                      <div className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-screen" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBYp1Cds--dpdK1X9fOKgRf32WvXk0jxUK9Pc9zaYsdQD_rQcY-sseMyZrGzX0c8GGQpeiO27IZ_Skp3kOV2NrzHiBoLxa2Tib3uxtZ-GzjVOEJQ9KkC0B2vGKw9ecQeYVs8KGsSN2ajjl7MCNjvCkcRrpAVj7IRRypkTh_LfQs9Kvf5RxACyeerX-QLHolsP4cqZhbCg_Y4NShAG85E6W7QLAtOOktaJMTx4fpXNPs1pHf_WiW_K8')" }}></div>
                                      <div className="absolute inset-0 bg-gradient-to-t from-surface-container to-transparent"></div>
                                      <div className="absolute bottom-3 left-4 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-vibrant-blue bg-surface-container p-1.5 rounded-full border border-slate-surface shadow-sm">event</span>
                                        <span className="font-body-md font-semibold text-data-white text-sm">Showing Proposed</span>
                                      </div>
                                    </div>
                                    <div className="p-4 bg-surface-container text-left">
                                      <div className="flex justify-between items-center mb-3">
                                        <span className="font-data-mono text-xs text-outline">{msg.interactiveCard.date}</span>
                                        <span className="font-data-mono text-xs text-data-white bg-slate-surface px-2 py-0.5 rounded text-center min-w-[70px]">{msg.interactiveCard.time}</span>
                                      </div>
                                      <button 
                                        onClick={() => handleConfirmShowing(msg.id)}
                                        disabled={msg.interactiveCard.confirmed}
                                        className={`w-full py-2 font-label-caps text-xs rounded-lg transition-colors border flex justify-center items-center gap-2 group cursor-pointer ${
                                          msg.interactiveCard.confirmed 
                                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500 cursor-default animate-none" 
                                            : "bg-slate-surface hover:bg-vibrant-blue hover:text-data-white text-on-surface-variant border-outline-variant/30"
                                        }`}
                                      >
                                        <span className="material-symbols-outlined text-[16px] group-hover:scale-110 transition-transform">
                                          {msg.interactiveCard.confirmed ? "done" : "schedule"}
                                        </span> 
                                        {msg.interactiveCard.confirmed ? "Showing Confirmed" : "Wait for confirmation"}
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    <div className="bg-vibrant-blue text-data-white p-4 rounded-2xl rounded-tr-sm shadow-md font-body-md text-body-md text-left">
                                      <p>{msg.text}</p>
                                    </div>
                                    <div className="flex items-center gap-1 mt-1 mr-1">
                                      <span className="font-label-caps text-[10px] text-outline">{msg.time}</span>
                                      <span className="material-symbols-outlined text-[14px] text-vibrant-blue" style={{ fontVariationSettings: "'FILL' 1" }}>done_all</span>
                                    </div>
                                  </>
                                )}
                              </div>
                              <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-data-white font-label-caps flex-shrink-0 mt-1 text-xs select-none">JD</div>
                            </div>
                          );
                        })}
                      </div>
                      {/* Input Area */}
                      <div className="p-6 bg-surface border-t border-slate-surface z-20">
                        <div className="bg-surface-container rounded-2xl border border-slate-surface flex flex-col transition-all focus-within:border-vibrant-blue focus-within:shadow-[0_0_15px_rgba(37,99,235,0.15)]">
                          <textarea 
                            className="w-full bg-transparent p-4 font-body-md text-data-white placeholder:text-outline resize-none focus:outline-none" 
                            id="message-input" 
                            placeholder="Type your message..." 
                            rows={2}
                            value={typedMessage}
                            onChange={(e) => setTypedMessage(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendChatMessage();
                              }
                            }}
                          />
                          <div className="px-4 py-3 border-t border-slate-surface/50 flex items-center justify-between">
                            <div className="flex items-center gap-1">
                              <button className="p-2 text-outline hover:text-vibrant-blue hover:bg-vibrant-blue/10 rounded-full transition-colors tooltip-trigger bg-transparent border-none cursor-pointer" title="Attach File">
                                <span className="material-symbols-outlined text-[20px]">attach_file</span>
                              </button>
                              <button className="p-2 text-outline hover:text-vibrant-blue hover:bg-vibrant-blue/10 rounded-full transition-colors tooltip-trigger bg-transparent border-none cursor-pointer" title="Insert Listing">
                                <span className="material-symbols-outlined text-[20px]">real_estate_agent</span>
                              </button>
                              <button className="p-2 text-outline hover:text-vibrant-blue hover:bg-vibrant-blue/10 rounded-full transition-colors tooltip-trigger bg-transparent border-none cursor-pointer" title="Propose Time">
                                <span className="material-symbols-outlined text-[20px]">event_available</span>
                              </button>
                            </div>
                            <button 
                              onClick={handleSendChatMessage}
                              className="bg-vibrant-blue hover:bg-inverse-primary text-data-white px-6 py-2 rounded-full font-label-caps text-xs flex items-center gap-2 transition-all hover:shadow-[0_0_12px_rgba(37,99,235,0.4)] active:scale-95 border-none cursor-pointer"
                            >
                              <span>SEND</span>
                              <span className="material-symbols-outlined text-[16px]">send</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "dashboard" && (
                /* TAB 1: OVERVIEW & PIPELINE */
                <motion.div
                  key="dashboard-tab"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.2 }}
                  className="p-8 space-y-6 text-left"
                >
                  {/* Agent Greeting Header Card */}
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-205 dark:border-slate-850 shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-blue-650 text-white font-black text-lg flex items-center justify-center shadow-md select-none">
                        {agentName ? agentName.charAt(0) : "R"}
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

                  <div className="space-y-6 pt-4">
                    {/* Active Transactions Deal Pipeline */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-850 p-6 rounded-3xl shadow-sm space-y-6">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-extrabold text-sm text-slate-950 dark:text-white flex items-center gap-2">
                            <Activity className="h-4.5 w-4.5 text-blue-500" /> Transaction Pipeline Tracker
                          </h3>
                          <p className="text-[10px] text-slate-400 font-light mt-0.5">Stage progression of active deals in Rajesh Mehta&apos;s portfolio</p>
                        </div>
                      </div>

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
                                <p className="font-black text-amber-550">{formatCurrency(listing.price)}</p>
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
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Upcoming Schedule Widget */}
                      <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-850 p-6 rounded-3xl shadow-sm space-y-4">
                        <div className="flex justify-between items-center">
                          <h3 className="font-extrabold text-sm text-slate-950 dark:text-white flex items-center gap-2">
                            <Calendar className="h-4.5 w-4.5 text-blue-500" /> Agenda &amp; Showings
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
                            className="px-4 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-750 transition-colors border-none cursor-pointer"
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
                                className="flex items-center gap-3 text-left font-semibold text-slate-850 dark:text-slate-200 cursor-pointer bg-transparent border-none outline-none"
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
                            <p className="text-xs text-slate-450 dark:text-slate-650 text-center py-8 font-bold">
                              No outstanding checklist tasks.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "marketing-kit" && (
                <motion.div
                  key="marketing-tab"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.2 }}
                  className="p-8 text-left bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-850 rounded-3xl space-y-4 shadow-sm"
                >
                  <h3 className="font-extrabold text-sm text-slate-950 dark:text-white flex items-center gap-2">
                    <Sparkles className="h-4.5 w-4.5 text-blue-500" /> Spire Marketing Kit
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Download high-resolution print flyers, customized brochure PDFs, and social media templates for your active listings.</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-55 dark:bg-slate-950 rounded-2xl text-xs space-y-2 border border-slate-100 dark:border-slate-850">
                      <h4 className="font-bold text-slate-800 dark:text-white">Print Flyers Template</h4>
                      <p className="text-[10px] text-slate-400">Letter-sized high quality design assets.</p>
                      <button className="px-3 py-1.5 bg-blue-600 hover:bg-blue-750 text-white rounded text-[10px] font-bold border-none cursor-pointer">Download SVG</button>
                    </div>
                    <div className="p-4 bg-slate-55 dark:bg-slate-950 rounded-2xl text-xs space-y-2 border border-slate-100 dark:border-slate-850">
                      <h4 className="font-bold text-slate-800 dark:text-white">Social Media Kit</h4>
                      <p className="text-[10px] text-slate-400">Square layout optimized for Instagram &amp; LinkedIn.</p>
                      <button className="px-3 py-1.5 bg-blue-600 hover:bg-blue-750 text-white rounded text-[10px] font-bold border-none cursor-pointer">Download ZIP</button>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "settings" && (
                <motion.div
                  key="settings-tab"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.2 }}
                  className="p-8 text-left bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-850 rounded-3xl space-y-4 shadow-sm"
                >
                  <h3 className="font-extrabold text-sm text-slate-950 dark:text-white">Portal Settings</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Configure notifications, listing alerts, and lead assignment rules.</p>
                  <div className="space-y-3 pt-2 text-xs">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" defaultChecked className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                      <span className="font-medium text-slate-700 dark:text-slate-350">Notify me via email when new client leads submit inquiries</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" defaultChecked className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                      <span className="font-medium text-slate-700 dark:text-slate-350">Sync showings calendar automatically to my device calendar</span>
                    </label>
                  </div>
                </motion.div>
              )}
\n{/* TAB 2: PROPERTY LISTINGS */}
                  {activeTab === "my-listings" && (
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
                  {activeTab === "crm-leads" && (
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
                  {activeTab === "analytics" && (
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
            </main>
          </div>
        )}

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
