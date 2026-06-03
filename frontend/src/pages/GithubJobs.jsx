import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  RefreshCw,
  FileText,
  Link2,
  Clock3,
  Shield,
  GitBranch,
  GitCommit,
  MessageSquareText,
  Trash2
} from "lucide-react";
import {
  connectGithubRepo,
  getGithubRepos,
  disconnectGithubRepo,
  syncGithubRepo,
  getGithubCommitJobs,
  triggerDocGeneration
} from "../api/githubJobs";
import { getAllDocArtifacts, downloadDocArtifact } from "../api/docAgent";
import toast from "react-hot-toast";

export default function GithubJobs() {
  const [repos, setRepos] = useState([]);
  const [selectedRepoId, setSelectedRepoId] = useState("");
  const [commitJobs, setCommitJobs] = useState([]);
  const [docArtifacts, setDocArtifacts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    repoUrl: "",
    repoName: "",
    owner: "",
    defaultBranch: "main",
    authType: "GITHUB_APP",
    accessToken: "",
    installationId: ""
  });

  const selectedRepo = useMemo(
    () => repos.find((repo) => repo.id === selectedRepoId),
    [repos, selectedRepoId]
  );

  const loadRepos = async () => {
    setIsLoading(true);
    try {
      const data = await getGithubRepos();
      setRepos(Array.isArray(data) ? data : []);
      if (!selectedRepoId && data?.length) {
        setSelectedRepoId(data[0].id);
      }
    } catch (err) {
      toast.error("Failed to load GitHub repos");
    } finally {
      setIsLoading(false);
    }
  };

  const loadCommitJobs = async (repoId) => {
    if (!repoId) {
      setCommitJobs([]);
      return;
    }
    try {
      const data = await getGithubCommitJobs(repoId);
      setCommitJobs(Array.isArray(data) ? data : []);
    } catch (err) {
      setCommitJobs([]);
    }
  };

  const loadDocArtifacts = async () => {
    try {
      const data = await getAllDocArtifacts();
      setDocArtifacts(Array.isArray(data) ? data : []);
    } catch (err) {
      setDocArtifacts([]);
    }
  };

  useEffect(() => {
    loadRepos();
    loadDocArtifacts();
  }, []);

  useEffect(() => {
    loadCommitJobs(selectedRepoId);
  }, [selectedRepoId]);

  const handleConnect = async (e) => {
    e.preventDefault();
    const loadingToast = toast.loading("Connecting repository...");
    try {
      const payload = {
        ...form,
        installationId: form.installationId ? Number(form.installationId) : null
      };
      const created = await connectGithubRepo(payload);
      toast.success("Repository connected", { id: loadingToast });
      setShowForm(false);
      setRepos((prev) => [created, ...prev]);
      setSelectedRepoId(created.id);
    } catch (err) {
      toast.error("Connection failed", { id: loadingToast });
    }
  };

  const handleDisconnect = async (repoId) => {
    const loadingToast = toast.loading("Disconnecting repository...");
    try {
      await disconnectGithubRepo(repoId);
      toast.success("Repository disconnected", { id: loadingToast });
      const nextRepos = repos.filter((repo) => repo.id !== repoId);
      setRepos(nextRepos);
      setSelectedRepoId(nextRepos[0]?.id || "");
    } catch (err) {
      toast.error("Failed to disconnect", { id: loadingToast });
    }
  };

  const handleSync = async (repoId) => {
    setIsSyncing(true);
    const loadingToast = toast.loading("Syncing commits and docs...");
    try {
      await syncGithubRepo(repoId);
      toast.success("Repo synced", { id: loadingToast });
      await loadCommitJobs(repoId);
      await loadRepos();
    } catch (err) {
      toast.error("Sync failed", { id: loadingToast });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleGenerateDocs = async (repoId, commitSha) => {
    const loadingToast = toast.loading("Generating docs...");
    try {
      await triggerDocGeneration(repoId, { commitSha, mode: "AUTO_DOCS" });
      toast.success("Doc generation started", { id: loadingToast });
      await loadDocArtifacts();
    } catch (err) {
      toast.error("Failed to trigger docs", { id: loadingToast });
    }
  };

  const handleDownloadArtifact = async (artifactId, fileName) => {
    const loadingToast = toast.loading("Downloading markdown...");
    try {
      const blob = await downloadDocArtifact(artifactId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName || "generated-doc.md";
      link.click();
      window.URL.revokeObjectURL(url);
      toast.success("Download ready", { id: loadingToast });
    } catch (err) {
      toast.error("Download failed", { id: loadingToast });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-[var(--text-main)]">GitHub Jobs</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Connect repositories, track commits, store context, and launch jobs like auto-doc generation.
          </p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          <Plus size={16} /> Connect Repo
        </button>
      </div>

      {showForm && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-[var(--text-main)]">Connect GitHub Repository</h2>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Add repo credentials and choose how Pulse should access commits and documentation context.
              </p>
            </div>
            <button onClick={() => setShowForm(false)} className="text-sm text-[var(--text-muted)] hover:text-[var(--text-main)]">
              Close
            </button>
          </div>
          <form onSubmit={handleConnect} className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input placeholder="Repository URL" value={form.repoUrl} onChange={(e) => setForm((p) => ({ ...p, repoUrl: e.target.value }))} required />
            <input placeholder="Repository name" value={form.repoName} onChange={(e) => setForm((p) => ({ ...p, repoName: e.target.value }))} required />
            <input placeholder="Owner / org" value={form.owner} onChange={(e) => setForm((p) => ({ ...p, owner: e.target.value }))} required />
            <input placeholder="Default branch" value={form.defaultBranch} onChange={(e) => setForm((p) => ({ ...p, defaultBranch: e.target.value }))} />
            <select value={form.authType} onChange={(e) => setForm((p) => ({ ...p, authType: e.target.value }))}>
              <option value="GITHUB_APP">GitHub App</option>
              <option value="PAT">Personal Access Token</option>
            </select>
            <input placeholder="Installation ID (GitHub App)" value={form.installationId} onChange={(e) => setForm((p) => ({ ...p, installationId: e.target.value }))} />
            <input className="md:col-span-2" placeholder="Access token (PAT, optional for prototype)" value={form.accessToken} onChange={(e) => setForm((p) => ({ ...p, accessToken: e.target.value }))} />
            <div className="md:col-span-2 flex justify-end">
              <button type="submit" className="btn-primary">Save Repo</button>
            </div>
          </form>
        </motion.div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-1 space-y-4">
          <div className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Repositories</h2>
              <button onClick={loadRepos} className="text-[var(--text-muted)] hover:text-[var(--text-main)]">
                <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
              </button>
            </div>
            <div className="space-y-2">
              {repos.map((repo) => (
                <button
                  key={repo.id}
                  onClick={() => setSelectedRepoId(repo.id)}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${selectedRepoId === repo.id ? "border-[var(--accent)] bg-sky-50" : "border-[var(--border-color)] bg-white hover:bg-[var(--bg-surface)]"}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center">
                      <GitCommit size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-[var(--text-main)] truncate">{repo.repoName || repo.name}</p>
                      <p className="text-xs text-[var(--text-muted)] truncate">{repo.owner || repo.repoUrl}</p>
                    </div>
                  </div>
                </button>
              ))}
              {repos.length === 0 && (
                <div className="text-center py-8 text-[var(--text-muted)] text-sm">
                  No repos connected yet.
                </div>
              )}
            </div>
          </div>

          {selectedRepo && (
            <div className="card p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                  <Link2 size={18} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[var(--text-main)]">{selectedRepo.repoName || selectedRepo.name}</p>
                  <p className="text-xs text-[var(--text-muted)]">Connected repo</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => handleSync(selectedRepo.id)} className="btn-primary flex-1" disabled={isSyncing}>
                  <RefreshCw size={14} className={isSyncing ? "animate-spin" : ""} />
                  Sync
                </button>
                <button onClick={() => handleDisconnect(selectedRepo.id)} className="px-3 py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50">
                  <Trash2 size={14} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-3 rounded-lg bg-[var(--bg-surface)]">
                  <p className="text-[var(--text-muted)] uppercase font-bold">Auth</p>
                  <p className="mt-1 font-medium text-[var(--text-main)] flex items-center gap-1">
                    <Shield size={12} /> {selectedRepo.authType || "GitHub App"}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-[var(--bg-surface)]">
                  <p className="text-[var(--text-muted)] uppercase font-bold">Branch</p>
                  <p className="mt-1 font-medium text-[var(--text-main)] flex items-center gap-1">
                    <GitBranch size={12} /> {selectedRepo.defaultBranch || "main"}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-[var(--bg-surface)]">
                  <p className="text-[var(--text-muted)] uppercase font-bold">Context</p>
                  <p className="mt-1 font-medium text-[var(--text-main)] flex items-center gap-1">
                    <MessageSquareText size={12} /> RAG ready
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-[var(--bg-surface)]">
                  <p className="text-[var(--text-muted)] uppercase font-bold">Jobs</p>
                  <p className="mt-1 font-medium text-[var(--text-main)] flex items-center gap-1">
                    <Clock3 size={12} /> {commitJobs.length}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="xl:col-span-2 space-y-4">
          <div className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-sm font-semibold text-[var(--text-main)]">Commit Timeline</h2>
                <p className="text-xs text-[var(--text-muted)] mt-1">Store commits, track history, and launch doc jobs from each change.</p>
              </div>
              <button
                onClick={() => selectedRepoId && handleGenerateDocs(selectedRepoId, commitJobs[0]?.commitSha)}
                className="btn-primary"
                disabled={!selectedRepoId || !commitJobs.length}
              >
                <FileText size={14} /> Auto Docs
              </button>
            </div>

            <div className="space-y-3">
              {commitJobs.map((job) => (
                <div key={job.id} className="p-4 rounded-xl border border-[var(--border-color)] bg-white">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <p className="text-sm font-semibold text-[var(--text-main)]">{job.commitMessage || job.title || "Commit"}</p>
                      </div>
                      <p className="text-xs text-[var(--text-muted)] mt-1 font-mono">{job.commitSha || job.sha}</p>
                      <p className="text-xs text-[var(--text-muted)] mt-1">{job.changedFiles || job.files || "Changed files stored with the job"}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="badge badge-info">{job.status || "READY"}</span>
                      <button onClick={() => handleGenerateDocs(selectedRepoId, job.commitSha || job.sha)} className="btn-primary text-xs px-3 py-2">
                        Generate Docs
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {commitJobs.length === 0 && (
                <div className="text-center py-10 text-[var(--text-muted)]">
                  Select a repo and sync it to see commits and doc jobs here.
                </div>
              )}
            </div>
          </div>

          <div className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-sm font-semibold text-[var(--text-main)]">Job Types</h2>
                <p className="text-xs text-[var(--text-muted)] mt-1">Use the repo context for multiple automation jobs, not just docs.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-4 rounded-xl bg-sky-50 border border-sky-100">
                <p className="text-xs font-bold uppercase text-sky-700">Auto Docs</p>
                <p className="text-sm text-sky-900 mt-2">Generate Markdown docs from commits and PRs.</p>
              </div>
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                <p className="text-xs font-bold uppercase text-emerald-700">Release Notes</p>
                <p className="text-sm text-emerald-900 mt-2">Summarize changes across multiple commits.</p>
              </div>
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-100">
                <p className="text-xs font-bold uppercase text-amber-700">Context Index</p>
                <p className="text-sm text-amber-900 mt-2">Store repo memory for RAG, search, and assistants.</p>
              </div>
            </div>
          </div>

          <div className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-sm font-semibold text-[var(--text-main)]">Generated Docs</h2>
                <p className="text-xs text-[var(--text-muted)] mt-1">This is where the Markdown document lives after generation.</p>
              </div>
              <span className="badge badge-info">{docArtifacts.length}</span>
            </div>

            <div className="space-y-3">
              {docArtifacts.map((artifact) => (
                <div key={artifact.id} className="p-4 rounded-xl border border-[var(--border-color)] bg-white">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[var(--text-main)]">{artifact.title}</p>
                      <p className="text-xs text-[var(--text-muted)] mt-1 font-mono">{artifact.fileName}</p>
                      <pre className="mt-3 text-xs text-[var(--text-main)] whitespace-pre-wrap bg-[var(--bg-surface)] rounded-lg p-3 max-h-52 overflow-auto">
                        {artifact.markdownContent}
                      </pre>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span className="badge badge-info">{artifact.status || "COMPLETED"}</span>
                      <button className="btn-primary text-xs px-3 py-2" onClick={() => handleDownloadArtifact(artifact.id, artifact.fileName)}>
                        Download
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {docArtifacts.length === 0 && (
                <div className="text-center py-10 text-[var(--text-muted)]">
                  No generated docs yet. Click <strong>Generate Docs</strong> on a commit or use <strong>Auto Docs</strong>.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
