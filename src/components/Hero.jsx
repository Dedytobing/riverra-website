import React from "react";

export default function Hero() {
  return (
    <section id="hero" className="hero">
      <video autoPlay muted loop playsInline>
        <source src="https://raw.githubusercontent.com/Dedytobing/riverra-website/refs/heads/main/assets/video.mp4" type="video/mp4" />
      </video>
      <div className="hero-overlay"></div>

      <div className="hero-content">
        <span className="hero-subtitle">ESTABLISHED FOR SOVEREIGNTY</span>
        {/* Hapus kelas split agar teks ter-render murni oleh React */}
        <h1>RIVERRA</h1>
        <div className="hero-divider"></div>
        <p>We are not just a family. We are a legacy.</p>
        <a href="/family-tree" className="btn-primary">Explore Family Tree</a>
      </div>
    </section>
  );
}