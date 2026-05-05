import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Upload, 
  FileText, 
  Search, 
  Send, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  Database,
  MessageSquare,
  X,
  FileUp
} from "lucide-react";
import { getJobs } from "../api/jobs";
import { uploadDocument, getKnowledgeByJob, askQuestion } from "../api/knowledge";

export default function KnowledgeBase() {
  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState("");
  const [knowledge, setKnowledge] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [query, setQuery] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  useEffect(() => {
    fetchJobs();
  }, []);

  useEffect(() => {
    if (selectedJobId) {
      fetchKnowledge();
    } else {
      setKnowledge([]);
    }
  }, [selectedJobId]);

  const fetchJobs = async () => {
    try {
      const data = await getJobs();
      // Filter for RAG_INGESTION or just show all for now
      setJobs(data);
    } catch (err) {
      console.error("Failed to fetch jobs", err);
    }
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

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !selectedJobId) return;

    setIsUploading(true);
    try {
      await uploadDocument(selectedJobId, file);
      fetchKnowledge();
    } catch (err) {
      console.error("Upload failed", err);
    } finally {
      setIsUploading(false);
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

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-white">AI Knowledge Base</h1>
        <p className="text-white/50 text-sm mt-1">Upload documents to build a searchable RAG knowledge base.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Management */}
        <div className="lg:col-span-1 space-y-6">
          {/* Job Selection */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-xl">
            <h2 className="text-sm font-bold text-white/80 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Database size={16} className="text-sky-400" />
              Select Workspace
            </h2>
            <select 
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
              className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition-all appearance-none"
            >
              <option value="">Select a Job/Project</option>
              {jobs.map(job => (
                <option key={job.id} value={job.id}>{job.name}</option>
              ))}
            </select>
          </div>

          {/* Upload Area */}
          <div className={`bg-white/5 border-2 border-dashed transition-all duration-300 rounded-2xl p-8 text-center ${
            selectedJobId ? 'border-white/10 hover:border-sky-500/50 hover:bg-sky-500/5' : 'border-white/5 opacity-50 grayscale'
          }`}>
            <input 
              type="file" 
              id="file-upload" 
              className="hidden" 
              disabled={!selectedJobId || isUploading}
              onChange={handleFileUpload}
            />
            <label 
              htmlFor="file-upload"
              className={`flex flex-col items-center gap-3 ${selectedJobId ? 'cursor-pointer' : 'cursor-not-allowed'}`}
            >
              <div className="w-12 h-12 rounded-full bg-sky-500/10 flex items-center justify-center text-sky-400 group-hover:scale-110 transition-transform">
                {isUploading ? <Loader2 className="animate-spin" /> : <FileUp size={24} />}
              </div>
              <div>
                <p className="text-white font-semibold">
                  {isUploading ? "Processing..." : "Click to upload"}
                </p>
                <p className="text-white/40 text-xs mt-1">PDF, TXT, or DOCX up to 10MB</p>
              </div>
            </label>
          </div>

          {/* Document List */}
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden flex flex-col h-[400px]">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-xs font-bold text-white/60 uppercase">Indexed Documents</h2>
              <span className="bg-white/10 px-2 py-0.5 rounded-full text-[10px] text-white/80">{knowledge.length}</span>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-full opacity-30 gap-2">
                  <Loader2 className="animate-spin" />
                  <span className="text-xs">Loading files...</span>
                </div>
              ) : knowledge.length > 0 ? (
                knowledge.map(file => (
                  <div key={file.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors group">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/60">
                      <FileText size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] text-white/90 truncate font-medium">{file.fileName}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          file.status === 'INDEXED' ? 'bg-green-500' : 
                          file.status === 'FAILED' ? 'bg-red-500' : 'bg-amber-500 animate-pulse'
                        }`} />
                        <span className="text-[10px] text-white/30 uppercase tracking-tighter">{file.status}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-full opacity-20 text-center p-6">
                  <Upload size={32} className="mb-2" />
                  <p className="text-xs">No documents uploaded yet for this workspace.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Chat Interface */}
        <div className="lg:col-span-2">
          <div className="bg-white/5 border border-white/10 rounded-2xl flex flex-col h-[650px] overflow-hidden backdrop-blur-xl relative">
            {!selectedJobId && (
              <div className="absolute inset-0 z-10 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-12 text-center">
                <div className="max-w-xs">
                  <MessageSquare size={48} className="mx-auto mb-4 text-white/20" />
                  <h3 className="text-lg font-bold text-white mb-2">Select a Workspace</h3>
                  <p className="text-sm text-white/40">Choose a job from the list on the left to start chatting with its knowledge base.</p>
                </div>
              </div>
            )}

            {/* Chat Header */}
            <div className="px-6 py-4 border-b border-white/10 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-500/20 flex items-center justify-center text-sky-400">
                <MessageSquare size={20} />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">AI Assistant</h2>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                  <span className="text-[10px] text-green-500/80 font-bold uppercase tracking-wider">Ready to answer</span>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
              {chatHistory.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center opacity-30 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full border border-white/20 flex items-center justify-center">
                    <Search size={24} />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Ask anything about your documents</p>
                    <p className="text-xs mt-1">"What are the main requirements in the project doc?"</p>
                  </div>
                </div>
              ) : (
                chatHistory.map((msg, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-[14px] leading-relaxed ${
                      msg.role === 'user' 
                        ? 'bg-sky-600 text-white shadow-lg shadow-sky-900/20 rounded-tr-none' 
                        : 'bg-white/10 text-white/90 border border-white/5 rounded-tl-none'
                    }`}>
                      {msg.content}
                    </div>
                  </motion.div>
                ))
              )}
              {isChatLoading && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="bg-white/10 px-4 py-3 rounded-2xl rounded-tl-none flex gap-1">
                    <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 bg-white/50 rounded-full" />
                    <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-white/50 rounded-full" />
                    <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-white/50 rounded-full" />
                  </div>
                </motion.div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-6 pt-0">
              <form 
                onSubmit={handleAsk}
                className="relative flex items-center gap-2"
              >
                <input 
                  type="text" 
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Type your question..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-4 pr-12 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition-all shadow-inner"
                />
                <button 
                  type="submit"
                  disabled={!query.trim() || isChatLoading}
                  className="absolute right-2 w-10 h-10 rounded-lg bg-sky-500 text-white flex items-center justify-center hover:bg-sky-400 disabled:opacity-50 disabled:grayscale transition-all shadow-lg shadow-sky-500/20"
                >
                  <Send size={18} />
                </button>
              </form>
              <p className="text-[10px] text-white/20 mt-3 text-center">
                AI can make mistakes. Consider checking important information.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
