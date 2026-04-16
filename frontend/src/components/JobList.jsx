import { useEffect, useState } from "react";
import { getJobs, getJobHistory, deleteJob, pauseJob, resumeJob } from "../api/jobs";
import { Play, Pause, Trash2, Globe, ChevronRight, X, Clock } from "lucide-react";

export default function JobList({ refresh }) {
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchJobs = async () => {
    try {
      const all = await getJobs();
      const jobList = Array.isArray(all) ? all : [];
      setJobs(jobList.filter(j => (j.jobType || "HTTP") === "HTTP"));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 10000);
    return () => clearInterval(interval);
  }, [refresh]);

  const viewHistory = async (job) => {
    setSelectedJob(job);
    try {
      const data = await getJobHistory(job.id);
      setHistory(data);
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this job?")) return;
    try { await deleteJob(id); fetchJobs(); }
    catch (err) { alert(err.message); }
  };

  const handleToggleStatus = async (job) => {
    try {
      if (job.status === 'PAUSED') await resumeJob(job.id);
      else await pauseJob(job.id);
      fetchJobs();
    } catch (err) { alert(err.message); }
  };

  const statusBadge = (status) => {
    const map = {
      SUCCESS: "badge-success",
      FAILED: "badge-danger",
      RETRYING: "badge-warning",
      PAUSED: "badge-neutral",
      PENDING: "badge-info",
      RUNNING: "badge-info",
    };
    return map[status] || "badge-neutral";
  };

  if (loading) return (
    <div className="flex items-center justify-center py-12">
      <div className="w-6 h-6 border-2 border-sky-200 border-t-sky-600 rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="space-y-3">
      {jobs.map((job) => (
        <div key={job.id} className="card p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 ${job.status === 'PAUSED' ? 'bg-gray-100 text-gray-400' : 'bg-sky-50 text-sky-600'}`}>
              <Globe size={16} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-[var(--text-main)] truncate">{job.name}</p>
              <p className="text-xs text-[var(--text-muted)] truncate">{job.url}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className={`badge ${statusBadge(job.status)}`}>{job.status}</span>
            <div className="flex items-center gap-1">
              <button onClick={() => handleToggleStatus(job)} className="p-1.5 rounded-md text-[var(--text-muted)] hover:bg-[var(--bg-surface)] transition-colors">
                {job.status === 'PAUSED' ? <Play size={14} /> : <Pause size={14} />}
              </button>
              <button onClick={() => viewHistory(job)} className="p-1.5 rounded-md text-[var(--text-muted)] hover:bg-[var(--bg-surface)] transition-colors">
                <ChevronRight size={14} />
              </button>
              <button onClick={() => handleDelete(job.id)} className="p-1.5 rounded-md text-[var(--text-muted)] hover:bg-red-50 hover:text-red-500 transition-colors">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        </div>
      ))}

      {jobs.length === 0 && (
        <div className="text-center py-10 card">
          <p className="text-sm text-[var(--text-muted)]">No jobs yet</p>
        </div>
      )}

      {selectedJob && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setSelectedJob(null)}>
          <div className="bg-white border border-[var(--border-color)] rounded-xl shadow-xl max-w-xl w-full max-h-[75vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-[var(--border-color)] flex justify-between items-center">
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-main)]">{selectedJob.name}</h3>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">Execution log</p>
              </div>
              <button onClick={() => setSelectedJob(null)} className="p-1.5 hover:bg-[var(--bg-surface)] rounded-md">
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {history.length === 0 ? (
                <p className="text-center py-8 text-sm text-[var(--text-muted)]">No executions yet</p>
              ) : (
                history.map(exec => (
                  <div key={exec.id} className="p-3 border border-[var(--border-color)] rounded-lg bg-[var(--bg-surface)]">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`badge ${statusBadge(exec.status)}`}>{exec.status}</span>
                        <span className="text-[11px] text-[var(--text-muted)] flex items-center gap-1">
                          <Clock size={10} />
                          {new Date(exec.executedAt).toLocaleString()}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-[var(--text-muted)]">{exec.durationMs}ms</span>
                    </div>
                    <pre className="bg-[#1e1e2e] text-gray-300 p-3 rounded-md text-xs font-mono overflow-x-auto whitespace-pre-wrap">{exec.result || "No output"}</pre>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
