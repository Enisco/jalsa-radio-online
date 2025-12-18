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

const apiKey = import.meta.env.VITE_STREAM_API_KEY;
const token = import.meta.env.VITE_STREAM_TOKEN;
const callId = import.meta.env.VITE_STREAM_CALL_ID;

const user: User = { type: "anonymous" };
const client = new StreamVideoClient({ apiKey, user, token });

function App() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [hasAudio, setHasAudio] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  //  MEDIA SESSION (LOCK SCREEN / NOTIFICATION CONTROLS)
  useEffect(() => {
    if (!isPlaying || !("mediaSession" in navigator)) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: "Live Radio",
      artist: "Your Station Name",
      album: "Live Stream",
      artwork: [
        { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
        { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      ],
    });

    navigator.mediaSession.setActionHandler("play", () => {
      setIsPlaying(true);
      audioElementRef.current?.play().catch(() => {});
    });

    navigator.mediaSession.setActionHandler("pause", () => {
      setIsPlaying(false);
      audioElementRef.current?.pause();
    });

    navigator.mediaSession.setActionHandler("stop", () => {
      setIsPlaying(false);
      audioElementRef.current?.pause();
    });

    return () => {
      navigator.mediaSession.setActionHandler("play", null);
      navigator.mediaSession.setActionHandler("pause", null);
      navigator.mediaSession.setActionHandler("stop", null);
    };
  }, [isPlaying]);

  //  AUDIO + VISUALIZATION SETUP
  useEffect(() => {
    if (!isPlaying) {
      cleanupAudio();
      return;
    }

    const setupAudio = () => {
      const audio = document.querySelector("audio") as HTMLAudioElement | null;
      if (!audio || !audio.srcObject) {
        setTimeout(setupAudio, 500);
        return;
      }

      audioElementRef.current = audio;
      audio.volume = 1.0;

      const stream = audio.srcObject as MediaStream;
      const tracks = stream.getAudioTracks();
      if (!tracks.length) return;

      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
        const source = audioContextRef.current.createMediaStreamSource(stream);
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 256;
        analyserRef.current.smoothingTimeConstant = 0.8;

        source.connect(analyserRef.current);
        animateWaveBars();
      }
    };

    setupAudio();
  }, [isPlaying]);

  //  VISIBILITY HANDLING (BACKGROUND SAFE)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
      } else if (isPlaying) {
        animateWaveBars();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, [isPlaying]);

  //  LIVE STATUS CHECK
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      const video = document.querySelector("video");
      setIsLive(!!video?.srcObject);
    }, 2000);

    return () => clearInterval(interval);
  }, [isPlaying]);

  //  AUDIO VISUALIZER
  const animateWaveBars = () => {
    if (!analyserRef.current || document.hidden || !isPlaying) return;

    const data = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(data);

    const avg = data.reduce((a, b) => a + b) / data.length;
    setHasAudio(avg > 5);

    document.querySelectorAll(".waveform span").forEach((bar, i) => {
      const value = data[i * 4] || avg;
      const scale = Math.max(0.2, value / 128);
      (bar as HTMLElement).style.transform = `scaleY(${scale})`;
    });

    animationFrameRef.current = requestAnimationFrame(animateWaveBars);
  };

  //  CLEANUP
  const cleanupAudio = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    analyserRef.current = null;
    setHasAudio(false);
  };

  //  UI
  return (
    <>
      <HeaderCard />

      <main className="main-content">
        {isPlaying && !isLive && (
          <div className="live-pill connecting">Connecting…</div>
        )}
        {isLive && isPlaying && !hasAudio && (
          <div className="live-pill no-audio">Waiting for audio…</div>
        )}
        {isLive && isPlaying && hasAudio && (
          <div className="live-pill">🔴 LIVE</div>
        )}

        <div className="audio-player-container">
          <div className={`waveform ${hasAudio ? "playing" : ""}`}>
            {Array.from({ length: 10 }).map((_, i) => (
              <span key={i} />
            ))}
          </div>

          <button
            className={isPlaying ? "stop-button" : "play-button"}
            onClick={() => setIsPlaying((p) => !p)}
          >
            {isPlaying ? "Stop Listening" : "Start Listening"}
          </button>
        </div>

        {/* Hidden audio/video renderer */}
        {isPlaying && (
          <div
            style={{
              position: "fixed",
              width: 1,
              height: 1,
              opacity: 0,
              pointerEvents: "none",
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
