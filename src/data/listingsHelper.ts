import listingsData from "./listings.json";

export interface Agent {
  name: string;
  phone: string;
  email: string;
  image: string;
}

export interface Property {
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
  agent: Agent;
}

const CUSTOM_LISTINGS_KEY = "homespire_custom_listings";
const DELETED_LISTINGS_KEY = "homespire_deleted_listings";

export function getCombinedListings(): Property[] {
  if (typeof window === "undefined") {
    return listingsData as Property[];
  }

  try {
    const customListingsStr = localStorage.getItem(CUSTOM_LISTINGS_KEY);
    const customListings: Property[] = customListingsStr ? JSON.parse(customListingsStr) : [];
    
    const deletedListingsStr = localStorage.getItem(DELETED_LISTINGS_KEY);
    const deletedListings: string[] = deletedListingsStr ? JSON.parse(deletedListingsStr) : [];

    // Filter out deleted static listings, and combine with custom listings
    const activeStaticListings = (listingsData as Property[]).filter(
      (p) => !deletedListings.includes(p.id)
    );

    const activeCustomListings = customListings.filter(
      (p) => !deletedListings.includes(p.id)
    );

    return [...activeCustomListings, ...activeStaticListings];
  } catch (error) {
    console.error("Error reading listings from localStorage", error);
    return listingsData as Property[];
  }
}

export function addCustomListing(property: Property): void {
  if (typeof window === "undefined") return;

  try {
    const customListingsStr = localStorage.getItem(CUSTOM_LISTINGS_KEY);
    const customListings: Property[] = customListingsStr ? JSON.parse(customListingsStr) : [];
    
    localStorage.setItem(CUSTOM_LISTINGS_KEY, JSON.stringify([property, ...customListings]));
  } catch (error) {
    console.error("Error adding custom listing to localStorage", error);
  }
}

export function deleteListing(id: string): void {
  if (typeof window === "undefined") return;

  try {
    const deletedListingsStr = localStorage.getItem(DELETED_LISTINGS_KEY);
    const deletedListings: string[] = deletedListingsStr ? JSON.parse(deletedListingsStr) : [];
    
    if (!deletedListings.includes(id)) {
      localStorage.setItem(DELETED_LISTINGS_KEY, JSON.stringify([...deletedListings, id]));
    }
  } catch (error) {
    console.error("Error deleting listing in localStorage", error);
  }
}

export function getListingById(id: string): Property | null {
  const listings = getCombinedListings();
  return listings.find((p) => p.id === id) || null;
}
