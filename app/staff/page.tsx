"use client";

import { useState, useEffect } from "react";
import { Activity, Clock, FileCheck, Search, Bell, Users, ChevronRight, X, XCircle } from "lucide-react";
import Link from "next/link";
import { getPusherClient } from "@/lib/pusher";

type PatientDetails = {
  firstName?: string;
  middleName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  gender?: string;
  address?: string;
  nationality?: string;
  language?: string;
  dob?: string | null;
  religion?: string;
  emergencyName?: string;
  emergencyRel?: string;
};

type Patient = {
  id: string;
  name: string;
  status: string;
  lastUpdated: number; // timestamp in ms
  progress: string;
  details?: PatientDetails;
};

export default function StaffView() {
  const [activeTab, setActiveTab] = useState("all");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [, setTick] = useState(0); // force re-render for relative times

  // Tick every 10 seconds to update relative timestamps
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 10000);
    return () => clearInterval(interval);
  }, []);

  const formatTimeAgo = (timestamp: number) => {
    const diff = Math.floor((Date.now() - timestamp) / 1000);
    if (diff < 5) return 'Just now';
    if (diff < 60) return `${diff}s ago`;
    const mins = Math.floor(diff / 60);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  useEffect(() => {
    const pusher = getPusherClient();
    if (!pusher) return;

    const channel = pusher.subscribe('patient-updates');

    // Track inactivity timers per session
    const inactivityTimers: Record<string, NodeJS.Timeout> = {};
    const INACTIVITY_TIMEOUT = 30000; // 30 seconds

    const abandonmentTimers: Record<string, NodeJS.Timeout> = {};
    const ABANDONMENT_TIMEOUT = 300000; // 5 minutes

    const calculateProgress = (details?: PatientDetails) => {
      if (!details) return "0%";
      const requiredFields: (keyof PatientDetails)[] = ['firstName', 'lastName', 'dob', 'gender', 'phone', 'email', 'address', 'nationality', 'language'];
      let filled = 0;
      requiredFields.forEach(field => {
        if (details[field] && String(details[field]).trim() !== '') {
          filled++;
        }
      });
      return `${Math.round((filled / requiredFields.length) * 100)}%`;
    };

    // Load historical data
    fetch('/api/patients')
      .then(res => res.json())
      .then(data => {
        if (data.patients && Array.isArray(data.patients)) {
          const historicalPatients: Patient[] = data.patients.map((p: any) => {
            const lastUpdated = new Date(p.timestamp).getTime();
            const timeDiff = Date.now() - lastUpdated;
            let status = p.status === 'submitted' ? 'Submitted' : p.status === 'abandoned' ? 'Abandoned' : 'Actively filling';
            
            if (status === 'Actively filling') {
              if (timeDiff > ABANDONMENT_TIMEOUT) status = 'Abandoned';
              else if (timeDiff > INACTIVITY_TIMEOUT) status = 'Inactive';
            }

            return {
              id: p.sessionId,
              name: p.name || 'Anonymous Patient',
              status,
              lastUpdated,
              progress: calculateProgress(p.details),
              details: p.details
            };
          });
          
          setPatients(prev => {
             const merged = [...prev];
             historicalPatients.forEach(hp => {
                if (!merged.find(p => p.id === hp.id)) {
                   merged.push(hp);
                }
             });
             // Sort by latest update
             return merged.sort((a, b) => b.lastUpdated - a.lastUpdated);
          });
        }
      })
      .catch(err => console.error("Failed to load patient history:", err));

    const markInactive = (sessionId: string) => {
      setPatients(prev => prev.map(p => 
        p.id === sessionId && p.status === 'Actively filling'
          ? { ...p, status: 'Inactive', lastUpdated: Date.now() }
          : p
      ));
    };

    const markAbandoned = (sessionId: string) => {
      setPatients(prev => prev.map(p => 
        p.id === sessionId && (p.status === 'Actively filling' || p.status === 'Inactive')
          ? { ...p, status: 'Abandoned', lastUpdated: Date.now() }
          : p
      ));
    };

    const resetInactivityTimer = (sessionId: string) => {
      if (inactivityTimers[sessionId]) clearTimeout(inactivityTimers[sessionId]);
      inactivityTimers[sessionId] = setTimeout(() => markInactive(sessionId), INACTIVITY_TIMEOUT);

      if (abandonmentTimers[sessionId]) clearTimeout(abandonmentTimers[sessionId]);
      abandonmentTimers[sessionId] = setTimeout(() => markAbandoned(sessionId), ABANDONMENT_TIMEOUT);
    };

    // Handle typing events
    channel.bind('typing', (data: { sessionId: string, name: string, details?: PatientDetails }) => {
      const currentProgress = calculateProgress(data.details);
      resetInactivityTimer(data.sessionId);
      
      setPatients(prev => {
        const exists = prev.find(p => p.id === data.sessionId);
        
        if (exists) {
          return prev.map(p => p.id === data.sessionId 
            ? { ...p, name: data.name, status: 'Actively filling', lastUpdated: Date.now(), details: data.details, progress: currentProgress } 
            : p
          );
        } else {
          return [{
            id: data.sessionId,
            name: data.name,
            status: "Actively filling",
            lastUpdated: Date.now(),
            progress: currentProgress,
            details: data.details
          }, ...prev];
        }
      });
    });

    // Handle submitted events
    channel.bind('submitted', (data: { sessionId: string, id: string, name: string, timestamp: string, details?: PatientDetails }) => {
      // Clear inactivity timers for this session
      if (inactivityTimers[data.sessionId]) {
        clearTimeout(inactivityTimers[data.sessionId]);
        delete inactivityTimers[data.sessionId];
      }
      if (abandonmentTimers[data.sessionId]) {
        clearTimeout(abandonmentTimers[data.sessionId]);
        delete abandonmentTimers[data.sessionId];
      }
      
      setPatients(prev => {
        // Replace the active session entry with the submitted one
        const exists = prev.find(p => p.id === data.sessionId);
        if (exists) {
          return prev.map(p => p.id === data.sessionId 
            ? { ...p, id: data.id, name: data.name, status: 'Submitted', lastUpdated: Date.now(), progress: '100%', details: data.details }
            : p
          );
        } else {
          return [{
            id: data.id,
            name: data.name,
            status: "Submitted",
            lastUpdated: Date.now(),
            progress: "100%",
            details: data.details
          }, ...prev];
        }
      });
    });

    // Handle abandoned events (patient closed the page)
    channel.bind('abandoned', (data: { sessionId: string, name: string, details?: PatientDetails }) => {
      if (inactivityTimers[data.sessionId]) {
        clearTimeout(inactivityTimers[data.sessionId]);
        delete inactivityTimers[data.sessionId];
      }
      if (abandonmentTimers[data.sessionId]) {
        clearTimeout(abandonmentTimers[data.sessionId]);
        delete abandonmentTimers[data.sessionId];
      }

      setPatients(prev => {
        const exists = prev.find(p => p.id === data.sessionId);
        if (exists) {
          return prev.map(p => p.id === data.sessionId 
            ? { ...p, name: data.name, status: 'Abandoned', lastUpdated: Date.now(), details: data.details }
            : p
          );
        } else {
          return [{
            id: data.sessionId,
            name: data.name || "Unknown",
            status: "Abandoned",
            lastUpdated: Date.now(),
            progress: calculateProgress(data.details),
            details: data.details
          }, ...prev];
        }
      });
    });

    return () => {
      // Clean up all timers
      Object.values(inactivityTimers).forEach(timer => clearTimeout(timer));
      Object.values(abandonmentTimers).forEach(timer => clearTimeout(timer));
      channel.unbind_all();
      channel.unsubscribe();
    };
  }, []);
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Actively filling":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-status-active/10 text-status-active border border-status-active/20 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-status-active opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-status-active"></span>
            </span>
            {status}
          </span>
        );
      case "Submitted":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-status-submitted/10 text-status-submitted border border-status-submitted/20 shadow-sm">
            <FileCheck className="w-3 h-3" />
            {status}
          </span>
        );
      case "Inactive":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-status-inactive/10 text-status-inactive border border-status-inactive/20 shadow-sm">
            <Clock className="w-3 h-3" />
            {status}
          </span>
        );
      case "Abandoned":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-600 border border-red-200 shadow-sm">
            <XCircle className="w-3 h-3" />
            {status}
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-mesh font-sans flex flex-col md:flex-row relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-[-10%] right-[10%] w-[40%] h-[40%] bg-blue-400/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[20%] left-[-10%] w-[30%] h-[30%] bg-indigo-400/20 rounded-full blur-[100px] pointer-events-none" />

      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex w-64 flex-col bg-white/70 backdrop-blur-md border-r border-slate-200/50 h-screen sticky top-0 z-20">
        <div className="h-16 flex items-center px-6 border-b border-slate-200/50">
          <Activity className="w-6 h-6 text-brand-600 mr-2" />
          <span className="text-lg font-bold text-slate-800 tracking-tight">Agnos Staff</span>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <a href="#" className="flex items-center px-4 py-3 bg-white/60 shadow-sm border border-brand-100 text-brand-700 rounded-xl text-sm font-semibold transition-all">
            <Users className="w-5 h-5 mr-3" />
            Live Registrations
          </a>
          <Link href="/" className="flex items-center px-4 py-3 text-slate-600 hover:bg-white/40 hover:text-slate-900 rounded-xl text-sm font-medium transition-all">
            <ChevronRight className="w-5 h-5 mr-3 rotate-180" />
            Exit Dashboard
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 relative z-10">
        {/* Header */}
        <header className="h-16 bg-white/50 backdrop-blur-sm border-b border-slate-200/50 flex items-center justify-between px-4 sm:px-6 lg:px-8 sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <Link href="/" className="p-2 -ml-2 text-slate-400 hover:text-slate-600 transition-colors md:hidden">
              <ChevronRight className="w-5 h-5 rotate-180" />
            </Link>
            <div className="flex items-center">
              <Activity className="w-6 h-6 text-brand-600 mr-2 md:hidden" />
              <span className="text-lg font-bold text-slate-800 tracking-tight md:hidden">Agnos</span>
              <span className="text-lg font-bold text-slate-800 tracking-tight hidden md:block">Dashboard Overview</span>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto animate-fade-in">
          <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-indigo-600 tracking-tight pb-1">Live Registrations</h1>
            <p className="mt-1 text-slate-600 font-medium">Monitor incoming patient data in real-time.</p>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
            <div className="glass p-6 rounded-3xl flex items-center justify-between hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              <div>
                <p className="text-sm font-medium text-slate-500">Active Forms</p>
                <p className="text-3xl font-bold text-slate-800 mt-1">
                  {patients.filter(p => p.status === 'Actively filling').length}
                </p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-blue-50 to-blue-100 text-blue-600 rounded-2xl flex items-center justify-center shadow-sm">
                <Activity className="w-7 h-7" />
              </div>
            </div>
            <div className="glass p-6 rounded-3xl flex items-center justify-between hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              <div>
                <p className="text-sm font-medium text-slate-500">Submitted Today</p>
                <p className="text-3xl font-bold text-slate-800 mt-1">
                  {patients.filter(p => p.status === 'Submitted').length}
                </p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-50 to-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center shadow-sm">
                <FileCheck className="w-7 h-7" />
              </div>
            </div>
            <div className="glass p-6 rounded-3xl flex items-center justify-between hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              <div>
                <p className="text-sm font-medium text-slate-500">Abandoned/Inactive</p>
                <p className="text-3xl font-bold text-slate-800 mt-1">
                  {patients.filter(p => p.status === 'Inactive' || p.status === 'Abandoned').length}
                </p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-slate-100 to-slate-200 text-slate-600 rounded-2xl flex items-center justify-center shadow-sm">
                <Clock className="w-7 h-7" />
              </div>
            </div>
          </div>

          {/* Table Area */}
          <div className="glass rounded-3xl overflow-hidden">
            <div className="border-b border-slate-200/50 px-6 py-5 flex items-center justify-between bg-white/30">
              <h2 className="text-lg font-bold text-slate-800">Current Sessions</h2>
              <div className="flex gap-2 text-sm bg-slate-100/50 p-1 rounded-xl">
                <button 
                  onClick={() => setActiveTab("all")}
                  className={`px-4 py-1.5 rounded-lg font-semibold transition-all ${activeTab === 'all' ? 'bg-white shadow-sm text-brand-700' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  All
                </button>
                <button 
                  onClick={() => setActiveTab("active")}
                  className={`px-4 py-1.5 rounded-lg font-semibold transition-all ${activeTab === 'active' ? 'bg-white shadow-sm text-brand-700' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  Active Only
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50/50 text-slate-500 font-semibold border-b border-slate-200/50">
                  <tr>
                    <th className="px-6 py-4">Patient ID</th>
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Progress</th>
                    <th className="px-6 py-4">Last Updated</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/50">
                  {patients.filter(p => activeTab === 'all' || p.status === 'Actively filling').map((patient) => (
                    <tr key={patient.id} className="hover:bg-white/60 transition-colors group">
                      <td className="px-6 py-4 font-semibold text-slate-700">{patient.id}</td>
                      <td className="px-6 py-4 text-slate-600">{patient.name || <span className="text-slate-400 italic font-medium">Typing...</span>}</td>
                      <td className="px-6 py-4">
                        {getStatusBadge(patient.status)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-slate-200/70 rounded-full overflow-hidden shadow-inner">
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ${patient.status === 'Submitted' ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' : patient.status === 'Actively filling' ? 'bg-gradient-to-r from-brand-400 to-brand-500' : 'bg-slate-400'}`} 
                              style={{ width: patient.progress }}
                            ></div>
                          </div>
                          <span className="text-xs text-slate-500 font-semibold">{patient.progress}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-500 font-medium">{formatTimeAgo(patient.lastUpdated)}</td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => setSelectedPatient(patient)}
                          className="text-brand-600 font-semibold hover:text-brand-700 bg-brand-50 hover:bg-brand-100 px-3 py-1.5 rounded-lg transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                        >
                          View details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {patients.filter(p => activeTab === 'all' || p.status === 'Actively filling').length === 0 && (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-6 h-6 text-gray-400" />
                </div>
                <h3 className="text-sm font-medium text-gray-900">No active sessions</h3>
                <p className="mt-1 text-sm text-gray-500">Waiting for patients to start the registration form.</p>
              </div>
            )}

          </div>
        </div>
      </main>

      {/* Modal Overlay */}
      {selectedPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="glass rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-modal-up border-slate-200/50">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-200/50 flex items-center justify-between bg-white/50">
              <div>
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">Patient Details</h3>
                <p className="text-sm text-slate-500 font-medium mt-1">ID: {selectedPatient.id}</p>
              </div>
              <button 
                onClick={() => setSelectedPatient(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto">
              {!selectedPatient.details ? (
                <div className="text-center py-12">
                  <p className="text-slate-500 font-medium">No details available yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-white/60 p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow transition-shadow">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">First Name</p>
                    <p className="text-sm font-bold text-slate-800">{selectedPatient.details.firstName || '-'}</p>
                  </div>
                  <div className="bg-white/60 p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow transition-shadow">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Middle Name</p>
                    <p className="text-sm font-bold text-slate-800">{selectedPatient.details.middleName || '-'}</p>
                  </div>
                  
                  <div className="bg-white/60 p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow transition-shadow">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Last Name</p>
                    <p className="text-sm font-bold text-slate-800">{selectedPatient.details.lastName || '-'}</p>
                  </div>
                  <div className="bg-white/60 p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow transition-shadow">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Date of Birth</p>
                    <p className="text-sm font-bold text-slate-800">{selectedPatient.details.dob ? new Date(selectedPatient.details.dob).toLocaleDateString() : '-'}</p>
                  </div>

                  <div className="bg-white/60 p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow transition-shadow">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Gender</p>
                    <p className="text-sm font-bold text-slate-800">{selectedPatient.details.gender || '-'}</p>
                  </div>
                  <div className="bg-white/60 p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow transition-shadow">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Nationality</p>
                    <p className="text-sm font-bold text-slate-800">{selectedPatient.details.nationality || '-'}</p>
                  </div>

                  <div className="bg-white/60 p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow transition-shadow">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Preferred Language</p>
                    <p className="text-sm font-bold text-slate-800">{selectedPatient.details.language || '-'}</p>
                  </div>
                  <div className="bg-white/60 p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow transition-shadow">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Religion</p>
                    <p className="text-sm font-bold text-slate-800">{selectedPatient.details.religion || '-'}</p>
                  </div>

                  <div className="bg-white/60 p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow transition-shadow">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Phone Number</p>
                    <p className="text-sm font-bold text-slate-800">{selectedPatient.details.phone || '-'}</p>
                  </div>
                  <div className="bg-white/60 p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow transition-shadow">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Email Address</p>
                    <p className="text-sm font-bold text-slate-800">{selectedPatient.details.email || '-'}</p>
                  </div>

                  <div className="sm:col-span-2 bg-white/60 p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow transition-shadow">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Address</p>
                    <p className="text-sm font-bold text-slate-800">{selectedPatient.details.address || '-'}</p>
                  </div>

                  <div className="bg-white/60 p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow transition-shadow">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Contact Name</p>
                    <p className="text-sm font-bold text-slate-800">{selectedPatient.details.emergencyName || '-'}</p>
                  </div>
                  <div className="bg-white/60 p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow transition-shadow">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Relationship</p>
                    <p className="text-sm font-bold text-slate-800">{selectedPatient.details.emergencyRel || '-'}</p>
                  </div>
                </div>
              )}
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button 
                onClick={() => setSelectedPatient(null)}
                className="px-5 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
