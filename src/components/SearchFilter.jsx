import React from 'react';

const verdicts = [
  { label: 'ALL', value: 'all', color: '#8888a0' },
  { label: 'CRITICAL', value: 'CRITICAL', color: '#ff1744' },
  { label: 'HIGH', value: 'HIGH', color: '#ff6d00' },
  { label: 'ELEVATED', value: 'ELEVATED', color: '#ffc400' },
  { label: 'LOW', value: 'LOW', color: '#00e676' },
];

const sortOptions = [
  { label: 'Anxiety Level (High \u2192 Low)', value: 'score-desc' },
  { label: 'Anxiety Level (Low \u2192 High)', value: 'score-asc' },
  { label: 'Company Name', value: 'name' },
  { label: 'Most Data Points', value: 'signals' },
];

const SearchFilter = ({ search, onSearchChange, activeVerdict, onVerdictChange, sort, onSortChange }) => {
  return (
    <div style={{ padding: '20px 32px', maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ position: 'relative', marginBottom: 16 }}>
        <div
          style={{
            position: 'absolute',
            left: 14,
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: 14,
            color: 'rgba(255,255,255,0.2)',
            pointerEvents: 'none',
            fontFamily: 'monospace',
          }}
        >
          &gt;_
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search companies, industries, tags..."
          style={{
            width: '100%',
            padding: '12px 16px 12px 42px',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 6,
            color: '#e0e0e8',
            fontSize: 13,
            fontFamily: "'JetBrains Mono', monospace",
            outline: 'none',
            transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
          }}
          onFocus={(e) => {
            e.target.style.borderColor = 'rgba(255,23,68,0.3)';
            e.target.style.boxShadow = '0 0 20px rgba(255,23,68,0.05)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = 'rgba(255,255,255,0.08)';
            e.target.style.boxShadow = 'none';
          }}
        />
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {verdicts.map((v) => {
            const active = activeVerdict === v.value;
            return (
              <button
                key={v.value}
                onClick={() => onVerdictChange(v.value)}
                style={{
                  padding: '6px 14px',
                  background: active ? `${v.color}15` : 'transparent',
                  border: `1px solid ${active ? `${v.color}50` : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: 4,
                  color: active ? v.color : 'rgba(255,255,255,0.35)',
                  fontSize: 11,
                  fontWeight: 700,
                  fontFamily: "'JetBrains Mono', monospace",
                  letterSpacing: '1.5px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  textTransform: 'uppercase',
                }}
              >
                {v.label}
              </button>
            );
          })}
        </div>

        <select
          value={sort}
          onChange={(e) => onSortChange(e.target.value)}
          style={{
            padding: '6px 12px',
            background: '#0f1019',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 4,
            color: 'rgba(255,255,255,0.5)',
            fontSize: 11,
            fontFamily: "'JetBrains Mono', monospace",
            cursor: 'pointer',
            outline: 'none',
            appearance: 'none',
            paddingRight: 24,
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%23555570' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 8px center',
          }}
        >
          {sortOptions.map((opt) => (
            <option key={opt.value} value={opt.value} style={{ background: '#0f1019', color: '#e0e0e8' }}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default SearchFilter;
