const API_BASE =
  "https://zct-testbla-crgne6d4gcgkh0cj.northeurope-01.azurewebsites.net";

export async function textToSpeech(
  {
    text,
    voice,
    model = "tts-1",
    speed = 1,
    format = "mp3",
    instructions = "",
  },
  token
) {
  const fd = new FormData();
  fd.append("input_text", text);
  fd.append("voice", voice);
  fd.append("model", model);
  fd.append("speed", String(speed));
  fd.append("response_format", format);
  if (instructions) fd.append("instructions", instructions);

  const res = await fetch(`${API_BASE}/transcription/text-to-speech`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: fd,
  });

  if (!res.ok) {
    const { msg } = await res.json().catch(() => ({}));
    throw new Error(msg || `TTS error ${res.status}`);
  }
  return await res.blob();
}
