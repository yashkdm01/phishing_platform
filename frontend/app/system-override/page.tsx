"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert, Key } from "lucide-react";
import axios from "axios";

export default function AdminSetup() {
  const router = useRouter();
  const [formData, setFormData] = useState({ name: "", email: "", password: "", admin_secret: "" });
  const [message, setMessage] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/register`, formData);
      setMessage("SUCCESS: System Override Accepted. Initializing Admin Gateway...");
      // Redirects directly to the admin path now!
      setTimeout(() => router.push("/admin"), 2000); 
    } catch (err: any) {
      setMessage(`ERROR: ${err.response?.data?.detail || "Authentication Failed"}`);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center p-4">
      <div className="bg-red-950/20 border border-red-500/50 p-8 rounded-2xl shadow-2xl max-w-md w-full">
        <div className="flex items-center gap-3 mb-6 border-b border-red-500/20 pb-4">
          <ShieldAlert className="text-red-500" size={32} />
          <h1 className="text-2xl font-bold text-white tracking-widest">SYSTEM OVERRIDE</h1>
        </div>
        
        <form onSubmit={handleRegister} className="space-y-4">
          <input type="text" placeholder="Admin Name" required onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded px-4 py-2 text-white" />
          <input type="email" placeholder="Admin Email" required onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded px-4 py-2 text-white" />
          <input type="password" placeholder="Secure Password" required onChange={(e) => setFormData({...formData, password: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded px-4 py-2 text-white" />
          
          <div className="relative pt-4">
            <Key className="absolute left-3 top-7 text-red-500/50" size={16} />
            <input type="password" placeholder="MASTER SECRET KEY" required onChange={(e) => setFormData({...formData, admin_secret: e.target.value})} className="w-full bg-red-900/10 border border-red-500/30 rounded pl-10 py-2 text-red-400 placeholder-red-800/50 focus:border-red-500 outline-none transition-colors" />
          </div>

          <button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded uppercase tracking-widest mt-6 transition-colors">
            Authorize Admin
          </button>
        </form>
        {message && <p className="mt-4 text-center text-sm font-bold text-red-400">{message}</p>}
      </div>
    </div>
  );
}
