export const SpeechStatus = {
  Unavailable: 'unavailable',
  Idle: 'idle',
  Requesting: 'requesting',
  Listening: 'listening',
  Denied: 'denied',
  Error: 'error',
} as const

export type SpeechRecognitionStatus =
  (typeof SpeechStatus)[keyof typeof SpeechStatus]
