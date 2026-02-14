import { useCallback, useEffect, useRef, useState } from 'react'
import { SpeechStatus } from '../constants/speechStatus'
import type { SpeechRecognitionStatus } from '../constants/speechStatus'

const SpeechRecognitionAPI =
  typeof window !== 'undefined'
    ? (window.SpeechRecognition ?? (window as unknown as { webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition)
    : undefined

function stopRecognition(recognition: SpeechRecognition | null): void {
  if (!recognition) return
  try {
    recognition.abort()
  } catch {
    try {
      recognition.stop()
    } catch {
      alert('Something went wrong. Try again.')
    }
  }
}

interface UseSpeechRecognitionOptions {
  active: boolean
  onResult: (text: string) => void
  onError: () => void
  onSilenceTimeout?: () => void
  silenceTimeoutMs?: number
  clearTranscriptWhenIdle?: boolean
}

export function useSpeechRecognition({
  active,
  onResult,
  onError,
  onSilenceTimeout,
  silenceTimeoutMs = 8000,
  clearTranscriptWhenIdle = false,
}: UseSpeechRecognitionOptions) {
  const [status, setStatus] = useState<SpeechRecognitionStatus>(
    SpeechRecognitionAPI ? SpeechStatus.Idle : SpeechStatus.Unavailable
  )
  const [transcript, setTranscript] = useState('')
  const [isSpeaking, setIsSpeaking] = useState(false)
  const recognitionRef = useRef<InstanceType<NonNullable<typeof SpeechRecognitionAPI>> | null>(null)
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const activeRef = useRef(active)
  activeRef.current = active

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current)
      silenceTimerRef.current = null
    }
  }, [])

  const startListening = useCallback(() => {
    if (!SpeechRecognitionAPI || !activeRef.current) return
    if (recognitionRef.current) return

    const recognition = new SpeechRecognitionAPI() as SpeechRecognition
    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = 'en-US'
    recognitionRef.current = recognition

    recognition.onresult = (e: SpeechRecognitionEvent) => {
      clearSilenceTimer()
      if (!activeRef.current) return
      const result = e.results[e.results.length - 1]
      const text = result[0].transcript ?? ''
      if (result.isFinal) {
        setIsSpeaking(false)
        if (text.trim()) {
          setTranscript(text)
          onResult(text)
        }
        recognition.stop()
      } else {
        setIsSpeaking(true)
      }
    }

    recognition.onend = () => {
      recognitionRef.current = null
      setIsSpeaking(false)
      if (activeRef.current) setStatus(SpeechStatus.Idle)
    }

    recognition.onerror = (e: SpeechRecognitionErrorEvent) => {
      recognitionRef.current = null
      clearSilenceTimer()
      if (!activeRef.current) return
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        setStatus(SpeechStatus.Denied)
      } else {
        setStatus(SpeechStatus.Error)
        onError()
      }
    }

    recognition.onstart = () => {
      setStatus(SpeechStatus.Listening)
    }

    setStatus(SpeechStatus.Requesting)
    setTranscript('')
    try {
      recognition.start()
      clearSilenceTimer()
      silenceTimerRef.current = setTimeout(() => {
        silenceTimerRef.current = null
        if (!activeRef.current) return
        if (recognitionRef.current) {
          stopRecognition(recognitionRef.current)
          recognitionRef.current = null
        }
        setStatus(SpeechStatus.Idle)
        if (activeRef.current) onSilenceTimeout?.()
      }, silenceTimeoutMs)
    } catch (err) {
      recognitionRef.current = null
      setStatus(SpeechStatus.Error)
      onError()
    }
  }, [onResult, onError, onSilenceTimeout, silenceTimeoutMs, clearSilenceTimer])

  useEffect(() => {
    if (!SpeechRecognitionAPI) return
    if (active) {
      startListening()
    } else {
      clearSilenceTimer()
      if (recognitionRef.current) {
        stopRecognition(recognitionRef.current)
        recognitionRef.current = null
      }
      setStatus(SpeechStatus.Idle)
    }
    return () => {
      clearSilenceTimer()
      if (recognitionRef.current) {
        stopRecognition(recognitionRef.current)
        recognitionRef.current = null
      }
    }
  }, [active, startListening, clearSilenceTimer])

  useEffect(() => {
    if (clearTranscriptWhenIdle) setTranscript('')
  }, [clearTranscriptWhenIdle])

  useEffect(() => {
    if (!active) setIsSpeaking(false)
  }, [active])

  return { status, transcript, isSpeaking, startListening }
}

export type { SpeechRecognitionStatus }
