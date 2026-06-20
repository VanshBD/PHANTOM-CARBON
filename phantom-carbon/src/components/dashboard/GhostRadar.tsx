'use client';

import { useMemo } from 'react';

interface GhostRadarProps {
  surfaceCarbon: number;
  shadowCarbon: number;
  ghostCarbon: number;
}

const CENTER = 120;

// Ring radii — dots will sit EXACTLY at these radii, guaranteed
const RING = {
  surface: { r: 45,  color: '#22c55e', label: 'Surface' },
  shadow:  { r: 80,  color: '#f59e0b', label: 'Shadow'  },
  ghost:   { r: 108, color: '#f97316', label: 'Ghost'   },
};

type LayerKey = keyof typeof RING;

interface Dot {
  cx: number;
  cy: number;
  color: string;
  r: number; // dot radius (size)
  delay: number;
}

/** Place up to `count` dots evenly on a circle of radius `ringR` */
function dotsOnRing(count: number, ringR: number, color: string, dotSize: number, delayBase: number): Dot[] {
  const dots: Dot[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * 2 * Math.PI - Math.PI / 2;
    dots.push({
      cx: CENTER + ringR * Math.cos(angle),
      cy: CENTER + ringR * Math.sin(angle),
      color,
      r: dotSize,
      delay: delayBase + i * 0.3,
    });
  }
  return dots;
}

