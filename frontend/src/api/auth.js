import api from "./axiosInstance";

export async function login(username, password) {
  try {
    const res = await api.post("/auth/login", { username, password });
    localStorage.setItem("token", res.data.token);
    localStorage.setItem("username", res.data.username);
    return res.data;
  } catch (err) {
    throw new Error(err.response?.data || "Login failed");
  }
}

export async function register(username, email, password) {
  try {
    const res = await api.post("/auth/register", { username, email, password });
    return res.data;
  } catch (err) {
    throw new Error(err.response?.data || "Registration failed");
  }
}

export function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("username");
}
