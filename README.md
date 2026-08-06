# Agnos Healthcare System (Patient-Staff Portal)

A modern, real-time web application built with Next.js that facilitates patient registration and provides a live monitoring dashboard for healthcare staff.

## Features

### 🏥 For Patients
- **Responsive Registration Form:** A clean, mobile-friendly interface for inputting personal details, contact information, and medical demographics.
- **Premium Glassmorphism UI:** Enjoy a modern, state-of-the-art aesthetic featuring vibrant mesh gradients, frosted glass panels, and smooth micro-animations.
- **Real-Time Sync:** As the patient types, their progress is instantly synced to the staff dashboard.
- **Form Validation:** Real-time feedback for required fields.

### 👩‍⚕️ For Staff
- **Live Monitoring Dashboard:** Watch patient registrations come in real-time without refreshing the page.
- **Dynamic Progress Tracking:** See exactly what percentage of a form a patient has completed in real-time.
- **Abandoned / Inactive Detection:** Identifies when a patient abandons the form (e.g., closing the tab) or goes inactive for more than 30 seconds, automatically flagging their session.
- **Patient Details Modal:** Click on any active or submitted registration to view a detailed, neatly organized grid of the patient's information with sleek slide-up animations.

## Tech Stack
- **Framework:** Next.js 15 (App Router)
- **Styling:** Tailwind CSS (Custom glassmorphism utilities & CSS variables)
- **Real-Time WebSockets:** Pusher
- **Icons:** Lucide React
- **Date Picker:** react-datepicker

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
.
├── app/
│   ├── api/
│   │   └── pusher/
│   │       └── route.ts       # API route to securely trigger Pusher events (handles JSON & plain text beacons)
│   ├── patient/
│   │   └── page.tsx           # Patient registration form (broadcasts events & heartbeats)
│   └── staff/
│       └── page.tsx           # Staff dashboard (listens to events & manages inactivity timeouts)
└── lib/
    └── pusher.ts              # Configurations for Pusher client and server
```

## Real-Time Architecture & Tracking
1. **Live Sync:** When a patient types in any input field, a debounced API call is sent to `/api/pusher`, which triggers a `typing` event over WebSockets containing the patient's current form state. 
2. **Heartbeat & Abandonment:** A unique `sessionId` tracks each form instance. A background heartbeat pings the server every 10 seconds. If the staff dashboard does not receive an update for 30 seconds, the session is marked as "Inactive/Abandoned". 
3. **Tab Closure:** If the user closes the tab before finishing, a `navigator.sendBeacon()` request reliably fires an "abandoned" event before the page unloads, instantly updating the staff dashboard.
4. **Completion:** When the form is submitted, a `submitted` event finalizes the record and the patient is greeted with an animated success screen.
