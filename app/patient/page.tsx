"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { CheckCircle2, User, Phone, MapPin, Globe, AlertCircle } from "lucide-react";
import Link from "next/link";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

// Generate a unique session ID for this form instance
const generateSessionId = () => `S-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

export default function PatientForm() {
  const [dob, setDob] = useState<Date | null>(null);
  const [status, setStatus] = useState<"idle" | "submitting" | "success">("idle");
  const [formData, setFormData] = useState({
    firstName: "", middleName: "", lastName: "", email: "", phone: "", gender: "", address: "", nationality: "", language: "", religion: "", emergencyName: "", emergencyRel: ""
  });
  
  // Ref for debouncing typing events
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // Stable session ID for this form instance
  const sessionIdRef = useRef<string>(generateSessionId());
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Send abandoned event when leaving the page with an unfinished form
  const sendAbandonedEvent = useCallback(() => {
    const hasData = formData.firstName || formData.lastName || formData.email || formData.phone;
    if (!hasData) return; // Don't send if form is completely empty
    
    const payload = JSON.stringify({
      event: 'abandoned',
      data: {
        sessionId: sessionIdRef.current,
        name: formData.firstName ? `${formData.firstName} ${formData.lastName}`.trim() : "Unknown",
        details: { ...formData, dob: dob ? dob.toISOString() : null }
      }
    });

    // Use sendBeacon for reliability on page close
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/pusher', payload);
    } else {
      fetch('/api/pusher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true
      }).catch(() => {});
    }
  }, [formData, dob]);

  // Register beforeunload handler
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (status !== 'success') {
        sendAbandonedEvent();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [sendAbandonedEvent, status]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.firstName) newErrors.firstName = "First name is required";
    if (!formData.lastName) newErrors.lastName = "Last name is required";
    if (!dob) newErrors.dob = "Date of birth is required";
    if (!formData.gender) newErrors.gender = "Gender is required";
    if (!formData.phone) {
      newErrors.phone = "Phone number is required";
    } else if (!/^\+?[\d\s-()]{7,20}$/.test(formData.phone)) {
      newErrors.phone = "Invalid phone number";
    }
    if (!formData.email) {
      newErrors.email = "Email address is required";
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = "Invalid email address";
    }
    if (!formData.address) newErrors.address = "Address is required";
    if (!formData.nationality) newErrors.nationality = "Nationality is required";
    if (!formData.language) newErrors.language = "Preferred language is required";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Broadcast typing status
  useEffect(() => {
    if (status === "submitting" || status === "success") return;

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      // Only broadcast if they've typed at least a first name, or we can just send an anonymous typing event
      fetch('/api/pusher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'typing',
          data: { 
            sessionId: sessionIdRef.current,
            name: formData.firstName ? `${formData.firstName} ${formData.lastName}`.trim() : "",
            details: { ...formData, dob: dob ? dob.toISOString() : null }
          }
        })
      }).catch(err => console.error("Failed to broadcast typing:", err));
    }, 1000); // 1s debounce

    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [formData, dob]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    
    setStatus("submitting");
    
    try {
      // Mock API call to save patient
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Broadcast submission to Pusher
      await fetch('/api/pusher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'submitted',
          data: {
            sessionId: sessionIdRef.current,
            id: `P-${Math.floor(1000 + Math.random() * 9000)}`,
            name: `${formData.firstName} ${formData.lastName}`.trim(),
            timestamp: new Date().toISOString(),
            details: { ...formData, dob: dob ? dob.toISOString() : null }
          }
        })
      });

      setStatus("success");
    } catch (error) {
      console.error(error);
      setStatus("idle");
    }
  };

  const resetForm = () => {
    setStatus("idle");
    setFormData({ firstName: "", middleName: "", lastName: "", email: "", phone: "", gender: "", address: "", nationality: "", language: "", religion: "", emergencyName: "", emergencyRel: "" });
    setDob(null);
    setErrors({});
    sessionIdRef.current = generateSessionId();
  };

  if (status === "success") {
    return (
      <div className="min-h-screen bg-mesh py-12 px-4 sm:px-6 lg:px-8 font-sans flex items-center justify-center relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-400/20 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-teal-400/20 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="max-w-md w-full text-center relative z-10">
          <div className="glass rounded-3xl p-8 sm:p-12 animate-fade-in shadow-xl">
            <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-pop shadow-inner border border-emerald-200">
              <CheckCircle2 className="w-12 h-12 text-emerald-600" />
            </div>
            <h1 className="text-3xl font-bold text-brand-900 mb-4 bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-600">Registration Submitted!</h1>
            <p className="text-slate-600 mb-8 leading-relaxed text-lg">
              Thank you, <span className="font-semibold text-brand-800">{formData.firstName} {formData.lastName}</span>. Your registration has been successfully submitted and is now being reviewed by our staff.
            </p>
            <div className="flex flex-col gap-4">
              <button
                onClick={resetForm}
                className="w-full inline-flex justify-center rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-4 text-base font-semibold text-white shadow-md hover:shadow-lg hover:from-emerald-600 hover:to-teal-600 hover:-translate-y-0.5 transition-all"
              >
                Submit Another Form
              </button>
              <Link
                href="/"
                className="w-full inline-flex justify-center rounded-xl bg-white/50 backdrop-blur-sm border border-slate-200 px-6 py-4 text-base font-semibold text-slate-700 shadow-sm hover:bg-white/80 hover:shadow transition-all"
              >
                Go Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-mesh py-12 px-4 sm:px-6 lg:px-8 font-sans relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-400/20 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="max-w-3xl mx-auto relative z-10 animate-fade-in">
        <div className="mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-indigo-600 tracking-tight pb-1">Patient Registration</h1>
            <p className="mt-2 text-base text-slate-600 font-medium">Please fill out your information carefully.</p>
          </div>
          <Link href="/" className="self-start sm:self-auto text-sm font-semibold text-brand-600 hover:text-brand-700 bg-white/50 backdrop-blur-md border border-white/60 shadow-sm px-5 py-2.5 rounded-full hover:shadow transition-all shrink-0">
            &larr; Back to Home
          </Link>
        </div>

        <div className="glass rounded-3xl shadow-xl overflow-hidden">
          <form onSubmit={handleSubmit} className="p-6 sm:p-10 space-y-10">
            
            {/* Personal Information */}
            <div>
              <div className="flex items-center gap-2 border-b border-gray-100 pb-4 mb-6">
                <User className="w-5 h-5 text-brand-500" />
                <h2 className="text-lg font-semibold text-brand-900">Personal Information</h2>
              </div>
              
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                <div className="sm:col-span-2">
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">First Name <span className="text-red-400 font-normal">*</span></label>
                  <input
                    type="text"
                    id="firstName"
                    className={`block w-full rounded-lg border ${errors.firstName ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-200 focus:ring-brand-500 focus:border-brand-500'} px-4 py-2.5 shadow-sm sm:text-sm transition-colors bg-white/70 backdrop-blur-sm placeholder:text-gray-400 text-brand-900`}
                    placeholder="John"
                    value={formData.firstName}
                    onChange={(e) => {
                      setFormData({...formData, firstName: e.target.value});
                      if(errors.firstName) setErrors({...errors, firstName: ""});
                    }}
                  />
                  {errors.firstName && <p className="mt-1 text-xs text-red-500">{errors.firstName}</p>}
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="middleName" className="block text-sm font-medium text-gray-700 mb-1">Middle Name <span className="text-gray-400 font-normal">(Optional)</span></label>
                  <input
                    type="text"
                    id="middleName"
                    className="block w-full rounded-lg border border-gray-200 px-4 py-2.5 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm transition-colors bg-white/70 backdrop-blur-sm placeholder:text-gray-400 text-brand-900"
                    placeholder="William"
                    value={formData.middleName}
                    onChange={(e) => setFormData({...formData, middleName: e.target.value})}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">Last Name <span className="text-red-400 font-normal">*</span></label>
                  <input
                    type="text"
                    id="lastName"
                    className={`block w-full rounded-lg border ${errors.lastName ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-200 focus:ring-brand-500 focus:border-brand-500'} px-4 py-2.5 shadow-sm sm:text-sm transition-colors bg-white/70 backdrop-blur-sm placeholder:text-gray-400 text-brand-900`}
                    placeholder="Doe"
                    value={formData.lastName}
                    onChange={(e) => {
                      setFormData({...formData, lastName: e.target.value});
                      if(errors.lastName) setErrors({...errors, lastName: ""});
                    }}
                  />
                  {errors.lastName && <p className="mt-1 text-xs text-red-500">{errors.lastName}</p>}
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="dob" className="block text-sm font-medium text-gray-700 mb-1">Date of Birth <span className="text-red-400 font-normal">*</span></label>
                  <DatePicker
                    selected={dob}
                    onChange={(date: Date | null) => {
                      setDob(date);
                      if (errors.dob) setErrors({...errors, dob: ""});
                    }}
                    dateFormat="dd/MM/yyyy"
                    placeholderText="dd/mm/yyyy"
                    className={`block w-full rounded-lg border ${errors.dob ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-200 focus:ring-brand-500 focus:border-brand-500'} px-4 py-2.5 shadow-sm sm:text-sm transition-colors bg-white/70 backdrop-blur-sm placeholder:text-gray-400 text-brand-900`}
                    wrapperClassName="w-full"
                  />
                  {errors.dob && <p className="mt-1 text-xs text-red-500">{errors.dob}</p>}
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">Gender <span className="text-red-400 font-normal">*</span></label>
                  <select
                    id="gender"
                    value={formData.gender}
                    onChange={(e) => {
                      setFormData({...formData, gender: e.target.value});
                      if (errors.gender) setErrors({...errors, gender: ""});
                    }}
                    className={`custom-select block w-full rounded-lg border ${errors.gender ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-200 focus:ring-brand-500 focus:border-brand-500'} px-4 py-2.5 shadow-sm sm:text-sm transition-colors bg-white/70 backdrop-blur-sm ${formData.gender ? 'text-brand-900' : 'text-gray-400'}`}
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer_not_to_say">Prefer not to say</option>
                  </select>
                  {errors.gender && <p className="mt-1 text-xs text-red-500">{errors.gender}</p>}
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <div className="flex items-center gap-2 border-b border-gray-100 pb-4 mb-6 pt-2">
                <Phone className="w-5 h-5 text-brand-500" />
                <h2 className="text-lg font-semibold text-brand-900">Contact Details</h2>
              </div>
              
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Phone Number <span className="text-red-400 font-normal">*</span></label>
                  <input
                    type="tel"
                    id="phone"
                    className={`block w-full rounded-lg border ${errors.phone ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-200 focus:ring-brand-500 focus:border-brand-500'} px-4 py-2.5 shadow-sm sm:text-sm transition-colors bg-white/70 backdrop-blur-sm placeholder:text-gray-400 text-brand-900`}
                    placeholder="+1 (555) 000-0000"
                    value={formData.phone}
                    onChange={(e) => {
                      setFormData({...formData, phone: e.target.value});
                      if (errors.phone) setErrors({...errors, phone: ""});
                    }}
                  />
                  {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone}</p>}
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address <span className="text-red-400 font-normal">*</span></label>
                  <input
                    type="email"
                    id="email"
                    className={`block w-full rounded-lg border ${errors.email ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-200 focus:ring-brand-500 focus:border-brand-500'} px-4 py-2.5 shadow-sm sm:text-sm transition-colors bg-white/70 backdrop-blur-sm placeholder:text-gray-400 text-brand-900`}
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={(e) => {
                      setFormData({...formData, email: e.target.value});
                      if(errors.email) setErrors({...errors, email: ""});
                    }}
                  />
                  {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">Full Address <span className="text-red-400 font-normal">*</span></label>
                  <textarea
                    id="address"
                    rows={3}
                    className={`block w-full rounded-lg border ${errors.address ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-200 focus:ring-brand-500 focus:border-brand-500'} px-4 py-2.5 shadow-sm sm:text-sm transition-colors bg-white/70 backdrop-blur-sm placeholder:text-gray-400 text-brand-900 resize-none`}
                    value={formData.address}
                    onChange={(e) => {
                      setFormData({...formData, address: e.target.value});
                      if (errors.address) setErrors({...errors, address: ""});
                    }}
                  />
                  {errors.address && <p className="mt-1 text-xs text-red-500">{errors.address}</p>}
                </div>
              </div>
            </div>

            {/* Demographics & Emergency */}
            <div>
              <div className="flex items-center gap-2 border-b border-gray-100 pb-4 mb-6 pt-2">
                <Globe className="w-5 h-5 text-brand-500" />
                <h2 className="text-lg font-semibold text-brand-900">Additional Information</h2>
              </div>
              
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="nationality" className="block text-sm font-medium text-gray-700 mb-1">Nationality <span className="text-red-400 font-normal">*</span></label>
                  <input
                    type="text"
                    id="nationality"
                    className={`block w-full rounded-lg border ${errors.nationality ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-200 focus:ring-brand-500 focus:border-brand-500'} px-4 py-2.5 shadow-sm sm:text-sm transition-colors bg-white/70 backdrop-blur-sm placeholder:text-gray-400 text-brand-900`}
                    placeholder="e.g. American"
                    value={formData.nationality}
                    onChange={(e) => {
                      setFormData({...formData, nationality: e.target.value});
                      if (errors.nationality) setErrors({...errors, nationality: ""});
                    }}
                  />
                  {errors.nationality && <p className="mt-1 text-xs text-red-500">{errors.nationality}</p>}
                </div>

                <div>
                  <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-1">Preferred Language <span className="text-red-400 font-normal">*</span></label>
                  <input
                    type="text"
                    id="language"
                    className={`block w-full rounded-lg border ${errors.language ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-200 focus:ring-brand-500 focus:border-brand-500'} px-4 py-2.5 shadow-sm sm:text-sm transition-colors bg-white/70 backdrop-blur-sm placeholder:text-gray-400 text-brand-900`}
                    placeholder="e.g. English"
                    value={formData.language}
                    onChange={(e) => {
                      setFormData({...formData, language: e.target.value});
                      if (errors.language) setErrors({...errors, language: ""});
                    }}
                  />
                  {errors.language && <p className="mt-1 text-xs text-red-500">{errors.language}</p>}
                </div>

                <div>
                  <label htmlFor="religion" className="block text-sm font-medium text-gray-700 mb-1">Religion <span className="text-gray-400 font-normal">(Optional)</span></label>
                  <input
                    type="text"
                    id="religion"
                    className="block w-full rounded-lg border border-gray-200 px-4 py-2.5 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm transition-colors bg-white/70 backdrop-blur-sm placeholder:text-gray-400 text-brand-900"
                    value={formData.religion}
                    onChange={(e) => setFormData({...formData, religion: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <div className="bg-orange-50/50 -mx-6 sm:-mx-8 p-6 sm:p-8 border-t border-b border-orange-100/50 mt-8 mb-8">
              <div className="flex items-center gap-2 mb-6">
                <AlertCircle className="w-5 h-5 text-orange-500" />
                <h2 className="text-lg font-semibold text-brand-900">Emergency Contact <span className="text-gray-500 font-normal text-sm ml-1">(Optional)</span></h2>
              </div>
              
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="emergencyName" className="block text-sm font-medium text-gray-700 mb-1">Contact Name</label>
                  <input
                    type="text"
                    id="emergencyName"
                    className="block w-full rounded-lg border border-gray-200 px-4 py-2.5 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm transition-colors bg-white/70 backdrop-blur-sm placeholder:text-gray-400 text-brand-900"
                    placeholder="Jane Doe"
                    value={formData.emergencyName}
                    onChange={(e) => setFormData({...formData, emergencyName: e.target.value})}
                  />
                </div>
                <div>
                  <label htmlFor="emergencyRel" className="block text-sm font-medium text-gray-700 mb-1">Relationship</label>
                  <input
                    type="text"
                    id="emergencyRel"
                    className="block w-full rounded-lg border border-gray-200 px-4 py-2.5 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm transition-colors bg-white/70 backdrop-blur-sm placeholder:text-gray-400 text-brand-900"
                    placeholder="e.g. Spouse, Parent"
                    value={formData.emergencyRel}
                    onChange={(e) => setFormData({...formData, emergencyRel: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 sm:gap-4 border-t border-slate-100/50 mt-10">
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-3.5 text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors text-center"
              >
                Clear Form
              </button>
              <button
                type="submit"
                disabled={status === "submitting"}
                className="inline-flex justify-center rounded-xl bg-gradient-to-r from-brand-500 to-indigo-600 px-8 py-3.5 text-sm font-semibold text-white shadow-md hover:shadow-lg hover:from-brand-600 hover:to-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 transition-all disabled:opacity-70 disabled:cursor-not-allowed w-full sm:w-auto"
              >
                {status === "submitting" ? "Submitting..." : "Submit Registration"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
