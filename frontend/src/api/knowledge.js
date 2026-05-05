import axiosInstance from "./axiosInstance";

export const uploadDocument = async (jobId, file) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("jobId", jobId);

  const response = await axiosInstance.post("/knowledge/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

export const getKnowledgeByJob = async (jobId) => {
  const response = await axiosInstance.get(`/knowledge/job/${jobId}`);
  return response.data;
};

export const askQuestion = async (jobId, query) => {
  const response = await axiosInstance.post(`/chat/${jobId}`, query, {
    headers: {
      "Content-Type": "text/plain",
    },
  });
  return response.data;
};
