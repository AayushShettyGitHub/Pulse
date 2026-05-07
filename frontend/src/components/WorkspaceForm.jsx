import { useState } from "react";
import { createJob } from "../api/jobs";
import { Database, Loader2, X } from "lucide-react";

export default function WorkspaceForm({ onWorkspaceCreated, onCancel }) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const jobData = {
        name,
        url: "http://internal/workspace", // Dummy internal URL
        jobType: "WORKSPACE",
        method: "POST",
        recurring: false
      };
      const newWorkspace = await createJob(jobData);
      setName("");
      onWorkspaceCreated(newWorkspace);
    } catch (err) {
      setError(err.message || "Failed to create workspace");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-6 space-y-4 shadow-xl">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-[var(--text-main)] flex items-center gap-2">
          <Database size={20} className="text-sky-500" />
          New Workspace
        </h3>
        {onCancel && (
          <button onClick={onCancel} className="text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors">
            <X size={20} />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Workspace Name</label>
          <input
            placeholder="Engineering Docs, Marketing Assets..."
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition-all"
            required
            autoFocus
          />
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
            {error}
          </div>
        )}

        <div className="flex gap-3">
          {onCancel && (
            <button 
              type="button" 
              onClick={onCancel}
              className="flex-1 bg-[var(--bg-surface)] hover:bg-[var(--border-color)] text-[var(--text-main)] font-bold py-3 rounded-xl transition-all border border-[var(--border-color)]"
            >
              Cancel
            </button>
          )}
          <button 
            type="submit" 
            className="flex-[2] bg-sky-500 hover:bg-sky-400 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-sky-500/20 flex items-center justify-center gap-2" 
            disabled={loading}
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : "Create Workspace"}
          </button>
        </div>
      </form>
    </div>
  );
}
