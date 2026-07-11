"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Shield, Users, AlertOctagon, Server, Activity, LogOut, Lock, Trash2 } from "lucide-react";
import axios from "axios";

export default function AdminPage() {
  const router = useRouter();
  
  // View States
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [userList, setUserList] = useState<any[]>([]);
  const [threatLogs, setThreatLogs] = useState<any[]>([]);

  // Live Telemetry States
  const [counters, setCounters] = useState({
    totalScans: 0,
    threatsBlocked: 0,
    totalUsers: 0
  });

  // Login Form States
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    checkTokenSecurity();
  }, []);

  const checkTokenSecurity = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      setIsAuthorized(false);
      return;
    }

    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      
      const decodedToken = JSON.parse(jsonPayload);
      
      if (decodedToken.role !== "admin") {
        localStorage.removeItem("token");
        setLoading(false);
        setIsAuthorized(false);
        setAuthError("Standard session cleared. Please provide Administrator credentials.");
        return;
      }

      setIsAuthorized(true);
      fetchGlobalTelemetry(token);
    } catch (e) {
      localStorage.removeItem("token");
      setLoading(false);
      setIsAuthorized(false);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setLoading(true);

    try {
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
        email,
        password
      });

      localStorage.setItem("token", res.data.access_token);
      checkTokenSecurity(); 
    } catch (err: any) {
      setAuthError("Access Denied: Invalid admin credentials.");
      setLoading(false);
    }
  };

  const fetchGlobalTelemetry = async (token: string) => {
    try {
      const [statsRes, usersRes] = await Promise.all([
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/analytics/history`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/admin/users`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      const history = statsRes.data.history || [];
      
      setThreatLogs(history);
      setUserList(usersRes.data);
      
      // Hydrate top level global metrics
      setCounters({
        totalScans: statsRes.data.total_scans || history.length,
        threatsBlocked: statsRes.data.high_risk_detected || statsRes.data.threats_blocked || 0,
        totalUsers: usersRes.data.length
      });
    } catch (err) {
      console.error("Failed to load global admin telemetry", err);
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // PRODUCTION GRADE ACTION ENGINE (DELETE USERS & THREATS)
  // =========================================================
  const handleDelete = async (type: 'users' | 'history', id: number) => {
    const confirmationText = type === 'users' 
      ? "Are you sure you want to permanently delete this user account and all their data?" 
      : "Are you sure you want to scrub this malicious website from the global records?";
      
    if (!confirm(confirmationText)) return;
    
    // 1. Target and isolate the item to figure out its properties before deletion
    let wasThreat = false;
    
    if (type === 'history') {
      const targetLog = threatLogs.find(log => log.id === id);
      if (targetLog?.risk_level === 'HIGH' || targetLog?.risk_level === 'MEDIUM') {
        wasThreat = true;
      }
      // Instantly wipe row from UI state
      setThreatLogs(prev => prev.filter(log => log.id !== id));
    } else {
      // Instantly wipe user from UI state
      setUserList(prev => prev.filter(user => user.id !== id));
    }

    // 2. Adjust global counters live on screen with Optimistic UI logic
    setCounters(prev => ({
      totalScans: type === 'history' ? prev.totalScans - 1 : prev.totalScans,
      threatsBlocked: wasThreat ? prev.threatsBlocked - 1 : prev.threatsBlocked,
      totalUsers: type === 'users' ? prev.totalUsers - 1 : prev.totalUsers
    }));

    // 3. Make the silent API call to sync the changes down to the database
    const token = localStorage.getItem("token");
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/admin/${type}/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err: any) {
      alert(`Action Failed: ${err.response?.data?.detail || "Database connection error"}`);
      // Re-hydrate state if backend fails to fall back safely
      fetchGlobalTelemetry(token!);
    }
  };

  const handleAdminLogout = () => {
    localStorage.removeItem("token");
    setIsAuthorized(false);
    setUserList([]);
    setThreatLogs([]);
  };

  if (loading) {
    return <div className="flex h-screen items-center justify-center text-white bg-[#0a0a0a]">Securing Terminal Link...</div>;
  }

  if (!isAuthorized) {
    return (
      <div className="flex h-screen items-center justify-center p-4 bg-[#0a0a0a]">
        <div className="bg-[#121214] border border-blue-500/20 p-8 rounded-2xl shadow-2xl max-w-md w-full">
          <div className="flex flex-col items-center justify-center gap-3 mb-8">
            <div className="p-4 bg-blue-500/10 rounded-full">
              <Lock className="text-blue-500" size={40} />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-widest text-center">ADMIN GATEWAY</h1>
            <p className="text-xs text-gray-500 uppercase tracking-widest">Restricted Access</p>
          </div>
          
          <form onSubmit={handleAdminLogin} className="space-y-4">
            <input type="email" placeholder="Admin Identifier" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded px-4 py-3 text-white focus:border-blue-500 focus:outline-none transition-colors" />
            <input type="password" placeholder="Passcode" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded px-4 py-3 text-white focus:border-blue-500 focus:outline-none transition-colors" />
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded uppercase tracking-widest mt-4 transition-colors">Initialize Session</button>
          </form>
          {authError && <p className="mt-6 text-center text-sm font-bold text-red-500 bg-red-500/10 py-2 rounded">{authError}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 max-w-7xl mx-auto w-full p-6 mt-8 text-white">
      <div className="flex justify-between items-end mb-8 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Shield className="text-blue-500" size={32} />
            <h1 className="text-3xl font-bold">Admin Command Center</h1>
          </div>
          <p className="text-gray-400">Global threat monitoring, telemetry, and platform governance.</p>
        </div>
        <button onClick={handleAdminLogout} className="flex items-center gap-2 text-sm bg-red-500/10 hover:bg-red-500/20 text-red-400 px-4 py-2 rounded-lg transition-colors border border-red-500/20">
          <LogOut size={16} /> Terminate Session
        </button>
      </div>

      {/* Global Telemetry Dashboard Blocks */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-[#121214] border border-white/10 p-6 rounded-2xl shadow-xl flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400 font-medium">Total Global Scans</p>
            <p className="text-3xl font-bold mt-1">{counters.totalScans}</p>
          </div>
          <Activity className="text-blue-500 opacity-50" size={32} />
        </div>
        <div className="bg-[#121214] border border-red-500/20 p-6 rounded-2xl shadow-xl flex items-center justify-between">
          <div>
            <p className="text-sm text-red-400 font-medium">Critical Threats Blocked</p>
            <p className="text-3xl font-bold text-red-500 mt-1">{counters.threatsBlocked}</p>
          </div>
          <AlertOctagon className="text-red-500 opacity-50" size={32} />
        </div>
        <div className="bg-[#121214] border border-white/10 p-6 rounded-2xl shadow-xl flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400 font-medium">Platform Users</p>
            <p className="text-3xl font-bold text-white mt-1">{counters.totalUsers}</p>
          </div>
          <Users className="text-green-500 opacity-50" size={32} />
        </div>
        <div className="bg-[#121214] border border-white/10 p-6 rounded-2xl shadow-xl flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400 font-medium">System Health</p>
            <p className="text-xl font-bold text-green-500 mt-2">100% Uptime</p>
          </div>
          <Server className="text-gray-500 opacity-50" size={32} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* User Accounts Administration Panel */}
        <div className="bg-[#121214] border border-white/10 rounded-2xl p-6 shadow-xl h-fit">
          <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
            <Users size={20} className="text-blue-500"/> Account Governance
          </h2>
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {userList.length > 0 ? (
              userList.map((user: any) => (
                <div key={user.id} className="bg-black/40 border border-white/5 p-4 rounded-lg flex justify-between items-center group">
                  <div>
                    <div className="text-sm font-bold flex items-center gap-2">
                      {user.name} 
                      {user.role === 'admin' && <span className="bg-blue-500/20 text-blue-400 text-[10px] px-2 py-0.5 rounded uppercase tracking-wider">Root Admin</span>}
                    </div>
                    <div className="text-xs text-gray-500">{user.email}</div>
                  </div>
                  {user.role !== 'admin' && (
                    <button 
                      onClick={() => handleDelete('users', user.id)}
                      className="text-gray-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 p-2"
                      title="Delete Account"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">No consumer profiles found.</p>
            )}
          </div>
        </div>

        {/* Global Threat Log Administration Panel */}
        <div className="bg-[#121214] border border-white/10 rounded-2xl p-6 shadow-xl h-fit">
          <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
            <AlertOctagon size={20} className="text-red-500"/> Malicious Website & Data Feeds
          </h2>
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {threatLogs.length > 0 ? (
              threatLogs.map((log: any) => (
                <div key={log.id} className="bg-black/40 border border-white/5 p-4 rounded-lg flex justify-between items-center group">
                  <div className="flex-1 min-w-0 pr-4">
                    <div className="text-sm text-gray-300 truncate mb-1">{log.content}</div>
                    <div className="text-xs text-gray-500 truncate">{log.result}</div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <span className={`text-xs font-bold px-2 py-1 rounded ${log.risk_level === 'HIGH' ? 'bg-red-500/20 text-red-500' : log.risk_level === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-500' : 'bg-green-500/20 text-green-500'}`}>
                      {log.risk_level}
                    </span>
                    <button 
                      onClick={() => handleDelete('history', log.id)}
                      className="text-gray-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                      title="Purge Threat Log Entry"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">No active threat entries registered.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
