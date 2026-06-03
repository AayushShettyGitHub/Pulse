import api from "./axiosInstance";

export async function connectGithubRepo(data) {
  const res = await api.post("/doc-agent/repos/connect", data);
  return res.data;
}

export async function getGithubRepos() {
  const res = await api.get("/doc-agent/repos");
  return res.data;
}

export async function disconnectGithubRepo(repoId) {
  await api.delete(`/doc-agent/repos/${repoId}`);
}

export async function syncGithubRepo(repoId) {
  const res = await api.post(`/doc-agent/repos/${repoId}/sync`);
  return res.data;
}

export async function getGithubCommitJobs(repoId) {
  const res = await api.get(`/doc-agent/repos/${repoId}/commits`);
  return res.data;
}

export async function triggerDocGeneration(repoId, payload) {
  const res = await api.post(`/doc-agent/repos/${repoId}/docs/generate`, payload);
  return res.data;
}
