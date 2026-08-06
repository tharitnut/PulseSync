"use client";

import { useState } from "react";
import { Activity, Clock, FileCheck, Search, Bell, Users, ChevronRight } from "lucide-react";
import Link from "next/link";

// Mock Data
const MOCK_PATIENTS = [
  {
    id: "P-1001",
    name: "John Doe",
    status: "Actively filling",
    lastUpdated: "Just now",
    progress: "60%"
  },
  {
    id: "P-1002",
    name: "Sarah Williams",
    status: "Submitted",
    lastUpdated: "5 mins ago",
    progress: "100%"
  },
  {
    id: "P-1003",
    name: "Michael Chen",
    status: "Inactive",
    lastUpdated: "12 mins ago",
    progress: "25%"
  },
  {
    id: "P-1004",
    name: "Emma Thompson",
    status: "Submitted",
    lastUpdated: "1 hour ago",
    progress: "100%"
  }
];

export default function StaffView() {
  const [activeTab, setActiveTab] = useState("all");
  
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
          <div className="flex items-center md:hidden gap-2">
            <Link href="/" className="p-1 -ml-1 text-gray-400 hover:text-gray-600 transition-colors">
              <ChevronRight className="w-5 h-5 rotate-180" />
            </Link>
            <div className="flex items-center">
              <Activity className="w-6 h-6 text-brand-500 mr-2" />
              <span className="text-lg font-bold text-brand-900 tracking-tight">Agnos</span>
            </div>
          </div>
          <div className="flex-1 flex justify-end items-center gap-4">
            <div className="relative max-w-md w-full hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search patients..." 
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors"
              />
            </div>
            <button className="p-2 text-gray-400 hover:text-gray-500 rounded-full hover:bg-gray-100 transition-colors">
              <Bell className="w-5 h-5" />
            </button>
            <div className="w-8 h-8 bg-teal-600 rounded-full text-white flex items-center justify-center text-sm font-medium shadow-sm">
              ST
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
                <p className="text-2xl font-semibold text-gray-900 mt-1">1</p>
              </div>
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                <Activity className="w-6 h-6" />
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Submitted Today</p>
                <p className="text-2xl font-semibold text-gray-900 mt-1">2</p>
              </div>
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                <FileCheck className="w-6 h-6" />
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Abandoned/Inactive</p>
                <p className="text-2xl font-semibold text-gray-900 mt-1">1</p>
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
                    <th className="px-6 py-4">Name (if provided)</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Progress</th>
                    <th className="px-6 py-4">Last Updated</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {MOCK_PATIENTS.filter(p => activeTab === 'all' || p.status === 'Actively filling').map((patient) => (
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
                      <td className="px-6 py-4 text-gray-500">{patient.lastUpdated}</td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-brand-500 font-medium hover:text-brand-700 hover:underline">
                          View details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Empty state (optional/if needed) */}
            {/* <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-6 h-6 text-gray-400" />
              </div>
              <h3 className="text-sm font-medium text-gray-900">No active sessions</h3>
              <p className="mt-1 text-sm text-gray-500">Waiting for patients to start the registration form.</p>
            </div> */}

          </div>
        </div>
      </main>
    </div>
  );
}
