// src/components/common/FancyAudio.js
import React, { useRef, useState } from 'react';
import './FancyAudio.css';

export default function FancyAudio({ src }) {
  const audioRef = useRef(null);
  const [isPlaying, setPlaying] = useState(false);
  const [progress,  setProgress] = useState(0);   // 0‒1

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) a.play(); else a.pause();
  };

  const onPlay  = () => setPlaying(true);
  const onPause = () => setPlaying(false);
  const onTime  = () => {
    const a = audioRef.current;
    setProgress(a.currentTime / a.duration);
  };

  return (
    <div className="fancy-audio">
      <button className="fa-btn" onClick={toggle}>
        {isPlaying ? '❚❚' : '▶'}
      </button>

      <div className="fa-bar" onClick={(e)=>{
        const a = audioRef.current;
        const rect = e.currentTarget.getBoundingClientRect();
        const pct  = (e.clientX - rect.left) / rect.width;
        a.currentTime = pct * a.duration;
      }}>
        <div className="fa-fill" style={{width: `${progress*100}%`}}/>
      </div>

      <audio
        ref={audioRef}
        src={src}
        onPlay={onPlay}
        onPause={onPause}
        onTimeUpdate={onTime}
      />
    </div>
  );
}
