import React, { useState, useEffect } from "react";
import { getAttendanceStats } from "../api/jobs";

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

  if (records.length === 0) return <p className="py-3 text-center text-xs text-[var(--text-muted)]">No records yet</p>;

  return (
    <div className="space-y-2.5 mt-4 pt-3 border-t border-[var(--border-color)]">
      {subjects.map(subject => {
        const subRecords = records.filter(r => r.subject === subject);
        const presentCount = subRecords.filter(r => r.attended).length;
        const pct = subRecords.length > 0 ? (presentCount / subRecords.length) * 100 : 0;

        return (
          <div key={subject}>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-medium text-[var(--text-main)]">{subject}</span>
              <span className={`text-xs font-semibold ${pct >= 75 ? 'text-emerald-600' : 'text-rose-500'}`}>
                {pct.toFixed(0)}%
              </span>
            </div>
            <div className="w-full h-1.5 bg-[var(--bg-surface)] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${pct >= 75 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                style={{ width: `${pct}%` }}
              ></div>
            </div>
            <p className="text-[10px] text-[var(--text-muted)] mt-0.5">{presentCount} of {subRecords.length} sessions</p>
          </div>
        );
      })}
    </div>
  );
}
