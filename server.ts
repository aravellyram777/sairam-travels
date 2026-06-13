import dotenv from "dotenv";
dotenv.config();

import express from "express";
import path from "path";
import dns from "dns";
import fs from "fs";
import pg from "pg";
const { Pool } = pg;
import { createServer as createViteServer } from "vite";
import { Bus, Booking, RentalInquiry, ContactInfo, RentalVehicle } from "./src/types";

// Prevent localhost lookup slowdowns
dns.setDefaultResultOrder("ipv4first");

const app = express();
const PORT = 3000;

app.use(express.json());

// Persistent Database Configuration
const DB_FILE = process.env.DB_PATH || path.join(process.cwd(), "db_sairam.json");

const DEFAULT_BUS_DATA: Omit<Bus, 'bookedSeats'>[] = [
  { id: 1, name: "Sairam Multi-Axle Volvo", type: "AC Sleeper", from: "Hyderabad", to: "Bangalore", departure: "21:00", arrival: "06:30", price: 1200, rating: 4.8, totalSeats: 20 },
  { id: 2, name: "Sairam Express", type: "Non-AC Sleeper", from: "Hyderabad", to: "Bangalore", departure: "19:30", arrival: "05:45", price: 750, rating: 4.2, totalSeats: 20 },
  { id: 3, name: "Sairam Travels Premium", type: "AC Sleeper", from: "Chennai", to: "Bangalore", departure: "22:15", arrival: "05:30", price: 1100, rating: 4.6, totalSeats: 20 },
  { id: 4, name: "Sairam High-Class Seater", type: "Non-AC Seater", from: "Mumbai", to: "Pune", departure: "08:00", arrival: "11:30", price: 350, rating: 4.0, totalSeats: 20 },
  { id: 5, name: "Sairam Luxury Liner", type: "AC Sleeper", from: "Hyderabad", to: "Chennai", departure: "20:30", arrival: "06:00", price: 1300, rating: 4.7, totalSeats: 20 },
  { id: 6, name: "Sairam Connect", type: "Non-AC Sleeper", from: "Bangalore", to: "Hyderabad", departure: "21:30", arrival: "07:00", price: 800, rating: 4.3, totalSeats: 20 }
];

const DEFAULT_CONTACT_INFO: ContactInfo = {
  helpline: "+91 98765 43210",
  email: "support@sairamtravels.com",
  address: "69/1 ,lane,beside more supermarket,saraswathi nagar ,lothukunta,alwal,secundrabad,Telangana 500015"
};

const DEFAULT_FLEET: RentalVehicle[] = [
  {
    id: "v1",
    name: "12 Seater Tempo Traveller (AC)",
    type: "AC Luxury Cruiser",
    capacity: "12 Passengers",
    rating: 4.8,
    price: "₹18/km",
    features: ["Individual AC vents", "Premium pushback seats", "Premium Sound System", "High high-roof clearance"]
  },
  {
    id: "v2",
    name: "17 Seater Tempo Traveller (AC)",
    type: "AC Tourist Coach",
    capacity: "17 Passengers",
    rating: 4.7,
    price: "₹21/km",
    features: ["Dual-zone cooling blowers", "Comfort headrests", "Mic and audio guide system", "Ample luggage space"]
  },
  {
    id: "v3",
    name: "12 Seater Force Urbania (Premium AC)",
    type: "Luxury Executive Van",
    capacity: "12 Passengers",
    rating: 4.9,
    price: "₹24/km",
    features: ["Elite styling & suspension", "Deep bucket recliners", "Padded armrests & USB ports", "Ambient internal lighting"]
  },
  {
    id: "v4",
    name: "16 Seater Force Urbania (Premium AC)",
    type: "Elite Business Cruiser",
    capacity: "16 Passengers",
    rating: 4.9,
    price: "₹27/km",
    features: ["Extra long wheelbase", "Full high-back leather seats", "Under-seat storage space", "LED Cabin illumination"]
  },
  {
    id: "v5",
    name: "22 Seater Mini Bus (AC)",
    type: "AC Executive Mini Bus",
    capacity: "22 Passengers",
    rating: 4.6,
    price: "₹30/km",
    features: ["Full air vents panel", "Wide view slide windows", "Ergonomic wide passenger seat", "Dedicated utility trunk"]
  },
  {
    id: "v6",
    name: "28 Seater Mini Bus (AC)",
    type: "Deluxe Group Motorcoach",
    capacity: "28 Passengers",
    rating: 4.5,
    price: "₹34/km",
    features: ["Perfect group width size", "Overhead hand rails", "Rear safety camera alerts", "First aid complete deck"]
  },
  {
    id: "v7",
    name: "30 Seater Bus (Executive Luxury Air-Suspension)",
    type: "AC Deluxe Air-Suspension Bus",
    capacity: "30 Passengers",
    rating: 4.8,
    price: "₹38/km",
    features: ["Premium air cushion suspension", "Pistol-grip armrests", "Wide gangways & high safety ratings", "Emergency door triggers"]
  }
];

