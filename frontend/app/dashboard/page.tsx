"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Shield, Globe, Mail, Activity, AlertOctagon, LogOut } from "lucide-react";
import axios from "axios";

export default function DashboardPage() {
  const router = useRouter();
  
  // UI Tab State
  const [activeTab, setActiveTab] = useState<"url" | "email">("url");
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Scan Result State
  const [scanResult, setScanResult] = useState<any>(null);
  
  // LIVE TELEMETRY STATES (No more static values)
  const [telemetry, setTelemetry] = useState({
    totalScans: 0,
    threatsBlocked: 0
  });
  const [detectionLogs, setDetectionLogs] = useState<any[]>([]);

  // Authenticate and load initial user history on page mount
  useEffect(() => {
    fetchUserHistory();
  }, []);

  const fetchUserHistory = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      // Pull historical analytics from the backend database
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/analytics/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const history = res.data.history || [];
      const highRiskCount = res.data.high_risk_detected || 0;
      const totalCount = res.data.total_scans || history.length;

      setTelemetry({
        totalScans: totalCount,
        threatsBlocked: highRiskCount
      });
      setDetectionLogs(history);
    } catch (err) {
      console.error("Failed to fetch operational telemetry", err);
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

      const data = res.data;
      setScanResult(data);

      // ==========================================
      // LIVE TELEMETRY UPDATE ENGINE (THE FIX)
      // ==========================================
      const isThreat = data.risk_level === "HIGH" || data.risk_level === "MEDIUM";
      
      // 1. Increment counters instantly on screen
      setTelemetry(prev => ({
        totalScans: prev.totalScans + 1,
        threatsBlocked: isThreat ? prev.threatsBlocked + 1 : prev.threatsBlocked
      }));

      # 2. Add the new scan item to the top of the side logs table dynamically
      const newLogItem = {
        id: Date.now(), 
        content: activeTab === "url" ? data.url : (inputValue.substring(0, 30) + "..."),
        risk_level: data.risk_level,
        result: data.status
      };
      setDetectionLogs(prev => [newLogItem, ...prev]);
      
      // Clear input field after successful scan
      setInputValue("");

    } catch (err: any) {
      setScanResult({
        risk_level: "ERROR",
        status: err.response?.data?.detail || "Network request failed. Ensure backend is running."
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  return (
    <div className="flex-1 max-w-7xl mx-auto w-full p-6 mt-8 text-white">
      {/* Header Area */}
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
        {/* Main Operational Panel */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#121214] border border-white/10 p-6 rounded-2xl shadow-xl">
            {/* Tab Toggles */}
            <div className="flex gap-4 mb-6">
              <button 
                type="button"
                onClick={() => { setActiveTab("url"); setScanResult(null); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === "url" ? "bg-blue-600 text-white" : "text-gray-400 hover:bg-white/5"}`}
              >
                <Globe size={18} /> URL Scanner
              </button>
              <button 
                type="button"
                onClick={() => { setActiveTab("email"); setScanResult(null); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === "email" ? "bg-blue-600 text-white" : "text-gray-400 hover:bg-white/5"}`}
              >
                <Mail size={18} /> Email Analyzer
              </button>
            </div>

            {/* Form Input */}
            <form onSubmit={handleAnalyze} className="flex gap-3">
              <input 
                type={activeTab === "url" ? "url" : "text"}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={activeTab === "url" ? "Paste suspicious threat link (https://...)" : "Paste full raw email message contents here..."}
                required
                className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-colors"
              />
              <button 
                type="submit" 
                disabled={loading}
                className="bg-white text-black hover:bg-gray-200 disabled:bg-gray-700 font-bold px-6 rounded-xl transition-colors text-sm shrink-0"
              >
                {loading ? "Analyzing..." : "Analyze"}
              </button>
            </form>
          </div>

          {/* Dynamic Result Output Screen */}
          {scanResult && (
            <div className={`border p-6 rounded-2xl flex gap-4 animate-fadeIn transition-all duration-300 ${
              scanResult.risk_level === 'HIGH' ? 'bg-red-500/10 border-red-500/30' : 
              scanResult.risk_level === 'MEDIUM' ? 'bg-yellow-500/10 border-yellow-500/30' :
              scanResult.risk_level === 'ERROR' ? 'bg-orange-500/10 border-orange-500/30' : 'bg-green-500/10 border-green-500/30'
            }`}>
              <div className="mt-1">
                {scanResult.risk_level === 'HIGH' || scanResult.risk_level === 'ERROR' ? (
                  <AlertOctagon className={scanResult.risk_level === 'HIGH' ? "text-red-500" : "text-orange-500"} size={28} />
                ) : (
                  <Shield className="text-green-500" size={28} />
                )}
              </div>
              <div>
                <h3 className="text-lg font-bold tracking-wide uppercase">
                  {scanResult.risk_level === 'HIGH' ? "High Risk Detected" : 
                   scanResult.risk_level === 'MEDIUM' ? "Medium Risk Detected" :
                   scanResult.risk_level === 'ERROR' ? "System Error" : "Low Risk Detected"}
                </h3>
                <p className="text-sm mt-1 text-gray-300 font-medium">{scanResult.status}</p>
                {scanResult.details && typeof scanResult.details === 'object' && (
                  <div className="mt-4 p-3 bg-black/40 rounded-lg text-xs font-mono text-gray-400 max-h-[150px] overflow-y-auto">
                    {JSON.stringify(scanResult.details, null, 2)}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Live Operational Telemetry Side-Panel */}
        <div className="space-y-6">
          <div className="bg-[#121214] border border-white/10 p-6 rounded-2xl shadow-xl">
            <h2 className="text-md font-bold mb-4 flex items-center gap-2 tracking-wider uppercase text-gray-400">
              <Activity size={16} className="text-blue-500"/> System Telemetry
            </h2>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-black/30 p-4 rounded-xl border border-white/5 text-center">
                <span className="text-xs text-gray-500 block uppercase">Total Scans</span>
                <span className="text-2xl font-bold mt-1 block">{telemetry.totalScans}</span>
              </div>
              <div className="bg-red-500/5 p-4 rounded-xl border border-red-500/10 text-center">
                <span className="text-xs text-red-400/70 block uppercase">Threats Blocked</span>
                <span className="text-2xl font-bold text-red-500 mt-1 block">{telemetry.threatsBlocked}</span>
              </div>
            </div>

            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Detection Logs</h3>
            <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1 custom-scrollbar">
              {detectionLogs.length > 0 ? (
                detectionLogs.map((log) => (
                  <div key={log.id} className="bg-black/20 border border-white/5 p-3 rounded-lg flex justify-between items-center text-xs">
                    <span className="truncate max-w-[140px] text-gray-400 font-medium">{log.content}</span>
                    <span className={`px-2 py-0.5 rounded font-bold ${
                      log.risk_level === 'HIGH' ? 'bg-red-500/20 text-red-500' : 
                      log.risk_level === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-500' : 'bg-green-500/20 text-green-500'
                    }`}>
                      {log.risk_level}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-600 py-4 text-center">No structural logs generated.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
