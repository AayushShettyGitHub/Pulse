import React, { useState, useEffect } from "react";
import JobForm from "../components/JobForm";
import JobList from "../components/JobList";
import { getJobs } from "../api/jobs";
import { Briefcase, CheckCircle2, Clock, AlertTriangle } from "lucide-react";

export default function Home() {
  const [refresh, setRefresh] = useState(0);
  const [stats, setStats] = useState({ total: 0, active: 0, pending: 0, failed: 0 });
  const username = localStorage.getItem("username") || "User";

  useEffect(() => {
    async function loadStats() {
      try {
        const all = await getJobs();
        const jobs = Array.isArray(all) ? all : [];
        const httpJobs = jobs.filter(j => (j.jobType || "HTTP") === "HTTP");
        setStats({
          total: httpJobs.length,
          active: httpJobs.filter(j => j.status === "SUCCESS" || j.status === "RUNNING").length,
          pending: httpJobs.filter(j => j.status === "PENDING" || j.status === "RETRYING").length,
          failed: httpJobs.filter(j => j.status === "FAILED").length,
        });
      } catch (e) { console.error(e); }
    }
    loadStats();
  }, [refresh]);

  const cards = [
    { label: "Total jobs", value: stats.total, icon: Briefcase, cls: "text-sky-600 bg-sky-50" },
    { label: "Healthy", value: stats.active, icon: CheckCircle2, cls: "text-emerald-600 bg-emerald-50" },
    { label: "Queued", value: stats.pending, icon: Clock, cls: "text-amber-600 bg-amber-50" },
    { label: "Failed", value: stats.failed, icon: AlertTriangle, cls: "text-rose-600 bg-rose-50" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-[var(--text-main)]">Dashboard</h1>
        <p className="text-sm text-[var(--text-muted)] mt-0.5">Welcome back, {username}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c, i) => (
          <div key={i} className="card p-4 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${c.cls}`}>
              <c.icon size={18} />
            </div>
            <div>
              <p className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-wide">{c.label}</p>
              <p className="text-xl font-semibold text-[var(--text-main)] leading-tight">{c.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-1 space-y-3">
          <h2 className="text-sm font-semibold text-[var(--text-main)]">Create job</h2>
          <JobForm onJobCreated={() => setRefresh(r => r + 1)} />
        </div>
        <div className="xl:col-span-2 space-y-3">
          <h2 className="text-sm font-semibold text-[var(--text-main)]">Recent jobs</h2>
          <JobList refresh={refresh} />
        </div>
      </div>
    </div>
  );
}
