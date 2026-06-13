export interface Bus {
  id: number;
  name: string;
  type: string; // 'AC Sleeper' | 'Non-AC Sleeper' | 'Non-AC Seater' etc.
  from: string;
  to: string;
  departure: string;
  arrival: string;
  price: number;
  rating: number;
  totalSeats: number;
  bookedSeats: number[];
  heldSeats?: number[];
}

export interface Booking {
  pnr: string;
  busId: number;
  passengerName: string;
  passengerPhone: string;
  passengerEmail: string;
  seats: number[];
  totalPrice: number;
  journeyDate: string;
  bookingDate: string;
}

export interface RentalInquiry {
  id: string;
  category: string; // "Bus Rent" | "Weddings" | "Corporate" | "Tempo Travellers" | "Tour Packages" | "Travel" | "Hourly Packages" | "Picnics"
  vehicleType: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  pickupDate: string;
  durationDays: number;
  durationUnit?: "Days" | "Hours";
  notes?: string;
  status: "pending" | "contacted" ;
  createdAt: string;
}

export interface ContactInfo {
  helpline: string;
  email: string;
  address: string;
}

export interface RentalVehicle {
  id: string;
  name: string;
  type: string;
  capacity: string;
  rating: number;
  price: string;
  features: string[];
}
