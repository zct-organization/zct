import { API_BASE } from "../constants/constants";

export async function registerUser(username, password) {
  const res = await fetch(`${API_BASE}/users/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    const { msg } = await res.json().catch(() => ({}));
    throw new Error(msg || "Registration failed");
  }
  const { token, user } = await res.json();
  return { token, user };
}

export async function loginUser(username, password) {
  const res = await fetch(`${API_BASE}/users/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    const { msg } = await res.json().catch(() => ({}));
    throw new Error(msg || "Login failed");
  }
  const { token, user } = await res.json();
  return { token, user };
}
