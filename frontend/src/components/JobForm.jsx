import { useState } from "react";
import { createJob } from "../api/jobs";

export default function JobForm({ onJobCreated }) {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [method, setMethod] = useState("GET");
  const [payload, setPayload] = useState("");
  const [maxRetries, setMaxRetries] = useState(3);
  const [isRecurring, setIsRecurring] = useState(false);
  const [intervalMinutes, setIntervalMinutes] = useState("");
  const [maxRuns, setMaxRuns] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [startTime, setStartTime] = useState("");
  const [maxConsecutiveFailures, setMaxConsecutiveFailures] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const jobData = {
        name,
        url,
        method,
        payload,
        maxRetries,
        recurring: isRecurring,
        intervalMinutes: isRecurring ? parseInt(intervalMinutes) : null,
        maxRuns: maxRuns ? parseInt(maxRuns) : null,
        endsAt: endsAt ? new Date(endsAt).toISOString() : null,
        startTime: startTime ? new Date(startTime).toISOString() : null,
        maxConsecutiveFailures: parseInt(maxConsecutiveFailures)
      };
      await createJob(jobData);
      setName("");
      setUrl("");
      setMethod("GET");
      setPayload("");
      setMaxRetries(3);
      setIsRecurring(false);
      setIntervalMinutes("");
      setMaxRuns("");
      setEndsAt("");
      setStartTime("");
      setMaxConsecutiveFailures(5);
      onJobCreated();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl mx-auto border border-gray-100">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Schedule New Job
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="col-span-full">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Job Name</label>
            <input 
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
              placeholder="e.g. Daily Data Cleanup"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>

          <div className="col-span-full">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Endpoint URL</label>
            <input 
              type="url"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
              placeholder="https://api.example.com/endpoint"
              value={url}
              onChange={e => setUrl(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">HTTP Method</label>
            <select 
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
              value={method}
              onChange={e => setMethod(e.target.value)}
            >
              <option>GET</option>
              <option>POST</option>
              <option>PUT</option>
              <option>DELETE</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Stop after consecutive fails</label>
            <input 
              type="number"
              min="1"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
              value={maxConsecutiveFailures}
              onChange={e => setMaxConsecutiveFailures(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Start Time (Optional)</label>
            <input 
              type="datetime-local"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
              value={startTime}
              onChange={e => setStartTime(e.target.value)}
            />
          </div>

          <div className="col-span-full">
            <label className="block text-sm font-semibold text-gray-700 mb-2">JSON Payload (Optional)</label>
            <textarea 
              className="w-full px-4 py-3 rounded-xl border border-gray-200 font-mono text-sm h-24 focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder='{"key": "value"}'
              value={payload}
              onChange={e => setPayload(e.target.value)}
            />
          </div>

          <div className="col-span-full flex items-center p-4 bg-indigo-50 rounded-xl">
            <input 
              type="checkbox"
              id="recurring"
              className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
              checked={isRecurring}
              onChange={e => setIsRecurring(e.target.checked)}
            />
            <label htmlFor="recurring" className="ml-3 font-semibold text-indigo-900 cursor-pointer">
              Enable Recurring Execution
            </label>
          </div>

          {isRecurring && (
            <>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Interval (Minutes)</label>
                <input 
                  type="number"
                  min="1"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={intervalMinutes}
                  onChange={e => setIntervalMinutes(e.target.value)}
                  required={isRecurring}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Total Runs (Optional)</label>
                <input 
                  type="number"
                  min="1"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={maxRuns}
                  onChange={e => setMaxRuns(e.target.value)}
                />
              </div>

              <div className="col-span-full">
                <label className="block text-sm font-semibold text-gray-700 mb-2">End Execution By (Optional)</label>
                <input 
                  type="datetime-local"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={endsAt}
                  onChange={e => setEndsAt(e.target.value)}
                />
              </div>
            </>
          )}
        </div>

        {error && <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium">{error}</div>}

        <button 
          type="submit"
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg hover:shadow-indigo-200 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "Creating Job..." : "Schedule Job"}
        </button>
      </form>
    </div>
  );
}
