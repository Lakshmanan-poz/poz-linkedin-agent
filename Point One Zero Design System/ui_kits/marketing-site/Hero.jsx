// Hero.jsx — full-bleed dark hero with display type.
const Hero = ({ onCta }) => (
  <section className="poz-hero">
    <div className="poz-hero__eyebrow">AI-native strategy &amp; design</div>
    <h1 className="poz-hero__title">
      strategy, design,<br/>
      and systems — <em>shipped.</em>
    </h1>
    <p className="poz-hero__lede">
      we build products, reimagine experiences, and <strong><em>accelerate growth</em></strong> for ambitious teams.
    </p>
    <div className="poz-hero__ctas">
      <button className="poz-btn poz-btn--brand" onClick={onCta}>start a project</button>
      <button className="poz-btn poz-btn--ghost-dark" onClick={() => window.parent?.onNav?.('work')}>see the work →</button>
    </div>
    <div className="poz-hero__foot">
      <span className="poz-eyebrow-sm">trusted by</span>
      <div className="poz-hero__logos">
        <span>signal bank</span>
        <span>north grid</span>
        <span>helio health</span>
        <span>ferment</span>
        <span>atlas fm</span>
      </div>
    </div>
  </section>
);
Object.assign(window, { Hero });
