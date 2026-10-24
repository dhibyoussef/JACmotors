import { useCallback, useEffect, useRef, useState } from 'react'

type Props = {
  frames: string[]
  label: string
}

export function Photo360({ frames, label }: Props) {
  const [index, setIndex] = useState(0)
  const [dragging, setDragging] = useState(false)
  const stageRef = useRef<HTMLDivElement>(null)
  const drag = useRef<{ active: boolean; x: number; startIndex: number }>({
    active: false,
    x: 0,
    startIndex: 0,
  })

  const clampIndex = useCallback(
    (value: number) => {
      const n = frames.length
      if (n === 0) return 0
      return ((value % n) + n) % n
    },
    [frames.length],
  )

  useEffect(() => {
    frames.forEach((src) => {
      const img = new Image()
      img.src = src
    })
  }, [frames])

  useEffect(() => {
    setIndex(0)
  }, [frames])

  const onPointerDown = (clientX: number, pointerId?: number) => {
    drag.current = { active: true, x: clientX, startIndex: index }
    setDragging(true)
    if (pointerId != null) {
      stageRef.current?.setPointerCapture?.(pointerId)
    }
  }

  const onPointerMove = (clientX: number) => {
    if (!drag.current.active || frames.length < 2) return
    const delta = clientX - drag.current.x
    const steps = Math.round(delta / 24)
    setIndex(clampIndex(drag.current.startIndex - steps))
  }

  const onPointerUp = (pointerId?: number) => {
    drag.current.active = false
    setDragging(false)
    if (pointerId != null) {
      try {
        stageRef.current?.releasePointerCapture?.(pointerId)
      } catch {
        /* ignore */
      }
    }
  }

  if (frames.length === 0) {
    return <p className="form-hint">Aucune image 360 disponible.</p>
  }

  return (
    <div className="photo360">
      <div
        ref={stageRef}
        className={`photo360__stage ${dragging ? 'is-dragging' : ''}`}
        role="img"
        aria-label={`${label} — vue interactive, image ${index + 1} sur ${frames.length}`}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft') setIndex((i) => clampIndex(i - 1))
          if (e.key === 'ArrowRight') setIndex((i) => clampIndex(i + 1))
        }}
        onPointerDown={(e) => {
          e.preventDefault()
          onPointerDown(e.clientX, e.pointerId)
        }}
        onPointerMove={(e) => onPointerMove(e.clientX)}
        onPointerUp={(e) => onPointerUp(e.pointerId)}
        onPointerCancel={(e) => onPointerUp(e.pointerId)}
      >
        <img src={frames[index]} alt={`${label} — angle ${index + 1}`} draggable={false} />
        <div className="photo360__hint">
          <span>VUE 360°</span>
          <strong>Glissez pour tourner</strong>
        </div>
        <div className="photo360__progress" aria-hidden="true">
          {frames.map((_, i) => (
            <i key={i} data-active={i === index} />
          ))}
        </div>
      </div>
      <div className="photo360__controls">
        <button type="button" onClick={() => setIndex((i) => clampIndex(i - 1))}>
          ↺ Gauche
        </button>
        <span>
          {index + 1} / {frames.length}
        </span>
        <button type="button" onClick={() => setIndex((i) => clampIndex(i + 1))}>
          Droite ↻
        </button>
      </div>
      <p className="photo360__note">
        Glissez, utilisez les boutons, ou les flèches du clavier pour tourner autour du
        véhicule.
      </p>
    </div>
  )
}
