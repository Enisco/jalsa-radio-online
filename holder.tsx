// import type { Call, User } from "@stream-io/video-react-sdk";
// import {
//   CallingState,
//   LivestreamPlayer,
//   StreamCall,
//   StreamVideo,
//   StreamVideoClient,
//   useCallStateHooks,
// } from "@stream-io/video-react-sdk";
// import { useEffect, useRef, useState } from "react";
// import "./App.css";
// import HeaderCard from "./components/header";

// const apiKey = "qkq9wk3je9x2";
// const token =
//   "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJAc3RyZWFtLWlvL2Rhc2hib2FyZCIsImlhdCI6MTc2MzU2OTY3MSwiZXhwIjoxNzYzNjU2MDcxLCJ1c2VyX2lkIjoiIWFub24iLCJyb2xlIjoidmlld2VyIiwiY2FsbF9jaWRzIjpbImxpdmVzdHJlYW06bGl2ZXN0cmVhbV80NGJiYzhjMi04MGY3LTQwMDQtYjFjMy00NTBlODQ5M2Y3ZTgiXX0._sFaP3e4QSzq_0TKYxJogVz16QWSIiKD0JZ9hy4lsr4";
// const callId = "livestream_44bbc8c2-80f7-4004-b1c3-450e8493f7e8";
// const user: User = { type: "anonymous" };
// const client = new StreamVideoClient({ apiKey, user, token });
// const call = client.call("livestream", callId);

// function App() {
//   const [call] = useState<Call>(() => client.call("livestream", callId));

//   return (
//     <StreamVideo client={client}>
//       <StreamCall call={call}>
//         <HeaderCard />
//         <AudioLivestreamPlayer call={call} />
//       </StreamCall>
//     </StreamVideo>
//   );
// }

// function AudioLivestreamPlayer({ call }: { call: Call }) {
//   const [isPlaying, setIsPlaying] = useState(false);
//   const [callInitialized, setCallInitialized] = useState(false);
//   const [isReceivingAudio, setIsReceivingAudio] = useState(false);
//   const audioContextRef = useRef<AudioContext | null>(null);
//   const analyserRef = useRef<AnalyserNode | null>(null);
//   const animationFrameRef = useRef<number | null>(null);

//   const { useCallCallingState, useIsCallLive, useParticipants } =
//     useCallStateHooks();
//   const callingState = useCallCallingState();
//   const isLive = useIsCallLive();
//   const participants = useParticipants();

//   // Initialize call on mount
//   useEffect(() => {
//     console.log("🔧 Initializing call...");
//     call
//       .get()
//       .then(() => {
//         console.log("✅ Call loaded successfully");
//         setCallInitialized(true);
//       })
//       .catch((err) => {
//         console.error("❌ Failed to load call:", err);
//         console.log("🔄 Attempting to create call...");
//         call.getOrCreate().then(() => {
//           console.log("✅ Call created successfully");
//           setCallInitialized(true);
//         });
//       });
//   }, [call]);

//   // Monitor calling state changes
//   useEffect(() => {
//     console.log("📊 CALLING STATE:", callingState);
//     console.log("🔴 IS LIVE:", isLive);
//     console.log("👥 PARTICIPANTS:", participants.length);

//     if (callingState === CallingState.JOINED) {
//       console.log("✅ Successfully joined the call");
//     } else if (callingState === CallingState.RECONNECTING) {
//       console.log("🔄 Connection lost, reconnecting...");
//     } else if (callingState === CallingState.RECONNECTING_FAILED) {
//       console.log("❌ Reconnection failed");
//       if (isPlaying) {
//         console.log("🔄 Attempting to rejoin...");
//         call.join().catch((err) => console.error("❌ Rejoin failed:", err));
//       }
//     } else if (callingState === CallingState.OFFLINE) {
//       console.log("📴 No connection available");
//     } else if (callingState === CallingState.LEFT) {
//       console.log("👋 Left the call");
//     } else if (callingState === CallingState.IDLE) {
//       console.log("⏸️ Call is idle");
//     }
//   }, [callingState, isLive, participants, call, isPlaying]);

//   // Monitor audio stream reception
//   useEffect(() => {
//     const checkAudioStream = () => {
//       const audioElements = document.querySelectorAll("audio");
//       let hasAudio = false;

//       audioElements.forEach((audio) => {
//         if (audio.srcObject && (audio.srcObject as MediaStream).active) {
//           const audioTracks = (audio.srcObject as MediaStream).getAudioTracks();
//           if (audioTracks.length > 0 && audioTracks[0].enabled) {
//             hasAudio = true;
//             console.log("🎵 Audio track found:", {
//               trackId: audioTracks[0].id,
//               label: audioTracks[0].label,
//               enabled: audioTracks[0].enabled,
//               muted: audioTracks[0].muted,
//               readyState: audioTracks[0].readyState,
//             });
//           }
//         }
//       });

//       if (hasAudio !== isReceivingAudio) {
//         setIsReceivingAudio(hasAudio);
//         console.log(
//           hasAudio ? "✅ RECEIVING AUDIO STREAM" : "⚠️ NO AUDIO STREAM"
//         );
//       }
//     };

//     if (callingState === CallingState.JOINED) {
//       const interval = setInterval(checkAudioStream, 1000);
//       return () => clearInterval(interval);
//     }
//   }, [callingState, isReceivingAudio]);

