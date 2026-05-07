// WorkGrid.jsx — case-study tiles.
const CASES = [
  { id: 'signal', name: 'Signal Bank', tag: 'fintech · onboarding', year: '2025',
    blurb: 'reimagined onboarding for a challenger bank — 38% lift in completion.',
    theme: 'blue' },
  { id: 'northgrid', name: 'North Grid', tag: 'energy · dashboard', year: '2025',
    blurb: 'a clear view of a messy grid. operator tooling rebuilt from scratch.',
    theme: 'ink' },
  { id: 'helio', name: 'Helio Health', tag: 'health · ai triage', year: '2024',
    blurb: 'triage agent that sounds like a nurse, not a chatbot.',
    theme: 'electric' },
  { id: 'ferment', name: 'Ferment', tag: 'food · marketplace', year: '2024',
    blurb: 'a supply market for small producers. zero jargon.',
    theme: 'neutral' },
];

const WorkTile = ({ c, onOpen }) => (
  <a className={`poz-tile poz-tile--${c.theme}`} href="#" onClick={(e) => { e.preventDefault(); onOpen?.(c); }}>
    <div className="poz-tile__meta">
      <span>{c.tag}</span><span>{c.year}</span>
    </div>
    <div className="poz-tile__name">{c.name}</div>
    <div className="poz-tile__blurb">{c.blurb}</div>
    <div className="poz-tile__arrow">→</div>
  </a>
);

const WorkGrid = () => {
  const [open, setOpen] = React.useState(null);
  return (
    <section className="poz-section">
      <div className="poz-section__head">
        <span className="poz-eyebrow-sm">selected work · 2024–25</span>
        <h2 className="poz-section__title">recent projects</h2>
      </div>
      <div className="poz-work-grid">
        {CASES.map((c) => <WorkTile key={c.id} c={c} onOpen={setOpen} />)}
      </div>
      {open && (
        <div className="poz-modal" onClick={() => setOpen(null)}>
          <div className="poz-modal__box" onClick={(e) => e.stopPropagation()}>
            <div className="poz-eyebrow-sm">{open.tag} · {open.year}</div>
            <h3 className="poz-modal__title">{open.name}</h3>
            <p className="poz-modal__blurb">{open.blurb}</p>
            <button className="poz-btn poz-btn--primary" onClick={() => setOpen(null)}>close</button>
          </div>
        </div>
      )}
    </section>
  );
};
Object.assign(window, { WorkGrid });
