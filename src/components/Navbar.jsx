import React, { useEffect, useState } from "react";

export default function Navbar() {
  const currentPath = window.location.pathname;
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const close = () => setMenuOpen(false);
    window.addEventListener("resize", close);
    return () => window.removeEventListener("resize", close);
  }, []);

  return (
    <header>
      <div className="navbar">
        <div className="logo-group">
          <img
            src="https://cdn.corenexis.com/f/YwiVvDmu5FM.png"
            alt="Riverra Crest"
            className="navbar-crest"
          />
          <div className="brand-text">
            <div className="logo">RIVERRA FAMILY</div>
            <div className="slogan">The Legacy Never Dies</div>
          </div>
        </div>

        <button className="nav-toggle" type="button" aria-label={menuOpen ? "Close navigation" : "Open navigation"} aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}>
          <span /><span /><span />
        </button>
        <nav className={menuOpen ? "is-open" : ""} onClick={() => setMenuOpen(false)}>
          <a href="/" className={currentPath === "/" || currentPath === "/index.html" ? "active" : ""}>
            Dashboard
          </a>
          <a href="/family-tree" className={currentPath === "/family-tree" ? "active" : ""}>
            Family Tree
          </a>
          <a href="/admin" className={currentPath === "/admin" ? "active" : ""}>Admin</a>
        </nav>
      </div>
    </header>
  );
}
