"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Shield, Globe, Mail, Activity, AlertOctagon } from "lucide-react";
import axios from "axios";

export default function DashboardPage() {
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState<"url" | "email">("url");
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  
  const [telemetry, setTelemetry] = useState({ totalScans: 0, threatsBlocked: 0 });
  const [detectionLogs, setDetectionLogs] = useState<any[]>([]);

  useEffect(() => {
    fetchUserHistory();
  }, []);

  const fetchUserHistory = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      // THE FIX: Redirects to root ("/") instead of "/login" if root is your login page
      window.location.href = "/";
      return;
    }

    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/analytics/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const history = res.data.history || [];
      const highRiskCount = res.data.high_risk_detected || 0;
      const totalCount = res.data.total_scans || history.length;

      setTelemetry({ totalScans: totalCount, threatsBlocked: highRiskCount });
      setDetectionLogs(history);
    } catch (err) {
      console.error("Failed to fetch history", err);
    }
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    setLoading(true);
    setScanResult(null);

    const token = localStorage.getItem("token");
    const endpoint = activeTab === "url" ? "/scan/url" : "/scan/email";
    const payload = activeTab === "url" ? { url: inputValue } : { content: inputValue };

    try {
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setScanResult(res.data);
      
      const isThreat = res.data.risk_level === "HIGH" || res.data.risk_level === "MEDIUM";
      setTelemetry(prev => ({
        totalScans: prev.totalScans + 1,
        threatsBlocked: isThreat ? prev.threatsBlocked + 1 : prev.threatsBlocked
      }));

      setDetectionLogs(prev => [{
        id: Date.now(), 
        content: activeTab === "url" ? res.data.url : (inputValue.substring(0, 30) + "..."),
        risk_level: res.data.risk_level,
        result: res.data.status
      }, ...prev]);
      
      setInputValue("");
    } catch (err: any) {
      setScanResult({ risk_level: "ERROR", status: "Request failed." });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    // THE FIX: Explicitly redirect to root "/" to avoid 404s
    window.location.href = "/";
  };

  return (
    <div className="flex-1 max-w-7xl mx-auto w-full p-6 mt-8 text-white">
      <div className="flex justify-between items-end mb-8 border-b border-white/10 pb-4">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Shield className="text-blue-500" size={32} /> Threat Intelligence
          </h1>
          <p className="text-gray-400">Analyze payloads and monitor system telemetry.</p>
        </div>
        <button onClick={handleLogout} className="text-xs text-gray-500 hover:text-red-400 transition-colors">
          Disconnect Session
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#121214] border border-white/10 p-6 rounded-2xl shadow-xl">
            <div className="flex gap-4 mb-6">
              <button onClick={() => setActiveTab("url")} className={`px-4 py-2 rounded-lg font-medium ${activeTab === "url" ? "bg-blue-600" : "bg-white/5"}`}>URL Scanner</button>
              <button onClick={() => setActiveTab("email")} className={`px-4 py-2 rounded-lg font-medium ${activeTab === "email" ? "bg-blue-600" : "bg-white/5"}`}>Email Analyzer</button>
            </div>
            <form onSubmit={handleAnalyze} className="flex gap-3">
              <input type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder="Enter threat data..." required className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3" />
              <button type="submit" disabled={loading} className="bg-white text-black font-bold px-6 rounded-xl">{loading ? "Analyzing..." : "Analyze"}</button>
            </form>
          </div>
          {scanResult && (
            <div className={`border p-6 rounded-2xl ${scanResult.risk_level === 'HIGH' ? 'bg-red-500/10' : 'bg-green-500/10'}`}>
              <h3 className="font-bold uppercase">{scanResult.risk_level} Risk Detected</h3>
              <p className="text-sm mt-1">{scanResult.status}</p>
            </div>
          )}
        </div>

        <div className="bg-[#121214] border border-white/10 p-6 rounded-2xl">
          <h2 className="text-md font-bold mb-4 uppercase text-gray-400">System Telemetry</h2>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-black/30 p-4 rounded-xl text-center">
              <span className="text-2xl font-bold">{telemetry.totalScans}</span>
              <p className="text-xs text-gray-500">Scans</p>
            </div>
            <div className="bg-red-500/5 p-4 rounded-xl text-center">
              <span className="text-2xl font-bold text-red-500">{telemetry.threatsBlocked}</span>
              <p className="text-xs text-gray-500">Threats</p>
            </div>
          </div>
          <div className="space-y-2 max-h-[260px] overflow-y-auto">
            {detectionLogs.map((log) => (
              <div key={log.id} className="bg-black/20 p-3 rounded-lg flex justify-between text-xs">
                <span className="truncate">{log.content}</span>
                <span className={log.risk_level === 'HIGH' ? 'text-red-500' : 'text-green-500'}>{log.risk_level}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
