import { useState } from "react";
import { createJob } from "../api/jobs";

export default function JobForm({ onJobCreated }) {
  const [url, setUrl] = useState("");
  const [method, setMethod] = useState("GET");
  const [payload, setPayload] = useState("");
  const [maxRetries, setMaxRetries] = useState(3);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await createJob({ url, method, payload, maxRetries });
      setUrl("");
      setMethod("GET");
      setPayload("");
      setMaxRetries(3);
      onJobCreated();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="space-y-4 bg-white p-6 rounded shadow max-w-md mx-auto" onSubmit={handleSubmit}>
      <div>
        <label className="block mb-1 font-medium">URL</label>
        <input className="w-full border rounded px-3 py-2" value={url} onChange={e => setUrl(e.target.value)} required />
      </div>
      <div>
        <label className="block mb-1 font-medium">Method</label>
        <select className="w-full border rounded px-3 py-2" value={method} onChange={e => setMethod(e.target.value)}>
          <option>GET</option>
          <option>POST</option>
          <option>PUT</option>
          <option>DELETE</option>
        </select>
      </div>
      <div>
        <label className="block mb-1 font-medium">Payload</label>
        <textarea className="w-full border rounded px-3 py-2" value={payload} onChange={e => setPayload(e.target.value)} />
      </div>
      <div>
        <label className="block mb-1 font-medium">Max Retries</label>
        <input type="number" min="1" max="10" className="w-full border rounded px-3 py-2" value={maxRetries} onChange={e => setMaxRetries(Number(e.target.value))} />
      </div>
      {error && <div className="text-red-600">{error}</div>}
      <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded" disabled={loading}>{loading ? "Creating..." : "Create Job"}</button>
    </form>
  );
}
