import React, { useState, useEffect } from "react";
import { getAttendanceStats } from "../api/jobs";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AttendanceStats({ jobId }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getAttendanceStats(jobId);
        setRecords(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [jobId]);

  if (loading) return <p className="py-3 text-center text-xs text-[var(--text-muted)]">Loading stats...</p>;

  const subjects = [...new Set(records.map(r => r.subject))];
  
  // Group records by date for the trend chart
  const dateGroups = records.reduce((acc, r) => {
    const dateStr = r.date;
    if (!acc[dateStr]) acc[dateStr] = { date: dateStr, present: 0, total: 0 };
    acc[dateStr].total += 1;
    if (r.attended) acc[dateStr].present += 1;
    return acc;
  }, {});

  const trendData = Object.values(dateGroups)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map(d => ({
      date: new Date(d.date).toLocaleDateString([], { month: 'short', day: 'numeric' }),
      percentage: Math.round((d.present / d.total) * 100)
    }));

  if (records.length === 0) return <p className="py-3 text-center text-xs text-[var(--text-muted)]">No records yet</p>;

  const last30DaysData = Object.values(dateGroups)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(-30);

  return (
    <div className="space-y-6 mt-4 pt-4 border-t border-[var(--border-color)]">
      {/* Attendance Heatmap */}
      <div>
        <p className="text-[10px] font-medium text-[var(--text-muted)] uppercase mb-3 tracking-wider">Consistency Grid (Last 30 Days)</p>
        <div className="flex flex-wrap gap-1.5 p-3 bg-[var(--bg-surface)] rounded-lg border border-[var(--border-color)]">
          {last30DaysData.map((d, i) => {
            const pct = (d.present / d.total);
            const color = pct === 1 ? 'bg-emerald-600' : pct >= 0.5 ? 'bg-emerald-400' : pct > 0 ? 'bg-amber-400' : 'bg-rose-500';
            return (
              <div 
                key={i} 
                title={`${d.date}: ${d.present}/${d.total} attended`}
                className={`w-3.5 h-3.5 rounded-sm ${color} cursor-help transition-transform hover:scale-125`}
              ></div>
            );
          })}
          {Array.from({ length: Math.max(0, 30 - last30DaysData.length) }).map((_, i) => (
            <div key={`empty-${i}`} className="w-3.5 h-3.5 rounded-sm bg-gray-100"></div>
          ))}
        </div>
        <div className="flex items-center gap-4 mt-2 px-1">
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-sm bg-rose-500"></div><span className="text-[9px] text-[var(--text-muted)]">None</span></div>
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-sm bg-amber-400"></div><span className="text-[9px] text-[var(--text-muted)]">Partial</span></div>
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-sm bg-emerald-600"></div><span className="text-[9px] text-[var(--text-muted)]">Perfect</span></div>
        </div>
      </div>

      {/* Trend Chart */}
      <div>
        <p className="text-[10px] font-medium text-[var(--text-muted)] uppercase mb-3 tracking-wider">Attendance Trend (%)</p>
        <div className="h-40 w-full bg-[var(--bg-surface)] rounded-lg border border-[var(--border-color)] p-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
              <XAxis dataKey="date" hide />
              <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: 'var(--text-muted)'}} domain={[0, 100]} />
              <Tooltip 
                contentStyle={{borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '11px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)'}}
              />
              <Line type="monotone" dataKey="percentage" stroke="var(--accent)" strokeWidth={2} dot={{r: 3, fill: 'var(--accent)'}} activeDot={{r: 5}} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Progress Bars */}
      <div className="space-y-3">
        <p className="text-[10px] font-medium text-[var(--text-muted)] uppercase mb-2 tracking-wider">Subject-wise Analytics</p>
        {subjects.map(subject => {
          const subRecords = records.filter(r => r.subject === subject);
          const presentCount = subRecords.filter(r => r.attended).length;
          const pct = subRecords.length > 0 ? (presentCount / subRecords.length) * 100 : 0;

          return (
            <div key={subject} className="bg-white p-2 rounded-lg border border-[var(--border-color)]/50">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs font-semibold text-[var(--text-main)]">{subject}</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${pct >= 75 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-500'}`}>
                  {pct.toFixed(0)}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-[var(--bg-surface)] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${pct >= 75 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                  style={{ width: `${pct}%` }}
                ></div>
              </div>
              <div className="flex justify-between mt-1">
                <p className="text-[9px] text-[var(--text-muted)]">{presentCount} attended / {subRecords.length} total</p>
                <p className="text-[9px] font-medium text-[var(--text-muted)]">{pct >= 75 ? 'Safe' : 'Low Attendance'}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

