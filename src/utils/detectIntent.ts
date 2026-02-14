export const VideoKey = {
  Idle: 'idle',
  Greeting: 'greeting',
  Listening: 'listening',
  Weather: 'weather',
  GeneralResponse: 'general_response',
  Fallback: 'fallback',
  Goodbye: 'goodbye',
  Prompt: 'prompt',
  EasterEgg: 'easter_egg',
} as const

export type VideoKeyType = (typeof VideoKey)[keyof typeof VideoKey]

export function detectIntent(text: string): VideoKeyType {
  const t = text.trim().toLowerCase()
  if (!t) return VideoKey.Fallback

  if (t.includes('bye') || t.includes('goodbye')) return VideoKey.Goodbye
  if (t.includes('easter')) return VideoKey.EasterEgg
  if (t.includes('hello') || t.includes('hi')) return VideoKey.GeneralResponse
  if (t.includes('weather') || t.includes('today')) return VideoKey.Weather

  return VideoKey.Fallback
}
