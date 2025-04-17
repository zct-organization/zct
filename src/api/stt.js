import { API_BASE } from "../constants/constants";

export async function speechToText(
  file,
  {
    model = "whisper-1",
    language = "en",
    format = "verbose_json",
    prompt = "",
    temperature = 0,
  } = {},
  token
) {
  const fd = new FormData();
  fd.append("audio", file);
  fd.append("model", model);
  fd.append("language", language);
  fd.append("response_format", format);
  fd.append("temperature", String(temperature));
  if (prompt) fd.append("prompt", prompt);

  const res = await fetch(`${API_BASE}/transcription/speech-to-text`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: fd,
  });

  if (res.status === 401) {
    const err = new Error("Unauthorized");
    err.code = 401;
    throw err;
  }

  if (!res.ok) {
    const { msg } = await res.json().catch(() => ({}));
    throw new Error(msg || `STT error ${res.status}`);
  }

  const data = await res.json();
  return {
    text: data.text?.trim() ?? "",
    language: data.language ?? "",
    duration: data.duration ?? 0,
  };
}