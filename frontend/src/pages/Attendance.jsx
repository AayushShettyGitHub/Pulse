import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { getJob, markAttendance } from "../api/jobs";
import { CheckCircle2, Zap } from "lucide-react";

export default function Attendance() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const jobId = searchParams.get("id");
  const [subjects, setSubjects] = useState([]);
  const [status, setStatus] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    async function fetchTimetable() {
      try {
        const job = await getJob(jobId);
        const list = JSON.parse(job.timetableJson || "[]");
        setSubjects(list);
        const init = {};
        list.forEach(s => init[s] = true);
        setStatus(init);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    if (jobId) fetchTimetable();
  }, [jobId]);

  const handleSubmit = async () => {
    try {
      const records = subjects.map(s => ({ subject: s, attended: status[s] }));
      await markAttendance(jobId, records);
      setSubmitted(true);
    } catch (err) {
      alert("Failed: " + err.message);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-[var(--bg-surface)]">
      <div className="w-6 h-6 border-2 border-sky-200 border-t-sky-600 rounded-full animate-spin"></div>
    </div>
  );

  if (submitted) return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-surface)] px-4">
      <div className="card p-8 max-w-xs w-full text-center">
        <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 size={24} />
        </div>
        <h2 className="text-lg font-semibold text-[var(--text-main)] mb-1">Submitted</h2>
        <p className="text-sm text-[var(--text-muted)] mb-6">Attendance recorded successfully.</p>
        <button onClick={() => navigate("/")} className="btn-primary w-full py-2.5">Go to dashboard</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--bg-surface)] py-10 px-4">
      <div className="max-w-md mx-auto">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-10 h-10 rounded-lg bg-sky-600 flex items-center justify-center mb-3">
            <Zap size={20} className="text-white" />
          </div>
          <h1 className="text-lg font-semibold text-[var(--text-main)]">Daily check-in</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">Mark your attendance for today</p>
        </div>

        <div className="card overflow-hidden">
          <div className="p-4 border-b border-[var(--border-color)] bg-[var(--bg-surface)]">
            <p className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-wide">Sessions</p>
          </div>
          <div className="divide-y divide-[var(--border-color)]">
            {subjects.map(s => (
              <div
                key={s}
                onClick={() => setStatus({...status, [s]: !status[s]})}
                className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-[var(--bg-surface)]/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${
                    status[s] ? 'bg-sky-600 text-white' : 'border border-[var(--border-color)] bg-white'
                  }`}>
                    {status[s] && <CheckCircle2 size={14} />}
                  </div>
                  <span className="text-sm font-medium text-[var(--text-main)]">{s}</span>
                </div>
                <span className={`text-[10px] font-semibold uppercase ${status[s] ? 'text-emerald-600' : 'text-[var(--text-muted)]'}`}>
                  {status[s] ? 'Present' : 'Absent'}
                </span>
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-[var(--border-color)]">
            <button onClick={handleSubmit} className="btn-primary w-full py-2.5">
              Submit attendance
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
