'use client';

import { useMemo } from 'react';

interface GhostRadarProps {
  surfaceCarbon: number; // kg CO2e
  shadowCarbon: number;
  ghostCarbon: number;
  maxValue?: number; // normalize against this (default: auto)
}

interface RadarDot {
  cx: number;
  cy: number;
  ring: 'surface' | 'shadow' | 'ghost';
  size: number;
}

const CENTER = 120;
const RINGS = {
  surface: { radius: 45, color: '#22c55e', label: 'Surface', stroke: '#22c55e' },
  shadow:  { radius: 80, color: '#f59e0b', label: 'Shadow',  stroke: '#f59e0b' },
  ghost:   { radius: 108, color: '#f97316', label: 'Ghost',   stroke: '#f97316' },
};

/**
 * Generate dot positions for a carbon layer based on the normalized amount
 * Dots are scattered around the ring at varying angles
 */
function generateDots(
  value: number,
  maxValue: number,
  ring: 'surface' | 'shadow' | 'ghost'
): RadarDot[] {
  if (value <= 0) return [];

  const normalized = Math.min(value / maxValue, 1);
  const dotCount = Math.max(1, Math.round(normalized * 8));
  const { radius } = RINGS[ring];
  const dots: RadarDot[] = [];

  for (let i = 0; i < dotCount; i++) {
    const angle = (i / dotCount) * 2 * Math.PI - Math.PI / 2;
    // Slight scatter for visual interest
    const r = radius + (Math.sin(i * 7) * 5);
    dots.push({
      cx: CENTER + r * Math.cos(angle),
      cy: CENTER + r * Math.sin(angle),
      ring,
      size: 2.5 + normalized * 3,
    });
  }

  return dots;
}

export function GhostRadar({ surfaceCarbon, shadowCarbon, ghostCarbon, maxValue }: GhostRadarProps) {
  const total = surfaceCarbon + shadowCarbon + ghostCarbon;
  const hasData = total > 0;

  const dynamicMax = maxValue ?? Math.max(total * 0.7, 10);

  const allDots = useMemo(
    () => [
      ...generateDots(surfaceCarbon, dynamicMax, 'surface'),
      ...generateDots(shadowCarbon, dynamicMax, 'shadow'),
      ...generateDots(ghostCarbon, dynamicMax, 'ghost'),
    ],
    [surfaceCarbon, shadowCarbon, ghostCarbon, dynamicMax]
  );

  const ariaLabel = hasData
    ? `Ghost Radar showing carbon footprint: ${surfaceCarbon.toFixed(1)}kg surface, ${shadowCarbon.toFixed(1)}kg shadow, ${ghostCarbon.toFixed(1)}kg ghost emissions`
    : 'Ghost Radar — no carbon data recorded yet';

  return (
    <div className="flex flex-col items-center gap-4">
      <svg
        width="240"
        height="240"
        viewBox="0 0 240 240"
        role="img"
        aria-label={ariaLabel}
        className="overflow-visible"
      >
        <title>Ghost Radar — Carbon Detection</title>
        <desc>{ariaLabel}</desc>

        {/* Background glow */}
        <defs>
          <radialGradient id="radarGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#22c55e" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#0a0e1a" stopOpacity="0" />
          </radialGradient>

          {/* Sweep gradient */}
          <linearGradient id="sweepGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#22c55e" stopOpacity="0" />
            <stop offset="100%" stopColor="#22c55e" stopOpacity="0.4" />
          </linearGradient>

          <clipPath id="radarClip">
            <circle cx={CENTER} cy={CENTER} r="115" />
          </clipPath>
        </defs>

        {/* Background fill */}
        <circle cx={CENTER} cy={CENTER} r="115" fill="url(#radarGlow)" />

        {/* Grid circles — very subtle */}
        {[25, 50, 75, 100, 115].map((r) => (
          <circle
            key={r}
            cx={CENTER}
            cy={CENTER}
            r={r}
            fill="none"
            stroke="#1f2937"
            strokeWidth="0.5"
            aria-hidden="true"
          />
        ))}

        {/* Grid cross lines */}
        {[0, 45, 90, 135].map((angle) => {
          const rad = (angle * Math.PI) / 180;
          return (
            <line
              key={angle}
              x1={CENTER - 115 * Math.cos(rad)}
              y1={CENTER - 115 * Math.sin(rad)}
              x2={CENTER + 115 * Math.cos(rad)}
              y2={CENTER + 115 * Math.sin(rad)}
              stroke="#1f2937"
              strokeWidth="0.5"
              aria-hidden="true"
            />
          );
        })}

        {/* Ring circles — the three carbon layers */}
        {(Object.entries(RINGS) as [keyof typeof RINGS, typeof RINGS[keyof typeof RINGS]][]).map(
          ([key, ring]) => (
            <circle
              key={key}
              cx={CENTER}
              cy={CENTER}
              r={ring.radius}
              fill="none"
              stroke={ring.stroke}
              strokeWidth={1.5}
              strokeDasharray="4 3"
              opacity={hasData ? 0.7 : 0.25}
              aria-hidden="true"
            />
          )
        )}

        {/* Sweep line — the rotating radar beam */}
        <g
          clipPath="url(#radarClip)"
          className="radar-sweep"
          style={{ transformOrigin: `${CENTER}px ${CENTER}px` }}
          aria-hidden="true"
        >
          {/* The sweep "pie slice" wedge */}
          <path
            d={`M ${CENTER} ${CENTER} L ${CENTER + 115} ${CENTER} A 115 115 0 0 1 ${CENTER + 115 * Math.cos(-0.4)} ${CENTER + 115 * Math.sin(-0.4)} Z`}
            fill="url(#sweepGradient)"
            opacity={0.6}
          />
          {/* The sweep line itself */}
          <line
            x1={CENTER}
            y1={CENTER}
            x2={CENTER + 115}
            y2={CENTER}
            stroke="#22c55e"
            strokeWidth="1.5"
            opacity={0.9}
          />
        </g>

        {/* Carbon dots — appear at ring intersections */}
        {allDots.map((dot, i) => (
          <circle
            key={i}
            cx={dot.cx}
            cy={dot.cy}
            r={dot.size}
            fill={RINGS[dot.ring].color}
            opacity={0.85}
            className="radar-dot"
            style={{ animationDelay: `${i * 0.2}s` }}
            aria-hidden="true"
          />
        ))}

        {/* Center point */}
        <circle cx={CENTER} cy={CENTER} r="3" fill="#22c55e" aria-hidden="true" />
        <circle
          cx={CENTER}
          cy={CENTER}
          r="6"
          fill="none"
          stroke="#22c55e"
          strokeWidth="1"
          opacity={0.5}
          aria-hidden="true"
        />

        {/* Empty state overlay */}
        {!hasData && (
          <text
            x={CENTER}
            y={CENTER + 4}
            textAnchor="middle"
            fill="#4b5563"
            fontSize="11"
            fontFamily="Inter, sans-serif"
          >
            No data yet
          </text>
        )}
      </svg>

      {/* Legend */}
      <div className="flex items-center gap-4" role="list" aria-label="Carbon layer legend">
        {(Object.entries(RINGS) as [keyof typeof RINGS, typeof RINGS[keyof typeof RINGS]][]).map(
          ([key, ring]) => {
            const value =
              key === 'surface' ? surfaceCarbon : key === 'shadow' ? shadowCarbon : ghostCarbon;
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
                      {value.toFixed(1)}kg
                    </span>
                  )}
                </span>
              </div>
            );
          }
        )}
      </div>
    </div>
  );
}
