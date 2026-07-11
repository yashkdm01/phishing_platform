"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Shield, Users, AlertOctagon, Server, Activity, LogOut, Lock, Trash2 } from "lucide-react";
import axios from "axios";

export default function AdminPage() {
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [userList, setUserList] = useState<any[]>([]);
  const [threatLogs, setThreatLogs] = useState<any[]>([]);
  const [counters, setCounters] = useState({ totalScans: 0, threatsBlocked: 0, totalUsers: 0 });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      validateToken(token);
    } else {
      setLoading(false);
    }
  }, []);

  const validateToken = async (token: string) => {
    try {
      // THE FIX: Indestructible JWT parser with strict Base64 padding
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      
      // Calculate missing padding to prevent 'atob' from crashing
      const padding = base64.length % 4 === 0 ? '' : '='.repeat(4 - (base64.length % 4));
      const base64Padded = base64 + padding;
      
      const jsonPayload = decodeURIComponent(
        window.atob(base64Padded)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      
      const decodedToken = JSON.parse(jsonPayload);
      
      // Check if the account actually has admin privileges
      if (decodedToken.role !== "admin") {
        setAuthError(`Access Denied: Your account role is '${decodedToken.role}'. Please use /system-override to register an admin account.`);
        localStorage.removeItem("token");
        setIsAuthorized(false);
        setLoading(false);
        return; // Stop execution here
      }
      
      setIsAuthorized(true);
      fetchGlobalTelemetry(token);
    } catch (e: any) {
      console.error("JWT Parsing Error:", e);
      localStorage.removeItem("token");
      setIsAuthorized(false);
      setAuthError("Session verification failed. Please try logging in again.");
      setLoading(false);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setLoading(true);

    try {
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, { email, password });
      const token = res.data.access_token;
      
      localStorage.setItem("token", token);
      await validateToken(token);
    } catch (err: any) {
      setAuthError("Access Denied: Invalid admin credentials.");
      setLoading(false);
    }
  };

  const fetchGlobalTelemetry = async (token: string) => {
    try {
      const [statsRes, usersRes] = await Promise.all([
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/admin/telemetry`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/admin/users`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setThreatLogs(statsRes.data.history || []);
      setUserList(usersRes.data || []);
      setCounters({
        totalScans: statsRes.data.total_scans || 0,
        threatsBlocked: statsRes.data.threats_blocked || 0,
        totalUsers: usersRes.data.length || 0
      });
    } catch (err) {
      console.error("Telemetry fetch error", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (type: 'users' | 'history', id: number) => {
    if (!confirm("Are you sure you want to permanently delete this record?")) return;
    const token = localStorage.getItem("token");
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/admin/${type}/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchGlobalTelemetry(token!);
    } catch (err) {
      alert("Action failed.");
    }
  };

  const handleAdminLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/admin";
  };

  if (loading) return <div className="flex h-screen items-center justify-center text-white bg-[#0a0a0a]">Securing Terminal Link...</div>;

  if (!isAuthorized) {
    return (
      <div className="flex h-screen items-center justify-center p-4 bg-[#0a0a0a]">
        <div className="bg-[#121214] border border-blue-500/20 p-8 rounded-2xl shadow-2xl max-w-md w-full">
          <div className="flex flex-col items-center gap-3 mb-8">
            <Lock className="text-blue-500" size={40} />
            <h1 className="text-xl font-bold text-white tracking-widest">ADMIN GATEWAY</h1>
          </div>
          <form onSubmit={handleAdminLogin} className="space-y-4">
            <input type="email" placeholder="Admin Email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded px-4 py-3 text-white focus:outline-none focus:border-blue-500" />
            <input type="password" placeholder="Passcode" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded px-4 py-3 text-white focus:outline-none focus:border-blue-500" />
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 transition-colors text-white font-bold py-3 rounded">INITIALIZE SESSION</button>
          </form>
          {authError && <p className="mt-4 text-center text-sm font-bold text-red-500 bg-red-500/10 py-2 rounded">{authError}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 max-w-7xl mx-auto w-full p-6 mt-8 text-white">
      <div className="flex justify-between items-end mb-8 border-b border-white/10 pb-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3"><Shield className="text-blue-500" /> Admin Command Center</h1>
          <p className="text-gray-400 mt-2">Global threat monitoring, telemetry, and platform governance.</p>
        </div>
        <button onClick={handleAdminLogout} className="flex items-center gap-2 text-sm bg-red-500/10 text-red-400 px-4 py-2 rounded border border-red-500/20 hover:bg-red-500/20 transition-colors">
          <LogOut size={16} /> Terminate Session
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-[#121214] border border-white/10 p-6 rounded-2xl flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-400 font-medium">Total Scans</p>
            <p className="text-3xl font-bold mt-1">{counters.totalScans}</p>
          </div>
          <Activity className="text-blue-500 opacity-50" size={32} />
        </div>
        <div className="bg-[#121214] border border-red-500/20 p-6 rounded-2xl flex justify-between items-center">
          <div>
            <p className="text-sm text-red-400 font-medium">Threats Blocked</p>
            <p className="text-3xl font-bold text-red-500 mt-1">{counters.threatsBlocked}</p>
          </div>
          <AlertOctagon className="text-red-500 opacity-50" size={32} />
        </div>
        <div className="bg-[#121214] border border-white/10 p-6 rounded-2xl flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-400 font-medium">Platform Users</p>
            <p className="text-3xl font-bold mt-1">{counters.totalUsers}</p>
          </div>
          <Users className="text-green-500 opacity-50" size={32} />
        </div>
        <div className="bg-[#121214] border border-white/10 p-6 rounded-2xl flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-400 font-medium">System Health</p>
            <p className="text-xl font-bold text-green-500 mt-2">100% Uptime</p>
          </div>
          <Server className="text-gray-500 opacity-50" size={32} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-[#121214] border border-white/10 rounded-2xl p-6 shadow-xl max-h-[500px] overflow-y-auto custom-scrollbar">
          <h2 className="font-bold mb-6 flex items-center gap-2"><Users size={20} className="text-blue-500"/> Account Governance</h2>
          <div className="space-y-3">
            {userList.length > 0 ? userList.map((user: any) => (
              <div key={user.id} className="flex justify-between items-center p-4 bg-black/40 border border-white/5 rounded-lg group">
                <div>
                  <div className="text-sm font-bold flex items-center gap-2">
                    {user.name} 
                    {user.role === 'admin' && <span className="bg-blue-500/20 text-blue-400 text-[10px] px-2 py-0.5 rounded uppercase tracking-wider">Root Admin</span>}
                  </div>
                  <div className="text-xs text-gray-500">{user.email}</div>
                </div>
                {user.role !== 'admin' && (
                  <button onClick={() => handleDelete('users', user.id)} className="text-gray-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 p-2" title="Delete Account">
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            )) : <p className="text-sm text-gray-500 text-center py-4">No consumer profiles found.</p>}
          </div>
        </div>

        <div className="bg-[#121214] border border-white/10 rounded-2xl p-6 shadow-xl max-h-[500px] overflow-y-auto custom-scrollbar">
          <h2 className="font-bold mb-6 flex items-center gap-2"><AlertOctagon size={20} className="text-red-500"/> Malicious Website & Data Feeds</h2>
          <div className="space-y-3">
            {threatLogs.length > 0 ? threatLogs.map((log: any) => (
              <div key={log.id} className="flex justify-between items-center p-4 bg-black/40 border border-white/5 rounded-lg group">
                <div className="flex-1 min-w-0 pr-4">
                  <div className="text-sm text-gray-300 truncate mb-1">{log.content}</div>
                  <div className="text-xs text-gray-500 truncate">{log.result}</div>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <span className={`text-xs font-bold px-2 py-1 rounded ${log.risk_level === 'HIGH' ? 'bg-red-500/20 text-red-500' : log.risk_level === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-500' : 'bg-green-500/20 text-green-500'}`}>
                    {log.risk_level}
                  </span>
                  <button onClick={() => handleDelete('history', log.id)} className="text-gray-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100" title="Purge Threat Log Entry">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            )) : <p className="text-sm text-gray-500 text-center py-4">No active threat entries registered.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