let BUS_DATA: Omit<Bus, 'bookedSeats'>[] = [...DEFAULT_BUS_DATA];

// Let's keep PRE_BOOKED_TEMPLATES empty so all new dates start with 100% available seats!
const PRE_BOOKED_TEMPLATES: Record<number, number[]> = {};

// Date-specific seat registries: "busId:date" -> array of booked seat numbers
let dateBookingsRegistry: Record<string, number[]> = {};

// Full stores
let bookingsStore: Booking[] = [];
let rentalInquiriesStore: RentalInquiry[] = [];
let contactInfo: ContactInfo = { ...DEFAULT_CONTACT_INFO };
let rentalFleetStore: RentalVehicle[] = [...DEFAULT_FLEET];

// --- PostgreSQL Database Adapter ---
let dbPool: pg.Pool | null = null;
let pgConnected = false;

function applyLoadedData(parsed: any) {
  if (!parsed) return;
  
  if (parsed.BUS_DATA) {
    BUS_DATA = parsed.BUS_DATA;
  } else {
    BUS_DATA = JSON.parse(JSON.stringify(DEFAULT_BUS_DATA));
  }

  if (parsed.rentalFleetStore) {
    rentalFleetStore = parsed.rentalFleetStore;
  } else {
    rentalFleetStore = JSON.parse(JSON.stringify(DEFAULT_FLEET));
  }
  
  if (parsed.dateBookingsRegistry) dateBookingsRegistry = parsed.dateBookingsRegistry;
  if (parsed.bookingsStore) bookingsStore = parsed.bookingsStore;
  if (parsed.rentalInquiriesStore) rentalInquiriesStore = parsed.rentalInquiriesStore;
  if (parsed.contactInfo) {
    contactInfo = parsed.contactInfo;
  } else {
    contactInfo = { ...DEFAULT_CONTACT_INFO };
  }
}

// Initial/fallback synchronous database load from file system
function loadDatabase() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const fileContent = fs.readFileSync(DB_FILE, "utf-8");
      const parsed = JSON.parse(fileContent);
      applyLoadedData(parsed);
      console.log(`[Database] Local disk load complete. Persistent loaded: ${BUS_DATA.length} buses, ${rentalFleetStore.length} fleet vehicles, ${bookingsStore.length} bookings, ${rentalInquiriesStore.length} inquiries.`);
    } else {
      saveDatabase();
    }
  } catch (error) {
    console.error("[Database] Local load error - defaulting to fresh data:", error);
  }
}

async function bootstrapPostgreSQLTables() {
  if (!dbPool) return;
  try {
    console.log("[Database] Bootstrapping PostgreSQL tables...");
    
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS sairam_buses (
        id INT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        departure_from TEXT NOT NULL,
        arrival_to TEXT NOT NULL,
        departure TEXT NOT NULL,
        arrival TEXT NOT NULL,
        price INT NOT NULL,
        rating DOUBLE PRECISION NOT NULL,
        total_seats INT NOT NULL
      )
    `);

    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS sairam_date_bookings (
        key TEXT PRIMARY KEY,
        booked_seats INT[] NOT NULL
      )
    `);

    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS sairam_bookings (
        pnr TEXT PRIMARY KEY,
        bus_id INT NOT NULL,
        passenger_name TEXT NOT NULL,
        passenger_phone TEXT NOT NULL,
        passenger_email TEXT NOT NULL,
        seats INT[] NOT NULL,
        total_price INT NOT NULL,
        journey_date TEXT NOT NULL,
        booking_date TEXT NOT NULL
      )
    `);

    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS sairam_rental_inquiries (
        id TEXT PRIMARY KEY,
        category TEXT NOT NULL,
        vehicle_type TEXT NOT NULL,
        customer_name TEXT NOT NULL,
        customer_phone TEXT NOT NULL,
        customer_email TEXT NOT NULL,
        pickup_date TEXT NOT NULL,
        duration_days INT NOT NULL,
        duration_unit TEXT NOT NULL,
        notes TEXT NOT NULL,
        status TEXT NOT NULL,
        created_at TEXT NOT NULL
      )
    `);

    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS sairam_contact_info (
        id INT PRIMARY KEY DEFAULT 1,
        helpline TEXT NOT NULL,
        email TEXT NOT NULL,
        address TEXT NOT NULL,
        CONSTRAINT single_row CHECK (id = 1)
      )
    `);

    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS sairam_rental_fleet (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        capacity TEXT NOT NULL,
        rating DOUBLE PRECISION NOT NULL,
        price TEXT NOT NULL,
        features TEXT[] NOT NULL
      )
    `);

    console.log("[Database] Schema bootstrap finished successfully.");
  } catch (error) {
    console.error("[Database] Error creating PostgreSQL tables:", error);
    throw error;
  }
}

