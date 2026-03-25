import React, { useState } from 'react';
import EvilGauge from './EvilGauge';
import VerdictStamp from './VerdictStamp';
import { getScoreColor, getVerdictColor, breakdownLabels } from '../data/companies';

const BreakdownBar = ({ label, value, delay, visible }) => {
  const color = getScoreColor(value);

  return (
    <div style={{ marginBottom: 6 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: 3,
          fontSize: 10,
          fontFamily: "'JetBrains Mono', monospace",
        }}
      >
        <span style={{ color: 'rgba(255,255,255,0.45)' }}>{label}</span>
        <span style={{ color, fontWeight: 600 }}>{value}%</span>
      </div>
      <div
        style={{
          height: 5,
          background: 'rgba(255,255,255,0.04)',
          borderRadius: 3,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: visible ? `${value}%` : '0%',
            background: `linear-gradient(90deg, ${color}80, ${color})`,
            borderRadius: 3,
            boxShadow: `0 0 8px ${color}30`,
            transition: `width 1s cubic-bezier(0.4, 0, 0.2, 1) ${delay}ms`,
          }}
        />
      </div>
    </div>
  );
};

const SourceBadge = ({ name, weight }) => (
  <div
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      padding: '3px 8px',
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 3,
      fontSize: 9,
      fontFamily: "'JetBrains Mono', monospace",
      color: 'rgba(255,255,255,0.4)',
    }}
  >
    <span style={{ textTransform: 'capitalize' }}>{name}</span>
    <span style={{ color: 'rgba(255,255,255,0.25)' }}>{Math.round(weight * 100)}%</span>
  </div>
);

const Tag = ({ label }) => {
  const hotTags = [
    'mass-layoffs',
    'surveillance',
    'union-busting',
    'harassment-lawsuits',
    'whistleblower-retaliation',
    'gender-discrimination',
    '100-hour-weeks',
  ];
  const isHot = hotTags.includes(label);
  const color = isHot ? '#ff1744' : '#ffc400';

  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 6px',
        fontSize: 9,
        fontFamily: "'JetBrains Mono', monospace",
        color: `${color}bb`,
        background: `${color}0a`,
        border: `1px solid ${color}25`,
        borderRadius: 2,
        letterSpacing: '0.5px',
      }}
    >
      {label}
    </span>
  );
};

const TrendIndicator = ({ trend }) => {
  const config = {
    up: { symbol: '\u25B2', color: '#ff1744', label: 'WORSENING', animation: 'trendUp 2s ease-in-out infinite' },
    down: { symbol: '\u25BC', color: '#00e676', label: 'IMPROVING', animation: 'trendDown 2s ease-in-out infinite' },
    stable: { symbol: '\u25C6', color: '#ffc400', label: 'STABLE', animation: 'none' },
  };
  const c = config[trend] || config.stable;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        fontSize: 9,
        fontFamily: "'JetBrains Mono', monospace",
        color: c.color,
        letterSpacing: '1px',
        animation: c.animation,
      }}
    >
      <span>{c.symbol}</span>
      {c.label}
    </span>
  );
};

