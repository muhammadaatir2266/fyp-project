'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { RetellWebClient } from 'retell-client-js-sdk'
import { Button } from '@/components/ui/button'
import { MicOff, Mic, PhoneOff, Loader2 } from 'lucide-react'

type CallStatus = 'connecting' | 'active' | 'ended' | 'error'

interface VoiceCallModalProps {
  accessToken: string
  doctorName: string
  doctorSpecialty: string
  patientName: string
  onClose: (booked: boolean) => void
}

export function VoiceCallModal({
  accessToken,
  doctorName,
  doctorSpecialty,
  patientName,
  onClose,
}: VoiceCallModalProps) {
  const clientRef = useRef<RetellWebClient | null>(null)
  const [status, setStatus] = useState<CallStatus>('connecting')
  const [errorMsg, setErrorMsg] = useState<string>('')
  const [muted, setMuted] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const bookedRef = useRef(false)

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  const startTimer = () => {
    timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000)
  }

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  const handleEnd = useCallback(
    (booked: boolean) => {
      stopTimer()
      bookedRef.current = booked
      setStatus('ended')
    },
    [],
  )

  useEffect(() => {
    const client = new RetellWebClient()
    clientRef.current = client

    client.on('call_started', () => {
      setStatus('active')
      startTimer()
    })

    client.on('call_ended', () => {
      handleEnd(false)
    })

    client.on('error', (err) => {
      console.error('Retell call error:', err)
      setErrorMsg(
        err?.message?.includes('Permission denied') || err?.message?.includes('NotAllowed')
          ? 'Microphone permission denied. Please allow mic access and try again.'
          : 'Call error. Please try again or book online.',
      )
      setStatus('error')
      stopTimer()
    })

    client.startCall({ accessToken }).catch((err: Error) => {
      console.error('startCall failed:', err)
      setErrorMsg('Could not start call. Please try again.')
      setStatus('error')
    })

    return () => {
      stopTimer()
      client.stopCall()
    }
  }, [accessToken, handleEnd])

  const hangUp = () => {
    clientRef.current?.stopCall()
    handleEnd(false)
  }

  const toggleMute = () => {
    if (!clientRef.current) return
    const next = !muted
    if (next) {
      clientRef.current.mute()
    } else {
      clientRef.current.unmute()
    }
    setMuted(next)
  }

  const handleDismiss = () => onClose(bookedRef.current)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-80 rounded-2xl bg-white p-6 shadow-2xl flex flex-col items-center gap-5">
        {/* Doctor avatar placeholder */}
        <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center text-3xl font-bold text-primary">
          {doctorName.charAt(4).toUpperCase()}
        </div>

        <div className="text-center">
          <p className="text-lg font-semibold text-gray-900">{doctorName}</p>
          <p className="text-sm text-gray-500">{doctorSpecialty}</p>
        </div>

        {status === 'connecting' && (
          <div className="flex flex-col items-center gap-2 text-sm text-gray-500">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span>Connecting…</span>
          </div>
        )}

        {status === 'active' && (
          <div className="text-sm font-mono text-green-600">{formatTime(elapsed)}</div>
        )}

        {status === 'ended' && (
          <p className="text-sm text-gray-500">Call ended.</p>
        )}

        {status === 'error' && (
          <p className="text-sm text-destructive text-center">{errorMsg}</p>
        )}

        {(status === 'connecting' || status === 'active') && (
          <div className="flex gap-4">
            <button
              onClick={toggleMute}
              title={muted ? 'Unmute' : 'Mute'}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition"
            >
              {muted ? (
                <MicOff className="h-5 w-5 text-gray-600" />
              ) : (
                <Mic className="h-5 w-5 text-gray-600" />
              )}
            </button>
            <button
              onClick={hangUp}
              title="End call"
              className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive hover:bg-destructive/90 transition"
            >
              <PhoneOff className="h-5 w-5 text-white" />
            </button>
          </div>
        )}

        {(status === 'ended' || status === 'error') && (
          <Button onClick={handleDismiss} variant="outline" className="w-full">
            Close
          </Button>
        )}

        <p className="text-xs text-gray-400 text-center">
          AI voice assistant · booking for {patientName}
        </p>
      </div>
    </div>
  )
}
