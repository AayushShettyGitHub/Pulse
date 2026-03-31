const API_BASE = "http://localhost:8081/api/auth";

export async function login(username, password) {
  const res = await fetch(`${API_BASE}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    const error = await res.text();
    throw new Error(error || "Login failed");
  }
  const data = await res.json();
  localStorage.setItem("token", data.token);
  localStorage.setItem("username", data.username);
  return data;
}

export async function register(username, password) {
  const res = await fetch(`${API_BASE}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    const error = await res.text();
    throw new Error(error || "Registration failed");
  }
  return res.text();
}

export function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("username");
}

export function getAuthHeader() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}
