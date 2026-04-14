import { useState, useEffect, useCallback } from "react";
import { getJobsByType, createJob, deleteJob } from "../api/jobs";

export default function AttendanceTracker() {
  const [trackers, setTrackers] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [subjects, setSubjects] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchTrackers = useCallback(async () => {
    try {
      const data = await getJobsByType("ATTENDANCE_TRACKER");
      setTrackers(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchTrackers();
  }, [fetchTrackers]);

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      const subjectList = subjects.split(",").map(s => s.trim()).filter(s => s);
      await createJob({
        name,
        jobType: "ATTENDANCE_TRACKER",
        recurring: true,
        intervalMinutes: 1440,
        timetableJson: JSON.stringify(subjectList),
        url: "http://internal-attendance",
        method: "GET"
      });
      setName("");
      setSubjects("");
      setShowAdd(false);
      fetchTrackers();
    } catch (err) { alert(err.message); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Stop tracking this attendance?")) return;
    try {
      await deleteJob(id);
      fetchTrackers();
    } catch (err) { alert(err.message); }
  };

  if (loading) return <div>Loading trackers...</div>;

  return (
    <div className="max-w-6xl mx-auto px-4">
      <div className="flex justify-between items-end mb-10">
        <div>
          <h2 className="text-4xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <span className="w-3 h-10 bg-indigo-500 rounded-full"></span>
            Attendance tracker
          </h2>
          <p className="text-gray-500 mt-2 font-medium">Daily check-ins & Weekly performance reports.</p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-8 rounded-2xl transition-all shadow-xl"
        >
          {showAdd ? "Close" : "Start Tracking"}
        </button>
      </div>

      {showAdd && (
        <div className="bg-white rounded-[2rem] shadow-2xl border border-gray-100 p-10 mb-12 animate-in slide-in-from-top duration-300">
          <form onSubmit={handleAdd} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-black text-gray-400 uppercase tracking-widest mb-3">Semester/Course Name</label>
                <input
                  className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
                  placeholder="Spring 2024"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-black text-gray-400 uppercase tracking-widest mb-3">Subjects (Comma Separated)</label>
                <input
                  className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
                  placeholder="Math, Physics, Chemistry"
                  value={subjects}
                  onChange={e => setSubjects(e.target.value)}
                  required
                />
              </div>
            </div>
            <button type="submit" className="w-full bg-gray-900 text-white font-black py-4 rounded-2xl">
              INITIALIZE TRACKER
            </button>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {trackers.map(t => (
          <div key={t.id} className="bg-white rounded-[2rem] p-8 shadow-xl border border-gray-100 hover:shadow-2xl transition-all group">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-2xl font-black text-gray-900">{t.name}</h3>
                <p className="text-indigo-500 font-bold text-sm mt-1">Daily cycle active</p>
              </div>
              <button
                onClick={() => handleDelete(t.id)}
                className="p-3 bg-red-50 text-red-500 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            </div>

            <div className="flex flex-wrap gap-2 mb-8">
              {JSON.parse(t.timetableJson || "[]").map(s => (
                <span key={s} className="px-4 py-2 bg-gray-50 text-gray-600 rounded-xl text-xs font-black uppercase tracking-wider border border-gray-100">
                  {s}
                </span>
              ))}
            </div>

            <div className="flex items-center justify-between p-4 bg-indigo-50 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                  <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                </div>
                <div className="text-xs font-black text-indigo-900 uppercase">Weekly Report due in {7 - (t.runsCount % 7)} days</div>
              </div>
              <div className="w-2 h-2 bg-indigo-600 rounded-full animate-ping"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
