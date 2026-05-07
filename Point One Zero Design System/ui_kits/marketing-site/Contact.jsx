// Contact.jsx — two-column form.
const Contact = () => {
  const [f, setF] = React.useState({ name: '', email: '', company: '', budget: '50–100k', brief: '' });
  const [sent, setSent] = React.useState(false);
  const up = (k) => (e) => setF({ ...f, [k]: e.target.value });
  return (
    <section className="poz-section poz-section--dark">
      <div className="poz-contact">
        <div className="poz-contact__left">
          <span className="poz-eyebrow-sm" style={{color:'rgba(255,255,255,.6)'}}>start a project</span>
          <h2 className="poz-contact__title">let's make<br/>something <em>real</em>.</h2>
          <p className="poz-contact__lede">
            a short brief is plenty. we reply within <strong><em>one business day</em></strong>.
          </p>
          <div className="poz-contact__meta">
            <div><span>email</span>hello@pointonezero.studio</div>
            <div><span>based in</span>remote · americas &amp; eu</div>
          </div>
        </div>
        <form className="poz-contact__form" onSubmit={(e) => { e.preventDefault(); setSent(true); }}>
          {sent ? (
            <div className="poz-contact__sent">
              <div className="poz-eyebrow-sm" style={{color:'#009FF0'}}>received</div>
              <div className="poz-contact__sent-title">thanks, {f.name || 'friend'}.</div>
              <p>we'll be in touch shortly.</p>
            </div>
          ) : (
            <>
              <div className="poz-row2">
                <Field label="name" value={f.name} onChange={up('name')} placeholder="sam rivera" />
                <Field label="email" value={f.email} onChange={up('email')} placeholder="you@company.com" />
              </div>
              <Field label="company" value={f.company} onChange={up('company')} placeholder="studio, inc." />
              <div className="poz-field">
                <label className="poz-label">budget</label>
                <select className="poz-input" value={f.budget} onChange={up('budget')}>
                  <option>under 50k</option>
                  <option>50–100k</option>
                  <option>100–250k</option>
                  <option>250k+</option>
                </select>
              </div>
              <div className="poz-field">
                <label className="poz-label">what are you building?</label>
                <textarea className="poz-input" rows={3} value={f.brief} onChange={up('brief')}
                          placeholder="a few sentences is plenty." />
              </div>
              <button type="submit" className="poz-btn poz-btn--brand poz-btn--full">send brief →</button>
            </>
          )}
        </form>
      </div>
    </section>
  );
};
const Field = ({ label, value, onChange, placeholder }) => (
  <div className="poz-field">
    <label className="poz-label">{label}</label>
    <input className="poz-input" value={value} onChange={onChange} placeholder={placeholder} />
  </div>
);
Object.assign(window, { Contact });
