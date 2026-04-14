import { useEffect, useState } from "react";
import { getJobs, getJobHistory, deleteJob, pauseJob, resumeJob } from "../api/jobs";

export default function JobList({ refresh }) {
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchJobs = async () => {
    try {
      const all = await getJobs();
      setJobs(all.filter(j => (j.jobType || "HTTP") === "HTTP"));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
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
    if (!window.confirm("Are you sure?")) return;
    try {
      await deleteJob(id);
      fetchJobs();
    } catch (err) { alert(err.message); }
  };

  const handleToggleStatus = async (job) => {
    try {
      if (job.status === 'PAUSED') await resumeJob(job.id);
      else await pauseJob(job.id);
      fetchJobs();
    } catch (err) { alert(err.message); }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 pb-20">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-black text-gray-900 tracking-tight">Active Jobs</h2>
        <span className="bg-indigo-100 text-indigo-700 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
          {jobs.length} Total
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {jobs.map((job) => (
          <div key={job.id} className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden hover:scale-[1.02] transition-all group">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                 <div className={`p-3 rounded-2xl ${job.status === 'PAUSED' ? 'bg-gray-100' : 'bg-indigo-50 text-indigo-600'}`}>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                 </div>
                 <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleToggleStatus(job)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500">
                       {job.status === 'PAUSED' ? (
                         <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
                       ) : (
                         <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                       )}
                    </button>
                    <button onClick={() => handleDelete(job.id)} className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-500">
                       <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                 </div>
              </div>
              
              <h3 className="text-xl font-black text-gray-900 mb-1 truncate px-1">{job.name}</h3>
              <p className="text-xs font-bold text-gray-400 font-mono mb-6 truncate px-1 uppercase tracking-tighter opacity-60">{job.url}</p>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 rounded-2xl p-3 border border-gray-100">
                  <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Status</div>
                  <div className={`text-xs font-black uppercase ${
                    job.status === 'SUCCESS' ? 'text-green-600' : 
                    job.status === 'FAILED' ? 'text-red-500' : 
                    job.status === 'RETRYING' ? 'text-amber-500 animate-pulse' : 
                    'text-indigo-500'
                  }`}>{job.status}</div>
                </div>
                <div className="bg-gray-50 rounded-2xl p-3 border border-gray-100">
                  <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Retries</div>
                  <div className="text-xs font-black text-gray-900">{job.retries} / {job.maxRetries}</div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="text-[10px] font-bold text-gray-400 font-mono">ID: {job.id.toString().slice(0, 8)}...</div>
                <button 
                  onClick={() => viewHistory(job)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-black py-3 px-6 rounded-2xl transition-all shadow-lg shadow-indigo-100 text-xs"
                >
                  DETAILS
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedJob && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col scale-100">
            <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div>
                <h3 className="text-2xl font-black text-gray-900">{selectedJob.name}</h3>
                <div className="mt-2 text-[10px] font-black uppercase tracking-wider text-indigo-500 flex items-center gap-4">
                  <span>Failures: {selectedJob.consecutiveFailures} / {selectedJob.maxConsecutiveFailures}</span>
                  <span className="text-gray-300">|</span>
                  <span>Retries: {selectedJob.retries} / {selectedJob.maxRetries}</span>
                  <span className="text-gray-300">|</span>
                  <span>Runs: {selectedJob.runsCount} / {selectedJob.maxRuns || '∞'}</span>
                </div>
              </div>
              <button onClick={() => setSelectedJob(null)} className="p-3 hover:bg-gray-200 rounded-2xl transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 space-y-4">
              {!history.length ? (
                <div className="text-center py-20 text-gray-300 font-bold italic">No log entries found.</div>
              ) : (
                history.map(exec => (
                  <div key={exec.id} className="border border-gray-100 rounded-[1.5rem] p-6 bg-gray-50/50">
                    <div className="flex justify-between items-start mb-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                        exec.status === 'SUCCESS' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {exec.status}
                      </span>
                      <span className="text-[10px] font-bold text-gray-400">{new Date(exec.executedAt).toLocaleString()}</span>
                    </div>
                    <div className="bg-gray-900 rounded-2xl p-5 text-green-400 font-mono text-xs overflow-x-auto shadow-inner">
                      <pre className="whitespace-pre-wrap">{exec.result || "No data returned"}</pre>
                    </div>
                    <div className="mt-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Duration: {exec.durationMs}ms</div>
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
