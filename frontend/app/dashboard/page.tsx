"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Link2, Mail, ShieldAlert, CheckCircle, AlertTriangle, Activity } from "lucide-react";
import axios from "axios";

export default function Dashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("url");
  const [inputData, setInputData] = useState("");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<any>(null);
  
  // Analytics State
  const [stats, setStats] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/");
    } else {
      fetchAnalytics();
    }
  }, [router]);

  const fetchAnalytics = async () => {
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/analytics/history`);
      setStats(res.data.statistics);
      setHistory(res.data.recent_scans);
    } catch (error) {
      console.error("Failed to fetch analytics");
    }
  };

  const handleScan = async () => {
    if (!inputData) return;
    setLoading(true);
    setReport(null);

    try {
      const endpoint = activeTab === "url" 
        ? `${process.env.NEXT_PUBLIC_API_URL}/scan/url` 
        : `${process.env.NEXT_PUBLIC_API_URL}/scan/email`;
      
      const payload = activeTab === "url" ? { url: inputData } : { content: inputData };
      const response = await axios.post(endpoint, payload);
      
      setReport(response.data);
      fetchAnalytics(); // Refresh logs after scanning
    } catch (error) {
      setReport({ risk_level: "ERROR", status: "Failed to connect to scanner engine." });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/");
  };

  return (
    <div className="flex-1 max-w-6xl mx-auto w-full p-6 mt-8">
      
      <div className="flex justify-between items-end mb-8 border-b border-white/10 pb-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Threat Intelligence</h1>
          <p className="text-gray-400">Analyze payloads and monitor system telemetry.</p>
        </div>
        <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-red-400 transition-colors">
          Disconnect Session
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Scanner */}
        <div className="lg:col-span-2">
          <div className="bg-[#121214] border border-white/10 rounded-2xl p-6 shadow-xl mb-8">
            <div className="flex gap-4 mb-6 border-b border-white/5 pb-4">
              <button onClick={() => {setActiveTab("url"); setReport(null);}} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === "url" ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}>
                <Link2 size={16} /> URL Scanner
              </button>
              <button onClick={() => {setActiveTab("email"); setReport(null);}} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === "email" ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}>
                <Mail size={16} /> Email Analyzer
              </button>
            </div>

            <div className="flex gap-4">
              <input 
                type="text" 
                placeholder={activeTab === "url" ? "Enter suspicious URL..." : "Paste suspicious email content..."}
                value={inputData}
                onChange={(e) => setInputData(e.target.value)}
                className="flex-1 bg-black/50 border border-white/10 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-blue-500"
              />
              <button 
                onClick={handleScan}
                disabled={loading || !inputData}
                className="bg-white text-black font-bold px-8 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
              >
                {loading ? "Scanning..." : "Analyze"}
              </button>
            </div>
          </div>

          {/* Report Area */}
          {report && (
            <div className={`border rounded-2xl p-6 shadow-2xl ${report.risk_level === 'HIGH' ? 'bg-red-500/10 border-red-500/50' : report.risk_level === 'MEDIUM' ? 'bg-yellow-500/10 border-yellow-500/50' : 'bg-green-500/10 border-green-500/50'}`}>
              <div className="flex items-center gap-4 mb-4">
                {report.risk_level === 'HIGH' ? <ShieldAlert className="text-red-500" size={32} /> : report.risk_level === 'MEDIUM' ? <AlertTriangle className="text-yellow-500" size={32} /> : <CheckCircle className="text-green-500" size={32} />}
                <div>
                  <h3 className="text-xl font-bold text-white uppercase">{report.risk_level} RISK DETECTED</h3>
                  <p className="text-gray-300">{report.status}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Analytics & History */}
        <div className="bg-[#121214] border border-white/10 rounded-2xl p-6 shadow-xl h-fit">
          <div className="flex items-center gap-2 mb-6">
            <Activity className="text-blue-500" size={20} />
            <h2 className="text-lg font-bold text-white">System Telemetry</h2>
          </div>

          {stats && (
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-black/40 border border-white/5 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-white">{stats.total_scans}</div>
                <div className="text-xs text-gray-400">Total Scans</div>
              </div>
              <div className="bg-red-900/20 border border-red-500/20 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-red-500">{stats.high_risk_detected}</div>
                <div className="text-xs text-red-400">Threats Blocked</div>
              </div>
            </div>
          )}

          <div>
            <h3 className="text-sm font-semibold text-gray-400 mb-4 uppercase tracking-wider">Detection Logs</h3>
            <div className="space-y-3">
              {history.map((log: any) => (
                <div key={log.id} className="bg-black/40 border border-white/5 p-3 rounded-lg flex justify-between items-center">
                  <div className="truncate text-sm text-gray-300 max-w-[150px]">{log.content}</div>
                  <span className={`text-xs font-bold px-2 py-1 rounded ${log.risk_level === 'HIGH' ? 'bg-red-500/20 text-red-500' : 'bg-green-500/20 text-green-500'}`}>
                    {log.risk_level}
                  </span>
                </div>
              ))}
              {history.length === 0 && <p className="text-sm text-gray-500">No logs found.</p>}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}