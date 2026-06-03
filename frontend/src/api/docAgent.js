import axiosInstance from "./axiosInstance";

export const submitDocWebhook = async (payload) => {
  const response = await axiosInstance.post("/doc-agent/webhook", payload);
  return response.data;
};

export const getDocJobs = async () => {
  const response = await axiosInstance.get("/doc-agent/jobs");
  return response.data;
};

export const getDocArtifacts = async (jobId) => {
  const response = await axiosInstance.get(`/doc-agent/jobs/${jobId}/artifacts`);
  return response.data;
};

export const getAllDocArtifacts = async () => {
  const response = await axiosInstance.get("/doc-agent/artifacts");
  return response.data;
};

export const downloadDocArtifact = async (artifactId) => {
  const response = await axiosInstance.get(`/doc-agent/artifacts/${artifactId}/download`, {
    responseType: "blob",
  });
  return response.data;
};