// Loads state asynchronously from PostgreSQL Database and merges it to live state
async function loadDatabasePg() {
  if (!pgConnected || !dbPool) return;
  try {
    console.log("[Database] Fetching data from PostgreSQL Cloud Database...");
    
    // 1. Buses
    const busesRes = await dbPool.query("SELECT * FROM sairam_buses ORDER BY id ASC");
    if (busesRes.rows.length > 0) {
      BUS_DATA = busesRes.rows.map(row => ({
        id: row.id,
        name: row.name,
        type: row.type,
        from: row.departure_from,
        to: row.arrival_to,
        departure: row.departure,
        arrival: row.arrival,
        price: row.price,
        rating: row.rating,
        totalSeats: row.total_seats
      }));
    } else {
      console.log("[Database] Seeding default buses...");
      for (const bus of DEFAULT_BUS_DATA) {
        await dbPool.query(
          "INSERT INTO sairam_buses (id, name, type, departure_from, arrival_to, departure, arrival, price, rating, total_seats) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) ON CONFLICT (id) DO NOTHING",
          [bus.id, bus.name, bus.type, bus.from, bus.to, bus.departure, bus.arrival, bus.price, bus.rating, bus.totalSeats]
        );
      }
      BUS_DATA = [...DEFAULT_BUS_DATA];
    }

    // 2. Date Bookings
    const dateBookingsRes = await dbPool.query("SELECT * FROM sairam_date_bookings");
    dateBookingsRegistry = {};
    for (const row of dateBookingsRes.rows) {
      dateBookingsRegistry[row.key] = row.booked_seats;
    }

    // 3. Bookings
    const bookingsRes = await dbPool.query("SELECT * FROM sairam_bookings");
    bookingsStore = bookingsRes.rows.map(row => ({
      pnr: row.pnr,
      busId: row.bus_id,
      passengerName: row.passenger_name,
      passengerPhone: row.passenger_phone,
      passengerEmail: row.passenger_email,
      seats: row.seats,
      totalPrice: row.total_price,
      journeyDate: row.journey_date,
      bookingDate: row.booking_date
    }));

    // 4. Rental Inquiries
    const inquiriesRes = await dbPool.query("SELECT * FROM sairam_rental_inquiries");
    rentalInquiriesStore = inquiriesRes.rows.map(row => ({
      id: row.id,
      category: row.category,
      vehicleType: row.vehicle_type,
      customerName: row.customer_name,
      customerPhone: row.customer_phone,
      customerEmail: row.customer_email,
      pickupDate: row.pickup_date,
      durationDays: row.duration_days,
      durationUnit: row.duration_unit,
      notes: row.notes,
      status: row.status as "pending" | "contacted",
      createdAt: row.created_at
    }));

    // 5. Contact Info
    const contactRes = await dbPool.query("SELECT * FROM sairam_contact_info WHERE id = 1");
    if (contactRes.rows.length > 0) {
      contactInfo = {
        helpline: contactRes.rows[0].helpline,
        email: contactRes.rows[0].email,
        address: contactRes.rows[0].address
      };
    } else {
      console.log("[Database] Seeding default contact info...");
      await dbPool.query(
        "INSERT INTO sairam_contact_info (id, helpline, email, address) VALUES (1, $1, $2, $3) ON CONFLICT (id) DO NOTHING",
        [DEFAULT_CONTACT_INFO.helpline, DEFAULT_CONTACT_INFO.email, DEFAULT_CONTACT_INFO.address]
      );
      contactInfo = { ...DEFAULT_CONTACT_INFO };
    }

    // 6. Rental Fleet
    const fleetRes = await dbPool.query("SELECT * FROM sairam_rental_fleet ORDER BY id ASC");
    if (fleetRes.rows.length > 0) {
      rentalFleetStore = fleetRes.rows.map(row => ({
        id: row.id,
        name: row.name,
        type: row.type,
        capacity: row.capacity,
        rating: row.rating,
        price: row.price,
        features: row.features
      }));
    } else {
      console.log("[Database] Seeding default rental fleet...");
      for (const item of DEFAULT_FLEET) {
        await dbPool.query(
          "INSERT INTO sairam_rental_fleet (id, name, type, capacity, rating, price, features) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (id) DO NOTHING",
          [item.id, item.name, item.type, item.capacity, item.rating, item.price, item.features]
        );
      }
      rentalFleetStore = [...DEFAULT_FLEET];
    }

    console.log(`[Database] PostgreSQL Cloud load complete: ${BUS_DATA.length} buses, ${rentalFleetStore.length} fleet vehicles, ${bookingsStore.length} bookings, ${rentalInquiriesStore.length} inquiries.`);
    
    // Write local JSON backup of pg loaded data
    try {
      const data = { BUS_DATA, dateBookingsRegistry, bookingsStore, rentalInquiriesStore, contactInfo, rentalFleetStore };
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
    } catch (err) {}

  } catch (error) {
    console.error("[Database] Error loading database from PostgreSQL:", error);
  }
}