//   // Setup audio visualization
//   useEffect(() => {
//     if (!isPlaying || callingState !== CallingState.JOINED) return;

//     const setupAudioVisualization = () => {
//       const audioElement = document.querySelector("audio") as HTMLAudioElement;

//       if (!audioElement || !audioElement.srcObject) {
//         console.log("⏳ Waiting for audio element...");
//         setTimeout(setupAudioVisualization, 500);
//         return;
//       }

//       console.log("🎨 Setting up audio visualization");

//       // Set maximum volume
//       audioElement.volume = 1.0;
//       console.log("🔊 Audio volume set to maximum (1.0)");

//       // Create audio context and analyser
//       if (!audioContextRef.current) {
//         audioContextRef.current = new AudioContext();
//         const source = audioContextRef.current.createMediaStreamSource(
//           audioElement.srcObject as MediaStream
//         );
//         analyserRef.current = audioContextRef.current.createAnalyser();
//         analyserRef.current.fftSize = 256;
//         source.connect(analyserRef.current);
//         console.log("✅ Audio context and analyser created");
//       }

//       animateWaveBars();
//     };

//     setupAudioVisualization();

//     return () => {
//       if (animationFrameRef.current) {
//         cancelAnimationFrame(animationFrameRef.current);
//       }
//     };
//   }, [isPlaying, callingState]);

//   // Animate wave bars based on audio
//   const animateWaveBars = () => {
//     if (!analyserRef.current) return;

//     const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
//     analyserRef.current.getByteFrequencyData(dataArray);

//     // Calculate average volume
//     const average = dataArray.reduce((a, b) => a + b) / dataArray.length;

//     // Update wave bars
//     const waveBars = document.querySelectorAll(".waveform span");
//     waveBars.forEach((bar, index) => {
//       const htmlBar = bar as HTMLElement;
//       const intensity = dataArray[index * 5] || average;
//       const scale = Math.max(0.2, intensity / 128);
//       htmlBar.style.transform = `scaleY(${scale})`;
//     });

//     animationFrameRef.current = requestAnimationFrame(animateWaveBars);
//   };

//   // Handle play/stop
//   const handleTogglePlay = async () => {
//     if (!callInitialized) {
//       console.log("⚠️ Call not initialized yet");
//       return;
//     }

//     if (!isPlaying) {
//       console.log("▶️ Starting to listen...");
//       setIsPlaying(true);

//       try {
//         await call.join();
//         console.log("✅ Joined call successfully");

//         // Disable video and mic for audio-only listening
//         await call.camera.disable();
//         await call.microphone.disable();
//         console.log("🎧 Audio-only mode enabled (camera and mic disabled)");

//         // Ensure maximum volume after a short delay
//         setTimeout(() => {
//           const audioElements = document.querySelectorAll("audio");
//           audioElements.forEach((audio) => {
//             audio.volume = 1.0;
//             console.log("🔊 Audio element volume set to maximum");
//           });
//         }, 1000);
//       } catch (err) {
//         console.error("❌ Failed to join call:", err);
//         setIsPlaying(false);
//       }
//     } else {
//       console.log("⏹️ Stopping listening...");
//       setIsPlaying(false);

//       try {
//         await call.leave();
//         console.log("✅ Left call successfully");

//         // Cleanup audio context
//         if (audioContextRef.current) {
//           audioContextRef.current.close();
//           audioContextRef.current = null;
//           analyserRef.current = null;
//           console.log("🧹 Audio context cleaned up");
//         }
//       } catch (err) {
//         console.error("❌ Failed to leave call:", err);
//       }
//     }
//   };

//   return (
//     <main className="main-content">
//       {isLive && <div className="live-pill">🔴 LIVE</div>}

//       {!isLive && callingState !== CallingState.JOINED && (
//         <div className="status-message">Stream is not live yet</div>
//       )}

//       {callingState === CallingState.RECONNECTING && (
//         <div className="status-message">🔄 Reconnecting...</div>
//       )}

//       {callingState === CallingState.RECONNECTING_FAILED && (
//         <div className="status-message error">
//           ❌ Connection failed. Retrying...
//         </div>
//       )}

//       <div className="audio-player-container">
//         <div className={`waveform ${isPlaying ? "playing" : ""}`}>
//           <span></span>
//           <span></span>
//           <span></span>
//           <span></span>
//           <span></span>
//           <span></span>
//           <span></span>
//           <span></span>
//           <span></span>
//           <span></span>
//         </div>

//         <button
//           className={`${isPlaying ? "stop-button" : "play-button"}`}
//           onClick={handleTogglePlay}
//           disabled={!callInitialized}
//         >
//           {isPlaying ? "Stop Listening" : "Start Listening"}
//         </button>
//       </div>

//       {/* Hidden audio container - SDK will render audio elements here */}
//       <div
//         style={{
//           position: "absolute",
//           width: "1px",
//           height: "1px",
//           overflow: "hidden",
//           opacity: 0,
//           pointerEvents: "none",
//         }}
//       >
//         {/* Audio elements will be automatically rendered by the SDK */}
//       </div>
//     </main>
//   );
// }

// function AppLive() {
//   return (
//     <StreamVideo client={client}>
//       <LivestreamPlayer callType="livestream" callId={callId} />
//     </StreamVideo>
//   );
// }

// // export default AppLive;
// export default App;
