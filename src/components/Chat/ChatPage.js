import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { textToSpeech } from "../../api/tts";
import { speechToText } from "../../api/stt";
import { AuthContext } from "../../contexts/AuthContext";
import "./ChatPage.css";

export default function ChatPage() {
  const { token } = useContext(AuthContext);
  const navigate = useNavigate();

  const voices = [
    { value: "alloy", label: "Alloy", sample: "/voices/alloy.mp3" },
    { value: "ash", label: "Ash", sample: "/voices/ash.mp3" },
    { value: "coral", label: "Coral", sample: "/voices/coral.mp3" },
    { value: "echo", label: "Echo", sample: "/voices/echo.mp3" },
    { value: "fable", label: "Fable", sample: "/voices/fable.mp3" },
    { value: "onyx", label: "Onyx", sample: "/voices/onyx.mp3" },
    { value: "nova", label: "Nova", sample: "/voices/nova.mp3" },
    { value: "sage", label: "Sage", sample: "/voices/sage.mp3" },
    { value: "shimmer", label: "Shimmer", sample: "/voices/shimmer.mp3" },
    { value: "verse", label: "Verse", sample: "/voices/verse.mp3" },
  ];

  const speeds = [
    { value: 0.25, label: "0.25×" },
    { value: 0.4, label: "0.4×" },
    { value: 1, label: "1×" },
  ];

  const formats = [
    { value: "mp3", label: "MP3" },
    { value: "opus", label: "Opus" },
    { value: "aac", label: "AAC" },
    { value: "flac", label: "FLAC" },
    { value: "wav", label: "WAV" },
    { value: "pcm", label: "PCM" },
  ];

  const [mode, setMode] = useState("tts");
  const [text, setText] = useState("");
  const [voice, setVoice] = useState("alloy");
  const [speed, setSpeed] = useState(1);
  const [format, setFormat] = useState("mp3");
  const [audioUrl, setAudioUrl] = useState("");
  const [transcript, setTranscript] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const playPreview = (v) => {
    const url = voices.find((x) => x.value === v).sample;
    new Audio(url).play();
  };

  const handleTTS = async () => {
    if (!text.trim()) return;
    setError("");
    setAudioUrl("");
    setLoading(true);
    try {
      const blob = await textToSpeech({ text, voice, speed, format }, token);
      setAudioUrl(URL.createObjectURL(blob));
    } catch (e) {
      if (e.code === 401) {
        navigate("/login");
      } else {
        setError(e.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSTT = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setError("");
    setTranscript("");
    setLoading(true);
    try {
      const { text: tx, language, duration } = await speechToText(file, {}, token);
      setTranscript(`Language: ${language}\nDuration: ${duration}s\n\n${tx}`);
    } catch (e) {
      if (e.code === 401) {
        navigate("/login");
      } else {
        setError(e.message);
      }
    } finally {
      setLoading(false);
      e.target.value = "";
    }
  };

  return (
    <main className="chat-root">
      <select
        className="mode-dropdown"
        value={mode}
        onChange={(e) => setMode(e.target.value)}
      >
        <option value="tts">Text → Speech</option>
        <option value="stt">Speech → Text</option>
      </select>

      <section className="chat-core">
        <h2 className="chat-title">What can I help with?</h2>

        {mode === "tts" && (
          <div className="preview-list">
            {voices.map((v) => (
              <button key={v.value} className="preview-btn" onClick={() => playPreview(v.value)}>
                {v.label} ▶️
              </button>
            ))}
          </div>
        )}

        {mode === "tts" ? (
          <>
            <div className="input-bar">
              <textarea
                className="input-field"
                placeholder="Enter text..."
                rows={1}
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
              <button className="send-btn" disabled={loading || !text.trim()} onClick={handleTTS}>
                ▶️
              </button>
            </div>

            <div className="option-row">
              <select className="pill" value={voice} onChange={(e) => setVoice(e.target.value)}>
                {voices.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <select className="pill" value={speed} onChange={(e) => setSpeed(Number(e.target.value))}>
                {speeds.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <select className="pill" value={format} onChange={(e) => setFormat(e.target.value)}>
                {formats.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            {audioUrl && (
              <div className="result-block">
                <audio controls src={audioUrl} />
                <a className="pill primary" href={audioUrl} download={`tts_output.${format}`}>
                  Download
                </a>
              </div>
            )}
          </>
        ) : (
          <>
            <label className="upload-area">
              <input type="file" accept="audio/*" onChange={handleSTT} disabled={loading} />
              <span>Choose audio…</span>
            </label>

            {transcript && (
              <textarea className="input-field" readOnly value={transcript} rows={6} />
            )}
          </>
        )}

        {error && <p className="error-msg">{error}</p>}
      </section>
    </main>
  );
}
