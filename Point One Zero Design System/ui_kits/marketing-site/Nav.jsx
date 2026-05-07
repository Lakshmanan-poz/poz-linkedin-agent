// Nav.jsx — fixed top nav for POZ marketing.
const Nav = ({ active, onNav }) => {
  const links = ['work', 'services', 'studio', 'journal'];
  return (
    <header className="poz-nav">
      <a className="poz-nav__brand" href="#" onClick={(e) => { e.preventDefault(); onNav('home'); }}>
        <img src="../../assets/logo-mark-black.png" alt="" />
        <span>point one zero</span>
      </a>
      <nav className="poz-nav__links">
        {links.map((l) => (
          <a key={l} href="#" className={active === l ? 'active' : ''}
             onClick={(e) => { e.preventDefault(); onNav(l); }}>{l}</a>
        ))}
      </nav>
      <button className="poz-btn poz-btn--primary" onClick={() => onNav('contact')}>
        start a project →
      </button>
    </header>
  );
};
Object.assign(window, { Nav });
