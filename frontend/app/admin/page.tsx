"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Shield, Users, AlertOctagon, Server, Activity, ArrowLeft } from "lucide-react";
import axios from "axios";

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [globalStats, setGlobalStats] = useState<any>(null);
  
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/");
      return;
    }

    // SECURITY LOCK: Decode the JWT to verify the role
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      
      const decodedToken = JSON.parse(jsonPayload);
      
      // If they aren't an admin, kick them immediately
      if (decodedToken.role !== "admin") {
        console.warn("Security Breach Attempted: Unauthorized Access");
        router.push("/dashboard"); 
        return;
      }
    } catch (e) {
      console.error("Invalid token format");
      router.push("/");
      return;
    }

    // If they survive the security check, fetch the data
    fetchGlobalTelemetry(token);
  }, [router]);

  const fetchGlobalTelemetry = async (token: string) => {
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/analytics/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setGlobalStats(res.data);
    } catch (err) {
      console.error("Failed to load admin telemetry", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex h-screen items-center justify-center text-white bg-[#0a0a0a]">Initializing Security Operations Center...</div>;
  }

  return (
    <div className="flex-1 max-w-7xl mx-auto w-full p-6 mt-8">
      <div className="flex justify-between items-end mb-8 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Shield className="text-blue-500" size={32} />
            <h1 className="text-3xl font-bold text-white">Admin Command Center</h1>
          </div>
          <p className="text-gray-400">Global threat monitoring and user activity logs.</p>
        </div>
        <button onClick={() => router.push("/dashboard")} className="flex items-center gap-2 text-sm bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-lg transition-colors">
          <ArrowLeft size={16} /> Return to Dashboard
        </button>
      </div>

      {/* Top Level Telemetry */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-[#121214] border border-white/10 p-6 rounded-2xl shadow-xl flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400 font-medium">Total System Scans</p>
            <p className="text-3xl font-bold text-white mt-1">{globalStats?.total_scans || 0}</p>
          </div>
          <Activity className="text-blue-500 opacity-50" size={32} />
        </div>
        <div className="bg-[#121214] border border-red-500/20 p-6 rounded-2xl shadow-xl flex items-center justify-between">
          <div>
            <p className="text-sm text-red-400 font-medium">Critical Threats Blocked</p>
            <p className="text-3xl font-bold text-red-500 mt-1">{globalStats?.high_risk_detected || globalStats?.threats_blocked || 0}</p>
          </div>
          <AlertOctagon className="text-red-500 opacity-50" size={32} />
        </div>
        <div className="bg-[#121214] border border-white/10 p-6 rounded-2xl shadow-xl flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400 font-medium">Active Agents</p>
            <p className="text-3xl font-bold text-white mt-1">1</p>
          </div>
          <Users className="text-green-500 opacity-50" size={32} />
        </div>
        <div className="bg-[#121214] border border-white/10 p-6 rounded-2xl shadow-xl flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400 font-medium">API Health</p>
            <p className="text-xl font-bold text-green-500 mt-2">100% Uptime</p>
          </div>
          <Server className="text-gray-500 opacity-50" size={32} />
        </div>
      </div>

      {/* Global Activity Feed */}
      <div className="bg-[#121214] border border-white/10 rounded-2xl p-6 shadow-xl">
        <h2 className="text-lg font-bold text-white mb-6">Recent Global Detections</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-sm text-gray-400 uppercase tracking-wider">
                <th className="pb-3 font-medium">Payload Target</th>
                <th className="pb-3 font-medium">Risk Assessment</th>
                <th className="pb-3 font-medium">Engine Output</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {globalStats?.history?.length > 0 ? (
                globalStats.history.map((log: any) => (
                  <tr key={log.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 text-gray-300 max-w-[200px] truncate pr-4">{log.content}</td>
                    <td className="py-4">
                      <span className={`text-xs font-bold px-2 py-1 rounded ${log.risk_level === 'HIGH' ? 'bg-red-500/20 text-red-500' : log.risk_level === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-500' : 'bg-green-500/20 text-green-500'}`}>
                        {log.risk_level}
                      </span>
                    </td>
                    <td className="py-4 text-gray-400 text-xs truncate max-w-[400px]">{log.result || 'Engine verified payload signature.'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-gray-500">No recent system activity.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
