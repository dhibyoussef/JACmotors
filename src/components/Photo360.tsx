import { useCallback, useRef, useState } from 'react'

type Props = {
  frames: string[]
  label: string
}

export function Photo360({ frames, label }: Props) {
  const [index, setIndex] = useState(0)
  const drag = useRef<{ active: boolean; x: number; startIndex: number }>({
    active: false,
    x: 0,
    startIndex: 0,
  })

  const clampIndex = useCallback(
    (value: number) => {
      const n = frames.length
      return ((value % n) + n) % n
    },
    [frames.length],
  )

  const onPointerDown = (clientX: number) => {
    drag.current = { active: true, x: clientX, startIndex: index }
  }

  const onPointerMove = (clientX: number) => {
    if (!drag.current.active || frames.length < 2) return
    const delta = clientX - drag.current.x
    const steps = Math.round(delta / 28)
    setIndex(clampIndex(drag.current.startIndex - steps))
  }

  const onPointerUp = () => {
    drag.current.active = false
  }

  if (frames.length === 0) {
    return <p className="demo-empty">Aucune image 360 disponible.</p>
  }

  return (
    <div className="photo360">
      <div
        className="photo360__stage"
        role="img"
        aria-label={`${label} — vue interactive, image ${index + 1} sur ${frames.length}`}
        onMouseDown={(e) => onPointerDown(e.clientX)}
        onMouseMove={(e) => onPointerMove(e.clientX)}
        onMouseUp={onPointerUp}
        onMouseLeave={onPointerUp}
        onTouchStart={(e) => onPointerDown(e.touches[0].clientX)}
        onTouchMove={(e) => onPointerMove(e.touches[0].clientX)}
        onTouchEnd={onPointerUp}
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
        Glissez horizontalement pour explorer le véhicule sous plusieurs angles.
      </p>
    </div>
  )
}
