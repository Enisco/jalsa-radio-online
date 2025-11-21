import type { User } from "@stream-io/video-react-sdk";
import {
  LivestreamPlayer,
  StreamVideo,
  StreamVideoClient,
} from "@stream-io/video-react-sdk";
import "@stream-io/video-react-sdk/dist/css/styles.css";
import { useEffect, useRef, useState } from "react";
import "./App.css";
import HeaderCard from "./components/header";

const apiKey = import.meta.env.STREAM_API_KEY;
const token = import.meta.env.STREAM_TOKEN;
const callId = import.meta.env.STREAM_CALL_ID;
const user: User = { type: "anonymous" };
const client = new StreamVideoClient({ apiKey, user, token });

function App() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // To monitor for audio elements and set up visualization
  useEffect(() => {
    if (!isPlaying) {
      // Cleanup when not playing
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
        analyserRef.current = null;
      }
      return;
    }

    const setupAudioVisualization = () => {
      const audioElement = document.querySelector("audio") as HTMLAudioElement;

      if (!audioElement || !audioElement.srcObject) {
        setTimeout(setupAudioVisualization, 500);
        return;
      }

      audioElement.volume = 1.0;

      // Check if audio track is active
      const stream = audioElement.srcObject as MediaStream;
      const audioTracks = stream.getAudioTracks();
      if (!audioContextRef.current && audioTracks.length > 0) {
        try {
          audioContextRef.current = new AudioContext();
          const source =
            audioContextRef.current.createMediaStreamSource(stream);
          analyserRef.current = audioContextRef.current.createAnalyser();
          analyserRef.current.fftSize = 256;
          analyserRef.current.smoothingTimeConstant = 0.8;
          source.connect(analyserRef.current);

          animateWaveBars();
        } catch (err) {
        }
      }
    };

    const timeoutId = setTimeout(setupAudioVisualization, 1000);
    return () => clearTimeout(timeoutId);
  }, [isPlaying]);

  // Check if stream is live
  useEffect(() => {
    const checkLiveStatus = () => {
      const videoElement = document.querySelector("video");
      if (videoElement && videoElement.srcObject) {
        setIsLive(true);
      } else {
        setIsLive(false);
      }
    };

    if (isPlaying) {
      const interval = setInterval(checkLiveStatus, 2000);
      checkLiveStatus(); // Check immediately
      return () => clearInterval(interval);
    }
  }, [isPlaying]);

  // Animate wave bars based on audio
  const animateWaveBars = () => {
    if (!analyserRef.current || !isPlaying) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    // Calculate average volume
    const average = dataArray.reduce((a, b) => a + b) / dataArray.length;

    // Update wave bars
    const waveBars = document.querySelectorAll(".waveform span");
    waveBars.forEach((bar, index) => {
      const htmlBar = bar as HTMLElement;
      const intensity = dataArray[index * 5] || average;
      const scale = Math.max(0.2, intensity / 128);
      htmlBar.style.transform = `scaleY(${scale})`;
    });

    animationFrameRef.current = requestAnimationFrame(animateWaveBars);
  };

  return (
    <>
      <HeaderCard />
      <main className="main-content">
        {isLive && isPlaying && <div className="live-pill">🔴 LIVE</div>}

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
            onClick={() => {
              setIsPlaying(!isPlaying);
            }}
          >
            {isPlaying ? "Stop Listening" : "Start Listening"}
          </button>
        </div>

        {/* Hidden LivestreamPlayer - renders only when playing */}
        {isPlaying && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "1px",
              height: "1px",
              opacity: 0,
              pointerEvents: "none",
              overflow: "hidden",
            }}
          >
            <StreamVideo client={client}>
              <LivestreamPlayer callType="livestream" callId={callId} />
            </StreamVideo>
          </div>
        )}
      </main>
    </>
  );
}

export default App;