// Saves state asynchronously to PostgreSQL Cloud tables
async function saveDatabasePg() {
  if (!pgConnected || !dbPool) return;
  try {
    // 1. Buses
    for (const bus of BUS_DATA) {
      await dbPool.query(
        `INSERT INTO sairam_buses (id, name, type, departure_from, arrival_to, departure, arrival, price, rating, total_seats) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
         ON CONFLICT (id) DO UPDATE SET name = $2, type = $3, departure_from = $4, arrival_to = $5, departure = $6, arrival = $7, price = $8, rating = $9, total_seats = $10`,
        [bus.id, bus.name, bus.type, bus.from, bus.to, bus.departure, bus.arrival, bus.price, bus.rating, bus.totalSeats]
      );
    }
    if (BUS_DATA.length > 0) {
      const ids = BUS_DATA.map(b => b.id);
      await dbPool.query("DELETE FROM sairam_buses WHERE id NOT IN (" + ids.join(",") + ")");
    } else {
      await dbPool.query("DELETE FROM sairam_buses");
    }

    // 2. Date Bookings
    for (const [key, booked] of Object.entries(dateBookingsRegistry)) {
      await dbPool.query(
        "INSERT INTO sairam_date_bookings (key, booked_seats) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET booked_seats = $2",
        [key, booked]
      );
    }
    const keys = Object.keys(dateBookingsRegistry);
    if (keys.length > 0) {
      await dbPool.query("DELETE FROM sairam_date_bookings WHERE NOT (key = ANY($1))", [keys]);
    } else {
      await dbPool.query("DELETE FROM sairam_date_bookings");
    }

    // 3. Bookings
    for (const b of bookingsStore) {
      await dbPool.query(
         `INSERT INTO sairam_bookings (pnr, bus_id, passenger_name, passenger_phone, passenger_email, seats, total_price, journey_date, booking_date)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          ON CONFLICT (pnr) DO UPDATE SET bus_id = $2, passenger_name = $3, passenger_phone = $4, passenger_email = $5, seats = $6, total_price = $7, journey_date = $8, booking_date = $9`,
         [b.pnr, b.busId, b.passengerName, b.passengerPhone, b.passengerEmail, b.seats, b.totalPrice, b.journeyDate, b.bookingDate]
      );
    }
    if (bookingsStore.length > 0) {
      const pnrs = bookingsStore.map(b => b.pnr);
      await dbPool.query("DELETE FROM sairam_bookings WHERE NOT (pnr = ANY($1))", [pnrs]);
    } else {
      await dbPool.query("DELETE FROM sairam_bookings");
    }

    // 4. Rental Inquiries
    for (const inq of rentalInquiriesStore) {
      await dbPool.query(
        `INSERT INTO sairam_rental_inquiries (id, category, vehicle_type, customer_name, customer_phone, customer_email, pickup_date, duration_days, duration_unit, notes, status, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         ON CONFLICT (id) DO UPDATE SET category = $2, vehicle_type = $3, customer_name = $4, customer_phone = $5, customer_email = $6, pickup_date = $7, duration_days = $8, duration_unit = $9, notes = $10, status = $11, created_at = $12`,
        [inq.id, inq.category, inq.vehicleType, inq.customerName, inq.customerPhone, inq.customerEmail, inq.pickupDate, inq.durationDays, inq.durationUnit, inq.notes, inq.status, inq.createdAt]
      );
    }
    if (rentalInquiriesStore.length > 0) {
      const ids = rentalInquiriesStore.map(inq => inq.id);
      await dbPool.query("DELETE FROM sairam_rental_inquiries WHERE NOT (id = ANY($1))", [ids]);
    } else {
      await dbPool.query("DELETE FROM sairam_rental_inquiries");
    }

    // 5. Contact Info
    await dbPool.query(
      "INSERT INTO sairam_contact_info (id, helpline, email, address) VALUES (1, $1, $2, $3) ON CONFLICT (id) DO UPDATE SET helpline = $1, email = $2, address = $3",
      [contactInfo.helpline, contactInfo.email, contactInfo.address]
    );

    // 6. Rental Fleet
    for (const item of rentalFleetStore) {
      await dbPool.query(
        `INSERT INTO sairam_rental_fleet (id, name, type, capacity, rating, price, features)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO UPDATE SET name = $2, type = $3, capacity = $4, rating = $5, price = $6, features = $7`,
        [item.id, item.name, item.type, item.capacity, item.rating, item.price, item.features]
      );
    }
    if (rentalFleetStore.length > 0) {
      const ids = rentalFleetStore.map(v => v.id);
      await dbPool.query("DELETE FROM sairam_rental_fleet WHERE NOT (id = ANY($1))", [ids]);
    } else {
      await dbPool.query("DELETE FROM sairam_rental_fleet");
    }

    console.log("[Database] State successfully persisted to PostgreSQL Database.");
  } catch (error) {
    console.error("[Database] PostgreSQL save failure:", error);
  }
}

