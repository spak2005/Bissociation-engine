/**
 * Subtle floating nodes + slow wireframe rotation — CSS only, pointer-events none.
 */
export default function AmbientMeshBackground() {
  const dots = [
    { x: 8, y: 12, d: 0 },
    { x: 22, y: 28, d: 1.2 },
    { x: 78, y: 8, d: 0.4 },
    { x: 88, y: 42, d: 2.1 },
    { x: 15, y: 65, d: 0.8 },
    { x: 45, y: 18, d: 1.6 },
    { x: 62, y: 55, d: 2.8 },
    { x: 35, y: 88, d: 1 },
    { x: 92, y: 72, d: 0.2 },
    { x: 55, y: 38, d: 2.4 },
    { x: 70, y: 22, d: 1.4 },
    { x: 28, y: 48, d: 3 },
  ]

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden
    >
      <svg
        className="ambient-wireframe absolute left-1/2 top-1/2 h-[min(90vw,520px)] w-[min(90vw,520px)] -translate-x-1/2 -translate-y-1/2 opacity-[0.07]"
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g className="animate-wireframe-spin">
          <path
            d="M100 20 L160 100 L100 180 L40 100 Z M100 20 L100 180 M40 100 L160 100 M70 60 L130 140 M130 60 L70 140"
            stroke="url(#wm)"
            strokeWidth="0.35"
          />
          <ellipse
            cx="100"
            cy="100"
            rx="72"
            ry="28"
            stroke="url(#wm)"
            strokeWidth="0.25"
            transform="rotate(32 100 100)"
          />
          <ellipse
            cx="100"
            cy="100"
            rx="52"
            ry="68"
            stroke="url(#wm)"
            strokeWidth="0.2"
            transform="rotate(-18 100 100)"
          />
        </g>
        <defs>
          <linearGradient id="wm" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#d946ef" />
          </linearGradient>
        </defs>
      </svg>

      <div className="absolute inset-0">
        {dots.map((d, i) => (
          <span
            key={i}
            className="ambient-dot absolute h-1 w-1 rounded-full"
            style={{
              left: `${d.x}%`,
              top: `${d.y}%`,
              animationDelay: `${d.d}s`,
              background:
                i % 2 === 0
                  ? 'rgba(6,182,212,0.35)'
                  : 'rgba(217,70,239,0.3)',
              boxShadow:
                i % 2 === 0
                  ? '0 0 12px rgba(6,182,212,0.25)'
                  : '0 0 12px rgba(217,70,239,0.2)',
            }}
          />
        ))}
      </div>
    </div>
  )
}
