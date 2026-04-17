import { useState, useEffect, useCallback } from "react";
import { getJobsByType, createJob, getJobHistory, deleteJob, pauseJob, resumeJob } from "../api/jobs";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Plus, CheckCircle2, AlertCircle, Play, Pause, Trash2, Clock, Activity, ChevronDown, ChevronUp, X } from "lucide-react";

export default function UptimeMonitor() {
  const [monitors, setMonitors] = useState([]);
  const [histories, setHistories] = useState({});
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [interval, setInterval_] = useState(5);
  const [loading, setLoading] = useState(true);
  const [selectedMonitor, setSelectedMonitor] = useState(null);

  const fetchMonitors = useCallback(async () => {
    try {
      const data = await getJobsByType("HEALTH_CHECK");
      setMonitors(data);
      const histMap = {};
      for (const m of data) {
        try {
          const h = await getJobHistory(m.id);
          histMap[m.id] = h.slice(0, 100);
        } catch { histMap[m.id] = []; }
      }
      setHistories(histMap);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMonitors();
    const timer = window.setInterval(fetchMonitors, 15000);
    return () => window.clearInterval(timer);
  }, [fetchMonitors]);

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await createJob({
        name, url, method: "GET", jobType: "HEALTH_CHECK",
        recurring: true, intervalMinutes: parseInt(interval),
        maxConsecutiveFailures: 100, maxRetries: 0
      });
      setName(""); setUrl(""); setShowAdd(false);
      fetchMonitors();
    } catch (err) { alert(err.message); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this monitor?")) return;
    try { await deleteJob(id); fetchMonitors(); }
    catch (err) { alert(err.message); }
  };

  const handleTogglePause = async (mon) => {
    try {
      if (mon.status === 'PAUSED') await resumeJob(mon.id);
      else await pauseJob(mon.id);
      fetchMonitors();
    } catch (err) { alert(err.message); }
  };

  const getUptime = (id) => {
    const hist = histories[id] || [];
    if (!hist.length) return "100.0";
    const successCount = hist.filter(h => h.status === "SUCCESS").length;
    return ((successCount / hist.length) * 100).toFixed(1);
  };

  const getChartData = (id) => {
    const hist = histories[id] || [];
    return hist.slice().reverse().map(h => ({
      time: new Date(h.executedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      ms: h.status === 'FAILED' ? 0 : (h.responseTimeMs || 0),
      status: h.status
    }));
  };

  if (loading) return (
    <div className="flex items-center justify-center py-16">
      <div className="w-6 h-6 border-2 border-sky-200 border-t-sky-600 rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setShowAdd(true)} className="btn-primary">
          <Plus size={16} /> New monitor
        </button>
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setShowAdd(false)}>
          <div className="bg-white border border-[var(--border-color)] rounded-xl shadow-xl max-w-md w-full p-5" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-semibold text-[var(--text-main)]">Add monitor</h3>
              <button onClick={() => setShowAdd(false)} className="p-1.5 hover:bg-[var(--bg-surface)] rounded-md"><X size={16} /></button>
            </div>
            <form onSubmit={handleAdd} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-[var(--text-muted)]">Service name</label>
                <input placeholder="Production API" value={name} onChange={e => setName(e.target.value)} required />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-[var(--text-muted)]">Health URL</label>
                <input type="url" placeholder="https://api.myapp.com/health" value={url} onChange={e => setUrl(e.target.value)} required />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-[var(--text-muted)]">Check interval</label>
                <select value={interval} onChange={e => setInterval_(e.target.value)}>
                  <option value="1">Every minute</option>
                  <option value="5">Every 5 minutes</option>
                  <option value="15">Every 15 minutes</option>
                  <option value="60">Hourly</option>
                </select>
              </div>
              <button type="submit" className="btn-primary w-full py-2.5">Start monitoring</button>
            </form>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {monitors.map(mon => {
          const uptime = getUptime(mon.id);
          const history = histories[mon.id] || [];
          const chartData = getChartData(mon.id);
          const isPaused = mon.status === 'PAUSED';
          const isDown = mon.status === 'FAILED';
          const isExpanded = selectedMonitor === mon.id;

          return (
            <div key={mon.id} className={`card overflow-hidden ${isExpanded ? 'ring-1 ring-sky-200' : ''}`}>
              <div className="p-4 flex items-center justify-between cursor-pointer" onClick={() => setSelectedMonitor(isExpanded ? null : mon.id)}>
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${isDown ? 'bg-red-500' : isPaused ? 'bg-gray-300' : 'bg-emerald-500'}`}></div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[var(--text-main)] truncate">{mon.name}</p>
                    <p className="text-xs text-[var(--text-muted)] truncate">{mon.url}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6 shrink-0">
                  <div className="text-right hidden md:block">
                    <p className="text-[10px] font-medium text-[var(--text-muted)] uppercase">Uptime</p>
                    <p className={`text-sm font-semibold ${Number(uptime) >= 99 ? 'text-emerald-600' : 'text-amber-500'}`}>{uptime || '0'}%</p>
                  </div>
                  <div className="text-right hidden md:block">
                    <p className="text-[10px] font-medium text-[var(--text-muted)] uppercase">Latency</p>
                    <p className="text-sm font-semibold text-[var(--text-main)]">{history[0]?.responseTimeMs || '0'}ms</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={(e) => { e.stopPropagation(); handleTogglePause(mon); }} className="p-1.5 rounded-md text-[var(--text-muted)] hover:bg-[var(--bg-surface)]">
                      {isPaused ? <Play size={14} /> : <Pause size={14} />}
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(mon.id); }} className="p-1.5 rounded-md text-[var(--text-muted)] hover:bg-red-50 hover:text-red-500">
                      <Trash2 size={14} />
                    </button>
                    {isExpanded ? <ChevronUp size={14} className="text-[var(--text-muted)] ml-1" /> : <ChevronDown size={14} className="text-[var(--text-muted)] ml-1" />}
                  </div>
                </div>
              </div>

              {isExpanded && (
                <div className="px-4 pb-4 border-t border-[var(--border-color)] bg-[var(--bg-surface)]">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-4">
                    <div className="lg:col-span-2">
                      <p className="text-[10px] font-medium text-[var(--text-muted)] uppercase mb-2">Response time</p>
                      <div className="h-40 w-full bg-white rounded-lg border border-[var(--border-color)] p-2">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={chartData}>
                            <defs>
                              <linearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#0284c7" stopOpacity={0.08}/>
                                <stop offset="95%" stopColor="#0284c7" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                            <XAxis dataKey="time" hide />
                            <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#9ca3af'}} />
                            <Tooltip contentStyle={{borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)'}} />
                            <Area type="monotone" dataKey="ms" stroke="#0284c7" fill="url(#fill)" strokeWidth={1.5} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] font-medium text-[var(--text-muted)] uppercase mb-2">Recent checks</p>
                      <div className="space-y-1.5">
                        {history.slice(0, 6).map(h => (
                          <div key={h.id} className="flex items-center justify-between p-2 rounded-md bg-white border border-[var(--border-color)]">
                            <div className="flex items-center gap-2">
                              <div className={`w-1.5 h-1.5 rounded-full ${h.status === 'SUCCESS' ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                              <span className="text-[11px] text-[var(--text-main)]">{new Date(h.executedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <span className="text-[11px] font-mono text-[var(--text-muted)]">{h.responseTimeMs || 0}ms</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {monitors.length === 0 && (
          <div className="text-center py-14 card">
            <Activity className="mx-auto text-gray-200 mb-3" size={36} />
            <p className="text-sm text-[var(--text-muted)]">No monitors configured</p>
          </div>
        )}
      </div>
    </div>
  );
}
