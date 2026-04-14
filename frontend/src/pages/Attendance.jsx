import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { getJob, markAttendance } from "../api/jobs";

export default function Attendance() {
  const [searchParams] = useSearchParams();
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
        
        const initialStatus = {};
        list.forEach(s => initialStatus[s] = true);
        setStatus(initialStatus);
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
      const records = subjects.map(s => ({
        subject: s,
        attended: status[s]
      }));
      await markAttendance(jobId, records);
      setSubmitted(true);
    } catch (err) {
      alert("Failed to submit: " + err.message);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
    </div>
  );

  if (submitted) return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center">
      <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
      </div>
      <h2 className="text-3xl font-black text-gray-900 mb-2">Success!</h2>
      <p className="text-gray-500 font-bold">Your attendance has been logged.</p>
    </div>
  );

  return (
    <div className="max-w-xl mx-auto py-20 px-4">
      <div className="mb-12">
        <h2 className="text-5xl font-black text-gray-900 tracking-tight mb-4">Daily Check-in</h2>
        <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">Log your lectures for today</p>
      </div>

      <div className="space-y-4">
        {subjects.map(s => (
          <div key={s} 
            onClick={() => setStatus({...status, [s]: !status[s]})}
            className={`flex justify-between items-center p-8 rounded-[2rem] border-2 cursor-pointer transition-all ${
              status[s] ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-gray-100 hover:border-gray-200'
            }`}
          >
            <span className={`text-xl font-black ${status[s] ? 'text-indigo-900' : 'text-gray-900'}`}>{s}</span>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
              status[s] ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-300'
            }`}>
              {status[s] ? (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
              ) : (
                <div className="w-3 h-3 bg-gray-200 rounded-full"></div>
              )}
            </div>
          </div>
        ))}

        <button 
          onClick={handleSubmit}
          className="w-full mt-10 bg-gray-900 hover:bg-black text-white font-black py-6 rounded-[2rem] shadow-2xl transition-all active:scale-95"
        >
          SAVE ATTENDANCE
        </button>
      </div>
    </div>
  );
}
