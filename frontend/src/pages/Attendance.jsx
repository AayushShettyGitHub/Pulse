import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { getJob, markAttendance } from "../api/jobs";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Zap, UserCheck, Clock, ArrowLeft } from "lucide-react";

export default function Attendance() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const jobId = searchParams.get("id");
  const [jobName, setJobName] = useState("");
  const [subjects, setSubjects] = useState([]);
  const [status, setStatus] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function fetchTimetable() {
      try {
        const job = await getJob(jobId);
        setJobName(job.name || "");
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
    setSubmitting(true);
    try {
      const records = subjects.map(s => ({ subject: s, attended: status[s] }));
      await markAttendance(jobId, records);
      setSubmitted(true);
    } catch (err) {
      alert("Failed: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const presentCount = Object.values(status).filter(Boolean).length;
  const totalCount = subjects.length;
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-surface)" }}>
      <div style={{ width: "1.5rem", height: "1.5rem", border: "2px solid var(--border-color)", borderTopColor: "var(--accent)", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (submitted) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-surface)", padding: "1rem" }}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="card" 
        style={{ padding: "2.5rem", maxWidth: "22rem", width: "100%", textAlign: "center" }}
      >
        <div style={{ width: "4rem", height: "4rem", background: "#dcfce7", color: "#16a34a", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem" }}>
          <CheckCircle2 size={28} />
        </div>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "0.5rem" }}>All Done!</h2>
        <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>
          Attendance recorded for {presentCount} of {totalCount} sessions.
        </p>
        <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "1.5rem" }}>{today}</p>
        <button onClick={() => navigate("/")} className="btn-primary" style={{ width: "100%", padding: "0.75rem", borderRadius: "0.75rem" }}>
          <ArrowLeft size={16} style={{ marginRight: "0.5rem" }} />
          Back to Dashboard
        </button>
      </motion.div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-surface)", padding: "2.5rem 1rem" }}>
      <div style={{ maxWidth: "28rem", margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ width: "3rem", height: "3rem", borderRadius: "0.75rem", background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1rem", boxShadow: "0 4px 12px rgba(2,132,199,0.3)" }}>
            <Zap size={22} style={{ color: "#fff", fill: "#fff" }} />
          </div>
          <h1 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-main)" }}>Daily Check-in</h1>
          {jobName && <p style={{ fontSize: "0.8125rem", color: "var(--accent)", fontWeight: 600, marginTop: "0.25rem" }}>{jobName}</p>}
          <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", marginTop: "0.5rem", color: "var(--text-muted)", fontSize: "0.75rem" }}>
            <Clock size={12} />
            <span>{today}</span>
          </div>
        </div>

        {/* Summary Bar */}
        <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem" }}>
          <div className="card" style={{ flex: 1, padding: "0.875rem 1rem", textAlign: "center" }}>
            <p style={{ fontSize: "1.25rem", fontWeight: 700, color: "#16a34a" }}>{presentCount}</p>
            <p style={{ fontSize: "0.625rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.05em" }}>Present</p>
          </div>
          <div className="card" style={{ flex: 1, padding: "0.875rem 1rem", textAlign: "center" }}>
            <p style={{ fontSize: "1.25rem", fontWeight: 700, color: "#dc2626" }}>{totalCount - presentCount}</p>
            <p style={{ fontSize: "0.625rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.05em" }}>Absent</p>
          </div>
          <div className="card" style={{ flex: 1, padding: "0.875rem 1rem", textAlign: "center" }}>
            <p style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-main)" }}>{totalCount}</p>
            <p style={{ fontSize: "0.625rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.05em" }}>Total</p>
          </div>
        </div>

        {/* Subject List */}
        <div className="card" style={{ overflow: "hidden" }}>
          <div style={{ padding: "0.875rem 1.25rem", borderBottom: "1px solid var(--border-color)", background: "var(--bg-surface)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <p style={{ fontSize: "0.6875rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Sessions</p>
            <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
              <UserCheck size={12} style={{ color: "var(--text-muted)" }} />
              <span style={{ fontSize: "0.6875rem", color: "var(--text-muted)", fontWeight: 600 }}>{presentCount}/{totalCount}</span>
            </div>
          </div>
          <div>
            {subjects.map((s, i) => (
              <motion.div
                key={s}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => setStatus({...status, [s]: !status[s]})}
                style={{ 
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "0.875rem 1.25rem", cursor: "pointer",
                  borderBottom: i < subjects.length - 1 ? "1px solid var(--border-color)" : "none",
                  transition: "background 0.15s",
                  background: status[s] ? "rgba(22,163,74,0.03)" : "transparent"
                }}
                onMouseEnter={e => e.currentTarget.style.background = status[s] ? "rgba(22,163,74,0.06)" : "var(--bg-surface)"}
                onMouseLeave={e => e.currentTarget.style.background = status[s] ? "rgba(22,163,74,0.03)" : "transparent"}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <div style={{ 
                    width: "1.5rem", height: "1.5rem", borderRadius: "0.375rem",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.2s",
                    ...(status[s] 
                      ? { background: "#16a34a", color: "#fff", border: "none", boxShadow: "0 2px 6px rgba(22,163,74,0.3)" }
                      : { background: "#fff", border: "1.5px solid var(--border-color)" }
                    )
                  }}>
                    {status[s] && <CheckCircle2 size={14} />}
                  </div>
                  <span style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--text-main)" }}>{s}</span>
                </div>
                <span style={{ 
                  fontSize: "0.6875rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.02em",
                  padding: "0.125rem 0.5rem", borderRadius: "9999px",
                  ...(status[s]
                    ? { color: "#16a34a", background: "#dcfce7" }
                    : { color: "#dc2626", background: "#fef2f2" }
                  )
                }}>
                  {status[s] ? "Present" : "Absent"}
                </span>
              </motion.div>
            ))}
          </div>
          <div style={{ padding: "1rem 1.25rem", borderTop: "1px solid var(--border-color)" }}>
            <button 
              onClick={handleSubmit} 
              disabled={submitting}
              className="btn-primary" 
              style={{ width: "100%", padding: "0.75rem", borderRadius: "0.75rem", fontSize: "0.875rem", fontWeight: 600, opacity: submitting ? 0.6 : 1 }}
            >
              {submitting ? "Submitting..." : "Submit Attendance"}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
