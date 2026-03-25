import React, { useState, useMemo } from 'react';
import Header from './components/Header';
import SearchFilter from './components/SearchFilter';
import CompanyCard from './components/CompanyCard';
import { companies, getVerdict } from './data/companies';

const App = () => {
  const [search, setSearch] = useState('');
  const [activeVerdict, setActiveVerdict] = useState('all');
  const [sort, setSort] = useState('score-desc');

  const totalSignals = useMemo(() => companies.reduce((sum, c) => sum + c.signals, 0), []);

  const filteredCompanies = useMemo(() => {
    let result = [...companies];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.industry.toLowerCase().includes(q) ||
          c.hq.toLowerCase().includes(q) ||
          c.ticker.toLowerCase().includes(q) ||
          c.tags.some((t) => t.toLowerCase().includes(q)),
      );
    }

    if (activeVerdict !== 'all') {
      result = result.filter((c) => getVerdict(c.evilScore) === activeVerdict);
    }

    switch (sort) {
      case 'score-desc':
        result.sort((a, b) => b.evilScore - a.evilScore);
        break;
      case 'score-asc':
        result.sort((a, b) => a.evilScore - b.evilScore);
        break;
      case 'name':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'signals':
        result.sort((a, b) => b.signals - a.signals);
        break;
    }

    return result;
  }, [search, activeVerdict, sort]);

  return (
    <div style={{ minHeight: '100vh', position: 'relative' }}>
      <div className="grid-bg" />
      <div className="scanline-overlay" />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <Header totalSignals={totalSignals} />

        <SearchFilter
          search={search}
          onSearchChange={setSearch}
          activeVerdict={activeVerdict}
          onVerdictChange={setActiveVerdict}
          sort={sort}
          onSortChange={setSort}
        />

        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '8px 32px 60px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 16,
              fontSize: 10,
              fontFamily: "'JetBrains Mono', monospace",
              color: 'rgba(255,255,255,0.2)',
              letterSpacing: '1px',
            }}
          >
            <span>
              {filteredCompanies.length} DOSSIER{filteredCompanies.length !== 1 ? 'S' : ''} FOUND
            </span>
            <span style={{ fontSize: 9 }}>ALL DATA FROM PUBLIC SOURCES</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {filteredCompanies.map((company, index) => (
              <CompanyCard key={company.id} company={company} index={index} />
            ))}
          </div>

          {filteredCompanies.length === 0 && (
            <div
              style={{
                textAlign: 'center',
                padding: '80px 20px',
                color: 'rgba(255,255,255,0.15)',
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }}>{'\u25CB'}</div>
              <div style={{ fontSize: 13, letterSpacing: '2px' }}>NO MATCHING DOSSIERS</div>
              <div style={{ fontSize: 10, marginTop: 8 }}>Adjust search parameters or filters</div>
            </div>
          )}
        </div>

        <footer
          style={{
            padding: '20px 32px',
            borderTop: '1px solid rgba(255,255,255,0.04)',
            textAlign: 'center',
            fontSize: 9,
            color: 'rgba(255,255,255,0.12)',
            fontFamily: "'JetBrains Mono', monospace",
            letterSpacing: '1px',
            lineHeight: 1.8,
          }}
        >
          EVIL INDEX v0.1.0 &middot; AGGREGATED FROM PUBLIC SOURCES &middot; FOR INFORMATIONAL PURPOSES ONLY
          <br />
          SCORES REPRESENT ALGORITHMIC ANALYSIS OF PUBLIC SENTIMENT, NOT VERIFIED FACTS
        </footer>
      </div>
    </div>
  );
};

export default App;
