# Agnos Healthcare System (Patient-Staff Portal)

A modern, real-time web application built with Next.js that facilitates patient registration and provides a live monitoring dashboard for healthcare staff.

## 🚀 Live Demo
- **Home Page / Landing:** [https://agnos-candidate-assignment-patient.vercel.app/](https://agnos-candidate-assignment-patient.vercel.app/)
- **Patient Registration Form:** [https://agnos-candidate-assignment-patient.vercel.app/patient](https://agnos-candidate-assignment-patient.vercel.app/patient)
- **Staff Monitoring Dashboard:** [https://agnos-candidate-assignment-patient.vercel.app/staff](https://agnos-candidate-assignment-patient.vercel.app/staff)

*(Open both links in separate windows to see the real-time synchronization in action!)*

## Features

### 🏥 For Patients
- **Responsive Registration Form:** A clean, mobile-friendly interface for inputting personal details, contact information, and medical demographics.
- **Real-Time Sync:** As the patient types, their progress is instantly synced to the staff dashboard.
- **Form Validation:** Real-time feedback for required fields.

### 👩‍⚕️ For Staff
- **Live Monitoring Dashboard:** Watch patient registrations come in real-time without refreshing the page.
- **Dynamic Progress Tracking:** See exactly what percentage of a form a patient has completed in real-time.
- **Abandoned / Inactive Detection:** Identifies when a patient abandons the form (e.g., closing the tab) or goes inactive. A 30-second timeout flags them as "Inactive", and a 5-minute timeout permanently flags them as "Abandoned" with clear visual separation.
- **Patient Details Modal:** Click on any active or submitted registration to view a detailed, neatly organized grid of the patient's information with sleek slide-up animations.

## Tech Stack
- **Framework:** Next.js 15 (App Router)
- **Styling:** Tailwind CSS (Custom glassmorphism utilities & CSS variables)
- **Real-Time WebSockets:** Pusher
- **Icons:** Lucide React
- **Forms & Data:** react-datepicker, react-select, i18n-iso-countries, iso-639-1

## Getting Started

### Prerequisites
You will need a Pusher account and credentials. Create a `.env.local` file in the root directory and add the following keys:

```env
NEXT_PUBLIC_PUSHER_APP_KEY=your_app_key
NEXT_PUBLIC_PUSHER_CLUSTER=your_cluster
PUSHER_APP_ID=your_app_id
PUSHER_SECRET=your_secret
```
*(See `.env.example` for a template).*

### Installation
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
3. Open two browser windows to see the real-time functionality:
   - Patient view: [http://localhost:3000/patient](http://localhost:3000/patient)
   - Staff view: [http://localhost:3000/staff](http://localhost:3000/staff)

## Project Structure

```text
├── app/
│   ├── api/
│   │   ├── patients/
│   │   │   └── route.ts       # GET route for the staff dashboard to fetch initial history
│   │   └── pusher/
│   │       └── route.ts       # POST route to handle real-time WebSockets and store history
│   ├── patient/
│   │   └── page.tsx           # Client-side form where patients input their information
│   ├── staff/
│   │   └── page.tsx           # Client-side dashboard where staff monitor live incoming data
│   ├── layout.tsx             # Global HTML layout and metadata
│   └── globals.css            # Tailwind CSS configuration and custom glassmorphism variables
├── lib/
│   ├── pusher.ts              # Initialization configuration for Pusher (Server & Client)
│   └── store.ts               # In-memory global store to save patient sessions across reloads
└── public/                    # Static assets
```

## Real-Time Architecture & Tracking
1. **Live Sync:** When a patient types in any input field, a debounced API call is sent to `/api/pusher`, which triggers a `typing` event over WebSockets containing the patient's current form state. 
2. **Heartbeat & Abandonment:** A unique `sessionId` tracks each form instance. A background heartbeat pings the server every 10 seconds. If the staff dashboard does not receive an update for 30 seconds, the session is marked as "Inactive". After 5 minutes of total silence, it escalates to "Abandoned".
3. **Tab Closure:** If the user closes the tab before finishing, a `navigator.sendBeacon()` request reliably fires an "abandoned" event before the page unloads, instantly updating the staff dashboard.
4. **Completion:** When the form is submitted, a `submitted` event finalizes the record and the patient is greeted with an animated success screen.
