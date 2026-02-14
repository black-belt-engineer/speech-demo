export const ChatState = {
  Idle: 'idle',
  Greeting: 'greeting',
  Listening: 'listening',
  Response: 'response',
  Goodbye: 'goodbye',
} as const

export type ChatState = (typeof ChatState)[keyof typeof ChatState]
