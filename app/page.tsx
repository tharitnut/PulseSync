import Link from "next/link";
import { UserPlus, Users } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-mesh text-gray-900 font-sans relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-400/20 rounded-full blur-[100px] pointer-events-none" />
      
      <main className="flex flex-col flex-1 items-center justify-center p-6 sm:p-12 relative z-10">
        <div className="max-w-2xl w-full text-center space-y-10 animate-fade-in">
          <div className="space-y-4">
            <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-indigo-600 pb-2">
              Agnos Healthcare
            </h1>
            <p className="text-lg text-slate-600 max-w-lg mx-auto font-medium">
              Welcome to the patient registration portal. Please select your role below to continue.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-12">
            <Link 
              href="/patient"
              className="group flex flex-col items-center justify-center p-10 glass rounded-3xl hover:shadow-xl hover:border-brand-400 hover:-translate-y-1 transition-all duration-300 gap-6"
            >
              <div className="p-5 bg-gradient-to-br from-brand-50 to-brand-100 text-brand-600 rounded-2xl group-hover:scale-110 group-hover:shadow-md transition-all duration-300">
                <UserPlus className="w-10 h-10" />
              </div>
              <div className="text-center">
                <h2 className="text-2xl font-bold text-slate-800">Patient Form</h2>
                <p className="text-sm text-slate-500 mt-2">Enter patient information and details.</p>
              </div>
            </Link>

            <Link 
              href="/staff"
              className="group flex flex-col items-center justify-center p-10 glass rounded-3xl hover:shadow-xl hover:border-brand-400 hover:-translate-y-1 transition-all duration-300 gap-6"
            >
              <div className="p-5 bg-gradient-to-br from-brand-50 to-brand-100 text-brand-600 rounded-2xl group-hover:scale-110 group-hover:shadow-md transition-all duration-300">
                <Users className="w-10 h-10" />
              </div>
              <div className="text-center">
                <h2 className="text-2xl font-bold text-slate-800">Staff Dashboard</h2>
                <p className="text-sm text-slate-500 mt-2">Monitor patient submissions in real-time.</p>
              </div>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
