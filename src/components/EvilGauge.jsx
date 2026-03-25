import React, { useState, useEffect, useRef } from 'react';
import { getScoreColor } from '../data/companies';

const EvilGauge = ({ score, size = 160 }) => {
  const [displayScore, setDisplayScore] = useState(0);
  const [mounted, setMounted] = useState(false);
  const rafRef = useRef();

  useEffect(() => {
    const delay = setTimeout(() => {
      setMounted(true);
      const duration = 1500;
      const startTime = performance.now();

      const animate = (time) => {
        const elapsed = time - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplayScore(Math.round(eased * score));
        if (progress < 1) {
          rafRef.current = requestAnimationFrame(animate);
        }
      };

      rafRef.current = requestAnimationFrame(animate);
    }, 200);

    return () => {
      clearTimeout(delay);
      cancelAnimationFrame(rafRef.current);
    };
  }, [score]);

  const center = size / 2;
  const strokeWidth = 8;
  const radius = center - strokeWidth - 8;
  const circumference = 2 * Math.PI * radius;
  const arcLength = circumference * 0.75;
  const progress = mounted ? (score / 100) * arcLength : 0;
  const color = getScoreColor(displayScore);

  const ticks = [];
  const numTicks = 27;
  for (let i = 0; i <= numTicks; i++) {
    const angle = (135 + (i / numTicks) * 270) * (Math.PI / 180);
    const isMajor = i % 3 === 0;
    const innerR = radius - (isMajor ? 14 : 7);
    const outerR = radius - 2;
    ticks.push(
      <line
        key={i}
        x1={center + innerR * Math.cos(angle)}
        y1={center + innerR * Math.sin(angle)}
        x2={center + outerR * Math.cos(angle)}
        y2={center + outerR * Math.sin(angle)}
        stroke={isMajor ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.05)'}
        strokeWidth={isMajor ? 1.5 : 0.75}
      />,
    );
  }

  const gaugeId = `gauge-glow-${score}-${size}`;

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <filter id={gaugeId}>
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {ticks}

        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.04)"
          strokeWidth={strokeWidth}
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeLinecap="round"
          transform={`rotate(135 ${center} ${center})`}
        />

        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={`${progress} ${circumference}`}
          strokeLinecap="round"
          transform={`rotate(135 ${center} ${center})`}
          filter={`url(#${gaugeId})`}
          style={{
            transition: 'stroke-dasharray 1.5s cubic-bezier(0.4, 0, 0.2, 1), stroke 1.5s ease-out',
          }}
        />
      </svg>

      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontSize: size * 0.28,
            fontWeight: 800,
            fontFamily: "'Orbitron', 'JetBrains Mono', monospace",
            color: color,
            textShadow: `0 0 20px ${color}, 0 0 40px ${color}40`,
            lineHeight: 1,
          }}
        >
          {displayScore}
        </div>
        <div
          style={{
            fontSize: Math.max(size * 0.065, 8),
            color: 'rgba(255,255,255,0.25)',
            fontFamily: "'JetBrains Mono', monospace",
            letterSpacing: '2px',
            textTransform: 'uppercase',
            marginTop: 4,
          }}
        >
          EVIL INDEX
        </div>
      </div>
    </div>
  );
};

export default EvilGauge;
