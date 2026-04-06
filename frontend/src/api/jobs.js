import { getAuthHeader } from "./auth";

const API_BASE = "http://localhost:8081/api/v1/jobs";

export async function createJob(data) {
  const res = await fetch(API_BASE, {
    method: "POST",
    headers: { 
        "Content-Type": "application/json",
        ...getAuthHeader()
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create job");
  return res.json();
}

export async function getJobs() {
  const res = await fetch(API_BASE, {
    headers: { ...getAuthHeader() }
  });
  if (!res.ok) throw new Error("Failed to fetch jobs");
  return res.json();
}

export async function getJob(id) {
  const res = await fetch(`${API_BASE}/${id}`, {
    headers: { ...getAuthHeader() }
  });
  if (!res.ok) throw new Error("Failed to fetch job");
  return res.json();
}

export async function getJobHistory(id) {
  const res = await fetch(`${API_BASE}/${id}/history`, {
    headers: { ...getAuthHeader() }
  });
  if (!res.ok) throw new Error("Failed to fetch job history");
  return res.json();
}

export async function getJobsByType(type) {
  const all = await getJobs();
  return all.filter(j => (j.jobType || "HTTP") === type);
}

export async function deleteJob(id) {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: "DELETE",
    headers: { ...getAuthHeader() }
  });
  if (!res.ok) throw new Error("Failed to delete job");
}

export async function pauseJob(id) {
  const res = await fetch(`${API_BASE}/${id}/pause`, {
    method: "PUT",
    headers: { ...getAuthHeader() }
  });
  if (!res.ok) throw new Error("Failed to pause job");
  return res.json();
}

export async function resumeJob(id) {
  const res = await fetch(`${API_BASE}/${id}/resume`, {
    method: "PUT",
    headers: { ...getAuthHeader() }
  });
  if (!res.ok) throw new Error("Failed to resume job");
  return res.json();
}
