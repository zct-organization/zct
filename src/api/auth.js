const API_BASE = process.env.REACT_APP_API_URL;

export async function registerUser(username, password) {
  const res = await fetch(`${API_BASE}/users/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    const { message } = await res.json();
    throw new Error(message || "Registration failed");
  }
  const { token } = await res.json();
  return token;
}

export async function loginUser(username, password) {
  const res = await fetch(`${API_BASE}/users/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    const { message } = await res.json();
    throw new Error(message || "Login failed");
  }
  const { token } = await res.json();
  return token;
}
