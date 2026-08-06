"use client";

import { useState, useEffect } from "react";
import { Activity, Clock, FileCheck, Search, Bell, Users, ChevronRight, X } from "lucide-react";
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

    const markInactive = (sessionId: string) => {
      setPatients(prev => prev.map(p => 
        p.id === sessionId && p.status === 'Actively filling'
          ? { ...p, status: 'Inactive', lastUpdated: Date.now() }
          : p
      ));
    };

    const resetInactivityTimer = (sessionId: string) => {
      if (inactivityTimers[sessionId]) clearTimeout(inactivityTimers[sessionId]);
      inactivityTimers[sessionId] = setTimeout(() => markInactive(sessionId), INACTIVITY_TIMEOUT);
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
      // Clear inactivity timer for this session
      if (inactivityTimers[data.sessionId]) {
        clearTimeout(inactivityTimers[data.sessionId]);
        delete inactivityTimers[data.sessionId];
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

      setPatients(prev => {
        const exists = prev.find(p => p.id === data.sessionId);
        if (exists) {
          return prev.map(p => p.id === data.sessionId 
            ? { ...p, name: data.name, status: 'Inactive', lastUpdated: Date.now(), details: data.details }
            : p
          );
        } else {
          return [{
            id: data.sessionId,
            name: data.name || "Unknown",
            status: "Inactive",
            lastUpdated: Date.now(),
            progress: calculateProgress(data.details),
            details: data.details
          }, ...prev];
        }
      });
    });

    return () => {
      // Clean up all inactivity timers
      Object.values(inactivityTimers).forEach(timer => clearTimeout(timer));
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
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-brand-50 font-sans flex flex-col md:flex-row">
      
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex w-64 flex-col bg-white border-r border-gray-200 h-screen sticky top-0">
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <Activity className="w-6 h-6 text-brand-500 mr-2" />
          <span className="text-lg font-bold text-brand-900 tracking-tight">Agnos Staff</span>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <a href="#" className="flex items-center px-3 py-2.5 bg-brand-50 text-brand-700 rounded-lg text-sm font-medium transition-colors">
            <Users className="w-5 h-5 mr-3" />
            Live Registrations
          </a>
          <Link href="/" className="flex items-center px-3 py-2.5 text-gray-700 hover:bg-gray-50 rounded-lg text-sm font-medium transition-colors">
            <ChevronRight className="w-5 h-5 mr-3 rotate-180" />
            Exit Dashboard
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 lg:px-8 sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <Link href="/" className="p-1 -ml-1 text-gray-400 hover:text-gray-600 transition-colors md:hidden">
              <ChevronRight className="w-5 h-5 rotate-180" />
            </Link>
            <div className="flex items-center">
              <Activity className="w-6 h-6 text-brand-500 mr-2 md:hidden" />
              <span className="text-lg font-bold text-brand-900 tracking-tight md:hidden">Agnos</span>
              <span className="text-lg font-bold text-gray-900 tracking-tight hidden md:block">Dashboard Overview</span>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-brand-900 tracking-tight">Live Registrations</h1>
            <p className="mt-1 text-gray-500">Monitor incoming patient data in real-time.</p>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Active Forms</p>
                <p className="text-2xl font-semibold text-gray-900 mt-1">
                  {patients.filter(p => p.status === 'Actively filling').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-50 text-brand-600 rounded-xl flex items-center justify-center">
                <Activity className="w-6 h-6" />
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Submitted Today</p>
                <p className="text-2xl font-semibold text-gray-900 mt-1">
                  {patients.filter(p => p.status === 'Submitted').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                <FileCheck className="w-6 h-6" />
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Abandoned/Inactive</p>
                <p className="text-2xl font-semibold text-gray-900 mt-1">
                  {patients.filter(p => p.status === 'Inactive').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-gray-100 text-gray-600 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Table Area */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900">Current Sessions</h2>
              <div className="flex gap-2 text-sm">
                <button 
                  onClick={() => setActiveTab("all")}
                  className={`px-3 py-1.5 rounded-md font-medium transition-colors ${activeTab === 'all' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                >
                  All
                </button>
                <button 
                  onClick={() => setActiveTab("active")}
                  className={`px-3 py-1.5 rounded-md font-medium transition-colors ${activeTab === 'active' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                >
                  Active Only
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-gray-50/50 text-gray-500 font-medium">
                  <tr>
                    <th className="px-6 py-4">Patient ID</th>
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Progress</th>
                    <th className="px-6 py-4">Last Updated</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {patients.filter(p => activeTab === 'all' || p.status === 'Actively filling').map((patient) => (
                    <tr key={patient.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900">{patient.id}</td>
                      <td className="px-6 py-4 text-gray-700">{patient.name || <span className="text-gray-400 italic">Typing...</span>}</td>
                      <td className="px-6 py-4">
                        {getStatusBadge(patient.status)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${patient.status === 'Submitted' ? 'bg-emerald-500' : patient.status === 'Actively filling' ? 'bg-blue-500' : 'bg-gray-300'}`} 
                              style={{ width: patient.progress }}
                            ></div>
                          </div>
                          <span className="text-xs text-gray-500 font-medium">{patient.progress}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-500">{formatTimeAgo(patient.lastUpdated)}</td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => setSelectedPatient(patient)}
                          className="text-brand-500 font-medium hover:text-brand-700 hover:underline transition-colors"
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

      {/* Patient Details Modal */}
      {selectedPatient && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white">
              <h2 className="text-lg font-semibold text-gray-900">Patient Details: <span className="text-brand-600">{selectedPatient.id}</span></h2>
              <button onClick={() => setSelectedPatient(null)} className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[70vh]">
              {!selectedPatient.details ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileCheck className="w-6 h-6 text-gray-400" />
                  </div>
                  <h3 className="text-sm font-medium text-gray-900">No details provided yet</h3>
                  <p className="mt-1 text-sm text-gray-500">This user hasn't filled out any fields.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <p className="text-xs font-medium text-gray-500 mb-1">First Name</p>
                    <p className="text-sm font-semibold text-gray-900">{selectedPatient.details.firstName || '-'}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <p className="text-xs font-medium text-gray-500 mb-1">Middle Name</p>
                    <p className="text-sm font-semibold text-gray-900">{selectedPatient.details.middleName || '-'}</p>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <p className="text-xs font-medium text-gray-500 mb-1">Last Name</p>
                    <p className="text-sm font-semibold text-gray-900">{selectedPatient.details.lastName || '-'}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <p className="text-xs font-medium text-gray-500 mb-1">Date of Birth</p>
                    <p className="text-sm font-semibold text-gray-900">{selectedPatient.details.dob ? new Date(selectedPatient.details.dob).toLocaleDateString() : '-'}</p>
                  </div>

                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <p className="text-xs font-medium text-gray-500 mb-1">Gender</p>
                    <p className="text-sm font-semibold text-gray-900">{selectedPatient.details.gender || '-'}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <p className="text-xs font-medium text-gray-500 mb-1">Nationality</p>
                    <p className="text-sm font-semibold text-gray-900">{selectedPatient.details.nationality || '-'}</p>
                  </div>

                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <p className="text-xs font-medium text-gray-500 mb-1">Preferred Language</p>
                    <p className="text-sm font-semibold text-gray-900">{selectedPatient.details.language || '-'}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <p className="text-xs font-medium text-gray-500 mb-1">Religion</p>
                    <p className="text-sm font-semibold text-gray-900">{selectedPatient.details.religion || '-'}</p>
                  </div>

                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <p className="text-xs font-medium text-gray-500 mb-1">Phone Number</p>
                    <p className="text-sm font-semibold text-gray-900">{selectedPatient.details.phone || '-'}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <p className="text-xs font-medium text-gray-500 mb-1">Email Address</p>
                    <p className="text-sm font-semibold text-gray-900">{selectedPatient.details.email || '-'}</p>
                  </div>

                  <div className="sm:col-span-2 bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <p className="text-xs font-medium text-gray-500 mb-1">Address</p>
                    <p className="text-sm font-semibold text-gray-900">{selectedPatient.details.address || '-'}</p>
                  </div>

                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <p className="text-xs font-medium text-gray-500 mb-1">Contact Name</p>
                    <p className="text-sm font-semibold text-gray-900">{selectedPatient.details.emergencyName || '-'}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <p className="text-xs font-medium text-gray-500 mb-1">Relationship</p>
                    <p className="text-sm font-semibold text-gray-900">{selectedPatient.details.emergencyRel || '-'}</p>
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
