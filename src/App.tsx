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
  const wakeLockRef = useRef<any>(null);

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
      // Release wake lock when stopping
      if (wakeLockRef.current) {
        wakeLockRef.current.release();
        wakeLockRef.current = null;
      }
      setHasAudio(false);
      return;
    }

    // Request wake lock to keep screen active
    requestWakeLock();

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
        } catch (err) {}
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

  // Handle visibility change to resume audio context
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is hidden/backgrounded
        if (audioContextRef.current && audioContextRef.current.state === 'running') {
          // Keep audio context running
          console.log('App backgrounded, audio continues');
        }
      } else {
        // Page is visible again
        if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
          audioContextRef.current.resume();
        }
        // Re-request wake lock when page becomes visible
        if (isPlaying && !wakeLockRef.current) {
          requestWakeLock();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isPlaying]);

  // Setup Media Session API for background audio and lock screen controls
  useEffect(() => {
    if (!isPlaying) {
      // Clear media session when stopped
      if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = null;
        navigator.mediaSession.playbackState = 'none';
      }
      return;
    }

    if ('mediaSession' in navigator) {
      // Set metadata for lock screen/notification
      navigator.mediaSession.metadata = new MediaMetadata({
        title: 'Live Radio Stream',
        artist: 'Your Radio Station',
        album: 'Live Broadcast',
        artwork: [
          { src: '/icon-96x96.png', sizes: '96x96', type: 'image/png' },
          { src: '/icon-128x128.png', sizes: '128x128', type: 'image/png' },
          { src: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-256x256.png', sizes: '256x256', type: 'image/png' },
          { src: '/icon-384x384.png', sizes: '384x384', type: 'image/png' },
          { src: '/icon-512x512.png', sizes: '512x512', type: 'image/png' },
        ],
      });

      // Set playback state
      navigator.mediaSession.playbackState = 'playing';

      // Setup action handlers for media controls
      navigator.mediaSession.setActionHandler('play', () => {
        setIsPlaying(true);
      });

      navigator.mediaSession.setActionHandler('pause', () => {
        setIsPlaying(false);
      });

      navigator.mediaSession.setActionHandler('stop', () => {
        setIsPlaying(false);
      });

      // Prevent seeking for live streams
      navigator.mediaSession.setActionHandler('seekbackward', null);
      navigator.mediaSession.setActionHandler('seekforward', null);
      navigator.mediaSession.setActionHandler('seekto', null);
    }

    return () => {
      if ('mediaSession' in navigator) {
        // Clear all action handlers
        navigator.mediaSession.setActionHandler('play', null);
        navigator.mediaSession.setActionHandler('pause', null);
        navigator.mediaSession.setActionHandler('stop', null);
      }
    };
  }, [isPlaying]);

  // Request wake lock to prevent screen from sleeping
  const requestWakeLock = async () => {
    try {
      if ('wakeLock' in navigator) {
        wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
        console.log('Wake lock acquired');
        
        wakeLockRef.current.addEventListener('release', () => {
          console.log('Wake lock released');
        });
      }
    } catch (err) {
      console.log('Wake lock error:', err);
    }
  };

  // Animate wave bars based on audio
  const animateWaveBars = () => {
    if (!analyserRef.current || !isPlaying) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    // Calculate average volume
    const average = dataArray.reduce((a, b) => a + b) / dataArray.length;

    // Check if there's audio
    if (average > 5) {
      setHasAudio(true);
    } else {
      setHasAudio(false);
    }

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
        {isPlaying && !isLive && (
          <div className="live-pill connecting">Connecting to radio...</div>
        )}
        {isLive && isPlaying && !hasAudio && (
          <div className="live-pill no-audio">Waiting for audio...</div>
        )}
        {isLive && isPlaying && hasAudio && (
          <div className="live-pill">🔴 LIVE</div>
        )}

        <div className="audio-player-container">
          <div className={`waveform ${hasAudio ? "playing" : ""}`}>
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
