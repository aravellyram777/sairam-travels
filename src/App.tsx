/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Bus as BusIcon, 
  MapPin, 
  Calendar, 
  SlidersHorizontal, 
  Search, 
  Clock, 
  Star, 
  User, 
  Phone, 
  Mail, 
  X, 
  CheckCircle2, 
  Ticket, 
  RefreshCw, 
  ShieldCheck, 
  ChevronRight,
  Info,
  Briefcase,
  Gift,
  Heart,
  Compass,
  Smile,
  MessageCircle,
  Clock as ClockIcon,
  PhoneCall,
  Trash,
  Radio,
  Activity,
  Users
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Bus, Booking, RentalInquiry, ContactInfo, RentalVehicle } from "./types";

export default function App() {
  // Unique random browser clientId to safely isolate concurrent reservations
  const clientId = React.useMemo(() => {
    let id = sessionStorage.getItem("sai_travels_client_id");
    if (!id) {
      id = "client_" + Math.random().toString(36).substring(2, 15);
      sessionStorage.setItem("sai_travels_client_id", id);
    }
    return id;
  }, []);

  // State variables
  const [buses, setBuses] = useState<Bus[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorInput, setErrorInput] = useState<string | null>(null);

  // Search parameters
  const [fromCity, setFromCity] = useState<string>("Hyderabad");
  const [toCity, setToCity] = useState<string>("Bangalore");
  const todayStr = new Date().toISOString().split("T")[0];
  const [journeyDate, setJourneyDate] = useState<string>(todayStr);
  const [activeSearch, setActiveSearch] = useState<{from: string, to: string, date: string}>({
    from: "Hyderabad",
    to: "Bangalore",
    date: todayStr
  });

  // Filters state
  const [filterAc, setFilterAc] = useState<boolean>(false);
  const [filterNonAc, setFilterNonAc] = useState<boolean>(false);
  const [sortByPrice, setSortByPrice] = useState<string>("default");

  // Booking Modal Status
  const [selectedBus, setSelectedBus] = useState<Bus | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);
  const [passengerName, setPassengerName] = useState<string>("");
  const [passengerPhone, setPassengerPhone] = useState<string>("");
  const [passengerEmail, setPassengerEmail] = useState<string>("");
  const [submittingBooking, setSubmittingBooking] = useState<boolean>(false);

  // PNR Search & Bookings History
  const [pnrSearchCode, setPnrSearchCode] = useState<string>(""); // empty for user typing
  const [searchedTicket, setSearchedTicket] = useState<any | null>(null);
  const [searchedInquiry, setSearchedInquiry] = useState<RentalInquiry | null>(null);
  const [pnrLookupError, setPnrLookupError] = useState<string | null>(null);
  const [allMyBookings, setAllMyBookings] = useState<Booking[]>([]);
  const [isCheckStatusView, setIsCheckStatusView] = useState<boolean>(false);

  // Rental states
  const [rentalViewActive, setRentalViewActive] = useState<boolean>(true);
  const [allMyInquiries, setAllMyInquiries] = useState<RentalInquiry[]>([]);
  const [selectedRentalCategory, setSelectedRentalCategory] = useState<string>("Bus Rent");
  const [selectedFleetVehicle, setSelectedFleetVehicle] = useState<string>("12 Seater Tempo Traveller (AC)");
  const [openInquiryModal, setOpenInquiryModal] = useState<boolean>(false);

  // Inquiry Input fields
  const [inquiryName, setInquiryName] = useState<string>("");
  const [inquiryPhone, setInquiryPhone] = useState<string>("");
  const [inquiryEmail, setInquiryEmail] = useState<string>("");
  const [inquiryPickupDate, setInquiryPickupDate] = useState<string>(todayStr);
  const [inquiryDays, setInquiryDays] = useState<number>(1);
  const [inquiryUnit, setInquiryUnit] = useState<"Days" | "Hours">("Days");
  const [inquiryNotes, setInquiryNotes] = useState<string>("");
  const [submittingInquiry, setSubmittingInquiry] = useState<boolean>(false);

  // Success Toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastPnr, setToastPnr] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"booking" | "rental" | null>(null);
  const [lastBookingData, setLastBookingData] = useState<Booking | null>(null);
  const [lastInquiryData, setLastInquiryData] = useState<RentalInquiry | null>(null);
  const [lastBusName, setLastBusName] = useState<string>("");

  // Dynamic top announcement elements
  const announcements = [
    "🔥 SPECIAL OFFER: Hire custom luxury Tempo Travellers or Air-Suspension coaches at prime offseason rates!",
    "🟢 SECURE ECOSYSTEM: All Sairam operators are sanitized, speed-governed, and real-time GPS tracked for passenger security.",
    "⭐ POPULAR DEMAND: Elegant 12-Seater Force Urbania coaches are fully booked for Secunderabad temple circuits.",
    "🏆 TOP RATED OPERATOR: Traveling safely with premium comfort - Voted South India's premium coach choice for 2026!"
  ];
  const [announceIndex, setAnnounceIndex] = useState<number>(0);

  // Dynamic Live System States
  const liveActivities = [
    "🟢 ACTIVE INQUIRY: 12 Seater Force Urbania (AC Elite) requested for local Secunderabad sightseeing circuit",
    "⚡ DRIVER ACTIVE: Deluxe Multi-Axle sleeper #SR-772 departed Bangalore with 18 seats lock-held",
    "⭐ REALTIME BOOKING: Seat 12 reserved on Chennai sleeper corridor route #SR-110",
    "📞 OPERATOR SYNCED: Custom wedding package coordinator is currently holding line 3",
    "📍 GPS SYNCHRONIZED: High-roof Tempo Traveller registered active on National Highway NH-44",
    "🔥 EXCURSION LOCK: Corporate 12-hour excursion package logged from Gachibowli Outer Ring Road"
  ];
  const [liveVisitors, setLiveVisitors] = useState<number>(31);
  const [liveOperators, setLiveOperators] = useState<number>(11);
  const [liveLogIndex, setLiveLogIndex] = useState<number>(0);
  const [liveTime, setLiveTime] = useState<string>("");

  // Admin Portal states
  const [isAdminViewActive, setIsAdminViewActive] = useState<boolean>(false);
  const [openAdminAuthModal, setOpenAdminAuthModal] = useState<boolean>(false);
  const [adminPassphrase, setAdminPassphrase] = useState<string>("");
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);
  const [adminError, setAdminError] = useState<string | null>(null);
  const [adminActiveTab, setAdminActiveTab] = useState<"bookings" | "rentals" | "buses" | "contact" | "fleet">("rentals");
  const [adminSearchQuery, setAdminSearchQuery] = useState<string>("");

  // Contact Info states
  const [contactInfo, setContactInfo] = useState<ContactInfo>({
    helpline: "+91 98765 43210",
    email: "support@sairamtravels.com",
    address: "69/1 ,lane,beside more supermarket,saraswathi nagar ,lothukunta,alwal,secundrabad,Telangana 500015"
  });
  const [editHelpline, setEditHelpline] = useState<string>("");
  const [editEmail, setEditEmail] = useState<string>("");
  const [editAddress, setEditAddress] = useState<string>("");

  // Fleet management states
  const [rentalFleet, setRentalFleet] = useState<RentalVehicle[]>([]);
  const [editingFleetVehicle, setEditingFleetVehicle] = useState<RentalVehicle | null>(null);
  const [isFleetFormOpen, setIsFleetFormOpen] = useState<boolean>(false);
  const [fleetFormName, setFleetFormName] = useState<string>("");
  const [fleetFormType, setFleetFormType] = useState<string>("");
  const [fleetFormCapacity, setFleetFormCapacity] = useState<string>("");
  const [fleetFormRating, setFleetFormRating] = useState<number>(4.8);
  const [fleetFormPrice, setFleetFormPrice] = useState<string>("");
  const [fleetFormFeaturesText, setFleetFormFeaturesText] = useState<string>(""); // Comma separated

  // Bus CRUD Admin states
  const [editingBus, setEditingBus] = useState<Bus | null>(null);
  const [isBusFormOpen, setIsBusFormOpen] = useState<boolean>(false);
  const [busFormName, setBusFormName] = useState<string>("");
  const [busFormType, setBusFormType] = useState<string>("AC Sleeper");
  const [busFormFrom, setBusFormFrom] = useState<string>("Hyderabad");
  const [busFormTo, setBusFormTo] = useState<string>("Bangalore");
  const [busFormDeparture, setBusFormDeparture] = useState<string>("21:00");
  const [busFormArrival, setBusFormArrival] = useState<string>("06:30");
  const [busFormPrice, setBusFormPrice] = useState<number>(1000);
  const [busFormSeats, setBusFormSeats] = useState<number>(20);
  const [busFormRating, setBusFormRating] = useState<number>(4.5);

  // Load available buses
  const fetchBusesStatus = async (date: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/buses?date=${encodeURIComponent(date)}&clientId=${encodeURIComponent(clientId)}`);
      if (!res.ok) throw new Error("Failed to load buses from backend.");
      const data = await res.json();
      setBuses(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Background real-time polling to sync seat selections and bookings across multiple users
  useEffect(() => {
    const handleBackgroundRefresh = () => {
      if (activeSearch && activeSearch.date) {
        fetch(`/api/buses?date=${encodeURIComponent(activeSearch.date)}&clientId=${encodeURIComponent(clientId)}`)
          .then(res => {
            if (res.ok) return res.json();
          })
          .then(data => {
            if (data) {
              setBuses(data);
            }
          })
          .catch(err => console.error("Real-time sync failed", err));
      }
    };

    const intervalId = setInterval(handleBackgroundRefresh, 3000);
    return () => clearInterval(intervalId);
  }, [activeSearch, clientId]);

  // Sync selected bus details with live backend state changes (e.g., live seats under book)
  useEffect(() => {
    if (selectedBus) {
      const liveBus = buses.find(b => b.id === selectedBus.id);
      if (liveBus) {
        setSelectedBus(prev => {
          if (!prev) return null;
          return {
            ...prev,
            bookedSeats: liveBus.bookedSeats,
            heldSeats: liveBus.heldSeats
          };
        });
      }
    }
  }, [buses, selectedBus?.id]);

  // Sync / Reserve seat holds with server-side database
  useEffect(() => {
    if (selectedBus) {
      sessionStorage.setItem("sai_travels_last_bus_id", String(selectedBus.id));
    }
  }, [selectedBus]);

  useEffect(() => {
    if (selectedBus && activeSearch && activeSearch.date) {
      fetch("/api/bookings/hold", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          busId: selectedBus.id,
          journeyDate: activeSearch.date,
          clientId: clientId,
          seats: selectedSeats
        })
      })
      .then(async res => {
        if (!res.ok) {
          const detail = await res.json();
          alert(detail.error || "Some seats are currently being locked by other travelers. Re-syncing database...");
          // Deselect held seats if there's a booking conflict reported
          setSelectedSeats([]);
        }
      })
      .catch(err => {
        console.error("Failed to update seat lock on backend", err);
      });
    } else {
      // Release any active client holds upon modal close
      const lastId = sessionStorage.getItem("sai_travels_last_bus_id");
      if (lastId && activeSearch && activeSearch.date) {
        fetch("/api/bookings/hold", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            busId: Number(lastId),
            journeyDate: activeSearch.date,
            clientId: clientId,
            seats: []
          })
        })
        .then(() => {
          sessionStorage.removeItem("sai_travels_last_bus_id");
        })
        .catch(err => console.error("Release lock fail", err));
      }
    }
  }, [selectedSeats, selectedBus?.id, activeSearch?.date]);

  // Fetch full bookings database
  const fetchCompletedBookings = async () => {
    try {
      const res = await fetch("/api/bookings", {
        headers: {
          "X-Admin-Passphrase": "sairam555"
        }
      });
      if (res.ok) {
        const data = await res.json();
        setAllMyBookings(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch all rental inquiries
  const fetchMyInquiries = async () => {
    try {
      const res = await fetch("/api/rentals/inquiry", {
        headers: {
          "X-Admin-Passphrase": "sairam555"
        }
      });
      if (res.ok) {
        const data = await res.json();
        setAllMyInquiries(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Admin and Owner Actions
  const handleUpdateInquiryStatus = async (id: string, currentStatus: string) => {
    try {
      const nextStatus = currentStatus === "pending" ? "contacted" : "pending";
      const res = await fetch(`/api/admin/rentals/inquiry/${id}/status`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-Admin-Passphrase": "sairam555"
        },
        body: JSON.stringify({ status: nextStatus })
      });
      if (!res.ok) throw new Error("Failed to update status on server.");
      fetchMyInquiries(); // Refresh state list
    } catch (err: any) {
      alert(`Error updating status: ${err.message}`);
    }
  };

  const handleDeleteInquiry = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this custom fleet inquiry permanently?")) return;
    try {
      const res = await fetch(`/api/admin/rentals/inquiry/${id}`, {
        method: "DELETE",
        headers: {
          "X-Admin-Passphrase": "sairam555"
        }
      });
      if (!res.ok) throw new Error("Failed to delete from server memory.");
      fetchMyInquiries(); // Refresh state list
    } catch (err: any) {
      alert(`Error deleting inquiry: ${err.message}`);
    }
  };

  const handleCancelBooking = async (pnr: string) => {
    if (!window.confirm(`Are you sure you want to cancel booking PNR ${pnr}? This will release the seats instantly for other clients.`)) return;
    try {
      const res = await fetch(`/api/admin/bookings/${pnr}`, {
        method: "DELETE",
        headers: {
          "X-Admin-Passphrase": "sairam555"
        }
      });
      if (!res.ok) throw new Error("Failed to cancel seat reservation.");
      fetchCompletedBookings(); // Refresh state list
      fetchBusesStatus(journeyDate); // Refresh active bus seats
    } catch (err: any) {
      alert(`Error cancelling booking: ${err.message}`);
    }
  };

  // CRUD actions for Bus Management
  const handleAddNewBus = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/buses", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-Admin-Passphrase": "sairam555"
        },
        body: JSON.stringify({
          name: busFormName,
          type: busFormType,
          from: busFormFrom,
          to: busFormTo,
          departure: busFormDeparture,
          arrival: busFormArrival,
          price: Number(busFormPrice),
          rating: Number(busFormRating),
          totalSeats: Number(busFormSeats)
        })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to add bus");
      }
      alert("New Bus Route added successfully!");
      setIsBusFormOpen(false);
      resetBusForm();
      fetchBusesStatus(journeyDate); // Refresh local list
    } catch (err: any) {
      alert(`Error creating bus: ${err.message}`);
    }
  };

  const handleUpdateBus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBus) return;
    try {
      const res = await fetch(`/api/admin/buses/${editingBus.id}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "X-Admin-Passphrase": "sairam555"
        },
        body: JSON.stringify({
          name: busFormName,
          type: busFormType,
          from: busFormFrom,
          to: busFormTo,
          departure: busFormDeparture,
          arrival: busFormArrival,
          price: Number(busFormPrice),
          rating: Number(busFormRating),
          totalSeats: Number(busFormSeats)
        })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update bus");
      }
      alert("Bus Route details and pricing updated successfully!");
      setEditingBus(null);
      setIsBusFormOpen(false);
      resetBusForm();
      fetchBusesStatus(journeyDate); // Refresh local list
    } catch (err: any) {
      alert(`Error updating bus: ${err.message}`);
    }
  };

  const handleDeleteBus = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this bus route permanently? This action is irreversible.")) return;
    try {
      const res = await fetch(`/api/admin/buses/${id}`, {
        method: "DELETE",
        headers: {
          "X-Admin-Passphrase": "sairam555"
        }
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to delete bus");
      }
      alert("Bus Route deleted successfully!");
      fetchBusesStatus(journeyDate); // Refresh local list
    } catch (err: any) {
      alert(`Error deleting bus: ${err.message}`);
    }
  };

  const resetBusForm = () => {
    setBusFormName("");
    setBusFormType("AC Sleeper");
    setBusFormFrom("Hyderabad");
    setBusFormTo("Bangalore");
    setBusFormDeparture("21:00");
    setBusFormArrival("06:30");
    setBusFormPrice(1000);
    setBusFormSeats(20);
    setBusFormRating(4.5);
  };

  const fetchContactInfo = async () => {
    try {
      const res = await fetch("/api/contact");
      if (res.ok) {
        const data = await res.json();
        setContactInfo(data);
        setEditHelpline(data.helpline);
        setEditEmail(data.email);
        setEditAddress(data.address);
      }
    } catch (err) {
      console.error("Failed to load contact info:", err);
    }
  };

  const fetchRentalFleet = async () => {
    try {
      const res = await fetch("/api/rentals/fleet");
      if (res.ok) {
        const data = await res.json();
        setRentalFleet(data);
      }
    } catch (err) {
      console.error("Failed to load rental fleet:", err);
    }
  };

  const handleUpdateContactInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/contact", {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "X-Admin-Passphrase": "sairam555"
        },
        body: JSON.stringify({
          helpline: editHelpline,
          email: editEmail,
          address: editAddress
        })
      });
      if (!res.ok) throw new Error("Failed to update contact registry.");
      const data = await res.json();
      setContactInfo(data.contactInfo);
      alert("Sairam Travels live contact information updated on server successfully!");
    } catch (err: any) {
      alert(`Error updating contact info: ${err.message}`);
    }
  };

  const handleSaveFleetVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = editingFleetVehicle ? "PUT" : "POST";
      const url = editingFleetVehicle ? `/api/admin/rentals/fleet/${editingFleetVehicle.id}` : "/api/admin/rentals/fleet";
      const payload = {
        name: fleetFormName,
        type: fleetFormType,
        capacity: fleetFormCapacity,
        rating: fleetFormRating,
        price: fleetFormPrice,
        features: fleetFormFeaturesText.split(",").map(f => f.trim()).filter(Boolean)
      };

      const res = await fetch(url, {
        method,
        headers: { 
          "Content-Type": "application/json",
          "X-Admin-Passphrase": "sairam555"
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("Failed to save fleet vehicle.");
      alert(editingFleetVehicle ? "Rental vehicle updated successfully!" : "New rental vehicle added to active fleet!");
      setIsFleetFormOpen(false);
      setEditingFleetVehicle(null);
      resetFleetForm();
      fetchRentalFleet();
    } catch (err: any) {
      alert(`Error saving fleet vehicle: ${err.message}`);
    }
  };

  const handleDeleteFleetVehicle = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this vehicle from the rental fleet permanently?")) return;
    try {
      const res = await fetch(`/api/admin/rentals/fleet/${id}`, {
        method: "DELETE",
        headers: {
          "X-Admin-Passphrase": "sairam555"
        }
      });
      if (!res.ok) throw new Error("Failed to delete fleet vehicle.");
      alert("Fleet vehicle deleted successfully!");
      fetchRentalFleet();
    } catch (err: any) {
      alert(`Error deleting fleet vehicle: ${err.message}`);
    }
  };

  const resetFleetForm = () => {
    setFleetFormName("");
    setFleetFormType("");
    setFleetFormCapacity("");
    setFleetFormRating(4.8);
    setFleetFormPrice("");
    setFleetFormFeaturesText("");
  };

  const triggerEditFleetVehicle = (vehicle: RentalVehicle) => {
    setEditingFleetVehicle(vehicle);
    setFleetFormName(vehicle.name);
    setFleetFormType(vehicle.type);
    setFleetFormCapacity(vehicle.capacity);
    setFleetFormRating(vehicle.rating);
    setFleetFormPrice(vehicle.price);
    setFleetFormFeaturesText(vehicle.features.join(", "));
    setIsFleetFormOpen(true);
  };

  useEffect(() => {
    fetchBusesStatus(journeyDate);
    fetchCompletedBookings();
    fetchMyInquiries();
    fetchContactInfo();
    fetchRentalFleet();
  }, [journeyDate]);

  useEffect(() => {
    const timer = setInterval(() => {
      setAnnounceIndex(prev => (prev + 1) % announcements.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  // Live dispatcher active clock ticking Sairam Travels
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
        timeZone: "Asia/Kolkata"
      };
      setLiveTime(now.toLocaleTimeString("en-US", options));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Live visitor fluctuations and recent activity logging cycle
  useEffect(() => {
    const timer = setInterval(() => {
      setLiveVisitors(prev => {
        const delta = Math.floor(Math.random() * 5) - 2; // -2 to +2
        const next = prev + delta;
        return next < 20 ? 25 : next > 50 ? 32 : next;
      });
      setLiveOperators(prev => {
        const delta = Math.floor(Math.random() * 3) - 1; // -1 to +1
        const next = prev + delta;
        return next < 8 ? 9 : next > 14 ? 11 : next;
      });
      setLiveLogIndex(prev => (prev + 1) % liveActivities.length);
    }, 6500);
    return () => clearInterval(timer);
  }, []);

  // Handle Search Submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromCity || !toCity) {
      setErrorInput("Please specify starting and destination stations.");
      return;
    }
    if (fromCity === toCity) {
      setErrorInput("Origin and Destination stations cannot be the exact same city.");
      return;
    }
    setErrorInput(null);
    setActiveSearch({
      from: fromCity,
      to: toCity,
      date: journeyDate
    });
    fetchBusesStatus(journeyDate);
  };

  // Filter and Sort layout
  const filteredBuses = buses.filter(bus => {
    // 1. Station constraints
    const matchStations = bus.from.toLowerCase() === activeSearch.from.toLowerCase() &&
                          bus.to.toLowerCase() === activeSearch.to.toLowerCase();
    if (!matchStations) return false;

    // 2. AC vs Non-AC checkboxes
    if (filterAc || filterNonAc) {
      const isAc = bus.type === "AC Sleeper";
      const isNonAc = bus.type.includes("Non-AC");
      if (filterAc && isAc) return true;
      if (filterNonAc && isNonAc) return true;
      return false;
    }
    return true;
  });

  // Sort logic applied
  const finalProcessedBuses = [...filteredBuses];
  if (sortByPrice === "low-high") {
    finalProcessedBuses.sort((a, b) => a.price - b.price);
  } else if (sortByPrice === "high-low") {
    finalProcessedBuses.sort((a, b) => b.price - a.price);
  } else if (sortByPrice === "high-rated") {
    finalProcessedBuses.sort((a, b) => b.rating - a.rating);
  }

  // Handle seat click
  const handleSeatClick = (seatNumber: number) => {
    if (selectedSeats.includes(seatNumber)) {
      setSelectedSeats(prev => prev.filter(s => s !== seatNumber));
    } else {
      if (selectedSeats.length >= 5) {
        alert("You can select up to 5 seats per transaction.");
        return;
      }
      setSelectedSeats(prev => [...prev, seatNumber]);
    }
  };

  // Handle Reservation Confirmation Post Request
  const triggerTicketBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBus) return;
    if (selectedSeats.length === 0) {
      alert("Please choose at least 1 seat to confirm your reservation.");
      return;
    }
    if (!passengerName.trim() || !passengerPhone.trim() || !passengerEmail.trim()) {
      alert("Please provide valid passenger details.");
      return;
    }

    try {
      setSubmittingBooking(true);
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          busId: selectedBus.id,
          passengerName,
          passengerPhone,
          passengerEmail,
          seats: selectedSeats,
          journeyDate: activeSearch.date,
          clientId: clientId
        })
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to make seat reservation.");
      }

      setToastMessage(`Seats ${selectedSeats.join(", ")} confirmed successfully for ${selectedBus.name}.`);
      setToastPnr(result.booking.pnr);
      setToastType("booking");
      setLastBookingData(result.booking);
      setLastBusName(selectedBus.name);

      // Clear Modal states
      setSelectedBus(null);
      setSelectedSeats([]);
      setPassengerName("");
      setPassengerPhone("");
      setPassengerEmail("");

      // Trigger hot counters reload
      fetchBusesStatus(activeSearch.date);
      fetchCompletedBookings();

      // Show toast, then fade out
      setTimeout(() => {
        setToastMessage(null);
        setToastPnr(null);
      }, 7000);
    } catch (err: any) {
      alert(`Reservation Failed: ${err.message}`);
    } finally {
      setSubmittingBooking(false);
    }
  };

  // Handle Rental Inquiry Form Post Request
  const triggerRentalInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquiryName.trim() || !inquiryPhone.trim() || !inquiryEmail.trim()) {
      alert("Please enter proper contact credentials.");
      return;
    }

    try {
      setSubmittingInquiry(true);
      const response = await fetch("/api/rentals/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: selectedRentalCategory,
          vehicleType: selectedFleetVehicle,
          customerName: inquiryName,
          customerPhone: inquiryPhone,
          customerEmail: inquiryEmail,
          pickupDate: inquiryPickupDate,
          durationDays: Number(inquiryDays),
          durationUnit: inquiryUnit,
          notes: inquiryNotes
        })
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to log customized rental inquiry.");
      }

      setToastMessage(`Successful Inquiry for Sairam ${selectedFleetVehicle}! Our manager will call you at ${inquiryPhone} shortly.`);
      setToastPnr(result.inquiry.id);
      setToastType("rental");
      setLastInquiryData(result.inquiry);

      // Reset modal entries
      setOpenInquiryModal(false);
      setInquiryName("");
      setInquiryPhone("");
      setInquiryEmail("");
      setInquiryNotes("");
      setInquiryDays(1);
      setInquiryUnit("Days");

      // Trigger hot counts reload
      fetchMyInquiries();

      setTimeout(() => {
        setToastMessage(null);
        setToastPnr(null);
      }, 7000);

    } catch (err: any) {
      alert(`Inquiry Submission Failed: ${err.message}`);
    } finally {
      setSubmittingInquiry(false);
    }
  };

  // Search Booking or Inquiry by Code/ID
  const handlePnrSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const queryCode = pnrSearchCode.trim().toUpperCase();
    if (!queryCode) return;

    try {
      setPnrLookupError(null);
      setSearchedTicket(null);
      setSearchedInquiry(null);

      // Check if it looks like a rental inquiry ID (typically starts with SR-RENT-)
      if (queryCode.startsWith("SR-RENT-") || queryCode.includes("RENT")) {
        const localInq = allMyInquiries.find(inq => inq.id.toUpperCase() === queryCode);
        if (localInq) {
          setSearchedInquiry(localInq);
          return;
        }
        // Fallback to fetch current list and search again
        const resList = await fetch("/api/rentals/inquiry", {
          headers: { "X-Admin-Passphrase": "sairam555" }
        });
        if (resList.ok) {
          const list = await resList.json();
          const found = list.find((inq: any) => inq.id.toUpperCase() === queryCode);
          if (found) {
            setSearchedInquiry(found);
            return;
          }
        }
        throw new Error("Unable to find rental inquiry details on the server.");
      }

      // Default to Bus booking lookup
      const res = await fetch(`/api/bookings/${encodeURIComponent(queryCode)}`);
      const data = await res.json();
      if (!res.ok) {
        // If not found in bookings, let's search if any inquiry has this exact id as fallback
        const localInq = allMyInquiries.find(inq => inq.id.toUpperCase() === queryCode);
        if (localInq) {
          setSearchedInquiry(localInq);
          return;
        }
        throw new Error(data.error || "Unable to find ticket or inquiry details.");
      }
      setSearchedTicket(data);
    } catch (err: any) {
      setPnrLookupError(err.message);
    }
  };

  // Reset filter selections
  const handleResetFilters = () => {
    setFilterAc(false);
    setFilterNonAc(false);
    setSortByPrice("default");
  };

  return (
    <div className="bg-slate-50 text-slate-800 font-sans min-h-screen flex flex-col antialiased relative overflow-x-hidden">
      
      {/* Dynamic modern ambient glows */}
      <div className="absolute top-[10%] left-[-20%] w-[60%] h-[40%] rounded-full bg-indigo-200/25 blur-[130px] pointer-events-none select-none"></div>
      <div className="absolute top-[50%] right-[-20%] w-[60%] h-[40%] rounded-full bg-emerald-200/15 blur-[130px] pointer-events-none select-none"></div>

      {/* Dynamic Success Toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 bg-slate-900 border border-emerald-500/30 text-white p-5 rounded-2xl shadow-2xl max-w-md z-50 overflow-hidden"
          >
            <div className="flex gap-4">
              <div className="bg-emerald-500/10 p-2.5 h-fit rounded-full text-emerald-400">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-lg text-emerald-400">
                  {toastType === "booking" ? "Seat Reservation Completed!" : "Inquiry Logged on Server!"}
                </h4>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">{toastMessage}</p>
                
                {/* PNR Tracker */}
                <div className="mt-3 flex items-center justify-between bg-emerald-500/10 border border-emerald-500/25 px-3 py-1.5 rounded-lg">
                  <span className="text-xs text-emerald-300 font-mono">
                    {toastType === "booking" ? "PNR:" : "ID Code:"} <strong className="font-bold tracking-wider text-white text-sm">{toastPnr}</strong>
                  </span>
                  {toastType === "booking" && (
                    <button 
                      onClick={() => {
                        if (toastPnr) setPnrSearchCode(toastPnr);
                        setIsCheckStatusView(true);
                        setToastMessage(null);
                        setToastPnr(null);
                      }}
                      className="text-xs text-indigo-300 hover:text-indigo-200 underline font-medium cursor-pointer"
                    >
                      View Stub
                    </button>
                  )}
                </div>

                {/* WhatsApp notification push link */}
                <div className="mt-4 pt-3 border-t border-slate-800">
                  <p className="text-[10px] text-slate-400 mb-2 font-medium">To finalize reservation instantly, send a direct WhatsApp copy to our dispatch desk:</p>
                  
                  {toastType === "booking" && lastBookingData && (
                    <a
                      href={`https://wa.me/919876543210?text=${encodeURIComponent(`Hi Sairam Travels! I have booked a bus ticket:\n\n*PNR Code:* ${lastBookingData.pnr}\n*Passenger:* ${lastBookingData.passengerName}\n*Phone:* ${lastBookingData.passengerPhone}\n*Bus:* ${lastBusName}\n*Journey Date:* ${lastBookingData.journeyDate}\n*Seats:* ${lastBookingData.seats.join(", ")}\n*Total Price:* ₹${lastBookingData.totalPrice}`)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20ba5a] text-slate-950 font-black text-xs px-4 py-2.5 w-full rounded-xl transition cursor-pointer"
                    >
                      <MessageCircle className="w-4 h-4 text-emerald-900 fill-emerald-900" />
                      Send to WhatsApp &rarr;
                    </a>
                  )}

                  {toastType === "rental" && lastInquiryData && (
                    <a
                      href={`https://wa.me/919876543210?text=${encodeURIComponent(`Hi Sairam Travels! I submitted a fleet rental inquiry:\n\n*Inquiry ID:* ${lastInquiryData.id}\n*Client Name:* ${lastInquiryData.customerName}\n*Phone:* ${lastInquiryData.customerPhone}\n*Rental Tour Category:* ${lastInquiryData.category}\n*Vehicle requested:* ${lastInquiryData.vehicleType}\n*Start Date:* ${lastInquiryData.pickupDate}\n*Duration:* ${lastInquiryData.durationDays} ${lastInquiryData.durationUnit || "Days"}\n*Client notes:* ${lastInquiryData.notes || "No custom notes"}`)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20ba5a] text-slate-950 font-black text-xs px-4 py-2.5 w-full rounded-xl transition cursor-pointer"
                    >
                      <MessageCircle className="w-4 h-4 text-emerald-900 fill-emerald-900" />
                      Send to WhatsApp &rarr;
                    </a>
                  )}
                </div>
              </div>
              <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white shrink-0 self-start mt-0.5">
                <X className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dynamic Announcement Ticker Banner */}
      <div className="bg-emerald-500 text-slate-950 text-[11px] md:text-xs py-2 px-4 font-bold border-b border-emerald-400 select-none shadow-sm flex items-center justify-center gap-2 overflow-hidden bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-400">
        <div className="flex items-center gap-1.5 shrink-0 bg-slate-900 text-white text-[9px] px-1.5 py-0.5 rounded font-mono uppercase tracking-wider scale-95">
          <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping"></span>
          Live Board
        </div>
        <AnimatePresence mode="wait">
          <motion.p
            key={announceIndex}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="truncate font-extrabold max-w-4xl tracking-tight text-center"
          >
            {announcements[announceIndex]}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* Header Container */}
      <header className="bg-indigo-950/50 backdrop-blur-lg text-white py-4 px-6 sticky top-0 z-40 border-b border-white/10 shadow-[0_8px_32px_0_rgba(15,23,42,0.1)]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          
          {/* Logo & Slogan */}
          <div 
            className="flex items-center gap-3 cursor-pointer" 
            onClick={() => {
              setIsCheckStatusView(false);
              setRentalViewActive(true);
              setIsAdminViewActive(false);
            }}
          >
            <div className="bg-indigo-600/80 backdrop-blur-md p-2.5 rounded-xl text-white shadow-lg shadow-indigo-500/10 border border-white/20">
              <BusIcon className="w-7 h-7" />
            </div>
            <div>
              <span className="text-2xl font-black tracking-tight block">Sairam Travels</span>
              <span className="text-[10px] text-indigo-300 uppercase tracking-widest font-bold block">Luxury Fleet Rentals</span>
            </div>
          </div>

          {/* Nav Links & Actions */}
          <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
            <button 
              onClick={() => {
                setIsCheckStatusView(false);
                setRentalViewActive(true);
                setIsAdminViewActive(false);
              }}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 flex items-center gap-1.5 cursor-pointer border ${
                (rentalViewActive && !isCheckStatusView && !isAdminViewActive) 
                  ? "bg-white/15 border-white/30 text-white font-bold backdrop-blur-md shadow-lg shadow-white/5" 
                  : "bg-transparent border-transparent text-indigo-200 hover:text-white"
              }`}
            >
              <SlidersHorizontal className="w-4 h-4 text-emerald-400" />
              Book Rental
            </button>

            <button 
              onClick={() => {
                setIsCheckStatusView(true);
                setRentalViewActive(false);
                setIsAdminViewActive(false);
                if (allMyInquiries.length > 0 && !pnrSearchCode) {
                  setPnrSearchCode(allMyInquiries[allMyInquiries.length - 1].id);
                }
              }}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 flex items-center gap-1.5 cursor-pointer border ${
                (isCheckStatusView && !isAdminViewActive) 
                  ? "bg-white/15 border-white/30 text-emerald-400 font-bold backdrop-blur-md shadow-lg shadow-white/5" 
                  : "bg-transparent border-transparent text-indigo-200 hover:text-white"
              }`}
            >
              <Ticket className="w-4 h-4" />
              Check Status
            </button>
            <button 
              onClick={() => {
                if (isAdminAuthenticated) {
                  setIsAdminViewActive(true);
                  setIsCheckStatusView(false);
                  setRentalViewActive(false);
                } else {
                  setOpenAdminAuthModal(true);
                }
              }}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 flex items-center gap-1.5 cursor-pointer border ${
                isAdminViewActive 
                  ? "bg-emerald-500/95 text-slate-950 font-bold border-emerald-400/50 shadow-md shadow-emerald-500/20" 
                  : "bg-transparent border-transparent text-indigo-200 hover:text-white"
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Owner Portal {isAdminAuthenticated && "✔️"}
            </button>
          </div>
        </div>
      </header>

      {/* Hero Banner Section */}
      {!isCheckStatusView && !isAdminViewActive && (
        <section className="bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-950 text-white py-14 md:py-20 px-6 relative overflow-hidden flex flex-col items-center justify-center border-b border-indigo-900/40">
          {/* Visual ambient glowing spots reminiscent of Apple branding design */}
          <div className="absolute top-10 left-10 w-72 h-72 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-600/5 rounded-full blur-[100px] pointer-events-none"></div>

          <div className="max-w-4xl w-full text-center relative z-10">
            {/* Apple Luxury Glass Hero Card */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-3xl p-8 md:p-12 shadow-[0_20px_50px_rgba(0,0,0,0.3)] max-w-3xl mx-auto"
            >
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] md:text-xs font-black tracking-widest px-4 py-1.5 rounded-full uppercase inline-block mb-4 shadow-sm bg-gradient-to-r from-emerald-500/10 to-emerald-500/25">
                💎 Premium Fleet & Event Logisticians
              </span>
              <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white leading-tight">
                Premium Vehicle & Luxury Rentals
              </h1>
              <p className="text-indigo-200 text-xs md:text-sm mt-4 max-w-xl mx-auto font-light leading-relaxed">
                Plan professional corporate layouts, grand wedding transfers, safe outdoor excursions, family picnics, state-wide tours, or custom leisure paths. Select from high-roof Elite Force Urbanias, Deluxe Tempo Travellers, and AC Executive Air-Suspension multi-coaches on demand.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-4">
                <a 
                  href={`tel:${contactInfo.helpline.replace(/\s+/g, "")}`}
                  className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-6 py-3.5 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(16,185,129,0.3)] transition duration-300 hover:scale-[1.03] active:scale-[0.98] cursor-pointer"
                >
                  <PhoneCall className="w-4 h-4 text-slate-950" />
                  Request Booking: {contactInfo.helpline}
                </a>
                <a 
                  href={`https://wa.me/${contactInfo.helpline.replace(/[^0-9]/g, "")}?text=Hi%20Sairam%20Travels!%20I%20want%20to%20get%20more%20details%20on%20renting%20or%20booking%20a%20vehicle%20service.`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full sm:w-auto bg-white/10 hover:bg-white/15 text-white border border-white/25 font-bold px-6 py-3.5 rounded-2xl text-xs flex items-center justify-center gap-2 backdrop-blur-md transition duration-300 hover:scale-[1.03] active:scale-[0.98] cursor-pointer"
                >
                  <MessageCircle className="w-4.5 h-4.5 fill-white text-emerald-400" />
                  WhatsApp Support Live
                </a>
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* Main Grid section */}
      <main className="max-w-7xl mx-auto px-6 py-8 flex-grow w-full">
        {isAdminViewActive ? (
          /* Render fully featured Administrative panel */
          <motion.div 
            initial={{ opacity: 0, x: 25 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="bg-white/75 backdrop-blur-md border border-white/50 rounded-3xl shadow-lg p-6 md:p-8"
          >
            {/* Header metrics */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6 mb-8">
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-indigo-500">Live Backend Control</span>
                <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2 mt-1">
                  👨‍💼 Sairam Travels Owner Dashboard
                </h2>
                <p className="text-xs text-slate-500 mt-1">Real-time memory buffers tracking active customer reservations & rental inquiries securely.</p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    fetchCompletedBookings();
                    fetchMyInquiries();
                  }}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4 text-slate-500" />
                  Refresh
                </button>
                <button
                  onClick={() => setIsAdminViewActive(false)}
                  className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs px-4 py-2.5 rounded-xl transition cursor-pointer"
                >
                  Home Screen
                </button>
              </div>
            </div>

            {/* Metrics cards grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Active Fleet Cars</span>
                <span className="text-2xl font-black text-slate-800 block mt-1">{rentalFleet.length} Operators</span>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Approved Rentals</span>
                <span className="text-2xl font-black text-emerald-600 block mt-1">{allMyInquiries.filter(i => i.status === "completed" || i.status === "approved" || i.status === "confirmed").length} Approved</span>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Fleet Inquiries</span>
                <span className="text-2xl font-black text-slate-800 block mt-1">{allMyInquiries.length} Requests</span>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Pending Fleet</span>
                <span className="text-2xl font-black text-indigo-600 block mt-1">{allMyInquiries.filter(i => i.status === "pending").length} Pending</span>
              </div>
            </div>

            {/* Tabs Selector & Search */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-slate-100 pb-4">
              <div className="flex gap-2 bg-slate-100 p-1.5 rounded-xl self-start flex-wrap shadow-inner">
                <button
                  onClick={() => setAdminActiveTab("rentals")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${adminActiveTab === "rentals" ? "bg-white text-indigo-950 shadow" : "text-slate-500 hover:text-slate-800"}`}
                >
                  📨 Custom Rental Inquiries ({allMyInquiries.length})
                </button>
                <button
                  onClick={() => setAdminActiveTab("fleet")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${adminActiveTab === "fleet" ? "bg-white text-indigo-950 shadow" : "text-slate-500 hover:text-slate-800"}`}
                >
                  🚍 Fleet Management ({rentalFleet.length})
                </button>
                <button
                  onClick={() => setAdminActiveTab("contact")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${adminActiveTab === "contact" ? "bg-white text-indigo-950 shadow" : "text-slate-500 hover:text-slate-800"}`}
                >
                  📞 Contact Info Settings
                </button>
              </div>

              {/* Text search filter & Export */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Interactive Filter..."
                  value={adminSearchQuery}
                  onChange={(e) => setAdminSearchQuery(e.target.value)}
                  className="bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500 w-44 font-medium"
                />
                
                <button
                  onClick={() => {
                    if (adminActiveTab === "bookings") {
                      if (allMyBookings.length === 0) {
                        alert("No bookings available to copy.");
                        return;
                      }
                      const csvContent = "PNR,Passenger Name,Phone,Email,Seats,Date,Price\n" + 
                        allMyBookings.map(b => `"${b.pnr}","${b.passengerName}","${b.passengerPhone}","${b.passengerEmail}","${b.seats.join("-")}","${b.journeyDate}",${b.totalPrice}`).join("\n");
                      navigator.clipboard.writeText(csvContent);
                      alert("Successfully compiled & copied Bookings spreadsheet (CSV) to clipboard! You can paste this directly into Excel / Google Sheets.");
                    } else {
                      if (allMyInquiries.length === 0) {
                        alert("No custom inquiries available to copy.");
                        return;
                      }
                      const csvContent = "Inquiry ID,Customer Name,Phone,Email,Category,Vehicle,Pickup Date,Duration,Unit,Notes,Status\n" + 
                        allMyInquiries.map(i => `"${i.id}","${i.customerName}","${i.customerPhone}","${i.customerEmail}","${i.category}","${i.vehicleType}","${i.pickupDate}",${i.durationDays},"${i.durationUnit || 'Days'}","${i.notes || ''}","${i.status}"`).join("\n");
                      navigator.clipboard.writeText(csvContent);
                      alert("Successfully compiled & copied customized Fleet inquiries spreadsheet (CSV) to clipboard! Ready to paste into Excel / Sheets.");
                    }
                  }}
                  className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs px-3 py-2 rounded-xl border border-emerald-200 flex items-center gap-1 transition cursor-pointer"
                  title="Copy formatted spreadsheet CSV to clipboard"
                >
                  📥 Export (Excel CSV)
                </button>
              </div>
            </div>

            {/* TAB CONTENT 2: Rental inquiries and customized wedding tours */}
            {adminActiveTab === "rentals" && (
              <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="bg-slate-50 text-slate-400 font-bold uppercase text-[10px] tracking-widest border-b border-indigo-50/50">
                      <th className="p-4">Inquiry ID</th>
                      <th className="p-4">Customer</th>
                      <th className="p-4">Requirements & Sizing</th>
                      <th className="p-4">Pickup Date / Days</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 text-xs">
                    {allMyInquiries
                      .filter(i => {
                        const q = adminSearchQuery.toLowerCase();
                        return (
                          i.id.toLowerCase().includes(q) ||
                          i.customerName.toLowerCase().includes(q) ||
                          i.customerPhone.includes(q) ||
                          i.customerEmail.toLowerCase().includes(q) ||
                          i.category.toLowerCase().includes(q) ||
                          i.vehicleType.toLowerCase().includes(q)
                        );
                      })
                      .slice()
                      .reverse()
                      .map(i => (
                        <tr key={i.id} className="hover:bg-slate-50 transition">
                          <td className="p-4 font-mono font-bold text-slate-600">{i.id}</td>
                          <td className="p-4">
                            <span className="font-semibold text-slate-900 block">{i.customerName}</span>
                            <span className="text-[10px] text-slate-500 font-mono block">{i.customerPhone}</span>
                            <span className="text-[10px] text-slate-400 block">{i.customerEmail}</span>
                          </td>
                          <td className="p-4 space-y-1">
                            <div className="flex items-center gap-1.5 font-bold text-slate-800">
                              <span className="bg-indigo-50 text-indigo-700 text-[10px] px-2 py-0.5 rounded-lg border border-indigo-100/50">{i.category}</span>
                              <span className="text-slate-700 font-semibold">{i.vehicleType}</span>
                            </div>
                            <p className="text-[10px] text-slate-500 max-w-sm italic mt-1 leading-relaxed">
                              &ldquo;{i.notes || "No extra specs noted."}&rdquo;
                            </p>
                          </td>
                          <td className="p-4">
                            <span className="font-semibold block">{i.pickupDate}</span>
                            <span className="text-slate-500 text-[11px] font-medium block mt-0.5">{i.durationDays} {i.durationUnit || "Days"}</span>
                          </td>
                          <td className="p-4">
                            <button
                              onClick={() => handleUpdateInquiryStatus(i.id, i.status)}
                              className={`px-2.5 py-1 rounded-full font-bold text-[10px] flex items-center gap-1 transition shadow-sm border cursor-pointer ${
                                i.status === "contacted"
                                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                                  : "bg-amber-50 border-amber-200 text-amber-800 dynamic-pulse"
                              }`}
                              title="Click to toggle contacted/pending status"
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${i.status === "contacted" ? "bg-emerald-500" : "bg-amber-500"}`}></span>
                              {i.status === "contacted" ? "Contacted" : "Pending Log"}
                            </button>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2 justify-center">
                              <button
                                onClick={() => handleUpdateInquiryStatus(i.id, i.status)}
                                className="bg-indigo-50 hover:bg-indigo-100 text-indigo-800 font-bold px-2 py-1.5 rounded-lg text-[10px] transition cursor-pointer"
                              >
                                Toggle State
                              </button>
                              <button
                                onClick={() => handleDeleteInquiry(i.id)}
                                className="bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-500 p-1.5 rounded-lg transition cursor-pointer"
                                title="Delete inquiry"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    {allMyInquiries.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-12 text-center text-slate-400 italic">No vehicle inquiries submitted yet. Try placing a customized fleet quote request using the vehicles drawer.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* TAB CONTENT 4: Contact Settings Tab */}
            {adminActiveTab === "contact" && (
              <div className="bg-white/75 backdrop-blur-md border border-white/50 rounded-2xl p-6 shadow-sm max-w-2xl mx-auto">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-indigo-50 text-indigo-700 p-2.5 rounded-xl border border-indigo-200">
                    <PhoneCall className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-md text-slate-800">Dynamic Contact Information Settings</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">Configure support lines, email channels, and physical helpdesks centrally.</p>
                  </div>
                </div>
                
                <form onSubmit={handleUpdateContactInfo} className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">Helpline / Manager Mobile Number *</label>
                    <input 
                      type="text"
                      required
                      value={editHelpline}
                      onChange={e => setEditHelpline(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">Email Support Address *</label>
                    <input 
                      type="email"
                      required
                      value={editEmail}
                      onChange={e => setEditEmail(e.target.value)}
                      placeholder="support@sairamtravels.com"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">Office Location Address *</label>
                    <textarea 
                      required
                      rows={3}
                      value={editAddress}
                      onChange={e => setEditAddress(e.target.value)}
                      placeholder="69/1 ,lane,beside more supermarket,saraswathi nagar ,lothukunta,alwal,secundrabad,Telangana 500015"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-slate-800 leading-relaxed"
                    />
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-black px-6 py-3 rounded-xl text-xs transition shadow-lg shadow-indigo-500/20 cursor-pointer"
                    >
                      Save Live Contact Details
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* TAB CONTENT 5: Fleet Management Tab */}
            {adminActiveTab === "fleet" && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/75 backdrop-blur-md p-5 border border-white/50 rounded-2xl shadow-sm">
                  <div>
                    <h3 className="font-extrabold text-md text-slate-800">Dynamic Active Fleet Management</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">Configure, update base rates or add/remove heavy cruisers from customer package listings.</p>
                  </div>
                  <button 
                    onClick={() => {
                      setEditingFleetVehicle(null);
                      resetFleetForm();
                      setIsFleetFormOpen(true);
                    }}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow transition cursor-pointer"
                  >
                    + Add New Rental Vehicle
                  </button>
                </div>

                {isFleetFormOpen && (
                  <div className="bg-slate-50 border border-indigo-100 rounded-2xl p-5 shadow-inner">
                    <h4 className="font-extrabold text-xs text-indigo-900 uppercase tracking-widest mb-4">
                      {editingFleetVehicle ? "Edit Fleet Vehicle Details" : "Add New Fleet Vehicle"}
                    </h4>
                    <form onSubmit={handleSaveFleetVehicle} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Vehicle Name *</label>
                        <input 
                          type="text"
                          required
                          placeholder="e.g., 12 Seater Tempo Traveller (AC)"
                          value={fleetFormName}
                          onChange={e => setFleetFormName(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Vehicle Category / Sub-Type *</label>
                        <input 
                          type="text"
                          required
                          placeholder="e.g., AC Luxury Cruiser"
                          value={fleetFormType}
                          onChange={e => setFleetFormType(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Capacity limit *</label>
                        <input 
                          type="text"
                          required
                          placeholder="e.g., 12 Passengers"
                          value={fleetFormCapacity}
                          onChange={e => setFleetFormCapacity(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Base Tariff Price Rate *</label>
                        <input 
                          type="text"
                          required
                          placeholder="e.g., ₹18/km"
                          value={fleetFormPrice}
                          onChange={e => setFleetFormPrice(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Star Rating (1.0 to 5.0)</label>
                        <input 
                          type="number"
                          step="0.1"
                          min="1"
                          max="5"
                          value={fleetFormRating}
                          onChange={e => setFleetFormRating(Number(e.target.value))}
                          className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Highlights (comma separated)</label>
                        <input 
                          type="text"
                          placeholder="Features e.g., Individual AC vents, Pushback seats"
                          value={fleetFormFeaturesText}
                          onChange={e => setFleetFormFeaturesText(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                        />
                      </div>

                      <div className="md:col-span-3 flex justify-end gap-2.5 pt-2">
                        <button 
                          type="button"
                          onClick={() => {
                            setIsFleetFormOpen(false);
                            setEditingFleetVehicle(null);
                            resetFleetForm();
                          }}
                          className="bg-slate-200 hover:bg-slate-300 text-slate-600 font-bold px-4 py-2 rounded-xl text-xs transition cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button 
                          type="submit"
                          className="bg-indigo-600 hover:bg-indigo-700 text-white font-black px-5 py-2 rounded-xl text-xs transition shadow-md cursor-pointer"
                        >
                          {editingFleetVehicle ? "Update Vehicle Details" : "Launch Fleet Vehicle"}
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Rental Fleet Active List */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {rentalFleet
                    .filter(v => {
                      const q = adminSearchQuery.toLowerCase();
                      return (
                        v.name.toLowerCase().includes(q) ||
                        v.type.toLowerCase().includes(q) ||
                        v.capacity.toLowerCase().includes(q)
                      );
                    })
                    .map((vehicle, vehicleIdx) => (
                      <div key={vehicle.id || `admin-fleet-${vehicleIdx}`} className="bg-white/70 backdrop-blur-md border border-white/50 rounded-2xl p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start gap-4 mb-3">
                            <span className="bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">
                              {vehicle.type}
                            </span>
                            <span className="flex items-center gap-1 text-[11px] font-bold bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full border border-amber-100">
                              <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                              {vehicle.rating}
                            </span>
                          </div>

                          <h4 className="font-extrabold text-slate-800 text-sm">{vehicle.name}</h4>
                          <p className="text-[11px] text-slate-400 mt-1">Capacity Limit: <strong className="text-slate-600">{vehicle.capacity}</strong></p>
                          <p className="text-[11px] text-indigo-600 mt-1">Price Rate Details: <strong className="font-mono text-slate-700 bg-slate-50 px-1.5 py-0.5 rounded">{vehicle.price}</strong></p>
                          
                          <div className="mt-3.5 flex flex-wrap gap-1">
                            {vehicle.features.map((f, fIdx) => (
                              <span key={`${f}-${fIdx}`} className="bg-slate-50 text-slate-500 text-[9px] px-2.5 py-0.5 rounded border border-slate-100 font-medium">
                                {f}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="mt-5 pt-3 border-t border-slate-100 flex gap-2">
                          <button 
                            onClick={() => triggerEditFleetVehicle(vehicle)}
                            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold p-1.5 rounded text-xs transition cursor-pointer text-center"
                          >
                            Edit Vehicle
                          </button>
                          <button 
                            onClick={() => handleDeleteFleetVehicle(vehicle.id)}
                            className="bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-500 p-1.5 rounded transition cursor-pointer"
                            title="Delete vehicle model"
                          >
                            <Trash className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  {rentalFleet.length === 0 && (
                    <div className="col-span-full bg-slate-50 border border-slate-100 rounded-xl p-8 text-center text-xs text-slate-400 italic">
                      No fleet vehicles are loaded in the database yet. Launch a fleet model on the Admin portal.
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        ) : !isCheckStatusView ? (
          <div className="space-y-6">
            <motion.div 
              initial={{ opacity: 0, x: 25 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              className="grid grid-cols-1 lg:grid-cols-4 gap-8"
            >
              
              {/* Left Column: Rental Categories selector & dial card */}
              <aside className="lg:col-span-1 space-y-6">
                <div className="bg-white/35 backdrop-blur-xl rounded-[28px] border border-white/50 p-5 shadow-[0_8px_32px_0_rgba(31,38,135,0.02)] border-t border-l border-white/80">
                  <h3 className="text-[10px] font-black text-indigo-950 uppercase tracking-widest mb-4 border-b border-indigo-100/30 pb-2">Custom Package Types</h3>
                  <div className="space-y-1.5">
                    {[
                      { id: "Bus Rent", label: "Bus Rent", icon: BusIcon, desc: "Wedding, corporate or general outings" },
                      { id: "Weddings", label: "Wedding rentals", icon: Heart, desc: "Grand guest shuttles & logistics" },
                      { id: "Corporate", label: "Corporate rentals", icon: Briefcase, desc: "Employee commuting or business offsites" },
                      { id: "Tempo Travellers", label: "Tempo Travellers", icon: Compass, desc: "Luxury 12 & 17 seater vehicles" },
                      { id: "Tour Packages", label: "Tour packages", icon: Smile, desc: "State tours & dynamic temple circuits" },
                      { id: "Travel", label: "Travel Services", icon: Compass, desc: "Long range customized group tours" },
                      { id: "Hourly Packages", label: "Hourly packages", icon: ClockIcon, desc: "Sightseeing & local exploration" },
                      { id: "Picnics", label: "Picnic outings", icon: Gift, desc: "Family picnics, school & college tours" }
                    ].map(cat => {
                      const IconComp = cat.icon;
                      const isSelected = selectedRentalCategory === cat.id;

                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setSelectedRentalCategory(cat.id)}
                          className={`w-full text-left p-3 rounded-2xl transition-all duration-200 cursor-pointer flex items-start gap-3 border ${
                            isSelected 
                              ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/15 translate-x-1" 
                              : "bg-transparent border-transparent hover:bg-white/50 text-slate-700"
                          }`}
                        >
                          <div className={`p-2 rounded-xl shrink-0 transition-colors ${isSelected ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"}`}>
                            <IconComp className="w-4 h-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className={`font-black text-xs uppercase tracking-tight block truncate ${isSelected ? "text-white" : "text-slate-800"}`}>{cat.label}</span>
                            <span className={`text-[10px] block mt-0.5 leading-snug ${isSelected ? "text-indigo-100 font-medium" : "text-slate-400"}`}>{cat.desc}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Secure call details & WhatsApp direct panel */}
                <div className="bg-indigo-950 text-white rounded-2xl p-5 border border-indigo-900 shadow-xl">
                  <span className="bg-emerald-500 text-slate-950 font-black text-[9px] px-2 py-0.5 rounded tracking-wide uppercase">FAST HELPLINES</span>
                  <h4 className="font-bold text-sm mt-2">Have specific needs?</h4>
                  <p className="text-indigo-200 text-xs mt-1.5 leading-relaxed">
                    Speak directly with a Sairam Travels coordinator to lock custom rates or route itineraries over the phone or WhatsApp.
                  </p>
                  <div className="mt-4 space-y-2">
                    <a 
                      href={`tel:${contactInfo.helpline.replace(/\s+/g, "")}`}
                      className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 p-2.5 rounded-xl text-xs font-semibold text-white transition cursor-pointer"
                    >
                      <Phone className="w-3.5 h-3.5 text-emerald-400" />
                      Call Us: {contactInfo.helpline}
                    </a>
                    <a 
                      href={`https://wa.me/${contactInfo.helpline.replace(/[^0-9]/g, "")}?text=Hi%20Sairam%2520Travels!%20I%20want%2520to%20inquire%2520about%20renting%20a%20vehicle.`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 p-2.5 rounded-xl text-xs font-semibold text-emerald-300 border border-emerald-500/20 transition cursor-pointer"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                      Chat with WhatsApp
                    </a>
                  </div>
                </div>
              </aside>

              {/* Right Column: Fleet Grid lists */}
              <section className="lg:col-span-3 space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                      Sairam Active Fleet: <span className="text-indigo-600 font-extrabold">{selectedRentalCategory}</span>
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Choose from our fully sanitized, GPS-enabled fleet. Click "Inquire" to lock quotes.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {rentalFleet.map((v, idx) => {
                    return (
                      <motion.div
                        key={v.id || `public-fleet-${idx}`}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="bg-white/45 backdrop-blur-xl border border-white/60 rounded-[28px] p-6 hover:bg-white/70 hover:border-white hover:shadow-[0_20px_50px_rgba(31,38,135,0.04)] transition-all duration-300 flex flex-col justify-between border-t border-l border-white/80"
                      >
                        <div>
                          {/* Header metrics with premium borders */}
                          <div className="flex justify-between items-start gap-2 flex-wrap">
                            <span className="bg-indigo-600/15 border border-indigo-400/20 text-indigo-700 font-black text-[9px] px-3 py-1 rounded-xl tracking-wider uppercase">
                              {v.type}
                            </span>
                            <div className="flex gap-1.5 items-center">
                              <span className="flex items-center gap-1 text-[8px] font-extrabold bg-emerald-500/15 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-500/20 uppercase tracking-tight">
                                <span className="w-1 h-1 bg-emerald-500 rounded-full animate-ping shrink-0"></span>
                                Live Ready
                              </span>
                              <span className="flex items-center gap-1 text-[10px] font-black bg-amber-500/10 text-amber-700 px-2.5 py-1 rounded-full border border-amber-500/20">
                                <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                                {v.rating}
                              </span>
                            </div>
                          </div>

                          {/* Vehicle Title & Limits */}
                          <h4 className="text-base font-black text-indigo-950 mt-4 tracking-tight">{v.name}</h4>
                          <span className="text-slate-400 text-xs block mt-1">Capacity Limit: <strong className="text-slate-700 font-semibold">{v.capacity} Passengers</strong></span>

                          {/* Features listing pills - Apple pill style */}
                          <div className="mt-4 flex flex-wrap gap-1.5">
                            {v.features.map((f, fIdx) => (
                              <span key={`${f}-${fIdx}`} className="bg-white/80 text-slate-500 hover:text-indigo-950 text-[9px] px-2.5 py-1 rounded-lg border border-white uppercase font-bold tracking-tight shadow-sm transition">
                                {f}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Pricing and Action deck */}
                        <div className="border-t border-slate-100 pt-4 mt-5 flex items-center justify-between gap-4">
                          <div>
                            <span className="text-[9px] text-slate-400 uppercase tracking-widest block font-bold">Estimated Cost</span>
                            <span className="text-base sm:text-lg font-mono text-indigo-900 font-black tracking-tight">
                              {v.price.startsWith("₹") ? v.price : `₹${v.price}`}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedFleetVehicle(v.name);
                              setOpenInquiryModal(true);
                            }}
                            className="bg-indigo-600 hover:bg-indigo-700 hover:scale-[1.03] active:scale-[0.97] transition-all text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-xl shadow-indigo-600/15 cursor-pointer border border-white/10"
                          >
                            Inquire Now
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                  {rentalFleet.length === 0 && (
                    <div className="col-span-full bg-slate-50 border border-slate-100 rounded-xl p-8 text-center text-xs text-slate-400 italic">
                      No fleet vehicles are loaded in the database yet. Launch a fleet model on the Admin portal.
                    </div>
                  )}
                </div>

                 {/* Submitted server inquiries history */}
                <div className="bg-white/70 backdrop-blur-md border border-white/50 rounded-3xl p-6 shadow-sm">
                  <span className="text-xs text-indigo-600 font-extrabold tracking-widest uppercase block mb-1">Interactive Inquiry Logs</span>
                  <h3 className="font-bold text-md text-slate-800 mb-2">My Live Submitted Inquiries on Server</h3>
                  <p className="text-xs text-slate-400 leading-relaxed mb-4">
                    Your submitted premium booking inquiries. Sairam Travels executives track this list globally in real time.
                  </p>

                  {allMyInquiries.length === 0 ? (
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-5 text-center text-xs text-slate-400 italic">
                      You have not submitted any vehicle rental inquiries yet.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {allMyInquiries.slice().reverse().map(inq => (
                        <div key={inq.id} className="bg-slate-50 border border-slate-200 py-3.5 px-4 rounded-2xl text-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-slate-900 uppercase tracking-tight text-sm">{inq.vehicleType}</span>
                              <span className="bg-amber-100 border border-amber-200 text-amber-800 text-[9px] font-bold px-2 py-0.5 rounded uppercase">
                                {inq.category}
                              </span>
                            </div>
                            <div className="mt-1.5 text-slate-500 space-y-0.5">
                              <p>Client: <strong className="text-slate-700">{inq.customerName}</strong> ({inq.customerPhone}) &bull; {inq.customerEmail}</p>
                              <p>Pickup Date: <strong>{inq.pickupDate}</strong> &bull; Duration: <strong>{inq.durationDays} {inq.durationUnit || "Days"}</strong></p>
                              {inq.notes && <p className="italic text-[11px] text-slate-400 mt-1">"Notes: {inq.notes}"</p>}
                            </div>
                          </div>
                          <div className="text-left sm:text-right shrink-0">
                            <span className="text-[10px] text-slate-400 block font-mono">INQUIRY CODE</span>
                            <span className="font-mono text-indigo-700 font-black tracking-wider block">{inq.id}</span>
                            <span className="bg-emerald-50 text-emerald-800 font-bold border border-emerald-100 text-[9px] px-2 py-0.5 rounded mt-1.5 block w-fit sm:ml-auto">
                              ACTIVE QUEUE
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            </motion.div>
          </div>
        ) : (
          /* Check status ticket / inquiry checker panel with premium glassmorphism */
          <motion.div 
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="max-w-2xl mx-auto bg-white/45 backdrop-blur-xl border border-white/60 rounded-3xl shadow-[0_20px_50px_rgba(31,38,135,0.06)] p-6 sm:p-10 text-slate-800"
          >
            <div className="text-center max-w-md mx-auto mb-6">
              <div className="bg-indigo-600/10 text-indigo-600 p-3.5 rounded-full w-fit mx-auto mb-3 border border-indigo-200/20">
                <Ticket className="w-7 h-7" />
              </div>
              <h2 className="text-2xl font-black text-indigo-950 tracking-tight">
                Track Booking or Inquiry Status
              </h2>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Enter your unique 8-digit booking PNR (e.g. SR123456) or customized fleet Rental Inquiry ID (e.g. SR-RENT-12345) to view live confirmation records.
              </p>
            </div>

            <form onSubmit={handlePnrSearch} className="flex flex-col sm:flex-row gap-3">
              <input 
                type="text"
                placeholder="Enter PNR Code or Inquiry ID (e.g. SR-RENT-XXXXX)"
                value={pnrSearchCode}
                onChange={e => setPnrSearchCode(e.target.value.toUpperCase())}
                className="flex-1 bg-white/70 border border-slate-200 p-3.5 rounded-2xl text-xs sm:text-sm font-mono tracking-wider text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 transition shadow-inner"
              />
              <button 
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 hover:scale-[1.02] active:scale-[0.98] text-white font-bold text-xs sm:text-sm px-6 py-3.5 rounded-2xl shrink-0 transition"
              >
                Find Record
              </button>
            </form>

            {pnrLookupError && (
              <div className="bg-rose-50 border border-rose-100 text-rose-700 text-xs p-4 mt-5 rounded-2xl flex items-center gap-2.5 shadow-sm">
                <Info className="w-4.5 h-4.5 shrink-0 text-rose-500" />
                <span className="font-medium">{pnrLookupError}</span>
              </div>
            )}

            {/* Render fetched custom inquiry stub */}
            {searchedInquiry && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-8 border border-white/60 bg-white/70 backdrop-blur-md rounded-3xl overflow-hidden relative shadow-2xl"
              >
                {/* Visual top bar badge in ticket */}
                <div className="bg-indigo-950 text-white p-5 flex justify-between items-center bg-gradient-to-r from-indigo-950 to-indigo-900">
                  <div>
                    <span className={`text-[8px] sm:text-[9px] font-black px-2.5 py-0.5 rounded uppercase block w-fit border ${
                      searchedInquiry.status === "pending" 
                        ? "bg-amber-400/20 text-amber-300 border-amber-400/30 animate-pulse" 
                        : "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                    }`}>
                      {searchedInquiry.status === "pending" ? "⏳ Awaiting Review" : "✅ Contacted / Reserved"}
                    </span>
                    <h4 className="text-sm sm:text-base font-black tracking-tight mt-1.5">{searchedInquiry.vehicleType}</h4>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-indigo-300 block font-bold">INQUIRY ID</span>
                    <span className="text-xs sm:text-sm font-mono font-black tracking-wider text-emerald-400">{searchedInquiry.id}</span>
                  </div>
                </div>

                {/* Main metrics summary */}
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Service Category</span>
                      <p className="font-bold text-slate-800">{searchedInquiry.category}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Request Date</span>
                      <p className="font-bold text-slate-800">{searchedInquiry.pickupDate}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Rental Duration</span>
                      <p className="font-bold text-slate-800">{searchedInquiry.durationDays} {searchedInquiry.durationUnit || "Days"}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Created on server</span>
                      <p className="font-mono text-slate-600 font-bold">{searchedInquiry.createdAt || "N/A"}</p>
                    </div>
                  </div>

                  {/* Customer details */}
                  <div className="border-t border-slate-200 border-dashed pt-4">
                    <span className="text-[10px] text-slate-400 font-extrabold tracking-wider block uppercase">Client logs</span>
                    <div className="text-xs text-slate-700 space-y-1.5 mt-2">
                      <p className="flex items-center gap-2 font-bold text-slate-900"><User className="w-3.5 h-3.5 text-indigo-500" /> {searchedInquiry.customerName}</p>
                      <p className="flex items-center gap-2 font-mono"><Phone className="w-3.5 h-3.5 text-indigo-500" /> {searchedInquiry.customerPhone}</p>
                      <p className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-indigo-500" /> {searchedInquiry.customerEmail}</p>
                    </div>
                  </div>

                  {searchedInquiry.notes && (
                    <div className="border-t border-slate-200 border-dashed pt-4">
                      <span className="text-[10px] text-slate-400 font-extrabold tracking-wider block uppercase">Special Requests</span>
                      <p className="text-xs text-slate-600 italic bg-slate-50/75 p-3 rounded-xl border border-slate-100 mt-2 font-light">"{searchedInquiry.notes}"</p>
                    </div>
                  )}

                  <div className="border-t border-slate-200 pt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs">
                    <div>
                      <span className="text-[10px] text-indigo-500 font-black block uppercase tracking-wider">Estimated Tariffs</span>
                      <p className="text-lg font-black text-slate-800 font-mono">Custom Quote Call</p>
                    </div>
                    <div className="bg-indigo-50/80 border border-indigo-100 px-3 py-1.5 rounded-xl text-indigo-800 font-extrabold uppercase text-[10px] sm:text-xs">
                      {searchedInquiry.status === "pending" ? "⌛ Awaiting Call" : "✔️ Confirmed Group"}
                    </div>
                  </div>
                </div>

                {/* Cut indicator circles */}
                <div className="absolute right-[-10px] top-[80px] w-5 h-5 bg-slate-100 border-l border-slate-200 rounded-full z-10 hidden sm:block"></div>
                <div className="absolute left-[-10px] top-[80px] w-5 h-5 bg-slate-100 border-r border-slate-200 rounded-full z-10 hidden sm:block"></div>
              </motion.div>
            )}

            {/* Render fetched ticket stub */}
            {searchedTicket && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-8 border border-white/60 bg-white/70 backdrop-blur-md rounded-3xl overflow-hidden relative shadow-2xl"
              >
                {/* Visual top bar badge in ticket */}
                <div className="bg-indigo-950 text-white p-5 flex justify-between items-center bg-gradient-to-r from-indigo-950 to-indigo-900">
                  <div>
                    <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] px-2.5 py-0.5 rounded uppercase block w-fit">VERIFIED ACTIVE</span>
                    <h4 className="text-sm font-bold tracking-tight mt-1">{searchedTicket.busName}</h4>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-indigo-300 block">PNR DETAILS</span>
                    <span className="text-sm font-mono font-bold tracking-wider text-emerald-400">{searchedTicket.pnr}</span>
                  </div>
                </div>

                {/* Ticket main metrics summary */}
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">ROUTE</span>
                      <p className="font-bold text-sm text-slate-800">{searchedTicket.from} &rarr; {searchedTicket.to}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">TRAVEL DATE</span>
                      <p className="font-bold text-sm text-slate-800">{searchedTicket.journeyDate}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">DEP / ARRIVAL</span>
                      <p className="font-semibold text-xs text-slate-700">{searchedTicket.departure} &bull; {searchedTicket.arrival}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">SEAT NUMBERS</span>
                      <p className="font-mono text-xs font-bold text-indigo-700">Seats: {searchedTicket.seats?.join(", ")}</p>
                    </div>
                  </div>

                  {/* Passenger metrics summary */}
                  <div className="border-t border-slate-200 border-dashed pt-4">
                    <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">PASSENGER DETAILS</span>
                    <div className="text-xs text-slate-700 space-y-1.5 mt-2">
                      <p className="flex items-center gap-1.5 font-semibold text-slate-900"><User className="w-3.5 h-3.5 text-slate-400" /> {searchedTicket.passengerName}</p>
                      <p className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-slate-400" /> {searchedTicket.passengerEmail}</p>
                      <p className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-slate-400" /> {searchedTicket.passengerPhone}</p>
                    </div>
                  </div>

                  {/* Pricing footer index of ticket */}
                  <div className="border-t border-slate-200 pt-4 flex justify-between items-center">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold">TOTAL AMOUNT PAID</span>
                      <p className="text-xl font-bold text-slate-800">₹{searchedTicket.totalPrice}</p>
                    </div>
                    <span className="text-xs bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-xl text-indigo-800 font-bold uppercase">{searchedTicket.type}</span>
                  </div>
                </div>

                {/* Cut indicator circles */}
                <div className="absolute right-[-10px] top-[80px] w-5 h-5 bg-slate-100 border-l border-slate-250 rounded-full z-10 hidden sm:block"></div>
                <div className="absolute left-[-10px] top-[80px] w-5 h-5 bg-slate-100 border-r border-slate-250 rounded-full z-10 hidden sm:block"></div>
              </motion.div>
            )}

            {/* List with recent transactions on the server for quick test purposes */}
            <div className="mt-8 pt-6 border-t border-slate-200/50">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Stored logs on server memory</h3>
              
              {allMyInquiries.length === 0 && allMyBookings.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No inquiries or bookings stored on current server memory session yet.</p>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {/* Custom Rental inquires logs */}
                  {allMyInquiries.slice().reverse().map(inq => (
                    <button 
                      key={inq.id} 
                      onClick={() => {
                        setPnrSearchCode(inq.id);
                        setSearchedInquiry(inq);
                        setSearchedTicket(null);
                        setPnrLookupError(null);
                      }}
                      className="w-full bg-white/50 border border-white hover:bg-white text-left p-3 rounded-2xl text-xs flex justify-between items-center transition cursor-pointer shadow-sm hover:scale-[1.01] duration-150"
                    >
                      <div>
                        <span className="font-bold text-slate-800">{inq.customerName}</span>
                        <p className="text-slate-500 text-[10px] mt-0.5">Rental Inquiry &bull; {inq.vehicleType}</p>
                      </div>
                      <span className="font-mono text-indigo-700 font-semibold">{inq.id} &rarr;</span>
                    </button>
                  ))}

                  {/* Traditional bookings logs list */}
                  {allMyBookings.slice().reverse().map(b => (
                    <button 
                      key={b.pnr} 
                      onClick={() => {
                        setPnrSearchCode(b.pnr);
                        setSearchedInquiry(null);
                        setPnrLookupError(null);
                        fetch(`/api/bookings/${b.pnr}`).then(r => r.json()).then(data => setSearchedTicket(data));
                      }}
                      className="w-full bg-white/50 border border-white hover:bg-white text-left p-3 rounded-2xl text-xs flex justify-between items-center transition cursor-pointer shadow-sm hover:scale-[1.01] duration-150"
                    >
                      <div>
                        <span className="font-bold text-slate-800">{b.passengerName}</span>
                        <p className="text-slate-500 text-[10px] mt-0.5">Seats: {b.seats.join(", ")} &bull; {b.journeyDate}</p>
                      </div>
                      <span className="font-mono text-indigo-700 font-semibold">{b.pnr} &rarr;</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

          </motion.div>
        )}
      </main>

      {/* Booking Seat Matrix Sheet (Modal Layout) */}
      <AnimatePresence>
        {selectedBus && (
          <div 
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setSelectedBus(null);
              }
            }}
            className="fixed inset-0 bg-indigo-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div 
              initial={{ scale: 0.96, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 10 }}
              transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.22 }}
              className="bg-white/90 backdrop-blur-lg shadow-2xl max-w-4xl w-full flex flex-col md:flex-row border border-white/50 my-4 max-h-[90vh] overflow-y-auto"
            >
              
              {/* Left Column of Modal: Seat grid representation */}
              <div className="flex-1 p-6 md:p-8 bg-slate-50/80 border-b md:border-b-0 md:border-r border-slate-200/60">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-slate-900 font-extrabold text-xl">Assign Seats</h3>
                    <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-bold">{selectedBus.name}</p>
                  </div>
                  <button 
                    onClick={() => setSelectedBus(null)}
                    className="p-1.5 rounded-full hover:bg-slate-200 text-slate-500 transition cursor-pointer"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Seat Legend list */}
                <div className="flex flex-wrap justify-center gap-4 text-xs mb-8">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-slate-200 border border-slate-300 rounded-md"></div>
                    <span className="text-slate-600 font-semibold">Available</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-amber-400 border border-amber-500 rounded-md animate-pulse"></div>
                    <span className="text-slate-600 font-semibold flex items-center gap-1">Under Booking <span className="text-[9px] text-amber-600 font-mono">(In Progress)</span></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-indigo-600 border border-indigo-700 rounded-md"></div>
                    <span className="text-slate-600 font-semibold">Selected</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-slate-300 border border-slate-400 rounded-md cursor-not-allowed"></div>
                    <span className="text-slate-600 font-semibold">Booked</span>
                  </div>
                </div>

                {/* Cabin floor background layout */}
                <div className="border border-slate-200 bg-white p-6 rounded-2xl max-w-[270px] mx-auto shadow-inner relative">
                  
                  {/* Dashboard front steering indicator */}
                  <div className="flex justify-between items-center pb-4 mb-4 border-b border-slate-100">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">FRONT ENGINE</span>
                    <div className="w-7 h-7 border-2 border-slate-300 rounded-full flex items-center justify-center text-[10px] font-bold text-slate-400 bg-slate-50">
                      Steer
                    </div>
                  </div>

                  {/* Seat matrix */}
                  <div className="grid grid-cols-4 gap-3">
                    {Array.from({ length: selectedBus.totalSeats }).map((_, index) => {
                      const seatNo = index + 1;
                      const isBooked = selectedBus.bookedSeats.includes(seatNo);
                      const isHeld = selectedBus.heldSeats?.includes(seatNo);
                      const isSelected = selectedSeats.includes(seatNo);

                      let btnStyle = "bg-slate-200 hover:bg-indigo-100 text-slate-700 hover:text-indigo-900 cursor-pointer border border-slate-300";
                      if (isBooked) {
                        btnStyle = "bg-slate-300 text-slate-500 cursor-not-allowed border border-slate-400";
                      } else if (isHeld) {
                        btnStyle = "bg-amber-400 text-amber-950 font-bold border border-amber-500 cursor-not-allowed animate-pulse shadow-sm shadow-amber-300/30";
                      } else if (isSelected) {
                        btnStyle = "bg-indigo-600 text-white border border-indigo-700 font-bold scale-[1.04] shadow-md shadow-indigo-500/10";
                      }

                      // Render gaps as empty divs (e.g. create aisle between col 2 and col 3)
                      // No aisle logic needed for tight layout, standard 4 grid is super clear, but let's add custom labels
                      return (
                        <button
                          key={seatNo}
                          type="button"
                          disabled={isBooked || isHeld}
                          onClick={() => handleSeatClick(seatNo)}
                          className={`h-11 w-11 rounded-xl text-xs font-semibold flex items-center justify-center transition ${btnStyle}`}
                          title={isHeld ? `Seat ${seatNo} (Under booking by other user)` : `Seat ${seatNo}`}
                        >
                          {seatNo}
                        </button>
                      );
                    })}
                  </div>

                  <div className="text-center pt-5 mt-5 border-t border-slate-100">
                    <span className="text-[10px] font-extrabold text-slate-400 tracking-wider block uppercase">AISLE &uarr; BACK</span>
                  </div>
                </div>
              </div>

              {/* Right Column of Modal: Booking Entry form details */}
              <div className="w-full md:w-[360px] p-6 md:p-8 flex flex-col justify-between">
                <div>
                  <h3 className="font-extrabold text-lg text-slate-900 pr-4">Passenger Credentials</h3>
                  <p className="text-xs text-slate-400 mt-1">Fill out the corresponding customer log required for issuing tickets.</p>

                  <form onSubmit={triggerTicketBooking} className="mt-5 space-y-4">
                    
                    {/* Input name */}
                    <div>
                      <label className="text-[11px] font-black uppercase text-slate-400 block tracking-wider mb-1.5">Full Name</label>
                      <div className="relative">
                        <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                        <input 
                          type="text" 
                          required
                          value={passengerName}
                          onChange={e => setPassengerName(e.target.value)}
                          placeholder="Passenger Name"
                          className="w-full bg-slate-100 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 transition rounded-xl py-2.5 pl-9 pr-3 text-xs font-semibold text-slate-800"
                        />
                      </div>
                    </div>

                    {/* Input phone number */}
                    <div>
                      <label className="text-[11px] font-black uppercase text-slate-400 block tracking-wider mb-1.5">Mobile Number</label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                        <input 
                          type="tel" 
                          required
                          value={passengerPhone}
                          onChange={e => setPassengerPhone(e.target.value)}
                          placeholder="10-digit Phone"
                          className="w-full bg-slate-100 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 transition rounded-xl py-2.5 pl-9 pr-3 text-xs font-semibold text-slate-800"
                        />
                      </div>
                    </div>

                    {/* Email Input */}
                    <div>
                      <label className="text-[11px] font-black uppercase text-slate-400 block tracking-wider mb-1.5">Email Address</label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                        <input 
                          type="email" 
                          required
                          value={passengerEmail}
                          onChange={e => setPassengerEmail(e.target.value)}
                          placeholder="Email Address"
                          className="w-full bg-slate-100 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 transition rounded-xl py-2.5 pl-9 pr-3 text-xs font-semibold text-slate-800"
                        />
                      </div>
                    </div>
                  </form>
                </div>

                {/* Confirm pricing footer section inside modal sheet */}
                <div className="border-t border-slate-200 pt-5 mt-6 space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500 font-medium">Selected Seats:</span>
                    <span className="font-bold text-slate-900">
                      {selectedSeats.length > 0 ? selectedSeats.sort((a,b)=>a-b).join(", ") : "None"}
                    </span>
                  </div>
                  <div className="flex justify-between items-end">
                    <span className="text-slate-500 text-sm font-medium">Total Fare:</span>
                    <span className="text-2xl font-black text-indigo-950 font-mono">
                      ₹{selectedSeats.length * selectedBus.price}
                    </span>
                  </div>

                  <button
                    onClick={triggerTicketBooking}
                    disabled={selectedSeats.length === 0 || submittingBooking}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-black p-3.5 rounded-xl transition duration-150 flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-indigo-950/20"
                  >
                    {submittingBooking ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Generating Reservation...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        Confirm Ticket Reservation
                      </>
                    )}
                  </button>
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Premium Rental Inquiry Modal */}
      <AnimatePresence>
        {openInquiryModal && (
          <div 
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setOpenInquiryModal(false);
              }
            }}
            className="fixed inset-0 bg-indigo-950/40 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div 
              initial={{ scale: 0.96, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 10 }}
              transition={{ type: "spring", stiffness: 450, damping: 32 }}
              className="bg-white/95 backdrop-blur-2xl shadow-[0_32px_64px_-10px_rgba(15,23,42,0.22)] max-w-lg w-full rounded-[32px] overflow-hidden border border-white/80 my-4"
            >
              {/* Header Container */}
              <div className="bg-indigo-950/95 text-white p-6 pb-5 flex justify-between items-center border-b border-indigo-900/10 bg-gradient-to-r from-indigo-950 to-indigo-900">
                <div>
                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] px-2.5 py-1 rounded-xl tracking-wider uppercase font-black">
                    ✨ Custom Rental Inquiry
                  </span>
                  <h3 className="font-extrabold text-base tracking-tight mt-1.5 text-white truncate max-w-[260px] sm:max-w-xs">
                    Inquire: {selectedFleetVehicle}
                  </h3>
                </div>
                <button 
                  onClick={() => setOpenInquiryModal(false)}
                  className="p-2 px-3 hover:bg-white/10 active:scale-95 text-indigo-200 hover:text-white rounded-xl text-[11px] font-bold cursor-pointer transition-all border border-white/10"
                >
                  Close
                </button>
              </div>

              {/* Dynamic Vehicle Silhouette Blueprint Card Option */}
              <div className="mx-6 mt-4 p-4 rounded-3xl bg-slate-50 border border-slate-200/50 flex flex-col items-center justify-center relative overflow-hidden shadow-inner">
                <div className="absolute top-2.5 left-4 text-[8px] font-black tracking-wider uppercase text-slate-400">
                  Vehicle Silhouette Blueprint
                </div>
                <div className="absolute top-2.5 right-4 text-[8px] font-black tracking-mono uppercase text-indigo-600">
                  {selectedFleetVehicle.toUpperCase().includes("URBANIA") ? "ELITE SUSPENSION FLUSH" : "HEAVY CAB COACH LXI"}
                </div>
                
                <div className="mt-4 mb-2 w-full flex justify-center">
                  {selectedFleetVehicle.toUpperCase().includes("URBANIA") ? (
                    <svg viewBox="0 0 240 80" className="w-48 h-12 text-emerald-600/80" fill="currentColor">
                      <g className="opacity-80">
                        <circle cx="55" cy="65" r="11" className="fill-white stroke-emerald-600 stroke-[1.5]" />
                        <circle cx="55" cy="65" r="5" className="fill-slate-400/40" />
                        <circle cx="185" cy="65" r="11" className="fill-white stroke-emerald-600 stroke-[1.5]" />
                        <circle cx="185" cy="65" r="5" className="fill-slate-400/40" />
                        <path d="M 15,55 L 18,48 Q 22,36 35,32 L 42,23 Q 48,22 55,22 L 215,22 Q 222,22 222,35 L 222,55 Q 222,58 217,58 L 197,58 A 14,14 0 0,0 173,58 L 67,58 A 14,14 0 0,0 43,58 L 22,58 Q 15,58 15,55 Z" className="fill-emerald-500/[0.04] stroke-emerald-600 stroke-[2] stroke-round" />
                        <path d="M 32,33 L 43,25 L 55,25 L 53,35 L 36,36 Z" className="fill-emerald-600/10 stroke-emerald-600/30 stroke" />
                        <rect x="61" y="26" width="36" height="15" rx="3" className="fill-emerald-600/10 stroke-emerald-600/20 stroke" />
                        <rect x="101" y="26" width="36" height="15" rx="3" className="fill-emerald-600/10 stroke-emerald-600/20 stroke" />
                        <rect x="141" y="26" width="36" height="15" rx="3" className="fill-emerald-600/10 stroke-emerald-600/20 stroke" />
                        <rect x="181" y="26" width="34" height="15" rx="3" className="fill-emerald-600/10 stroke-emerald-600/20 stroke" />
                        <line x1="15" y1="41" x2="221" y2="41" className="stroke-emerald-600/20 stroke-1" />
                      </g>
                    </svg>
                  ) : selectedFleetVehicle.toUpperCase().includes("TRAVELLER") || selectedFleetVehicle.toUpperCase().includes("CRUISER") ? (
                    <svg viewBox="0 0 240 80" className="w-48 h-12 text-indigo-600/80" fill="currentColor">
                      <g className="opacity-80">
                        <circle cx="50" cy="65" r="11" className="fill-white stroke-indigo-600 stroke-[1.5]" />
                        <circle cx="50" cy="65" r="5" className="fill-slate-400/40" />
                        <circle cx="190" cy="65" r="11" className="fill-white stroke-indigo-600 stroke-[1.5]" />
                        <circle cx="190" cy="65" r="5" className="fill-slate-400/40" />
                        <path d="M 20,55 L 20,40 Q 20,28 32,25 L 210,25 Q 220,25 220,38 L 220,55 Q 220,58 215,58 L 202,58 A 14,14 0 0,0 178,58 L 62,58 A 14,14 0 0,0 38,58 L 25,58 Q 20,58 20,55 Z" className="fill-indigo-500/[0.04] stroke-indigo-600 stroke-[2] stroke-round" />
                        <rect x="35" y="30" width="28" height="13" rx="2" className="fill-indigo-600/10 stroke-indigo-600/20 stroke" />
                        <rect x="68" y="30" width="34" height="13" rx="2" className="fill-indigo-600/10 stroke-indigo-600/20 stroke" />
                        <rect x="107" y="30" width="34" height="13" rx="2" className="fill-indigo-600/10 stroke-indigo-600/20 stroke" />
                        <rect x="146" y="30" width="34" height="13" rx="2" className="fill-indigo-600/10 stroke-indigo-600/20 stroke" />
                        <rect x="185" y="30" width="28" height="13" rx="2" className="fill-indigo-600/10 stroke-indigo-600/20 stroke" />
                        <line x1="20" y1="46" x2="220" y2="46" className="stroke-indigo-600/30 stroke-1" />
                      </g>
                    </svg>
                  ) : (
                    <svg viewBox="0 0 240 80" className="w-48 h-12 text-indigo-800/80" fill="currentColor">
                      <g className="opacity-80">
                        <circle cx="48" cy="65" r="11" className="fill-white stroke-indigo-700 stroke-[1.5]" />
                        <circle cx="48" cy="65" r="5" className="fill-slate-400/40" />
                        <circle cx="180" cy="65" r="11" className="fill-white stroke-indigo-700 stroke-[1.5]" />
                        <circle cx="180" cy="65" r="5" className="fill-slate-400/40" />
                        <circle cx="204" cy="65" r="11" className="fill-white stroke-indigo-700 stroke-[1.5]" />
                        <circle cx="204" cy="65" r="5" className="fill-slate-400/40" />
                        <path d="M 15,55 L 15,24 Q 15,18 25,18 L 222,18 Q 226,18 226,24 L 226,55 Q 226,58 221,58 L 216,58 A 12,12 0 0,0 192,58 H 168 A 12,12 0 0,0 144,58 H 60 A 12,12 0 0,0 36,58 L 22,58 Q 15,58 15,55 Z" className="fill-indigo-500/[0.04] stroke-indigo-700 stroke-[2] stroke-round" />
                        <rect x="22" y="23" width="22" height="19" rx="2" className="fill-indigo-700/10 stroke-indigo-700/25 stroke" />
                        <rect x="49" y="23" width="30" height="19" rx="2" className="fill-indigo-700/10 stroke-indigo-700/25 stroke" />
                        <rect x="83" y="23" width="30" height="19" rx="2" className="fill-indigo-700/10 stroke-indigo-700/25 stroke" />
                        <rect x="117" y="23" width="30" height="19" rx="2" className="fill-indigo-700/10 stroke-indigo-700/25 stroke" />
                        <rect x="151" y="23" width="30" height="19" rx="2" className="fill-indigo-700/10 stroke-indigo-700/25 stroke" />
                        <rect x="185" y="23" width="33" height="19" rx="2" className="fill-indigo-700/10 stroke-indigo-700/25 stroke" />
                        <line x1="15" y1="46" x2="226" y2="46" className="stroke-indigo-700/20 stroke-1" />
                      </g>
                    </svg>
                  )}
                </div>

                <div className="text-[9px] text-slate-500 font-bold flex items-center gap-1.5 bg-white px-2.5 py-0.5 rounded-full border border-slate-100 shadow-sm">
                  <span className="w-1 h-1 rounded-full bg-indigo-600 animate-pulse"></span>
                  Category: {selectedFleetVehicle.toUpperCase().includes("URBANIA") ? "Executive Force Urbania Platform" : selectedFleetVehicle.toUpperCase().includes("TRAVELLER") ? "Cruiser Force Tempo Traveller" : "Heavy Passenger Coach Class"}
                </div>
              </div>

              <form onSubmit={triggerRentalInquiry} className="p-6 pt-2 space-y-4 text-left">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block mb-1.5">
                      Service Type / Category
                    </label>
                    <select
                      value={selectedRentalCategory}
                      onChange={e => setSelectedRentalCategory(e.target.value)}
                      className="w-full bg-slate-50/70 border border-slate-200 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 rounded-2xl p-3 text-xs font-extrabold text-slate-800 transition"
                    >
                      <option value="Bus Rent">Bus Rent</option>
                      <option value="Weddings">Wedding rentals</option>
                      <option value="Corporate">Corporate rentals</option>
                      <option value="Tempo Travellers">Tempo Travellers</option>
                      <option value="Tour Packages">Tour packages</option>
                      <option value="Travel">Travel Services</option>
                      <option value="Hourly Packages">Hourly packages</option>
                      <option value="Picnics">Picnics / Outings</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block mb-1.5">
                      Target Fleet Vehicle
                    </label>
                    <select
                      value={selectedFleetVehicle}
                      onChange={e => setSelectedFleetVehicle(e.target.value)}
                      className="w-full bg-slate-50/70 border border-slate-200 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 rounded-2xl p-3 text-xs font-extrabold text-slate-800 transition"
                    >
                      <option value="12 Seater Tempo Traveller (AC)">12 Seater Tempo Traveller (AC)</option>
                      <option value="17 Seater Tempo Traveller (AC)">17 Seater Tempo Traveller (AC)</option>
                      <option value="12 Seater Force Urbania (Premium AC)">12 Seater Force Urbania (Premium AC)</option>
                      <option value="16 Seater Force Urbania (Premium AC)">16 Seater Force Urbania (Premium AC)</option>
                      <option value="22 Seater Mini Bus (AC)">22 Seater Mini Bus (AC)</option>
                      <option value="28 Seater Mini Bus (AC)">28 Seater Mini Bus (AC)</option>
                      <option value="30 Seater Bus (Executive Luxury Air-Suspension)">30 Seater Bus (Executive Luxury)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block mb-1.5">
                      📆 Pickup Date
                    </label>
                    <input 
                      type="date"
                      required
                      min={todayStr}
                      value={inquiryPickupDate}
                      onChange={e => setInquiryPickupDate(e.target.value)}
                      className="w-full bg-slate-50/70 border border-slate-200 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 rounded-2xl p-3 text-xs font-bold text-slate-800 transition"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block mb-1.5">
                      ⏱️ Duration
                    </label>
                    <div className="flex gap-2">
                      <input 
                        type="number"
                        required
                        min={1}
                        max={inquiryUnit === "Days" ? 30 : 24}
                        value={inquiryDays}
                        onChange={e => setInquiryDays(Number(e.target.value))}
                        className="w-1/2 bg-slate-50/70 border border-slate-200 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 rounded-2xl p-3 text-xs font-bold text-slate-800 transition"
                      />
                      <select
                        value={inquiryUnit}
                        onChange={e => {
                          const unit = e.target.value as "Days" | "Hours";
                          setInquiryUnit(unit);
                          if (unit === "Hours" && inquiryDays > 24) {
                            setInquiryDays(8); // clean fallback defaults
                          }
                        }}
                        className="w-1/2 bg-indigo-50 border border-indigo-100 text-indigo-700 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 rounded-2xl p-3 text-xs font-extrabold transition cursor-pointer"
                      >
                        <option value="Days">Days</option>
                        <option value="Hours">Hours</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block mb-1.5">
                    👤 Customer Full Name
                  </label>
                  <input 
                    type="text"
                    required
                    placeholder="Enter full name"
                    value={inquiryName}
                    onChange={e => setInquiryName(e.target.value)}
                    className="w-full bg-slate-50/70 border border-slate-200 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 rounded-2xl p-3 text-xs font-bold text-slate-800 transition px-4"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block mb-1.5">
                      📞 Mobile Number
                    </label>
                    <input 
                      type="tel"
                      required
                      placeholder="e.g. 9876543210"
                      value={inquiryPhone}
                      onChange={e => setInquiryPhone(e.target.value)}
                      className="w-full bg-slate-50/70 border border-slate-200 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 rounded-2xl p-3 text-xs font-mono font-bold text-slate-800 transition px-4"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block mb-1.5">
                      ✉️ Email Address
                    </label>
                    <input 
                      type="email"
                      required
                      placeholder="e.g. name@domain.com"
                      value={inquiryEmail}
                      onChange={e => setInquiryEmail(e.target.value)}
                      className="w-full bg-slate-50/70 border border-slate-200 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 rounded-2xl p-3 text-xs font-bold text-slate-800 transition px-4"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block mb-1.5">
                    🗒️ Special Requirements & Route Details
                  </label>
                  <textarea 
                    placeholder="Provide details about destination, pickup point, routing packages, or special preferences..."
                    rows={2}
                    value={inquiryNotes}
                    onChange={e => setInquiryNotes(e.target.value)}
                    className="w-full bg-slate-50/70 border border-slate-200 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 rounded-2xl p-3 text-xs font-medium text-slate-800 font-sans transition-all px-4"
                  />
                </div>

                <div className="border-t border-slate-100 pt-5 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setOpenInquiryModal(false)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-extrabold p-3.5 rounded-2xl text-xs transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingInquiry}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-black p-3.5 rounded-2xl text-xs transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-indigo-600/10 border border-indigo-500/20 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {submittingInquiry ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Logging...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Log Inquiry Now
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Administrative Auth Dialog Overlay */}
      <AnimatePresence>
        {openAdminAuthModal && (
          <div 
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setOpenAdminAuthModal(false);
                setAdminPassphrase("");
                setAdminError(null);
              }
            }}
            className="fixed inset-0 bg-indigo-950/40 backdrop-blur-md z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.96, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 8 }}
              transition={{ type: "spring", stiffness: 450, damping: 32 }}
              className="bg-white/95 backdrop-blur-2xl rounded-[32px] p-8 md:p-10 max-w-sm w-full border border-white/80 shadow-[0_32px_64px_-10px_rgba(15,23,42,0.22)] relative text-slate-800"
            >
              <button 
                onClick={() => {
                  setOpenAdminAuthModal(false);
                  setAdminPassphrase("");
                  setAdminError(null);
                }}
                className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center">
                <div className="bg-indigo-600/10 text-indigo-600 p-4 rounded-full w-fit mx-auto mb-5 border border-indigo-200/20">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black text-indigo-950 tracking-tight">Admin Portal Access</h3>
                <p className="text-xs text-slate-500 mt-2.5 leading-relaxed font-medium">
                  Provide the Sairam Travels administrator security passphrase to access reservation and inquiry records.
                </p>
              </div>

              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  if (adminPassphrase === "sairam555") {
                    setIsAdminAuthenticated(true);
                    setIsAdminViewActive(true);
                    setOpenAdminAuthModal(false);
                    setIsCheckStatusView(false);
                    setRentalViewActive(false);
                    setAdminPassphrase("");
                    setAdminError(null);
                  } else {
                    setAdminError("Access Denied: Invalid administrator passphrase.");
                  }
                }}
                className="mt-6 space-y-4"
              >
                <div>
                  <label className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block mb-1.5 text-center">
                    Enter Passphrase
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={adminPassphrase}
                    onChange={e => setAdminPassphrase(e.target.value)}
                    className="w-full bg-slate-50/70 border border-slate-200/80 rounded-2xl p-3.5 text-sm outline-none font-mono text-center tracking-widest focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-black text-slate-800 shadow-inner"
                  />
                </div>

                {adminError && (
                  <p className="text-rose-600 text-[10px] font-bold text-center mt-2 bg-rose-50 border border-rose-100 rounded-xl p-3 shadow-sm">
                    ⚠️ {adminError}
                  </p>
                )}

                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 hover:scale-[1.02] active:scale-[0.98] text-white font-black py-4 rounded-2xl text-xs transition duration-200 shadow-lg shadow-indigo-600/10 border border-indigo-500/10 cursor-pointer mt-1"
                >
                  Verify Configuration Keys
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Persistent Floating Calls & WhatsApp Widget (Bottom-Left Side to prevent overlap with standard toasts) */}
      <div className="fixed bottom-6 left-6 z-40 flex flex-col gap-2.5">
        <a 
          href={`tel:${contactInfo.helpline.replace(/\s+/g, "")}`}
          className="bg-indigo-600 hover:bg-indigo-700 hover:scale-[1.06] active:scale-[0.98] text-white p-3.5 rounded-full shadow-2xl flex items-center justify-center transition group relative cursor-pointer"
          title="Call Sairam Travels Helpline"
        >
          <Phone className="w-5.5 h-5.5" />
          <span className="absolute left-14 bg-indigo-950 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition whitespace-nowrap shadow border border-indigo-900 pointer-events-none">
            Call support: {contactInfo.helpline}
          </span>
        </a>
        <a 
          href={`https://wa.me/${contactInfo.helpline.replace(/[^0-9]/g, "")}?text=Hi%20Sairam%2520Travels!%20I%20want%2520to%20get%2520more%20details%20on%20renting%20or%20booking%20a%20vehicle%2520service.`}
          target="_blank"
          rel="noreferrer"
          className="bg-[#25D366] hover:bg-[#20ba5a] hover:scale-[1.06] active:scale-[0.98] text-white p-3.5 rounded-full shadow-2xl flex items-center justify-center transition group relative cursor-pointer"
          title="Chat with WhatsApp Support Agent"
        >
          <MessageCircle className="w-5.5 h-5.5 fill-white text-emerald-800" />
          <span className="absolute left-14 bg-slate-900 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition whitespace-nowrap shadow border border-slate-800 pointer-events-none">
            WhatsApp Live Chat
          </span>
        </a>
      </div>

      {/* Testimonials & Customer Testimonials */}
      {!isAdminViewActive && (
        <section className="bg-slate-900/15 py-14 px-6 border-t border-slate-200 relative overflow-hidden bg-gradient-to-b from-white to-slate-50/50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <span className="bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] font-black tracking-widest px-3 py-1 rounded-full uppercase">
                PASSENGER EXPERIENCES
              </span>
              <h2 className="text-2xl md:text-3.5xl font-black text-slate-800 mt-3 tracking-tight">
                Preferred by Lakhs of Happy Travelers
              </h2>
              <p className="text-slate-500 text-xs md:text-sm mt-2 font-light">
                See real feedback from our regular vacation groups, local commuters, corporate sponsors, and family organizers.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  name: "Karthik Subramanian",
                  role: "Family Tour Organizer",
                  rating: 5,
                  route: "Hyderabad ⇄ Bangalore (17 Seater Force Urbania)",
                  feedback: "Booked a premium Force Urbania for a family temple tour around Andhra Pradesh. The vehicle was spotless, had dual-zone cooling, and the driver was extremely professional and careful of blind zones. Outstanding service!",
                  avatar: "KS"
                },
                {
                  name: "Meera Reddy",
                  role: "HR Corporate lead",
                  rating: 5,
                  route: "Chennai ⇄ Bangalore (Executive Multi-Axle)",
                  feedback: "We rely on Sairam Travels daily for employee pickup routes. Timely departures, accurate GPS tracking, and extremely responsive helplines make them the best companion transit partner in Secunderabad.",
                  avatar: "MR"
                },
                {
                  name: "Aniket Sharma",
                  role: "Group Wedding Coordinator",
                  rating: 5,
                  route: "Hyderabad ⇄ Pune (30 Seater Luxury Bus)",
                  feedback: "Rented a custom air-suspension mini coach for guest transfers during our wedding functions. Outstanding communication from the administrator. They locked down tariffs easily. Highly recommend Sairam!",
                  avatar: "AS"
                }
              ].map((item, idx) => (
                <div key={idx} className="bg-white/70 backdrop-blur-md border border-slate-200 p-6 rounded-2xl flex flex-col justify-between hover:border-indigo-300 hover:shadow-lg transition cursor-pointer group">
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex gap-0.5">
                        {Array.from({ length: item.rating }).map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        ))}
                      </div>
                      <span className="text-[10px] text-indigo-600 font-mono font-bold tracking-tight uppercase">Verified Trip</span>
                    </div>
                    <p className="text-slate-600 text-xs italic leading-relaxed font-light">"{item.feedback}"</p>
                  </div>
                  <div className="border-t border-slate-100 pt-4 mt-5 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 font-black text-xs flex items-center justify-center border border-indigo-100">
                      {item.avatar}
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-slate-800">{item.name}</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">{item.role}</p>
                      <p className="text-[9px] text-emerald-600 font-mono mt-0.5">{item.route}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Footer copyright */}
      <footer className="bg-indigo-950 text-indigo-300 py-12 px-6 border-t border-indigo-900 mt-auto">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-sm leading-relaxed">
          <div>
            <h3 className="font-bold text-lg text-white mb-3">Sairam Travels</h3>
            <p className="font-light text-indigo-200">
              Sairam travels is India's leading premium motor carrier agency. Offering safe, timely, sanitized premium sleeper bus journeys connecting key hubs.
            </p>
          </div>
          <div>
            <h3 className="font-bold text-lg text-white mb-3 font-mono">Popular Active Links</h3>
            <ul className="space-y-1.5 text-indigo-200 font-light">
              <li>Hyderabad &bull; Bangalore Daily Sleeper</li>
              <li>Chennai &bull; Bangalore Executive Multi-Axle</li>
              <li>Mumbai &bull; Pune Seater Line</li>
              <li>Bangalore &bull; Hyderabad Premium AC Express</li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-lg text-white mb-3">Reach Out</h3>
            <p className="font-light text-indigo-200">Email: {contactInfo.email}</p>
            <p className="font-light text-indigo-200">Helpline: {contactInfo.helpline}</p>
            <p className="text-[11px] text-indigo-400 mt-2 font-mono leading-relaxed">{contactInfo.address}</p>
          </div>
        </div>
        <div className="max-w-7xl mx-auto text-center border-t border-indigo-900 mt-8 pt-8 text-[11px] text-indigo-400 font-mono flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <span>&copy; 2026 Sairam Travels. All rights reserved. Persistent in-memory state.</span>
          <button 
            type="button"
            onClick={() => {
              if (isAdminAuthenticated) {
                setIsAdminViewActive(true);
                setIsCheckStatusView(false);
                setRentalViewActive(false);
              } else {
                setOpenAdminAuthModal(true);
              }
            }}
            className="text-emerald-400 hover:text-emerald-300 transition underline font-bold flex items-center gap-1 cursor-pointer"
          >
            🔒 Owner & Manager Administrative Portal Login ({isAdminAuthenticated ? "Logged In" : "Click to Authenticate"})
          </button>
        </div>
      </footer>

    </div>
  );
}
