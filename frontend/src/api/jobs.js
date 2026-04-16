import api from "./axiosInstance";

export async function createJob(data) {
  const res = await api.post("/v1/jobs", data);
  return res.data;
}

export async function getJobs() {
  const res = await api.get("/v1/jobs");
  return res.data;
}

export async function getJob(id) {
  const res = await api.get(`/v1/jobs/${id}`);
  return res.data;
}

export async function getJobHistory(id) {
  const res = await api.get(`/v1/jobs/${id}/history`);
  return res.data;
}

export async function getAttendanceStats(jobId) {
  const res = await api.get(`/v1/attendance/${jobId}`);
  return res.data;
}

export async function getJobsByType(type) {
  const all = await getJobs();
  return Array.isArray(all) ? all.filter(j => (j.jobType || "HTTP") === type) : [];
}

export async function deleteJob(id) {
  await api.delete(`/v1/jobs/${id}`);
}

export async function pauseJob(id) {
  const res = await api.put(`/v1/jobs/${id}/pause`);
  return res.data;
}

export async function resumeJob(id) {
  const res = await api.put(`/v1/jobs/${id}/resume`);
  return res.data;
}

export async function markAttendance(jobId, records) {
  const res = await api.post(`/v1/attendance/${jobId}`, records);
  return res.data;
}
