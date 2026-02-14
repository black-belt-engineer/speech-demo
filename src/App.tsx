import { useEffect, useRef, useState } from 'react'
import { VideoPlayer, type VideoPlayerHandle } from './components/VideoPlayer'
import { Controls } from './components/Controls'
import { useChatMachine } from './state/useChatMachine'
import { useSpeechRecognition } from './hooks/useSpeechRecognition'
import { ChatState } from './constants/chatState'
import { VideoKey } from './utils/detectIntent'

function App() {
  const playerRef = useRef<VideoPlayerHandle | null>(null)
  const [preloadDone, setPreloadDone] = useState(false)
  const {
    state,
    video,
    isIdle,
    startChat,
    greetingEnded,
    speechResult,
    responseEnded,
    goodbyeEnded,
    silenceTimeout,
    recognitionError,
  } = useChatMachine()

  const isListening = state === ChatState.Listening

  const { status: speechStatus, transcript, isSpeaking } = useSpeechRecognition({
    active: isListening,
    onResult: speechResult,
    onError: recognitionError,
    onSilenceTimeout: silenceTimeout,
    silenceTimeoutMs: 8000,
    clearTranscriptWhenIdle: isIdle,
  })

  const loop =
    state === ChatState.Idle || state === ChatState.Listening
  useEffect(() => {
    const handle = playerRef.current
    if (!handle) return
    handle.playVideo(video, { loop }).catch(() => {})
  }, [video, loop])

  const onVideoEnded =
    state === ChatState.Greeting
      ? greetingEnded
      : state === ChatState.Response
        ? responseEnded
        : state === ChatState.Goodbye
          ? goodbyeEnded
          : undefined

  return (
    <div className="flex h-full w-full flex-col items-center justify-center overflow-auto bg-black px-4 py-6">
      <h1 className="sr-only">Virtual Video Chat Simulator</h1>
      <div className="flex flex-shrink-0 flex-col items-center gap-8">
        <div className="video-slot relative">
          <VideoPlayer
            ref={playerRef}
            initialKey={VideoKey.Idle}
            initialLoop
            onEnded={onVideoEnded}
            onPreloadComplete={() => setPreloadDone(true)}
          />
        </div>
        <div className="flex min-h-[160px] w-full max-w-md flex-shrink-0 flex-col items-center justify-center text-center">
          <Controls
            isIdle={isIdle}
            isListening={isListening}
            speechStatus={speechStatus}
            transcript={transcript}
            preloadDone={preloadDone}
            onStartChat={startChat}
            isSpeaking={isSpeaking}
          />
        </div>
      </div>
    </div>
  )
}

export default App
