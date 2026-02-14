import type { SpeechRecognitionStatus } from '../constants/speechStatus'
import { SpeechStatus } from '../constants/speechStatus'

interface ControlsProps {
  isIdle: boolean
  isListening: boolean
  speechStatus: SpeechRecognitionStatus
  transcript: string
  preloadDone: boolean
  onStartChat: () => void
  isSpeaking?: boolean
}

function MicIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-6 w-6"
      aria-hidden
    >
      <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
      <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
    </svg>
  )
}

export function Controls({
  isIdle,
  isListening,
  speechStatus,
  transcript,
  preloadDone,
  onStartChat,
  isSpeaking = false,
}: ControlsProps) {
  const micDenied = speechStatus === SpeechStatus.Denied
  const micError = speechStatus === SpeechStatus.Error
  const micUnavailable = speechStatus === SpeechStatus.Unavailable

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-4">
      {isIdle && preloadDone && (
        <button
          type="button"
          onClick={onStartChat}
          className="rounded-xl bg-indigo-600 px-6 py-3 font-medium text-white transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-neutral-900"
        >
          Start Chat
        </button>
      )}

      {isListening && (
        <div className="flex flex-col items-center gap-2">
          <div className="mic-indicator relative flex h-14 w-14 items-center justify-center">
            {isSpeaking && <div className="mic-pulse-ring absolute inset-0 rounded-full" />}
            <div
              className={`mic-circle flex h-14 w-14 items-center justify-center rounded-full border-2 ${
                isSpeaking
                  ? 'border-red-500 bg-red-500/20 text-red-500'
                  : 'border-neutral-500 bg-neutral-800/80 text-neutral-400'
              }`}
            >
              <MicIcon />
            </div>
          </div>
          <span className="text-sm text-neutral-400">
            {isSpeaking ? 'Listening…' : 'Speak now'}
          </span>
        </div>
      )}

      {micDenied && (
        <p className="rounded-lg bg-amber-500/20 px-4 py-2 text-sm text-amber-200">
          Microphone access was denied. Allow the mic to use voice.
        </p>
      )}

      {!isIdle && micUnavailable && (
        <p className="rounded-lg bg-amber-500/20 px-4 py-2 text-sm text-amber-200">
          Speech recognition is not supported in this browser.
        </p>
      )}

      {micError && !micDenied && (
        <p className="text-sm text-amber-200">Speech recognition error. Trying fallback.</p>
      )}

      {transcript && (
        <div className="w-full rounded-lg bg-neutral-800/80 px-4 py-3 text-left text-sm text-neutral-200">
          <span className="text-neutral-500">You said: </span>
          {transcript}
        </div>
      )}
    </div>
  )
}
