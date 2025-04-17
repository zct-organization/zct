const API_BASE = process.env.REACT_APP_API_URL;

export async function getHistory(token) {
  const res = await fetch(`${API_BASE}/transcription/history`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) throw new Error("Can’t load history");
  return await res.json();
}

export async function getHistoryAudio(id, token) {
  const res = await fetch(`${API_BASE}/transcription/history/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) throw new Error("Audio not found");
  return await res.blob();
}