export function GhostRadar({ surfaceCarbon, shadowCarbon, ghostCarbon }: GhostRadarProps) {
  const total = surfaceCarbon + shadowCarbon + ghostCarbon;
  const hasData = total > 0;

  // Normalise each layer against the max layer value (not total)
  const maxLayer = Math.max(surfaceCarbon, shadowCarbon, ghostCarbon, 1);

  const dots = useMemo(() => {
    const all: Dot[] = [];

    const layers: [LayerKey, number][] = [
      ['surface', surfaceCarbon],
      ['shadow',  shadowCarbon],
      ['ghost',   ghostCarbon],
    ];

    layers.forEach(([key, value], layerIndex) => {
      if (value <= 0) return;
      const norm  = Math.min(value / maxLayer, 1);
      const count = Math.max(1, Math.round(norm * 5)); // 1–5 dots per ring
      const size  = 4 + norm * 2;                      // 4–6px dot radius
      all.push(...dotsOnRing(count, RING[key].r, RING[key].color, size, layerIndex * 0.5));
    });

    return all;
  }, [surfaceCarbon, shadowCarbon, ghostCarbon, maxLayer]);

  const ariaLabel = hasData
    ? `Ghost Radar: ${surfaceCarbon.toFixed(1)}kg surface, ${shadowCarbon.toFixed(1)}kg shadow, ${ghostCarbon.toFixed(1)}kg ghost`
    : 'Ghost Radar — no data yet';

  return (
    <div className="flex flex-col items-center gap-4">
      <svg
        width="240"
        height="240"
        viewBox="0 0 240 240"
        role="img"
        aria-label={ariaLabel}
      >
        <title>Ghost Radar</title>
        <desc>{ariaLabel}</desc>

        <defs>
          {/* Clip everything inside the outer boundary */}
          <clipPath id="rc">
            <circle cx={CENTER} cy={CENTER} r={118} />
          </clipPath>

          {/* Sweep fade gradient */}
          <linearGradient id="sg" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor="#22c55e" stopOpacity="0"   />
            <stop offset="100%" stopColor="#22c55e" stopOpacity="0.35" />
          </linearGradient>

          {/* Background radial glow */}
          <radialGradient id="bg" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#22c55e" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#0a0e1a" stopOpacity="0"    />
          </radialGradient>
        </defs>

        {/* ── Everything is clipped — nothing can escape ── */}
        <g clipPath="url(#rc)">

          {/* Background */}
          <circle cx={CENTER} cy={CENTER} r={118} fill="url(#bg)" />

          {/* Subtle grid rings */}
          {[25, 55, 90, 118].map(r => (
            <circle key={r} cx={CENTER} cy={CENTER} r={r}
              fill="none" stroke="#1f2937" strokeWidth="0.5" />
          ))}

          {/* Grid cross lines */}
          {[0, 45, 90, 135].map(deg => {
            const a = (deg * Math.PI) / 180;
            return (
              <line key={deg}
                x1={CENTER - 118 * Math.cos(a)} y1={CENTER - 118 * Math.sin(a)}
                x2={CENTER + 118 * Math.cos(a)} y2={CENTER + 118 * Math.sin(a)}
                stroke="#1f2937" strokeWidth="0.5" />
            );
          })}

          {/* The three named rings */}
          {(Object.entries(RING) as [LayerKey, typeof RING[LayerKey]][]).map(([key, ring]) => (
            <circle key={key}
              cx={CENTER} cy={CENTER} r={ring.r}
              fill="none"
              stroke={ring.color}
              strokeWidth={1.5}
              strokeDasharray="5 3"
              opacity={hasData ? 0.65 : 0.2}
            />
          ))}

          {/* Rotating sweep beam */}
          <g style={{ transformOrigin: `${CENTER}px ${CENTER}px`, animation: 'sweep 4s linear infinite' }}>
            <path
              d={`M${CENTER} ${CENTER} L${CENTER + 118} ${CENTER} A118 118 0 0 1 ${CENTER + 118 * Math.cos(-0.35)} ${CENTER + 118 * Math.sin(-0.35)} Z`}
              fill="url(#sg)" opacity="0.55"
            />
            <line x1={CENTER} y1={CENTER} x2={CENTER + 118} y2={CENTER}
              stroke="#22c55e" strokeWidth="1.5" opacity="0.85" />
          </g>

          {/* ── DOTS — each one mathematically on its ring, opacity-only pulse ── */}
          {dots.map((dot, i) => (
            <circle
              key={i}
              cx={dot.cx}
              cy={dot.cy}
              r={dot.r}
              fill={dot.color}
              style={{
                animation: `dotFade 2.5s ease-in-out ${dot.delay}s infinite`,
              }}
            />
          ))}

          {/* Centre point */}
          <circle cx={CENTER} cy={CENTER} r="3.5" fill="#22c55e" opacity="0.9" />
          <circle cx={CENTER} cy={CENTER} r="7" fill="none" stroke="#22c55e" strokeWidth="1" opacity="0.4" />

          {/* Empty state label */}
          {!hasData && (
            <text x={CENTER} y={CENTER + 5}
              textAnchor="middle"
              fill="#4b5563" fontSize="11"
              fontFamily="Inter, system-ui, sans-serif">
              No data yet
            </text>
          )}

        </g>

        {/* Inline keyframes — opacity only, ZERO transform that would shift position */}
        <style>{`
          @keyframes sweep {
            from { transform: rotate(0deg); }
            to   { transform: rotate(360deg); }
          }
          @keyframes dotFade {
            0%,100% { opacity: 0.9; }
            50%      { opacity: 0.4; }
          }
          @media (prefers-reduced-motion: reduce) {
            circle[style*="dotFade"] { animation: none; opacity: 0.85; }
            g[style*="sweep"]        { animation: none; }
          }
        `}</style>
      </svg>

      {/* Legend */}
      <div className="flex items-center gap-5" role="list" aria-label="Carbon layer legend">
        {(Object.entries(RING) as [LayerKey, typeof RING[LayerKey]][]).map(([key, ring]) => {
          const val = key === 'surface' ? surfaceCarbon : key === 'shadow' ? shadowCarbon : ghostCarbon;
          return (
            <div key={key} className="flex items-center gap-1.5" role="listitem">
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: ring.color }}
                aria-hidden="true"
              />
              <span className="text-xs text-gray-400">
                {ring.label}
                {hasData && (
                  <span className="ml-1 font-semibold" style={{ color: ring.color }}>
                    {val.toFixed(1)}kg
                  </span>
                )}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
