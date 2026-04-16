import { useState, useEffect, useCallback } from "react";
import { getJobsByType, createJob, deleteJob } from "../api/jobs";
import { Plus, Trash2, Calendar, BookOpen, Layers, X, Clock, BarChart } from "lucide-react";
import AttendanceStats from "./AttendanceStats";

export default function AttendanceTracker() {
  const [trackers, setTrackers] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [subjects, setSubjects] = useState("");
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  const fetchTrackers = useCallback(async () => {
    try {
      const data = await getJobsByType("ATTENDANCE_TRACKER");
      setTrackers(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchTrackers(); }, [fetchTrackers]);

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      const subjectList = subjects.split(",").map(s => s.trim()).filter(s => s);
      await createJob({
        name, jobType: "ATTENDANCE_TRACKER", recurring: true,
        intervalMinutes: 1440, timetableJson: JSON.stringify(subjectList),
        url: "http://internal-attendance", method: "GET"
      });
      setName(""); setSubjects(""); setShowAdd(false);
      fetchTrackers();
    } catch (err) { alert(err.message); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Stop tracking?")) return;
    try { await deleteJob(id); fetchTrackers(); }
    catch (err) { alert(err.message); }
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
          <Plus size={16} /> New tracker
        </button>
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setShowAdd(false)}>
          <div className="bg-white border border-[var(--border-color)] rounded-xl shadow-xl max-w-md w-full p-5" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-semibold text-[var(--text-main)]">New attendance tracker</h3>
              <button onClick={() => setShowAdd(false)} className="p-1.5 hover:bg-[var(--bg-surface)] rounded-md"><X size={16} /></button>
            </div>
            <form onSubmit={handleAdd} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-[var(--text-muted)]">Course / semester</label>
                <input placeholder="Computer Science — Sem 4" value={name} onChange={e => setName(e.target.value)} required />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-[var(--text-muted)]">Subjects (comma separated)</label>
                <input placeholder="OS, DBMS, Networks" value={subjects} onChange={e => setSubjects(e.target.value)} required />
              </div>
              <button type="submit" className="btn-primary w-full py-2.5">Create tracker</button>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {trackers.map(t => {
          const timetable = JSON.parse(t.timetableJson || "[]");
          return (
            <div key={t.id} className="card p-5 flex flex-col">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-md bg-sky-50 text-sky-600 flex items-center justify-center">
                    <Calendar size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[var(--text-main)]">{t.name}</p>
                    <p className="text-[10px] text-emerald-600 font-medium uppercase">Active</p>
                  </div>
                </div>
                <button onClick={() => handleDelete(t.id)} className="p-1.5 text-[var(--text-muted)] hover:text-red-500 hover:bg-red-50 rounded-md transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5 my-3">
                {timetable.map(s => (
                  <span key={s} className="px-2 py-0.5 bg-[var(--bg-surface)] text-[var(--text-muted)] rounded text-[11px] font-medium border border-[var(--border-color)]">
                    {s}
                  </span>
                ))}
              </div>

              <div className="mt-auto pt-3 border-t border-[var(--border-color)] flex items-center justify-between">
                <span className="text-[11px] text-[var(--text-muted)] flex items-center gap-1">
                  <Clock size={11} /> Report in {7 - (t.runsCount % 7)}d
                </span>
                <button
                  onClick={() => setExpandedId(expandedId === t.id ? null : t.id)}
                  className={`text-[11px] font-medium flex items-center gap-1 transition-colors ${expandedId === t.id ? 'text-red-500' : 'text-[var(--accent-text)]'}`}
                >
                  <BarChart size={11} />
                  {expandedId === t.id ? 'Close' : 'Stats'}
                </button>
              </div>

              {expandedId === t.id && <AttendanceStats jobId={t.id} />}
            </div>
          );
        })}

        {trackers.length === 0 && (
          <div className="col-span-full text-center py-14 card">
            <p className="text-sm text-[var(--text-muted)]">No attendance trackers yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
