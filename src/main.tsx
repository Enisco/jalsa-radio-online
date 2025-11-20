import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client'; // Use the named import
import App from './App.tsx';
import './index.css';

import { StreamTheme } from "@stream-io/video-react-sdk";

import "@stream-io/video-react-sdk/dist/css/styles.css";

const container = document.getElementById('root');

if (container) {
  createRoot(container).render(
    <StrictMode>
      <StreamTheme style={{ fontFamily: "sans-serif", color: "white" }}>
        <App />
      </StreamTheme>
    </StrictMode>,
  );
} else {
  console.error("Root element not found in the document.");
}