// Double-persist to both local filesystem cache and async PostgreSQL Database
function saveDatabase() {
  const data = {
    BUS_DATA,
    dateBookingsRegistry,
    bookingsStore,
    rentalInquiriesStore,
    contactInfo,
    rentalFleetStore
  };

  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
    console.error("[Database] Local save error:", error);
  }

  if (pgConnected && dbPool) {
    saveDatabasePg().catch(err => {
      console.error("[Database] Async PostgreSQL cloud save error:", err);
    });
  }
}

// Async connection launcher for PostgreSQL
async function connectToPostgreSQL() {
  const dbUrl = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_zesug3YUid6b@ep-gentle-dust-atxktr1m.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require";
  if (!dbUrl) {
    console.log("[Database] DATABASE_URL environment variable is empty. Operating in Local File Mode.");
    return;
  }

  try {
    console.log("[Database] Connecting to PostgreSQL Cloud...");
    const hasSsl = dbUrl.includes("sslmode=") || dbUrl.includes("neon.tech") || dbUrl.includes("amazonaws.com") || dbUrl.includes("render.com");
    dbPool = new Pool({
      connectionString: dbUrl,
      ssl: hasSsl ? { rejectUnauthorized: false } : undefined,
      connectionTimeoutMillis: 15000,
      idleTimeoutMillis: 30000,
      max: 10
    });
    
    // Simple verification query
    await dbPool.query("SELECT NOW()");
    pgConnected = true;
    console.log("[Database] PostgreSQL Cloud Connected successfully.");
    
    await bootstrapPostgreSQLTables();
    await loadDatabasePg();
  } catch (error) {
    console.error("[Database] PostgreSQL Cloud connection failure. Falling back to local file mode:", error);
    pgConnected = false;
  }
}

// Initial synchronous local load to ensure memory is instantly loaded during module load
loadDatabase();

// ------------------ Active Seat Hold Registry & Simultaneous Booking Prevention ------------------
interface SeatHold {
  busId: number;
  journeyDate: string;
  clientId: string;
  seats: number[];
  expiresAt: number;
}
let seatHoldsStore: SeatHold[] = [];

// Clean expired seat holds from the system
function cleanExpiredHolds() {
  const now = Date.now();
  seatHoldsStore = seatHoldsStore.filter(hold => hold.expiresAt > now);
}

// Retrieve currently held seat numbers for a bus on a specific date, optionally excluding a client
function getHeldSeats(busId: number, date: string, excludeClientId?: string): number[] {
  cleanExpiredHolds();
  const held: number[] = [];
  for (const hold of seatHoldsStore) {
    if (hold.busId === busId && hold.journeyDate === date) {
      if (!excludeClientId || hold.clientId !== excludeClientId) {
        held.push(...hold.seats);
      }
    }
  }
  return [...new Set(held)];
}

// Helper to get booked seats for a bus and date
function getBookedSeats(busId: number, date: string): number[] {
  const key = `${busId}:${date}`;
  if (!dateBookingsRegistry[key]) {
    // Seed with template (which is empty, so they start 100% available unless custom booked)
    dateBookingsRegistry[key] = [...(PRE_BOOKED_TEMPLATES[busId] || [])];
    saveDatabase();
  }
  return dateBookingsRegistry[key];
}

// REST API Endpoints

// Security check middleware for all admin control endpoints to prevent external tampering or data corruption
app.use("/api/admin", (req, res, next) => {
  const passphrase = req.headers["x-admin-passphrase"];
  if (passphrase !== "sairam555") {
    return res.status(401).json({ error: "Access Denied: Unauthenticated control request." });
  }
  next();
});

// 1. Get Buses list with dynamic booked seats & active holds calculation per date
app.get("/api/buses", (req, res) => {
  const { date, clientId } = req.query;
  const journeyDate = typeof date === "string" ? date : new Date().toISOString().split("T")[0];
  const clientStr = typeof clientId === "string" ? clientId : "";

  const responseBuses = BUS_DATA.map(bus => {
    const booked = getBookedSeats(bus.id, journeyDate);
    const held = getHeldSeats(bus.id, journeyDate, clientStr);
    return {
      ...bus,
      bookedSeats: booked,
      heldSeats: held // Propagated so multiple clients see seats under booking in real time
    };
  });

  res.json(responseBuses);
});

