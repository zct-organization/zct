import React, { useState, useContext, useEffect } from "react";
import { textToSpeech } from "../../api/tts";
import { speechToText } from "../../api/stt";
import { getHistory, getHistoryAudio } from "../../api/history";
import { AuthContext } from "../../contexts/AuthContext";
import Select from "react-select";
import FancyAudio from "../common/FancyAudio";
import "./ChatPage.css";
import alloyMP3 from "./voices/alloy.mp3";
import ashMP3 from "./voices/ash.mp3";
import coralMP3 from "./voices/coral.mp3";
import echoMP3 from "./voices/echo.mp3";
import fableMP3 from "./voices/fable.mp3";
import onyxMP3 from "./voices/onyx.mp3";
import novaMP3 from "./voices/nova.mp3";
import sageMP3 from "./voices/sage.mp3";
import shimmerMP3 from "./voices/shimmer.mp3";

export default function ChatPage() {
  const { token } = useContext(AuthContext);

  const voices = [
    { value: "alloy", label: "Alloy", sample: alloyMP3 },
    { value: "ash", label: "Ash", sample: ashMP3 },
    { value: "coral", label: "Coral", sample: coralMP3 },
    { value: "echo", label: "Echo", sample: echoMP3 },
    { value: "fable", label: "Fable", sample: fableMP3 },
    { value: "onyx", label: "Onyx", sample: onyxMP3 },
    { value: "nova", label: "Nova", sample: novaMP3 },
    { value: "sage", label: "Sage", sample: sageMP3 },
    { value: "shimmer", label: "Shimmer", sample: shimmerMP3 },
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

  const [showSidebar, setShowSidebar] = useState(true);

  const [mode, setMode] = useState("tts");
  const [text, setText] = useState("");
  const [voice, setVoice] = useState("alloy");
  const [speed, setSpeed] = useState(1);
  const [format, setFormat] = useState("mp3");

  const [audioUrl, setAudioUrl] = useState("");
  const [transcript, setTranscript] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [history, setHistory] = useState([]);
  useEffect(() => {
    (async () => {
      try {
        setHistory(await getHistory(token));
      } catch (e) {
        console.error(e);
      }
    })();
  }, [token]);

  const resetFields = () => {
    setText("");
    setTranscript("");
    setAudioUrl("");
    setError("");
  };

  const playPreview = (v) =>
    new Audio(voices.find((x) => x.value === v).sample).play();

  const handleModeChange = (val) => {
    resetFields();
    setMode(val);
  };

  async function handleTTS() {
    if (!text.trim()) return;
    setLoading(true);
    setError("");
    setAudioUrl("");
    try {
      const blob = await textToSpeech({ text, voice, speed, format }, token);
      setAudioUrl(URL.createObjectURL(blob));
      setHistory(await getHistory(token));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSTT(e) {
    const file = e.target.files[0];
    if (!file) return;
    setLoading(true);
    setError("");
    setTranscript("");
    try {
      const {
        text: tx,
        language,
        duration,
      } = await speechToText(file, {}, token);
      setTranscript(`Language: ${language}\nDuration: ${duration}s\n\n${tx}`);
      setHistory(await getHistory(token));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
      e.target.value = "";
    }
  }

  async function loadFromHistory(item) {
    resetFields();
    if (item.request_type === "tts") {
      handleModeChange("tts");
      setText(item.input_text ?? "");
      try {
        const blob = await getHistoryAudio(item.id, token);
        setAudioUrl(URL.createObjectURL(blob));
      } catch (e) {
        setError(e.message);
      }
    } else {
      handleModeChange("stt");
      setTranscript(item.transcript_text ?? "");
    }
  }

  const selectStyles = {
    control: (base, state) => ({
      ...base,
      background: "var(--card-bg)",
      borderRadius: 999,
      border: state.isFocused
        ? `2px solid var(--link)`
        : `2px solid var(--primary)`,
      boxShadow: state.isFocused
        ? `0 0 0 2px var(--link)`
        : "0 2px 6px rgba(0,0,0,.08)",
      minHeight: "46px",
      paddingLeft: "1rem",
      color: "var(--text)",
      cursor: "pointer",
    }),
    singleValue: (base) => ({ ...base, color: "var(--text)", fontWeight: 600 }),
    menu: (base) => ({
      ...base,
      background: "var(--card-bg)",
      borderRadius: 12,
      boxShadow: "0 4px 16px rgba(0,0,0,.25)",
      padding: 4,
      zIndex: 10,
    }),
    option: (base, state) => ({
      ...base,
      background: state.isSelected
        ? "var(--primary)"
        : state.isFocused
        ? "rgba(var(--link-rgb), .12)"
        : "transparent",
      color: state.isSelected ? "#fff" : "var(--text)",
      fontWeight: state.isSelected ? 600 : 400,
      borderRadius: 8,
      cursor: "pointer",
    }),
    indicatorSeparator: () => ({ display: "none" }),
    dropdownIndicator: (base) => ({
      ...base,
      paddingRight: "1rem",
      color: "var(--link)",
    }),
  };

  return (
    <div className="page-wrapper">
      <aside className={`sidebar ${showSidebar ? "" : "collapsed"}`}>
        <h3>History</h3>
        <ul className="hist-list">
          {history.map((h) => (
            <li key={h.id}>
              <button onClick={() => loadFromHistory(h)}>
                {h.request_type.toUpperCase()} •{" "}
                {(h.input_text || h.transcript_text).slice(0, 25)}
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <div
        className="header-bar"
        style={{ marginLeft: showSidebar ? "272px" : "30px" }}
      >
        <button
          className="toggle-btn"
          onClick={() => setShowSidebar((s) => !s)}
          title={showSidebar ? "Hide history" : "Show history"}
        >
          {showSidebar ? "⮜" : "⮞"}
        </button>

        <Select
          className="mode-select"
          classNamePrefix="mode"
          styles={selectStyles}
          value={{
            label: mode === "tts" ? "Text → Speech" : "Speech → Text",
            value: mode,
          }}
          onChange={(opt) => handleModeChange(opt.value)}
          options={[
            { value: "tts", label: "Text → Speech" },
            { value: "stt", label: "Speech → Text" },
          ]}
        />
      </div>

      <main className="main-area">
        <section className="chat-core">
          <h2 className="chat-title">What can I help with?</h2>

          {mode === "tts" && (
            <div className="preview-list">
              {voices.map((v) => (
                <button
                  key={v.value}
                  className="preview-btn"
                  onClick={() => playPreview(v.value)}
                >
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
                  rows={1}
                  placeholder="Enter text..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                />
                <button
                  className="send-btn"
                  disabled={loading || !text.trim()}
                  onClick={handleTTS}
                  aria-label="Send"
                >
                  <svg
                    className="send-icon"
                    width="22"
                    height="22"
                    viewBox="0 0 32 32"
                  >
                    <path
                      fill="currentColor"
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M15.1918 8.90615C15.6381 8.45983 16.3618 8.45983 16.8081 8.90615L21.9509 14.049C22.3972 14.4953 22.3972 15.2189 21.9509 15.6652C21.5046 16.1116 20.781 16.1116 20.3347 15.6652L17.1428 12.4734V22.2857C17.1428 22.9169 16.6311 23.4286 15.9999 23.4286C15.3688 23.4286 14.8571 22.9169 14.8571 22.2857V12.4734L11.6652 15.6652C11.2189 16.1116 10.4953 16.1116 10.049 15.6652C9.60265 15.2189 9.60265 14.4953 10.049 14.049L15.1918 8.90615Z"
                    />
                  </svg>
                </button>
              </div>

              <div className="option-row">
                <select
                  className="pill"
                  value={voice}
                  onChange={(e) => setVoice(e.target.value)}
                >
                  {voices.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <select
                  className="pill"
                  value={speed}
                  onChange={(e) => setSpeed(Number(e.target.value))}
                >
                  {speeds.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <select
                  className="pill"
                  value={format}
                  onChange={(e) => setFormat(e.target.value)}
                >
                  {formats.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              {audioUrl && (
                <div className="result-block">
                  <FancyAudio src={audioUrl} />
                  <a
                    className="pill primary"
                    href={audioUrl}
                    download={`tts_output.${format}`}
                  >
                    Download
                  </a>
                </div>
              )}
            </>
          ) : (
            <>
              <label className="upload-area">
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleSTT}
                  disabled={loading}
                />
                <span>Choose audio…</span>
              </label>
              {transcript && (
                <textarea
                  className="input-field"
                  readOnly
                  rows={6}
                  value={transcript}
                />
              )}
            </>
          )}

          {error && <p className="error-msg">{error}</p>}
        </section>
      </main>
    </div>
  );
}
