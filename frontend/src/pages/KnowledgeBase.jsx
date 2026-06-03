import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Upload, 
  FileText, 
  Search, 
  Send, 
  Loader2, 
  Database,
  MessageSquare,
  FileUp,
  Trash2,
  RefreshCw
} from "lucide-react";
import { getJobs, deleteJob } from "../api/jobs";
import { uploadDocument, getKnowledgeByJob, askQuestion, deleteDocument } from "../api/knowledge";
import { submitDocWebhook, getDocJobs, getDocArtifacts, downloadDocArtifact } from "../api/docAgent";
import WorkspaceForm from "../components/WorkspaceForm";
import toast from "react-hot-toast";

export default function KnowledgeBase() {
  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState("");
  const [knowledge, setKnowledge] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [query, setQuery] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [showCreateWorkspace, setShowCreateWorkspace] = useState(false);
  const [docJobs, setDocJobs] = useState([]);
  const [docArtifacts, setDocArtifacts] = useState([]);
  const [docForm, setDocForm] = useState({
    repoName: "Pulse",
    repoUrl: "",
    commitSha: "",
    commitMessage: "",
    prNumber: "",
    branchName: "",
    changedFiles: "frontend/src/pages/KnowledgeBase.jsx\nbackend/src/main/java/com/example/backend/controller/DocAgentController.java",
    diffSummary: "",
  });
  const [selectedDocJobId, setSelectedDocJobId] = useState("");
  const [isDocSubmitting, setIsDocSubmitting] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    fetchJobs();
    fetchDocJobs();
  }, []);

  useEffect(() => {
    if (selectedJobId) {
      fetchKnowledge();
      setChatHistory([]);
    } else {
      setKnowledge([]);
    }
  }, [selectedJobId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, isChatLoading]);

  const fetchJobs = async () => {
    try {
      const data = await getJobs();
      const jobsArray = Array.isArray(data) ? data : (data?.data || []);
      const filtered = jobsArray.filter(job => {
        const type = job.jobType || job.job_type;
        return type === 'WORKSPACE';
      });
      setJobs(filtered);
    } catch (err) {
      console.error("Failed to fetch jobs", err);
    }
  };

  const onWorkspaceCreated = (newWorkspace) => {
    setJobs(prev => [...prev, newWorkspace]);
    setSelectedJobId(newWorkspace.id);
    setShowCreateWorkspace(false);
  };

  const fetchKnowledge = async () => {
    setIsLoading(true);
    try {
      const data = await getKnowledgeByJob(selectedJobId);
      setKnowledge(data);
    } catch (err) {
      console.error("Failed to fetch knowledge", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDocJobs = async () => {
    try {
      const data = await getDocJobs();
      setDocJobs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch doc jobs", err);
    }
  };

  const fetchDocArtifacts = async (jobId) => {
    if (!jobId) {
      setDocArtifacts([]);
      return;
    }
    try {
      const data = await getDocArtifacts(jobId);
      setDocArtifacts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch doc artifacts", err);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !selectedJobId) return;

    setIsUploading(true);
    const toastId = toast.loading("Uploading and indexing document...");
    try {
      await uploadDocument(selectedJobId, file);
      toast.success("Document uploaded successfully", { id: toastId });
      fetchKnowledge();
    } catch (err) {
      toast.error("Upload failed: " + err.message, { id: toastId });
      console.error("Upload failed", err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteWorkspace = async () => {
    if (!selectedJobId) return;
    
    toast((t) => (
      <div className="flex flex-col gap-3 p-1">
        <p className="text-sm font-medium text-gray-900">Delete this workspace and all its documents? This cannot be undone.</p>
        <div className="flex justify-end gap-2">
          <button onClick={() => toast.dismiss(t.id)} className="px-3 py-1.5 text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors">Cancel</button>
          <button 
            onClick={async () => {
              toast.dismiss(t.id);
              const loadingToast = toast.loading("Deleting workspace...");
              try {
                await deleteJob(selectedJobId);
                toast.success("Workspace deleted", { id: loadingToast });
                setSelectedJobId("");
                setKnowledge([]);
                setChatHistory([]);
                fetchJobs();
              } catch (err) {
                toast.error("Deletion failed", { id: loadingToast });
              }
            }} 
            className="px-3 py-1.5 text-xs font-semibold bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
          >
            Confirm
          </button>
        </div>
      </div>
    ), { duration: 6000, position: 'top-center' });
  };

  const handleDeleteDocument = async (documentId) => {
    const loadingToast = toast.loading("Removing document...");
    try {
      await deleteDocument(documentId);
      toast.success("Document removed", { id: loadingToast });
      fetchKnowledge();
    } catch (err) {
      toast.error("Failed to remove document", { id: loadingToast });
    }
  };

  const handleAsk = async (e) => {
    e.preventDefault();
    if (!query.trim() || !selectedJobId || isChatLoading) return;

    const userMessage = { role: "user", content: query };
    setChatHistory(prev => [...prev, userMessage]);
    const currentQuery = query;
    setQuery("");
    setIsChatLoading(true);

    try {
      const response = await askQuestion(selectedJobId, currentQuery);
      setChatHistory(prev => [...prev, { role: "ai", content: response }]);
    } catch (err) {
      setChatHistory(prev => [...prev, { role: "ai", content: "Error: " + (err.response?.data?.message || err.message) }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleDocSubmit = async (e) => {
    e.preventDefault();
    if (!docForm.commitSha.trim() || !docForm.repoName.trim()) return;
    setIsDocSubmitting(true);
    const loadingToast = toast.loading("Generating documentation from commit...");
    try {
      const payload = {
        ...docForm,
        changedFiles: docForm.changedFiles.split("\n").map(s => s.trim()).filter(Boolean),
        triggerType: "MANUAL",
      };
      await submitDocWebhook(payload);
      toast.success("Documentation generated", { id: loadingToast });
      await fetchDocJobs();
    } catch (err) {
      toast.error("Doc generation failed: " + (err.response?.data?.message || err.message), { id: loadingToast });
    } finally {
      setIsDocSubmitting(false);
    }
  };

  const handleSelectDocJob = async (jobId) => {
    setSelectedDocJobId(jobId);
    await fetchDocArtifacts(jobId);
  };

  const handleDownloadArtifact = async (artifactId, fileName) => {
    const loadingToast = toast.loading("Preparing download...");
    try {
      const blob = await downloadDocArtifact(artifactId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName || "documentation.md";
      link.click();
      window.URL.revokeObjectURL(url);
      toast.success("Download ready", { id: loadingToast });
    } catch (err) {
      toast.error("Download failed", { id: loadingToast });
    }
  };

  const selectedWorkspaceName = jobs.find(j => j.id === selectedJobId)?.name;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text-main)" }}>AI Knowledge Base</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginTop: "0.25rem" }}>Upload documents and query them with AI-powered search.</p>
        </div>
        <button 
          onClick={() => setShowCreateWorkspace(true)}
          className="btn-primary"
          style={{ borderRadius: "0.75rem", padding: "0.5rem 1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}
        >
          <Database size={16} />
          New Workspace
        </button>
      </header>

      <div className="card" style={{ padding: "1.25rem", border: "1px solid rgba(2,132,199,0.12)", background: "linear-gradient(180deg, rgba(2,132,199,0.05), rgba(255,255,255,0.96))" }}>
        <div style={{ display: "flex", alignItems: "start", justifyContent: "space-between", gap: "1rem", marginBottom: "1rem" }}>
          <div>
            <h2 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-main)" }}>Doc-Agent</h2>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
              Generate updated Markdown docs from a commit or PR, using previous documentation as context.
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: "0.7rem", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 700 }}>Generated</p>
            <p style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--text-main)" }}>{docJobs.length}</p>
          </div>
        </div>
        <form onSubmit={handleDocSubmit} style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "0.75rem" }}>
          <input placeholder="Repo name" value={docForm.repoName} onChange={(e) => setDocForm(prev => ({ ...prev, repoName: e.target.value }))} />
          <input placeholder="Repo URL" value={docForm.repoUrl} onChange={(e) => setDocForm(prev => ({ ...prev, repoUrl: e.target.value }))} />
          <input placeholder="Commit SHA" value={docForm.commitSha} onChange={(e) => setDocForm(prev => ({ ...prev, commitSha: e.target.value }))} />
          <input placeholder="PR number" value={docForm.prNumber} onChange={(e) => setDocForm(prev => ({ ...prev, prNumber: e.target.value }))} />
          <input placeholder="Branch" value={docForm.branchName} onChange={(e) => setDocForm(prev => ({ ...prev, branchName: e.target.value }))} />
          <textarea rows={4} placeholder="Changed files, one per line" value={docForm.changedFiles} onChange={(e) => setDocForm(prev => ({ ...prev, changedFiles: e.target.value }))} />
          <textarea rows={4} style={{ gridColumn: "1 / -1" }} placeholder="Commit message or diff summary" value={docForm.commitMessage} onChange={(e) => setDocForm(prev => ({ ...prev, commitMessage: e.target.value }))} />
          <textarea rows={4} style={{ gridColumn: "1 / -1" }} placeholder="Diff summary / change notes" value={docForm.diffSummary} onChange={(e) => setDocForm(prev => ({ ...prev, diffSummary: e.target.value }))} />
          <button type="submit" className="btn-primary" disabled={isDocSubmitting} style={{ gridColumn: "1 / -1", justifySelf: "start" }}>
            {isDocSubmitting ? "Generating..." : "Generate docs from commit"}
          </button>
        </form>
      </div>

      <div className="card" style={{ padding: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
          <h2 style={{ fontSize: "0.8rem", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 700 }}>Doc Jobs</h2>
          <button className="btn-primary" onClick={fetchDocJobs} style={{ padding: "0.4rem 0.75rem" }}>Refresh</button>
        </div>
        <div style={{ display: "grid", gap: "0.5rem" }}>
          {docJobs.slice(0, 5).map(job => (
            <button key={job.id} onClick={() => handleSelectDocJob(job.id)} style={{ textAlign: "left", padding: "0.75rem", borderRadius: "0.75rem", border: selectedDocJobId === job.id ? "1px solid var(--accent)" : "1px solid var(--border-color)", background: "white" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem" }}>
                <div>
                  <p style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-main)" }}>{job.repoName}</p>
                  <p style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{job.commitSha}</p>
                </div>
                <span className="badge badge-info">{job.status}</span>
              </div>
            </button>
          ))}
          {docJobs.length === 0 && <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>No document jobs yet.</p>}
        </div>
        {selectedDocJobId && (
          <div style={{ marginTop: "1rem" }}>
            <h3 style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 700, marginBottom: "0.5rem" }}>Artifacts</h3>
            <div style={{ display: "grid", gap: "0.5rem" }}>
              {docArtifacts.map(artifact => (
                <div key={artifact.id} className="card" style={{ padding: "0.75rem", display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "center" }}>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-main)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{artifact.title}</p>
                    <p style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{artifact.fileName}</p>
                  </div>
                  <button className="btn-primary" onClick={() => handleDownloadArtifact(artifact.id, artifact.fileName)} style={{ padding: "0.4rem 0.75rem" }}>
                    Download
                  </button>
                </div>
              ))}
              {docArtifacts.length === 0 && <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Select a job to view artifacts.</p>}
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showCreateWorkspace && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{ marginBottom: "2rem" }}
          >
            <div style={{ maxWidth: "28rem", margin: "0 auto" }}>
              <WorkspaceForm 
                onWorkspaceCreated={onWorkspaceCreated} 
                onCancel={() => setShowCreateWorkspace(false)} 
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1.5rem" }} className="kb-grid">
        <style>{`.kb-grid { grid-template-columns: 1fr !important; } @media(min-width:1024px) { .kb-grid { grid-template-columns: 1fr 2fr !important; } }`}</style>

        {/* Left Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

          {/* Workspace Selector */}
          <div className="card" style={{ padding: "1.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
              <h2 style={{ fontSize: "0.6875rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Database size={16} style={{ color: "var(--accent)" }} />
                Select Workspace
              </h2>
              {selectedJobId && (
                <button
                  onClick={handleDeleteWorkspace}
                  title="Delete Workspace"
                  style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.6875rem", color: "#dc2626", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "0.5rem", padding: "0.25rem 0.5rem", cursor: "pointer", fontWeight: 600, transition: "all 0.15s" }}
                >
                  <Trash2 size={12} />
                  Delete
                </button>
              )}
            </div>
            <select 
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
              style={{ width: "100%", background: "var(--bg-surface)", border: "1px solid var(--border-color)", borderRadius: "0.75rem", padding: "0.75rem 1rem", color: "var(--text-main)", fontSize: "0.875rem" }}
            >
              <option value="">{jobs.length === 0 ? "No Workspaces Found" : "Choose a Workspace"}</option>
              {jobs.map(job => (
                <option key={job.id} value={job.id}>{job.name}</option>
              ))}
            </select>
          </div>

          {/* Upload Area */}
          <div style={{ 
            border: `2px dashed ${selectedJobId ? "var(--border-color)" : "#e5e7eb"}`,
            borderRadius: "1rem", 
            padding: "2rem", 
            textAlign: "center",
            background: selectedJobId ? "var(--bg-surface)" : "transparent",
            opacity: selectedJobId ? 1 : 0.5,
            transition: "all 0.3s",
            cursor: selectedJobId ? "pointer" : "not-allowed"
          }}>
            <input 
              type="file" 
              id="file-upload" 
              style={{ display: "none" }}
              disabled={!selectedJobId || isUploading}
              onChange={handleFileUpload}
            />
            <label 
              htmlFor="file-upload"
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem", cursor: selectedJobId ? "pointer" : "not-allowed" }}
            >
              <div style={{ width: "3rem", height: "3rem", borderRadius: "50%", background: "var(--accent-light)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--accent)" }}>
                {isUploading ? <Loader2 size={24} className="animate-spin" /> : <FileUp size={24} />}
              </div>
              <div>
                <p style={{ fontWeight: 600, color: "var(--text-main)", fontSize: "0.875rem" }}>
                  {isUploading ? "Processing..." : "Click to upload"}
                </p>
                <p style={{ color: "var(--text-muted)", fontSize: "0.75rem", marginTop: "0.25rem" }}>PDF, TXT, or DOCX up to 50MB</p>
              </div>
            </label>
          </div>

          {/* Document List */}
          <div className="card" style={{ overflow: "hidden", display: "flex", flexDirection: "column", height: "400px" }}>
            <div style={{ padding: "1rem", borderBottom: "1px solid var(--border-color)", display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--bg-surface)" }}>
              <h2 style={{ fontSize: "0.6875rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Indexed Documents</h2>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                {selectedJobId && (
                  <button onClick={fetchKnowledge} title="Refresh" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "1.5rem", height: "1.5rem", borderRadius: "0.375rem", color: "var(--text-muted)", cursor: "pointer" }}>
                    <RefreshCw size={12} />
                  </button>
                )}
                <span className="badge badge-info">{knowledge.length}</span>
              </div>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "0.5rem" }}>
              {isLoading ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", opacity: 0.4, gap: "0.5rem" }}>
                  <Loader2 size={20} className="animate-spin" />
                  <span style={{ fontSize: "0.75rem" }}>Loading files...</span>
                </div>
              ) : knowledge.length > 0 ? (
                knowledge.map(file => (
                  <div key={file.id} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem", borderRadius: "0.75rem", transition: "background 0.15s", border: "1px solid transparent" }}
                    onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-surface)"; e.currentTarget.style.borderColor = "var(--border-color)"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "transparent"; }}
                  >
                    <div style={{ width: "2rem", height: "2rem", borderRadius: "0.5rem", background: "var(--accent-light)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--accent)", flexShrink: 0 }}>
                      <FileText size={16} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: "0.8125rem", color: "var(--text-main)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{file.fileName}</p>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", marginTop: "0.125rem" }}>
                        <span style={{ 
                          width: "0.375rem", height: "0.375rem", borderRadius: "50%",
                          background: file.status === 'INDEXED' ? '#22c55e' : file.status === 'FAILED' ? '#ef4444' : '#f59e0b'
                        }} />
                        <span style={{ fontSize: "0.625rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "-0.02em" }}>{file.status}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteDocument(file.id)}
                      title="Remove document"
                      style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "1.75rem", height: "1.75rem", borderRadius: "0.375rem", color: "#dc2626", background: "transparent", cursor: "pointer", opacity: 0.5, transition: "opacity 0.15s", flexShrink: 0 }}
                      onMouseEnter={e => e.currentTarget.style.opacity = 1}
                      onMouseLeave={e => e.currentTarget.style.opacity = 0.5}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              ) : (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", opacity: 0.25, textAlign: "center", padding: "1.5rem" }}>
                  <Upload size={32} style={{ marginBottom: "0.5rem" }} />
                  <p style={{ fontSize: "0.75rem" }}>No documents uploaded yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Chat */}
        <div>
          <div className="card" style={{ display: "flex", flexDirection: "column", height: "650px", overflow: "hidden", position: "relative" }}>
            {!selectedJobId && (
              <div style={{ position: "absolute", inset: 0, zIndex: 10, background: "rgba(255,255,255,0.85)", backdropFilter: "blur(2px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "3rem", textAlign: "center" }}>
                <div style={{ maxWidth: "16rem" }}>
                  <MessageSquare size={48} style={{ margin: "0 auto 1rem", color: "var(--text-muted)", opacity: 0.2 }} />
                  <h3 style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "0.5rem" }}>Select a Workspace</h3>
                  <p style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>Choose a workspace from the left to start chatting with its knowledge base.</p>
                </div>
              </div>
            )}

            {/* Chat Header */}
            <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid var(--border-color)", display: "flex", alignItems: "center", gap: "0.75rem", background: "var(--bg-surface)" }}>
              <div style={{ width: "2.5rem", height: "2.5rem", borderRadius: "0.75rem", background: "var(--accent-light)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--accent)" }}>
                <MessageSquare size={20} />
              </div>
              <div>
                <h2 style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--text-main)" }}>AI Assistant</h2>
                <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", marginTop: "0.125rem" }}>
                  <span style={{ width: "0.375rem", height: "0.375rem", borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 8px rgba(34,197,94,0.5)" }} />
                  <span style={{ fontSize: "0.625rem", color: "#16a34a", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    {selectedWorkspaceName ? `Connected · ${selectedWorkspaceName}` : "Ready to answer"}
                  </span>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: "auto", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem", background: "var(--bg-app)" }}>
              {chatHistory.length === 0 ? (
                <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", opacity: 0.3, textAlign: "center", gap: "1rem" }}>
                  <div style={{ width: "4rem", height: "4rem", borderRadius: "50%", border: "1px solid var(--border-color)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Search size={24} />
                  </div>
                  <div>
                    <p style={{ fontSize: "0.875rem", fontWeight: 500 }}>Ask anything about your documents</p>
                    <p style={{ fontSize: "0.75rem", marginTop: "0.25rem" }}>"What are the main requirements in the project doc?"</p>
                  </div>
                </div>
              ) : (
                chatHistory.map((msg, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ display: "flex", justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}
                  >
                    <div style={{
                      maxWidth: "85%",
                      padding: "0.75rem 1rem",
                      borderRadius: "1rem",
                      fontSize: "0.875rem",
                      lineHeight: 1.6,
                      ...(msg.role === 'user' 
                        ? { background: "var(--accent)", color: "#fff", borderTopRightRadius: 0, boxShadow: "0 2px 8px rgba(2,132,199,0.2)" } 
                        : { background: "var(--bg-surface)", color: "var(--text-main)", border: "1px solid var(--border-color)", borderTopLeftRadius: 0 }
                      )
                    }}>
                      <div className="markdown-content">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
              {isChatLoading && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{ display: "flex", justifyContent: "flex-start" }}
                >
                  <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-color)", padding: "0.75rem 1rem", borderRadius: "1rem", borderTopLeftRadius: 0, display: "flex", gap: "0.25rem" }}>
                    <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1 }} style={{ width: "0.375rem", height: "0.375rem", background: "var(--text-muted)", borderRadius: "50%" }} />
                    <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} style={{ width: "0.375rem", height: "0.375rem", background: "var(--text-muted)", borderRadius: "50%" }} />
                    <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} style={{ width: "0.375rem", height: "0.375rem", background: "var(--text-muted)", borderRadius: "50%" }} />
                  </div>
                </motion.div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div style={{ padding: "1rem 1.5rem", borderTop: "1px solid var(--border-color)", background: "var(--bg-app)" }}>
              <form 
                onSubmit={handleAsk}
                style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
              >
                <input 
                  type="text" 
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Type your question..."
                  style={{ flex: 1, background: "var(--bg-surface)", border: "1px solid var(--border-color)", borderRadius: "0.75rem", padding: "0.875rem 1rem", color: "var(--text-main)", fontSize: "0.875rem" }}
                />
                <button 
                  type="submit"
                  disabled={!query.trim() || isChatLoading}
                  className="btn-primary"
                  style={{ width: "2.75rem", height: "2.75rem", borderRadius: "0.75rem", padding: 0, flexShrink: 0, opacity: (!query.trim() || isChatLoading) ? 0.5 : 1 }}
                >
                  <Send size={18} />
                </button>
              </form>
              <p style={{ fontSize: "0.625rem", color: "var(--text-muted)", marginTop: "0.75rem", textAlign: "center", opacity: 0.6 }}>
                AI can make mistakes. Consider checking important information.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