// 1.5 Temp Hold / Dynamic Seat Locking to prevent multi-user race conditions
app.post("/api/bookings/hold", (req, res) => {
  try {
    const { busId, journeyDate, clientId, seats } = req.body;

    if (!busId || !journeyDate || !clientId || !Array.isArray(seats)) {
      return res.status(400).json({ error: "Missing required booking hold parameters." });
    }

    cleanExpiredHolds();

    // Check if any seat is already booked
    const bookedSeats = getBookedSeats(Number(busId), journeyDate);
    const bookedConflict = seats.find(seat => bookedSeats.includes(seat));
    if (bookedConflict !== undefined) {
      return res.status(409).json({ error: `Seat ${bookedConflict} is already fully booked by another passenger. Please select another seat.` });
    }

    const targetBus = BUS_DATA.find(b => b.id === Number(busId));
    if (!targetBus) {
      return res.status(404).json({ error: "Bus not found." });
    }

    // Check if any seat is currently held/locked by another client
    for (const seat of seats) {
      if (seat < 1 || seat > targetBus.totalSeats) {
        return res.status(400).json({ error: `Invalid seat number ${seat}.` });
      }

      const activeOtherHold = seatHoldsStore.find(h => 
        h.busId === Number(busId) && 
        h.journeyDate === journeyDate && 
        h.clientId !== clientId && 
        h.seats.includes(seat)
      );

      if (activeOtherHold) {
        return res.status(409).json({ error: `Seat ${seat} is currently under booking by another customer. Please choose other seats.` });
      }
    }

    // Refresh/set the temporary lock for this clientId
    seatHoldsStore = seatHoldsStore.filter(h => !(h.clientId === clientId && h.busId === Number(busId) && h.journeyDate === journeyDate));
    
    if (seats.length > 0) {
      seatHoldsStore.push({
        busId: Number(busId),
        journeyDate,
        clientId,
        seats,
        expiresAt: Date.now() + 25000 // 25 seconds duration before release
      });
    }

    res.json({ success: true, message: "Seats held successfully." });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || "Internal server error" });
  }
});

// 2. Create Booking
app.post("/api/bookings", (req, res) => {
  try {
    const { busId, passengerName, passengerPhone, passengerEmail, seats, journeyDate, clientId } = req.body;

    if (!busId || !passengerName || !passengerPhone || !passengerEmail || !seats || !Array.isArray(seats) || seats.length === 0 || !journeyDate) {
      return res.status(400).json({ error: "Missing or invalid booking fields." });
    }

    const targetBus = BUS_DATA.find(b => b.id === Number(busId));
    if (!targetBus) {
      return res.status(404).json({ error: "Bus not found." });
    }

    if (seats.length > 5) {
      return res.status(400).json({ error: "Cannot book more than 5 seats at once." });
    }

    cleanExpiredHolds();
    const bookedSeats = getBookedSeats(Number(busId), journeyDate);

    // Assert that no target seat is booked yet
    const bookedConflict = seats.find(seat => bookedSeats.includes(seat) || seat < 1 || seat > targetBus.totalSeats);
    if (bookedConflict !== undefined) {
      return res.status(409).json({ error: `Seat ${bookedConflict} has been booked by another traveler. Please select other seats.` });
    }

    // Assert that no target seat is held/under booking by another clientId
    const heldOtherConflict = seats.find(seat => {
      return seatHoldsStore.some(h => 
        h.busId === Number(busId) && 
        h.journeyDate === journeyDate && 
        h.clientId !== clientId && 
        h.seats.includes(seat)
      );
    });

    if (heldOtherConflict !== undefined) {
      return res.status(409).json({ error: `Seat ${heldOtherConflict} is currently in progress / under booking by another user. Please choose another seat.` });
    }

    // Persist booking (update layout)
    bookedSeats.push(...seats);
    dateBookingsRegistry[`${busId}:${journeyDate}`] = bookedSeats;

    // Release this client's holds
    if (clientId) {
      seatHoldsStore = seatHoldsStore.filter(h => !(h.clientId === clientId && h.busId === Number(busId) && h.journeyDate === journeyDate));
    }

    const pnr = "SR" + Math.floor(100000 + Math.random() * 900000);

    const newBooking: Booking = {
      pnr,
      busId: Number(busId),
      passengerName,
      passengerPhone,
      passengerEmail,
      seats,
      totalPrice: seats.length * targetBus.price,
      journeyDate,
      bookingDate: new Date().toISOString().split("T")[0]
    };

    bookingsStore.push(newBooking);
    saveDatabase();

    res.status(201).json({
      message: "Booking successful!",
      booking: newBooking,
      busName: targetBus.name
    });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || "Internal server error." });
  }
});

// 3. Get Bookings list
app.get("/api/bookings", (req, res) => {
  res.json(bookingsStore);
});

// 4. Get Booking by PNR (or delete booking)
app.get("/api/bookings/:pnr", (req, res) => {
  const { pnr } = req.params;
  const booking = bookingsStore.find(b => b.pnr.toUpperCase() === pnr.toUpperCase());
  
  if (!booking) {
    return res.status(404).json({ error: "Ticket not found for PNR Code." });
  }

  const bus = BUS_DATA.find(b => b.id === booking.busId);

  res.json({
    ...booking,
    busName: bus?.name || "Sairam Travels Bus",
    type: bus?.type || "Standard",
    from: bus?.from || "",
    to: bus?.to || "",
    departure: bus?.departure || "",
    arrival: bus?.arrival || ""
  });
});

