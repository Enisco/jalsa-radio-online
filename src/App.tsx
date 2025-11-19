import { useState } from "react";
import "./App.css";
import HeaderCard from "./components/header";

function App() {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <>
      <HeaderCard />

      <main className="main-content">
        <div className="audio-player-container">
          <div className={`waveform ${isPlaying ? "playing" : ""}`}>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
          </div>

          <button
            className={`${isPlaying ? "stop-button" : "play-button"}`}
            onClick={() => setIsPlaying(!isPlaying)}
          >
            {isPlaying ? "Stop Listening" : "Start Listening"}
          </button>
        </div>
      </main>
    </>
  );
}

export default App;
