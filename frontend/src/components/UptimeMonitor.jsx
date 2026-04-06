import { useState, useEffect, useCallback } from "react";
import { getJobsByType, createJob, getJobHistory, deleteJob, pauseJob, resumeJob } from "../api/jobs";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Brush } from 'recharts';

export default function UptimeMonitor() {
  const [monitors, setMonitors] = useState([]);
  const [histories, setHistories] = useState({});
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [url, setUr] = useState("");
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
    const timer = window.setInterval(fetchMonitors, 10000);
    return () => window.clearInterval(timer);
  }, [fetchMonitors]);

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await createJob({
        name,
        url,
        method: "GET",
        jobType: "HEALTH_CHECK",
        recurring: true,
        intervalMinutes: parseInt(interval),
        maxConsecutiveFailures: 100,
        maxRetries: 0
      });
      setName("");
      setUr("");
      setShowAdd(false);
      fetchMonitors();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this monitor?")) return;
    try {
      await deleteJob(id);
      fetchMonitors();
    } catch (err) { alert(err.message); }
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
    if (!hist.length) return null;
    const success = hist.filter(h => h.status === "SUCCESS").length;
    return ((success / hist.length) * 100).toFixed(1);
  };

  const getChartData = (id) => {
    const hist = histories[id] || [];
    return hist.slice().reverse().map(h => ({
      time: new Date(h.executedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      fullTime: new Date(h.executedAt).toLocaleString(),
      ms: h.status === 'FAILED' ? 0 : (h.responseTimeMs || 0),
      status: h.status
    }));
  };

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 pb-20">
      <div className="flex justify-between items-end mb-10">
        <div>
          <h2 className="text-4xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <span className="w-3 h-10 bg-green-500 rounded-full"></span>
            Uptime Bot
          </h2>
          <p className="text-gray-500 mt-2 font-medium">Real-time service health & latency metrics.</p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="bg-gray-900 hover:bg-black text-white font-bold py-4 px-8 rounded-2xl transition-all shadow-xl flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
          Add Monitor
        </button>
      </div>

      {showAdd && (
        <div className="bg-white rounded-[2rem] shadow-2xl border border-gray-100 p-10 mb-12">
          <h3 className="text-2xl font-bold text-gray-900 mb-8">Configure New Monitor</h3>
          <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
            <div className="md:col-span-1">
              <label className="block text-sm font-black text-gray-400 uppercase tracking-widest mb-3">Service Name</label>
              <input
                className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-green-500 outline-none transition-all font-bold"
                placeholder="Production API"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-black text-gray-400 uppercase tracking-widest mb-3">Target URL</label>
              <input
                type="url"
                className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-green-500 outline-none transition-all font-bold"
                placeholder="https://api.myapp.com/health"
                value={url}
                onChange={e => setUr(e.target.value)}
                required
              />
            </div>
            <div className="flex gap-4">
               <div className="flex-1">
                <label className="block text-sm font-black text-gray-400 uppercase tracking-widest mb-3">Interval</label>
                <select 
                  className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-green-500 outline-none font-bold"
                  value={interval}
                  onChange={e => setInterval_(e.target.value)}
                >
                  <option value="1">1 min</option>
                  <option value="5">5 min</option>
                  <option value="15">15 min</option>
                  <option value="60">1 hour</option>
                </select>
              </div>
              <button type="submit" className="self-end bg-green-500 hover:bg-green-600 text-white font-black py-4 px-8 rounded-2xl transition-all shadow-lg shadow-green-100">
                START
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        {monitors.map(mon => {
          const uptime = getUptime(mon.id);
          const history = histories[mon.id] || [];
          const chartData = getChartData(mon.id);
          const isPaused = mon.status === 'PAUSED';
          const isDown = mon.status === 'FAILED';

          return (
            <div key={mon.id} className={`group bg-white rounded-[2rem] shadow-xl border-2 transition-all duration-300 ${selectedMonitor === mon.id ? 'border-indigo-500' : 'border-transparent hover:border-gray-200'}`}>
              <div className="p-8 cursor-pointer" onClick={() => setSelectedMonitor(selectedMonitor === mon.id ? null : mon.id)}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-center gap-6">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${
                      isPaused ? 'bg-gray-100' : isDown ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-500'
                    }`}>
                      {isPaused ? (
                        <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                      ) : (
                        <div className={`w-4 h-4 rounded-full ${isDown ? 'bg-red-500' : 'bg-green-500'} animate-ping`}></div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-xl font-black text-gray-900">{mon.name}</h3>
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase ${
                          isPaused ? 'bg-gray-100 text-gray-500' : isDown ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                        }`}>
                          {mon.status}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-gray-400 font-mono mt-1">{mon.url}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-12">
                    <div className="text-center">
                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Uptime</div>
                        <div className={`text-2xl font-black ${uptime >= 99 ? 'text-green-500' : 'text-amber-500'}`}>
                          {uptime || '0'}%
                        </div>
                    </div>
                    <div className="text-center hidden sm:block">
                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Latency</div>
                        <div className="text-2xl font-black text-gray-900">
                          {history[0]?.responseTimeMs || '0'}<span className="text-xs ml-1 text-gray-400">ms</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleTogglePause(mon); }}
                        className="p-3 hover:bg-gray-100 rounded-xl transition-colors text-gray-500"
                      >
                        {isPaused ? <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg> : <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>}
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDelete(mon.id); }}
                        className="p-3 hover:bg-red-50 rounded-xl transition-colors text-red-400"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {selectedMonitor === mon.id && (
                <div className="p-8 border-t-2 border-gray-50 bg-gray-50/30">
                  <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 mb-8">
                      <div className="flex items-center justify-between mb-8 px-4">
                        <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest">Performance Metrics (Last 100 checks)</h4>
                        <div className="flex items-center gap-6">
                           <div className="flex items-center gap-2">
                             <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                             <span className="text-[10px] font-black text-red-500 uppercase">Failed Ping</span>
                           </div>
                           <div className="flex items-center gap-2">
                             <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
                             <span className="text-[10px] font-black text-gray-400 uppercase">Response Time</span>
                           </div>
                        </div>
                      </div>
                      <div className="h-80 w-full px-4">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={chartData}>
                            <defs>
                              <linearGradient id="colorMs" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15}/>
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis 
                               dataKey="time" 
                               axisLine={false} 
                               tickLine={false} 
                               tick={{fontSize: 10, fontWeight: 'bold', fill: '#94a3b8'}} 
                               minTickGap={30}
                            />
                            <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold', fill: '#94a3b8'}} unit="ms" />
                            <Tooltip 
                               contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.25)', fontWeight: 'bold', padding: '16px'}}
                               labelStyle={{marginBottom: '8px', color: '#64748b'}}
                               formatter={(value, name, props) => [
                                 props.payload.status === 'FAILED' ? 'DOWN' : `${value}ms`, 
                                 'Response'
                               ]}
                            />
                            <Area 
                               type="monotone" 
                               dataKey="ms" 
                               stroke="#6366f1" 
                               strokeWidth={3} 
                               fillOpacity={1} 
                               fill="url(#colorMs)" 
                               dot={(props) => {
                                 const { cx, cy, payload } = props;
                                 if (payload.status === 'FAILED') {
                                   return <circle key={payload.fullTime} cx={cx} cy={cy} r={5} fill="#ef4444" stroke="#fff" strokeWidth={2} />;
                                 }
                                 return null;
                               }}
                               activeDot={{ r: 6, strokeWidth: 0 }}
                            />
                            <Brush 
                               dataKey="time" 
                               height={30} 
                               stroke="#e2e8f0" 
                               fill="#f8fafc"
                               traveller={({x, y, width, height}) => (
                                 <rect x={x} y={y} width={width} height={height} rx={4} fill="#6366f1" />
                               )}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  
                  <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">Recent Log Entries</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {history.slice(0, 12).map(h => (
                           <div key={h.id} className="flex justify-between items-center p-4 rounded-2xl bg-gray-50 border border-gray-100 group/item hover:bg-white hover:shadow-md transition-all">
                              <div>
                                <div className={`text-xs font-black ${h.status === 'SUCCESS' ? 'text-gray-900' : 'text-red-500'}`}>
                                    {h.status === 'SUCCESS' ? 'HTTP 200' : 'OFFLINE'}
                                </div>
                                <div className="text-[10px] font-bold text-gray-400">{new Date(h.executedAt).toLocaleString()}</div>
                              </div>
                              <div className={`text-sm font-black ${h.status === 'SUCCESS' ? 'text-green-500' : 'text-red-400 opacity-50'}`}>
                                {h.responseTimeMs || '0'}ms
                              </div>
                            </div>
                        ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!monitors.length && !loading && (
        <div className="text-center py-32 bg-white rounded-[3rem] shadow-xl border-dashed border-4 border-gray-100">
          <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-200">
             <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <h3 className="text-2xl font-black text-gray-900">Ready to monitor?</h3>
          <p className="text-gray-400 mt-2 font-medium">Add your first endpoint to start tracking uptime.</p>
        </div>
      )}
    </div>
  );
}