// 5. Submit Rental Inquiry
app.post("/api/rentals/inquiry", (req, res) => {
  try {
    const { category, vehicleType, customerName, customerPhone, customerEmail, pickupDate, durationDays, durationUnit, notes } = req.body;

    if (!category || !vehicleType || !customerName || !customerPhone || !customerEmail || !pickupDate || !durationDays) {
      return res.status(400).json({ error: "Missing required inquiry fields." });
    }

    const id = "SR-RENT-" + Math.floor(10000 + Math.random() * 90000);
    const newInquiry: RentalInquiry = {
      id,
      category,
      vehicleType,
      customerName,
      customerPhone,
      customerEmail,
      pickupDate,
      durationDays: Number(durationDays),
      durationUnit: durationUnit || "Days",
      notes: notes || "",
      status: "pending",
      createdAt: new Date().toISOString().split("T")[0]
    };

    rentalInquiriesStore.push(newInquiry);
    saveDatabase();

    res.status(201).json({
      message: "Inquiry submitted successfully!",
      inquiry: newInquiry
    });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || "Internal server error." });
  }
});

// 6. Get all Rental Inquiries
app.get("/api/rentals/inquiry", (req, res) => {
  res.json(rentalInquiriesStore);
});

// 7. Update Rental Inquiry Status (Admin only)
app.post("/api/admin/rentals/inquiry/:id/status", (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  const inquiry = rentalInquiriesStore.find(inq => inq.id === id);
  if (!inquiry) {
    return res.status(404).json({ error: "Inquiry not found." });
  }

  if (status === "pending" || status === "contacted") {
    inquiry.status = status;
    saveDatabase();
    return res.json({ message: "Inquiry status updated successfully", inquiry });
  } else {
    return res.status(400).json({ error: "Invalid status value." });
  }
});

// 8. Delete Rental Inquiry (Admin only)
app.delete("/api/admin/rentals/inquiry/:id", (req, res) => {
  const { id } = req.params;
  const index = rentalInquiriesStore.findIndex(inq => inq.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Inquiry not found." });
  }

  rentalInquiriesStore.splice(index, 1);
  saveDatabase();
  res.json({ message: "Inquiry deleted successfully" });
});

// 9. Cancel/Delete Booking Seat Reservation (Admin only)
app.delete("/api/admin/bookings/:pnr", (req, res) => {
  const { pnr } = req.params;
  const index = bookingsStore.findIndex(b => b.pnr.toUpperCase() === pnr.toUpperCase());
  if (index === -1) {
    return res.status(404).json({ error: "Booking reservation not found." });
  }

  const booking = bookingsStore[index];
  
  // Re-enable/free up the seats in the dynamic dateBookingsRegistry
  const registryKey = `${booking.busId}:${booking.journeyDate}`;
  if (dateBookingsRegistry[registryKey]) {
    // Remove the booked seats
    dateBookingsRegistry[registryKey] = dateBookingsRegistry[registryKey].filter(
      seatNum => !booking.seats.includes(seatNum)
    );
  }

  // Remove booking from store
  bookingsStore.splice(index, 1);
  saveDatabase();

  res.json({ message: "Booking cancelled and seats freed up successfully" });
});

// 10. Add New Bus (Admin only)
app.post("/api/admin/buses", (req, res) => {
  try {
    const { name, type, from, to, departure, arrival, price, rating, totalSeats } = req.body;
    if (!name || !type || !from || !to || !departure || !arrival || price === undefined || totalSeats === undefined) {
      return res.status(400).json({ error: "Missing required bus parameters." });
    }
    const nextId = BUS_DATA.length > 0 ? Math.max(...BUS_DATA.map(b => b.id)) + 1 : 1;
    const newBus = {
      id: nextId,
      name,
      type,
      from,
      to,
      departure,
      arrival,
      price: Number(price),
      rating: rating !== undefined ? Number(rating) : 4.5,
      totalSeats: Number(totalSeats)
    };
    BUS_DATA.push(newBus);
    saveDatabase();
    res.status(201).json({ message: "Bus created successfully", bus: newBus });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || "Internal server error" });
  }
});