const CompanyCard = ({ company, index }) => {
  const [expanded, setExpanded] = useState(false);
  const [hovered, setHovered] = useState(false);
  const verdictColor = getVerdictColor(company.evilScore);

  return (
    <div
      className="company-card"
      onClick={() => setExpanded(!expanded)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? '#12121e' : '#0e0e1a',
        border: `1px solid ${hovered ? `${verdictColor}25` : 'rgba(255,255,255,0.05)'}`,
        borderRadius: 8,
        padding: 24,
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        animationDelay: `${index * 80}ms`,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Top accent line */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          background: `linear-gradient(90deg, transparent, ${verdictColor}50, transparent)`,
          opacity: hovered ? 1 : 0.3,
          transition: 'opacity 0.3s ease',
        }}
      />

      {/* Dossier watermark */}
      <div
        style={{
          position: 'absolute',
          top: 12,
          right: 16,
          fontSize: 9,
          fontFamily: "'JetBrains Mono', monospace",
          color: 'rgba(255,255,255,0.06)',
          letterSpacing: '2px',
          userSelect: 'none',
        }}
      >
        DOSSIER #{String(company.id).padStart(3, '0')}
      </div>

      {/* Main header */}
      <div className="card-header-layout" style={{ display: 'flex', alignItems: 'flex-start', gap: 20, marginBottom: 16 }}>
        <EvilGauge score={company.evilScore} size={130} />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: 16,
              marginBottom: 6,
              flexWrap: 'wrap',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 5,
                    background: `${verdictColor}12`,
                    border: `1px solid ${verdictColor}30`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 11,
                    fontWeight: 800,
                    color: verdictColor,
                    fontFamily: "'Orbitron', monospace",
                    flexShrink: 0,
                  }}
                >
                  {company.logo}
                </div>
                <div>
                  <h2
                    style={{
                      fontSize: 17,
                      fontWeight: 700,
                      color: '#e0e0e8',
                      fontFamily: "'JetBrains Mono', monospace",
                      lineHeight: 1.2,
                    }}
                  >
                    {company.name}
                  </h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                    <span
                      style={{
                        fontSize: 9,
                        color: 'rgba(255,255,255,0.25)',
                        fontFamily: "'JetBrains Mono', monospace",
                        letterSpacing: '1px',
                      }}
                    >
                      ${company.ticker}
                    </span>
                    <TrendIndicator trend={company.trending} />
                  </div>
                </div>
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: 'rgba(255,255,255,0.35)',
                  fontFamily: "'JetBrains Mono', monospace",
                  marginTop: 6,
                  lineHeight: 1.6,
                }}
              >
                {company.industry} &middot; {company.hq}
                <br />
                {company.employeeCount} employees &middot; Est. {company.founded}
              </div>
            </div>

            <VerdictStamp score={company.evilScore} />
          </div>

          {/* Tags */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 10 }}>
            {company.tags.slice(0, expanded ? undefined : 3).map((tag) => (
              <Tag key={tag} label={tag} />
            ))}
            {!expanded && company.tags.length > 3 && (
              <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', padding: '2px 4px' }}>
                +{company.tags.length - 3}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Expandable section */}
      <div
        style={{
          maxHeight: expanded ? 700 : 0,
          opacity: expanded ? 1 : 0,
          overflow: 'hidden',
          transition: 'max-height 0.5s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.4s ease',
        }}
      >
        <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '4px 0 16px' }} />

        {/* Breakdown */}
        <div style={{ marginBottom: 20 }}>
          <div
            style={{
              fontSize: 9,
              letterSpacing: '3px',
              color: 'rgba(255,255,255,0.2)',
              textTransform: 'uppercase',
              marginBottom: 12,
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            &mdash;&mdash; THREAT BREAKDOWN &mdash;&mdash;
          </div>
          <div className="breakdown-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 24px' }}>
            {Object.entries(company.breakdown).map(([key, value], i) => (
              <BreakdownBar key={key} label={breakdownLabels[key]} value={value} delay={i * 80} visible={expanded} />
            ))}
          </div>
        </div>

        {/* Intel summary */}
        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              fontSize: 9,
              letterSpacing: '3px',
              color: 'rgba(255,255,255,0.2)',
              textTransform: 'uppercase',
              marginBottom: 8,
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            &mdash;&mdash; INTELLIGENCE SUMMARY &mdash;&mdash;
          </div>
          <p
            style={{
              fontSize: 11,
              lineHeight: 1.8,
              color: 'rgba(255,255,255,0.5)',
              fontFamily: "'JetBrains Mono', monospace",
              borderLeft: `2px solid ${verdictColor}35`,
              paddingLeft: 12,
            }}
          >
            {company.intelSummary}
          </p>
        </div>

        {/* Sources and meta */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            flexWrap: 'wrap',
            gap: 8,
          }}
        >
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
            {Object.entries(company.sources).map(([name, weight]) => (
              <SourceBadge key={name} name={name} weight={weight} />
            ))}
          </div>
          <div
            style={{
              fontSize: 9,
              color: 'rgba(255,255,255,0.2)',
              fontFamily: "'JetBrains Mono', monospace",
              textAlign: 'right',
            }}
          >
            {company.signals.toLocaleString()} signals &middot; {company.lastUpdated}
          </div>
        </div>
      </div>

      {/* Expand hint */}
      <div
        style={{
          textAlign: 'center',
          marginTop: 10,
          fontSize: 9,
          color: 'rgba(255,255,255,0.15)',
          fontFamily: "'JetBrains Mono', monospace",
          letterSpacing: '1px',
          transition: 'color 0.2s ease',
        }}
      >
        {expanded ? '\u25B2 COLLAPSE DOSSIER' : '\u25BC EXPAND DOSSIER'}
      </div>
    </div>
  );
};

export default CompanyCard;
