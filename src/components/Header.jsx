import React, { useState, useEffect, useRef } from 'react';

const Header = ({ totalSignals }) => {
  const [signalCount, setSignalCount] = useState(0);
  const rafRef = useRef();

  useEffect(() => {
    const duration = 2000;
    const startTime = performance.now();

    const animate = (time) => {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setSignalCount(Math.round(eased * totalSignals));
      if (progress < 1) rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [totalSignals]);

  return (
    <header
      style={{
        padding: '24px 32px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        position: 'relative',
        background: 'linear-gradient(180deg, rgba(255,23,68,0.04) 0%, transparent 100%)',
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="live-dot" />
            <h1
              style={{
                fontSize: 28,
                fontWeight: 900,
                fontFamily: "'Orbitron', sans-serif",
                color: '#ff1744',
                letterSpacing: '4px',
                textShadow: '0 0 20px rgba(255,23,68,0.3)',
                textTransform: 'uppercase',
              }}
            >
              ANXIETY INDEX
            </h1>
          </div>
          <p
            style={{
              fontSize: 11,
              color: 'rgba(255,255,255,0.25)',
              fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: '2px',
              textTransform: 'uppercase',
              marginTop: 4,
              marginLeft: 20,
            }}
          >
            Workplace Stress Intelligence Platform
          </p>
        </div>

        <div style={{ textAlign: 'right', fontFamily: "'JetBrains Mono', monospace" }}>
          <div
            style={{
              fontSize: 9,
              letterSpacing: '2px',
              color: 'rgba(255,255,255,0.25)',
              textTransform: 'uppercase',
              marginBottom: 4,
            }}
          >
            Data Points Analyzed
          </div>
          <div
            style={{
              fontSize: 24,
              fontWeight: 700,
              fontFamily: "'Orbitron', monospace",
              color: '#ff1744',
              textShadow: '0 0 15px rgba(255,23,68,0.4)',
            }}
          >
            {signalCount.toLocaleString()}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
