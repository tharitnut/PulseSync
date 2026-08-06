# Agnos Healthcare System (Patient-Staff Portal)

A modern, real-time web application built with Next.js that facilitates patient registration and provides a live monitoring dashboard for healthcare staff.

## Features

### 🏥 For Patients
- **Responsive Registration Form:** A clean, mobile-friendly interface for inputting personal details, contact information, and medical demographics.
- **Real-Time Sync:** As the patient types, their progress is instantly synced to the staff dashboard.
- **Form Validation:** Real-time feedback for required fields.

### 👩‍⚕️ For Staff
- **Live Monitoring Dashboard:** Watch patient registrations come in real-time without refreshing the page.
- **Dynamic Progress Tracking:** See exactly what percentage of a form a patient has completed in real-time.
- **Patient Details Modal:** Click on any active or submitted registration to view a detailed, neatly organized grid of the patient's information (First/Middle/Last Name, DOB, Contact Info, Emergency Contacts, etc.).

## Tech Stack
- **Framework:** Next.js 15 (App Router)
- **Styling:** Tailwind CSS
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
│   │       └── route.ts       # API route to securely trigger Pusher events
│   ├── patient/
│   │   └── page.tsx           # Patient registration form (broadcasts events)
│   └── staff/
│       └── page.tsx           # Staff dashboard (listens to events)
└── lib/
    └── pusher.ts              # Configurations for Pusher client and server
```

## Real-Time Architecture
When a patient types in any input field, a debounced API call is sent to `/api/pusher`, which triggers a `typing` event over WebSockets containing the patient's current form state. The staff dashboard listens for this event and dynamically updates the table and progress bars. When the form is submitted, a `submitted` event finalizes the record.
