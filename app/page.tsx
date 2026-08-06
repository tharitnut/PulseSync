import Link from "next/link";
import { UserPlus, Users } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-brand-50 text-gray-900 font-sans">
      <main className="flex flex-col flex-1 items-center justify-center p-6 sm:p-12">
        <div className="max-w-2xl w-full text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-brand-900">
              Agnos Healthcare System
            </h1>
            <p className="text-lg text-gray-600 max-w-lg mx-auto">
              Welcome to the patient registration portal. Please select your role below to continue.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-12">
            <Link 
              href="/patient"
              className="group flex flex-col items-center justify-center p-8 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-brand-500 transition-all duration-300 gap-4"
            >
              <div className="p-4 bg-brand-50 text-brand-500 rounded-full group-hover:scale-110 transition-all duration-300">
                <UserPlus className="w-8 h-8" />
              </div>
              <div className="text-center">
                <h2 className="text-xl font-semibold text-brand-900">Patient Form</h2>
                <p className="text-sm text-gray-500 mt-2">Enter patient information and details.</p>
              </div>
            </Link>

            <Link 
              href="/staff"
              className="group flex flex-col items-center justify-center p-8 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-brand-500 transition-all duration-300 gap-4"
            >
              <div className="p-4 bg-brand-50 text-brand-500 rounded-full group-hover:scale-110 transition-all duration-300">
                <Users className="w-8 h-8" />
              </div>
              <div className="text-center">
                <h2 className="text-xl font-semibold text-brand-900">Staff Dashboard</h2>
                <p className="text-sm text-gray-500 mt-2">Monitor patient submissions in real-time.</p>
              </div>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
