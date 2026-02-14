import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'
import { VideoKey, type VideoKeyType } from '../utils/detectIntent'

const VIDEO_KEYS: VideoKeyType[] = Object.values(VideoKey)

function getVideoUrl(key: VideoKeyType): string {
  return new URL(`../assets/videos/${key}.mp4`, import.meta.url).href
}

function preloadVideo(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    video.preload = 'auto'
    video.muted = true
    video.playsInline = true
    const onReady = () => {
      video.removeEventListener('canplaythrough', onReady)
      video.removeEventListener('error', onError)
      video.src = ''
      video.load()
      resolve()
    }
    const onError = (e: Event | string) => {
      video.removeEventListener('canplaythrough', onReady)
      video.removeEventListener('error', onError)
      reject(e)
    }
    video.addEventListener('canplaythrough', onReady, { once: true })
    video.addEventListener('error', onError, { once: true })
    video.src = url
    video.load()
  })
}

export interface VideoPlayerHandle {
  playVideo: (key: VideoKeyType, options: { loop: boolean }) => Promise<void>
}

interface VideoPlayerProps {
  initialKey: VideoKeyType
  initialLoop: boolean
  onEnded?: () => void
  onPreloadComplete?: () => void
}

export const VideoPlayer = forwardRef<
  VideoPlayerHandle,
  VideoPlayerProps
>(function VideoPlayer(
  { initialKey, initialLoop, onEnded, onPreloadComplete },
  ref
) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [preloadDone, setPreloadDone] = useState(false)
  const [preloadError, setPreloadError] = useState<string | null>(null)
  const currentKeyRef = useRef<VideoKeyType>(initialKey)
  const loopRef = useRef(initialLoop)
  const onEndedRef = useRef(onEnded)
  const onPreloadCompleteRef = useRef(onPreloadComplete)
  onEndedRef.current = onEnded
  onPreloadCompleteRef.current = onPreloadComplete
  loopRef.current = initialLoop

  useEffect(() => {
    let cancelled = false
    const urls = VIDEO_KEYS.map((k) => ({ key: k, url: getVideoUrl(k) }))
    Promise.all(urls.map(({ url }) => preloadVideo(url)))
      .then(() => {
        if (!cancelled) {
          setPreloadDone(true)
          onPreloadCompleteRef.current?.()
        }
      })
      .catch((err) => {
        if (!cancelled) setPreloadError(String(err))
      })
    return () => {
      cancelled = true
    }
  }, [])

  const playVideo = useCallback(
    async (key: VideoKeyType, options: { loop: boolean }) => {
      const video = videoRef.current
      if (!video) return

      const url = getVideoUrl(key)
      if (currentKeyRef.current === key && video.src) {
        video.loop = options.loop
        if (video.paused) video.play().catch(() => {})
        return
      }

      video.classList.add('video-transition-out')
      video.pause()
      currentKeyRef.current = key
      loopRef.current = options.loop
      video.loop = options.loop
      video.src = url
      video.load()

      const removeTransitionIn = () => {
        setTimeout(() => video.classList.remove('video-transition-in'), 400)
      }
      const playWhenReady = () => {
        video.removeEventListener('canplaythrough', playWhenReady)
        video.removeEventListener('error', onError)
        video.classList.remove('video-transition-out')
        video.classList.add('video-transition-in')
        video.play().catch(() => {})
        removeTransitionIn()
      }
      const onError = () => {
        video.removeEventListener('canplaythrough', playWhenReady)
        video.removeEventListener('error', onError)
        video.classList.remove('video-transition-out')
      }
      video.addEventListener('canplaythrough', playWhenReady, { once: true })
      video.addEventListener('error', onError, { once: true })

      if (video.readyState >= 3) {
        video.removeEventListener('canplaythrough', playWhenReady)
        video.removeEventListener('error', onError)
        video.classList.remove('video-transition-out')
        video.classList.add('video-transition-in')
        video.play().catch(() => {})
        removeTransitionIn()
      }
    },
    []
  )

  useImperativeHandle(ref, () => ({ playVideo }), [playVideo])

  const handleEnded = useCallback(() => {
    if (loopRef.current) return
    onEndedRef.current?.()
  }, [])

  useEffect(() => {
    if (!preloadDone || !videoRef.current) return
    const video = videoRef.current
    if (video.src) return
    const url = getVideoUrl(initialKey)
    video.loop = initialLoop
    video.src = url
    video.load()
    currentKeyRef.current = initialKey
    loopRef.current = initialLoop
    video.play().catch(() => {})
  }, [preloadDone, initialKey, initialLoop])

  if (preloadError) {
    return (
      <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/20 p-4">
        <p className="text-red-500">Failed to load videos: {preloadError}</p>
      </div>
    )
  }

  return (
    <div className="absolute inset-0 overflow-hidden bg-black">
      {!preloadDone && (
        <div className="absolute inset-0 flex items-center justify-center text-neutral-400">
          Loading…
        </div>
      )}
      <video
        ref={videoRef}
        className="video-state"
        playsInline
        muted={false}
        onEnded={handleEnded}
        style={{ opacity: preloadDone ? 1 : 0 }}
      />
    </div>
  )
})
