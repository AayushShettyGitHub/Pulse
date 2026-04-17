import api from "./axiosInstance";

export async function login(username, password) {
  try {
    const res = await api.post("/auth/login", { username, password });
    let data = res.data;
    console.log("Login Response type:", typeof data);
    console.log("Login Response data:", JSON.stringify(data));
    
    if (typeof data === "string" && data.startsWith("{")) {
       try { data = JSON.parse(data); } catch {}
    }
    
    const token = data.token || data.accessToken;
    if (token) {
      localStorage.setItem("token", token);
      localStorage.setItem("username", data.username || username);
    } else {
      console.error("Login successful but no token received. Data:", data);
    }
    return data;
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
