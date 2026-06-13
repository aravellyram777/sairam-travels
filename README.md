# Sairam Travels - Full-Stack Bus Ticket Booking Portal

An elegant, robust, and highly polished **Full-Stack Bus Ticket Booking web application** built with a custom **Express API backend** in Node.js and a interactive, premium **React + Tailwind CSS frontend** powered by Vite.

---

## 🌟 Highlights & Features
1. **Dynamic Seats Matrix**: Interactive seating layout representing bus seats with intuitive state indications (*Available*, *Selected*, *Booked*), complete with a driver cabin guide.
2. **Persistent Seat Reservations**: State is maintained live on the backend Express server, partitioned securely by target booking dates so listings remain completely independent day-after-day.
3. **Advanced Filters & Sorters**: Filter operational status by AC/Non-AC layouts and sort buses cleanly by price or star ratings.
4. **Alphanumeric PNR Status Check**: Verification panel to retrieve, preview and print unique, formatted numeric tickets with verified PNR tracking (e.g. `SR123456`).
5. **Modern Micro-Animations**: Built-in visual smooth transitions and state shifts powered by `motion` on button triggers and modal activations.

---

## 🛠️ Tech Stack & Architecture
- **Frontend**: [React 19](https://react.dev/), [Vite](https://vite.dev/), [Tailwind CSS v4](https://tailwindcss.com/), [Lucide React Icons](https://lucide.dev/), and [Motion](https://motion.dev/)
- **Backend API Server**: [Express](http://expressjs.com/) under Node.js with ESM TSX transpiling.
- **Production Packager**: [Esbuild](https://esbuild.github.io/) for high-performance bundling into `dist/server.cjs` mapping Node production environments cleanly.

---

## 🚦 Getting Started (Local Development)

### 1. Prerequisites
- Confirm that you have **Node.js (v18+)** and **npm** installed on your workstation.

### 2. Dependency Installation
Execute standard npm install at the project's root folder:
```bash
npm install
```

### 3. Running the Server Locally
To start the hybrid Express backend and Vite developer proxy simultaneously:
```bash
npm run dev
```
Once run, visit `http://localhost:3000` inside your web browser.

---

## 💻 Running & Debugging in PyCharm

PyCharm is a fantastic professional IDE for full-stack developers. Install the **Node.js** plugin if not already loaded, then follow these instructions:

1. **Open the Project**: Open the repository folder directly inside PyCharm (`File > Open`).
2. **Terminal setup**: Use PyCharm's integrated terminal panel (`Alt + F12` or `Terminal` at the status bar) and run `npm install`.
3. **Configure Run/Debug Configuration**:
   - Go to **Run > Edit Configurations...** in PyCharm's top taskbar.
   - Click the **`+` (Add New)** icon and select **npm**.
   - Input the following configuration options:
     * **Name**: `Start Sairam Travels`
     * **package.json**: Select `/package.json` from the file explorer target.
     * **Command**: `run`
     * **Scripts**: `dev`
   - Click **Apply** and then **OK**.
4. **Trigger Start**: Click the green **Run (Play)** button or **Debug** button at the top header of PyCharm. Sairam Travels will automatically boot on `http://localhost:3000`.

---

## 🐙 Uploading and Hosting on GitHub
To push Sairam Travels to GitHub, follow standard Git instructions from your terminal:

```bash
# 1. Initialize Git Repository
git init

# 2. Stage All Stored Code (ignores node_modules and builds through .gitignore)
git add .

# 3. Commit Locally
git commit -m "Initialize Sairam Travels full-stack portal"

# 4. Connect GitHub Remote (Replace with your repository URI)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# 5. Set default branch and push
git branch -M main
git push -u origin main
```

---

## 📡 API Server Specifications
The Sairam Travels Express backend exposes the following structured RESTful endpoints:

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/buses` | `GET` | Fetches active Sairam Travels bus listings with live booked seat positions computed dynamically per requested date. |
| `/api/bookings` | `POST` | Processes seat allocations, passenger verification details, and returns a verified ticketing stub with a unique ticket PNR. |
| `/api/bookings` | `GET` | Returns list of all bookings currently stored on the server memory. |
| `/api/bookings/:pnr` | `GET` | Retrieves details and customer records associated with the matching unique 8-digit PNR. |
