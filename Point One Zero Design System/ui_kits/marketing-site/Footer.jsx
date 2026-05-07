// Footer.jsx
const Footer = () => (
  <footer className="poz-footer">
    <img src="../../assets/wordmark-white.png" alt="point one zero" className="poz-footer__mark" />
    <div className="poz-footer__rows">
      <div>
        <div className="poz-eyebrow-sm" style={{color:'rgba(255,255,255,.5)'}}>studio</div>
        <a href="#">work</a><a href="#">services</a><a href="#">journal</a>
      </div>
      <div>
        <div className="poz-eyebrow-sm" style={{color:'rgba(255,255,255,.5)'}}>contact</div>
        <a href="#">hello@pointonezero.studio</a><a href="#">linkedin</a>
      </div>
      <div>
        <div className="poz-eyebrow-sm" style={{color:'rgba(255,255,255,.5)'}}>colophon</div>
        <span>© 2025 point one zero.</span>
        <span>all rights reserved.</span>
      </div>
    </div>
  </footer>
);

// Journal — simple list
const JOURNAL = [
  { d: 'apr 2026', t: 'less, but sharper.', b: 'a note on restraint as a product strategy.' },
  { d: 'mar 2026', t: 'ai-native is not ai-decorated.', b: 'what the label actually means when you ship.' },
  { d: 'feb 2026', t: 'the 6-week roadmap.', b: 'how we go from kick-off to a roadmap that survives reality.' },
  { d: 'jan 2026', t: 'design systems for teams that will keep building.', b: 'the handoff we always wanted.' },
];
const Journal = () => (
  <section className="poz-section poz-section--light">
    <div className="poz-section__head">
      <span className="poz-eyebrow-sm">writing</span>
      <h2 className="poz-section__title">journal</h2>
    </div>
    <div className="poz-journal">
      {JOURNAL.map((j, i) => (
        <a key={i} className="poz-journal__row" href="#">
          <span className="poz-journal__date">{j.d}</span>
          <span className="poz-journal__t">{j.t}</span>
          <span className="poz-journal__b">{j.b}</span>
          <span className="poz-journal__arr">→</span>
        </a>
      ))}
    </div>
  </section>
);
Object.assign(window, { Footer, Journal });
