import { useCallback, useReducer } from 'react'
import type { VideoKeyType } from '../utils/detectIntent'
import { VideoKey } from '../utils/detectIntent'
import { detectIntent } from '../utils/detectIntent'
import { ChatState } from '../constants/chatState'

type ChatEvent =
  | { type: 'START_CHAT' }
  | { type: 'GREETING_ENDED' }
  | { type: 'SPEECH_RESULT'; text: string }
  | { type: 'RESPONSE_ENDED' }
  | { type: 'GOODBYE_ENDED' }
  | { type: 'SILENCE_TIMEOUT' }
  | { type: 'RECOGNITION_ERROR' }

interface ChatStateContext {
  state: ChatState
  video: VideoKeyType
  responseVideo: VideoKeyType | null
  silenceCount: number
  listeningPhase: 'initial' | 'returned'
}

const initialContext: ChatStateContext = {
  state: ChatState.Idle,
  video: VideoKey.Idle,
  responseVideo: null,
  silenceCount: 0,
  listeningPhase: 'initial',
}

function getVideoForState(
  state: ChatState,
  responseVideo: VideoKeyType | null
): VideoKeyType {
  switch (state) {
    case ChatState.Idle:
      return VideoKey.Idle
    case ChatState.Greeting:
      return VideoKey.Greeting
    case ChatState.Listening:
      return VideoKey.Listening
    case ChatState.Response:
      return responseVideo ?? VideoKey.Fallback
    case ChatState.Goodbye:
      return VideoKey.Goodbye
    default:
      return VideoKey.Idle
  }
}

function chatReducer(
  ctx: ChatStateContext,
  event: ChatEvent
): ChatStateContext {
  const next = { ...ctx }

  switch (event.type) {
    case 'START_CHAT':
      if (ctx.state !== ChatState.Idle) return ctx
      next.state = ChatState.Greeting
      next.video = VideoKey.Greeting
      next.silenceCount = 0
      next.listeningPhase = 'initial'
      return next

    case 'GREETING_ENDED':
      if (ctx.state !== ChatState.Greeting) return ctx
      next.state = ChatState.Listening
      next.video = VideoKey.Listening
      return next

    case 'SPEECH_RESULT': {
      if (ctx.state !== ChatState.Listening) return ctx
      const intent = detectIntent(event.text)
      if (intent === VideoKey.Goodbye) {
        next.state = ChatState.Goodbye
        next.video = VideoKey.Goodbye
        next.responseVideo = null
        next.silenceCount = 0
        return next
      }
      next.state = ChatState.Response
      next.responseVideo = intent
      next.video = intent
      next.silenceCount = 0
      return next
    }

    case 'RESPONSE_ENDED':
      if (ctx.state !== ChatState.Response) return ctx
      next.state = ChatState.Listening
      next.video = VideoKey.Listening
      next.responseVideo = null
      next.listeningPhase = 'returned'
      return next

    case 'GOODBYE_ENDED':
      if (ctx.state !== ChatState.Goodbye) return ctx
      next.state = ChatState.Idle
      next.video = VideoKey.Idle
      next.responseVideo = null
      next.silenceCount = 0
      return next

    case 'SILENCE_TIMEOUT':
      if (ctx.state !== ChatState.Listening) return ctx
      next.silenceCount = ctx.silenceCount + 1
      if (next.silenceCount >= 2) {
        next.state = ChatState.Goodbye
        next.video = VideoKey.Goodbye
        next.silenceCount = 0
      } else {
        next.state = ChatState.Response
        next.responseVideo = VideoKey.Prompt
        next.video = VideoKey.Prompt
      }
      return next

    case 'RECOGNITION_ERROR':
      if (ctx.state !== ChatState.Listening) return ctx
      next.state = ChatState.Response
      next.responseVideo = VideoKey.Fallback
      next.video = VideoKey.Fallback
      return next

    default:
      return ctx
  }
}

export function useChatMachine() {
  const [ctx, dispatch] = useReducer(chatReducer, initialContext)

  const startChat = useCallback(() => dispatch({ type: 'START_CHAT' }), [])
  const greetingEnded = useCallback(
    () => dispatch({ type: 'GREETING_ENDED' }),
    []
  )
  const speechResult = useCallback((text: string) => {
    dispatch({ type: 'SPEECH_RESULT', text })
  }, [])
  const responseEnded = useCallback(
    () => dispatch({ type: 'RESPONSE_ENDED' }),
    []
  )
  const goodbyeEnded = useCallback(
    () => dispatch({ type: 'GOODBYE_ENDED' }),
    []
  )
  const silenceTimeout = useCallback(
    () => dispatch({ type: 'SILENCE_TIMEOUT' }),
    []
  )
  const recognitionError = useCallback(
    () => dispatch({ type: 'RECOGNITION_ERROR' }),
    []
  )

  const video = getVideoForState(ctx.state, ctx.responseVideo)

  return {
    state: ctx.state,
    video,
    silenceCount: ctx.silenceCount,
    isIdle: ctx.state === ChatState.Idle,
    isListening: ctx.state === ChatState.Listening,
    startChat,
    greetingEnded,
    speechResult,
    responseEnded,
    goodbyeEnded,
    silenceTimeout,
    recognitionError,
  }
}
