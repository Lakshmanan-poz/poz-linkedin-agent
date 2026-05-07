// ServicesList.jsx — numbered rows.
const SERVICES = [
  { n: '01', name: 'AI product strategy',
    body: 'opportunity mapping, problem framing, roadmap. we end with what to ship, not a slide deck.' },
  { n: '02', name: 'Product &amp; experience design',
    body: 'end-to-end product design, from discovery to handoff. systems that scale.' },
  { n: '03', name: 'Growth &amp; activation',
    body: 'onboarding, activation, retention — shipped, measured, iterated.' },
  { n: '04', name: 'Brand &amp; design systems',
    body: 'identities and systems built for teams who will keep building after us.' },
];

const ServicesList = () => {
  const [open, setOpen] = React.useState('01');
  return (
    <section className="poz-section poz-section--light">
      <div className="poz-section__head">
        <span className="poz-eyebrow-sm">what we do</span>
        <h2 className="poz-section__title">services</h2>
      </div>
      <div className="poz-svc">
        {SERVICES.map((s) => (
          <div key={s.n}
               className={`poz-svc__row ${open === s.n ? 'is-open' : ''}`}
               onClick={() => setOpen(open === s.n ? null : s.n)}>
            <div className="poz-svc__n">{s.n}</div>
            <div className="poz-svc__name" dangerouslySetInnerHTML={{ __html: s.name }} />
            <div className="poz-svc__plus">{open === s.n ? '−' : '+'}</div>
            {open === s.n && <div className="poz-svc__body">{s.body}</div>}
          </div>
        ))}
      </div>
    </section>
  );
};
Object.assign(window, { ServicesList });