// 11. Update Existing Bus Details & Pricing (Admin only)
app.put("/api/admin/buses/:id", (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, from, to, departure, arrival, price, rating, totalSeats } = req.body;
    
    const busIndex = BUS_DATA.findIndex(b => b.id === Number(id));
    if (busIndex === -1) {
      return res.status(404).json({ error: "Bus not found." });
    }

    const updatedBus = {
      ...BUS_DATA[busIndex],
      name: name !== undefined ? name : BUS_DATA[busIndex].name,
      type: type !== undefined ? type : BUS_DATA[busIndex].type,
      from: from !== undefined ? from : BUS_DATA[busIndex].from,
      to: to !== undefined ? to : BUS_DATA[busIndex].to,
      departure: departure !== undefined ? departure : BUS_DATA[busIndex].departure,
      arrival: arrival !== undefined ? arrival : BUS_DATA[busIndex].arrival,
      price: price !== undefined ? Number(price) : BUS_DATA[busIndex].price,
      rating: rating !== undefined ? Number(rating) : BUS_DATA[busIndex].rating,
      totalSeats: totalSeats !== undefined ? Number(totalSeats) : BUS_DATA[busIndex].totalSeats
    };

    BUS_DATA[busIndex] = updatedBus;
    saveDatabase();
    res.json({ message: "Bus updated successfully", bus: updatedBus });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || "Internal server error" });
  }
});

// 12. Delete Existing Bus (Admin only)
app.delete("/api/admin/buses/:id", (req, res) => {
  try {
    const { id } = req.params;
    const index = BUS_DATA.findIndex(b => b.id === Number(id));
    if (index === -1) {
      return res.status(404).json({ error: "Bus not found." });
    }
    
    BUS_DATA.splice(index, 1);
    saveDatabase();
    res.json({ message: "Bus deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || "Internal server error" });
  }
});

// 13. Get Contact Information
app.get("/api/contact", (req, res) => {
  res.json(contactInfo);
});

// 14. Update Contact Information (Admin only)
app.put("/api/admin/contact", (req, res) => {
  try {
    const { helpline, email, address } = req.body;
    if (helpline !== undefined) contactInfo.helpline = helpline;
    if (email !== undefined) contactInfo.email = email;
    if (address !== undefined) contactInfo.address = address;
    saveDatabase();
    res.json({ message: "Contact information updated successfully", contactInfo });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || "Internal server error" });
  }
});

// 15. Get Rental Fleet Vehicles
app.get("/api/rentals/fleet", (req, res) => {
  res.json(rentalFleetStore);
});

// 16. Add New Rental Fleet Vehicle (Admin only)
app.post("/api/admin/rentals/fleet", (req, res) => {
  try {
    const { name, type, capacity, rating, price, features } = req.body;
    if (!name || !type || !capacity || !price) {
      return res.status(400).json({ error: "Missing required vehicle parameters." });
    }
    const nextId = "v-" + Math.floor(1000 + Math.random() * 9000);
    const newVehicle: RentalVehicle = {
      id: nextId,
      name,
      type,
      capacity,
      rating: rating !== undefined ? Number(rating) : 4.8,
      price,
      features: Array.isArray(features) ? features : []
    };
    rentalFleetStore.push(newVehicle);
    saveDatabase();
    res.status(201).json({ message: "Fleet vehicle added successfully", vehicle: newVehicle });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || "Internal server error" });
  }
});

// 17. Update Existing Rental Fleet Vehicle (Admin only)
app.put("/api/admin/rentals/fleet/:id", (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, capacity, rating, price, features } = req.body;

    const fleetIndex = rentalFleetStore.findIndex(v => v.id === id);
    if (fleetIndex === -1) {
      return res.status(404).json({ error: "Fleet vehicle not found." });
    }

    const updatedVehicle: RentalVehicle = {
      ...rentalFleetStore[fleetIndex],
      name: name !== undefined ? name : rentalFleetStore[fleetIndex].name,
      type: type !== undefined ? type : rentalFleetStore[fleetIndex].type,
      capacity: capacity !== undefined ? capacity : rentalFleetStore[fleetIndex].capacity,
      rating: rating !== undefined ? Number(rating) : rentalFleetStore[fleetIndex].rating,
      price: price !== undefined ? price : rentalFleetStore[fleetIndex].price,
      features: features !== undefined ? (Array.isArray(features) ? features : []) : rentalFleetStore[fleetIndex].features
    };

    rentalFleetStore[fleetIndex] = updatedVehicle;
    saveDatabase();
    res.json({ message: "Fleet vehicle updated successfully", vehicle: updatedVehicle });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || "Internal server error" });
  }
});

// 18. Delete Rental Fleet Vehicle (Admin only)
app.delete("/api/admin/rentals/fleet/:id", (req, res) => {
  try {
    const { id } = req.params;
    const index = rentalFleetStore.findIndex(v => v.id === id);
    if (index === -1) {
      return res.status(404).json({ error: "Fleet vehicle not found." });
    }

    rentalFleetStore.splice(index, 1);
    saveDatabase();
    res.json({ message: "Fleet vehicle deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || "Internal server error" });
  }
});


// Initialize Vite server for asset handling
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] Sairam Travels backend active on http://localhost:${PORT}`);
    
    // Connect to PostgreSQL cloud database asynchronously to avoid blocking the main server boot
    connectToPostgreSQL().catch((err) => {
      console.error("[Database] Async background connection failed:", err);
    });
  });
}

startServer().catch((err) => {
  console.error("Error starting server:", err);
});
