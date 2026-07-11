import React from "react";

export default function Navbar() {
  const currentPath = window.location.pathname;

  return (
    <header>
      <div className="navbar">
        <div className="logo-group">
          <img
            src="https://raw.githubusercontent.com/Dedytobing/riverra-website/refs/heads/main/assets/logo.png"
            alt="Riverra Crest"
            className="navbar-crest"
          />
          <div className="brand-text">
            <div className="logo">RIVERRA FAMILY</div>
            <div className="slogan">The Legacy Never Dies</div>
          </div>
        </div>

        <nav>
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
