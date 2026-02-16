# Virtual Video Chat Simulator

A React + TypeScript web app that simulates a video chat with voice interaction. The app plays different video clips based on what you say, using the browser’s built-in speech recognition.

## What it does

- **Video states**: Idle → Greeting → Listening (with speech) → Response → back to Listening or Goodbye → Idle.
- **Voice input**: Uses the [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API) (microphone required).
- **Keyword responses**: Saying “hello”/“hi”, “weather”/“today”, “bye”/“goodbye”, or “easter” triggers different response videos; anything else uses a fallback.
- **UI**: Single video player (no flicker when switching clips), mic indicator with pulse when you speak, and transcript of what you said.

## Tech stack

- **React 18** + **TypeScript**
- **Vite** (dev server and build)
- **Tailwind CSS** (styling)

## Prerequisites

- [Node.js](https://nodejs.org/) (v20.19+ or v22.12+ recommended for Vite 7)
- A modern browser with Web Speech API support (e.g. Chrome, Edge)
- Microphone access for voice input

## How to run

### 1. Install dependencies

```bash
npm install
```

### 2. Start the dev server

```bash
npm run dev
```

Then open the URL shown in the terminal (usually `http://localhost:5173`) in your browser.

### 3. Use the app

1. Allow microphone access when prompted.
2. Click **Start Chat**.
3. After the greeting video, speak when you see the mic indicator (e.g. try “hello”, “weather”, or “goodbye”).
4. Response videos play based on what you said; say “goodbye” to end and return to idle.

## Other commands

| Command           | Description                |
|------------------|----------------------------|
| `npm run build`  | Production build to `dist/` |
| `npm run preview`| Serve the production build |
| `npm run lint`   | Run ESLint                 |
| `npm run format` | Format code with Prettier  |

## Project structure

- `src/App.tsx` – Main app and wiring of video, chat state, and speech.
- `src/components/` – `VideoPlayer` (single video, preload, transitions), `Controls` (Start Chat, mic indicator, transcript).
- `src/state/useChatMachine.ts` – Chat state machine (idle, greeting, listening, response, goodbye).
- `src/hooks/useSpeechRecognition.ts` – Web Speech API hook (listening, interim results, errors).
- `src/utils/detectIntent.ts` – Maps spoken text to response video keys.
- `src/constants/` – `chatState`, `speechStatus` (and video keys in `utils/detectIntent.ts`).
- `src/assets/videos/` – Video files used for each state and response.

Videos are preloaded so switching between clips is smooth and without black frames.
