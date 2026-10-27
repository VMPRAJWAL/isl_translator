# ISL Bridge — Indian Sign Language Translator Prototype

A beginner-friendly React + Vite front-end prototype for an Indian Sign Language (ISL) communication app. It is designed around two main modes: **Live translation** and **Chat rooms**. There is no login or email collection.

## What is included

- Responsive dashboard / splash page without login.
- Live translation role choice: DD (signing) or NP (text/voice).
- Two-way live translation UI flow, caption area, message textbox, browser speech recognition where supported, and browser text-to-speech.
- A CSS-illustrated avatar placeholder with larger hands to make the signing-avatar concept visible in demos.
- Create room with a generated 8-digit code and QR code.
- Join room by entering an 8-digit code.
- QR camera preview page (camera permission is requested only when selected).
- Multi-person meeting-style UI, text chat, role-based layout, and session history.
- Responsive layout for desktop and mobile.

## Important: prototype vs real translator

This package is a **deployable front-end prototype**, not a complete, production-ready ISL translation engine. The current UI does not yet recognize actual Indian Sign Language gestures or animate a real 3D GLB avatar. It uses an illustrated avatar placeholder, and the camera page provides a preview but does not decode QR codes.

Real sign-language translation needs a trained ISL recognition model and dataset, a validated mapping from recognized signs to text, and a real 3D avatar with ISL animations/phonemes/pose sequences. English browser speech recognition is only a browser API demo and is not an ISL recognizer. Text-to-speech uses the browser's speech synthesis.

## Beginner-friendly stack

- **React** — build UI as reusable components.
- **Vite** — run locally and build a deployable static website.
- **Plain CSS** — styling, responsive layout, and illustrated avatar placeholder.
- **Lucide React** — icons.
- **qrcode.react** — render a QR code for a room invite.
- **Web Speech API** — optional browser speech recognition and text-to-speech.

No database, backend, login, API key, or environment variables are needed for the current demo. Room codes and messages are local UI state. This means the rooms are **not shared across different devices** and the history is lost on refresh.

## Run locally

Install Node.js LTS (18+ recommended), then in this folder run:

```bash
npm install
npm run dev
```

Vite will print a local URL, usually `http://localhost:5173`. Open it in Chrome for the best Web Speech API support.

Create a production build:

```bash
npm run build
npm run preview
```

The production website is generated in `dist/`.

## Deploy (easy options)

### Vercel
1. Upload this folder to a GitHub repository.
2. Import the repository in Vercel.
3. Framework preset: **Vite**.
4. Build command: `npm run build`.
5. Output directory: `dist`.
6. Deploy.

### Netlify
1. Upload the repository to Netlify or connect GitHub.
2. Build command: `npm run build`.
3. Publish directory: `dist`.

The included `vercel.json` and `netlify.toml` provide SPA fallback routing defaults.

## Demo room

Use username `Praju` (or any name) and choose a role. To test joining an existing demo room, enter:

`48273106`

Because this is a front-end-only demo, it creates a local mock room rather than connecting to another device.

## Recommended next implementation steps

1. Replace the avatar illustration with a rigged GLB avatar and a WebGL viewer such as `@react-three/fiber` / `three`.
2. Add a real-time transport layer (for example, WebSocket/Socket.IO) for room membership, presence, and messages.
3. Add WebRTC only if real audio/video calls are required; design consent and permission handling carefully.
4. Add an ISL sign-recognition model, starting with a clearly scoped vocabulary and collecting consented, representative data.
5. Implement QR decoding using a browser library, and ensure the QR encodes a safe join URL.
6. Persist conversation history only with clear consent, a retention policy, and controls to delete it.
7. Validate usability with Deaf/HoH ISL users and interpreters; don't assume sign-language grammar is word-for-word English.

## Privacy and accessibility notes

- No sign-up form is present.
- Camera and microphone are requested only after the user chooses the relevant control.
- This prototype does not upload messages, video, or audio to a server.
- Use clear labels, keyboard focus indicators, and sufficient contrast.
- The DD/NP labels are implementation shortcuts for the demo and should be revisited with Deaf community feedback.

## Project structure

```text
isl-translator/
├── public/
├── src/
│   ├── main.jsx
│   └── styles.css
├── index.html
├── package.json
├── vite.config.js
├── vercel.json
├── netlify.toml
└── README.md
```
