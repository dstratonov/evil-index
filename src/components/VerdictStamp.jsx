import React from 'react';
import { getVerdict, getVerdictColor } from '../data/companies';

const rotations = {
  CRITICAL: -7,
  HIGH: 5,
  ELEVATED: -4,
  LOW: 3,
};

const VerdictStamp = ({ score, size = 'normal' }) => {
  const verdict = getVerdict(score);
  const color = getVerdictColor(score);

  const fontSize = size === 'small' ? 10 : size === 'large' ? 22 : 14;
  const padding = size === 'small' ? '2px 7px' : size === 'large' ? '8px 20px' : '5px 14px';
  const borderWidth = size === 'small' ? 1.5 : 3;

  return (
    <div
      className="verdict-stamp"
      style={{
        display: 'inline-block',
        padding,
        border: `${borderWidth}px solid ${color}`,
        borderRadius: 3,
        color,
        fontFamily: "'Orbitron', 'JetBrains Mono', monospace",
        fontWeight: 800,
        fontSize,
        letterSpacing: '2px',
        textTransform: 'uppercase',
        transform: `rotate(${rotations[verdict]}deg)`,
        textShadow: `0 0 10px ${color}`,
        boxShadow: `0 0 15px ${color}30, inset 0 0 15px ${color}10`,
        whiteSpace: 'nowrap',
        userSelect: 'none',
        flexShrink: 0,
      }}
    >
      {verdict}
    </div>
  );
};

export default VerdictStamp;
