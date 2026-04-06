import { useState } from "react";
import JobForm from "../components/JobForm";
import JobList from "../components/JobList";
import UptimeMonitor from "../components/UptimeMonitor";

export default function Home() {
  const [refresh, setRefresh] = useState(0);
  const [activeTab, setActiveTab] = useState("jobs");

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-xl font-extrabold text-gray-900 tracking-tight">Pulse</span>
            </div>

            <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
              <button
                onClick={() => setActiveTab("jobs")}
                className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${
                  activeTab === "jobs"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  Jobs
                </span>
              </button>
              <button
                onClick={() => setActiveTab("uptime")}
                className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${
                  activeTab === "uptime"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Uptime
                </span>
              </button>
            </div>

            <button
              onClick={() => { localStorage.removeItem("token"); window.location.reload(); }}
              className="text-sm font-medium text-gray-400 hover:text-red-500 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="py-10">
        {activeTab === "jobs" && (
          <>
            <JobForm onJobCreated={() => setRefresh(r => r + 1)} />
            <JobList refresh={refresh} />
          </>
        )}
        {activeTab === "uptime" && <UptimeMonitor />}
      </div>
    </div>
  );
}
