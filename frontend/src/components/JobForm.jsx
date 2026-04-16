import { useState } from "react";
import { createJob } from "../api/jobs";
import { Globe, Clock, Loader2 } from "lucide-react";

export default function JobForm({ onJobCreated }) {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [method, setMethod] = useState("GET");
  const [payload, setPayload] = useState("");
  const [maxRetries, setMaxRetries] = useState(3);
  const [retryDelay, setRetryDelay] = useState(30);
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
        maxRetries: parseInt(maxRetries),
        retryDelay: parseInt(retryDelay),
        recurring: isRecurring,
        intervalMinutes: isRecurring ? parseInt(intervalMinutes) : null,
        maxRuns: maxRuns ? parseInt(maxRuns) : null,
        endsAt: endsAt ? new Date(endsAt).toISOString() : null,
        startTime: startTime ? new Date(startTime).toISOString() : null,
        maxConsecutiveFailures: parseInt(maxConsecutiveFailures)
      };
      await createJob(jobData);
      setName(""); setUrl(""); setMethod("GET"); setPayload("");
      setMaxRetries(3); setRetryDelay(30); setIsRecurring(false);
      setIntervalMinutes(""); setMaxRuns(""); setEndsAt("");
      setStartTime(""); setMaxConsecutiveFailures(5);
      onJobCreated();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-5">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-[var(--text-muted)]">Job name</label>
          <input
            placeholder="Daily sync"
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-[var(--text-muted)]">Endpoint URL</label>
          <div className="relative">
            <Globe className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={14} />
            <input
              type="url"
              className="pl-8"
              placeholder="https://api.example.com/run"
              value={url}
              onChange={e => setUrl(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-[var(--text-muted)]">Method</label>
            <select value={method} onChange={e => setMethod(e.target.value)}>
              <option>GET</option>
              <option>POST</option>
              <option>PUT</option>
              <option>DELETE</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-[var(--text-muted)]">Retry delay (s)</label>
            <input type="number" value={retryDelay} onChange={e => setRetryDelay(e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-[var(--text-muted)]">Max retries</label>
            <input type="number" min="0" value={maxRetries} onChange={e => setMaxRetries(e.target.value)} />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-[var(--text-muted)]">Fail limit</label>
            <input type="number" min="1" value={maxConsecutiveFailures} onChange={e => setMaxConsecutiveFailures(e.target.value)} />
          </div>
        </div>

        <label className="flex items-center gap-2 pt-2 cursor-pointer">
          <input
            type="checkbox"
            className="w-3.5 h-3.5 rounded border-[var(--border-color)] text-sky-600 accent-sky-600"
            checked={isRecurring}
            onChange={e => setIsRecurring(e.target.checked)}
          />
          <span className="text-sm font-medium text-[var(--text-main)]">Recurring schedule</span>
        </label>

        {isRecurring && (
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="space-y-1">
              <label className="text-xs font-medium text-[var(--text-muted)]">Interval (min)</label>
              <input
                type="number" min="1"
                value={intervalMinutes}
                onChange={e => setIntervalMinutes(e.target.value)}
                required={isRecurring}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-[var(--text-muted)]">Max runs</label>
              <input type="number" min="1" value={maxRuns} onChange={e => setMaxRuns(e.target.value)} />
            </div>
          </div>
        )}

        {error && <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-red-600 text-xs">{error}</div>}

        <button type="submit" className="btn-primary w-full py-2.5 mt-1" disabled={loading}>
          {loading ? <Loader2 className="animate-spin" size={16} /> : "Create job"}
        </button>
      </form>
    </div>
  );
}
