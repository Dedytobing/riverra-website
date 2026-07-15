import React, { useEffect, useState, useRef } from "react";
import "/src/css/style.css"; 

// Import Library Animasi
import Lenis from "lenis";
import gsap from "gsap";

// Import Komponen Mandiri
import Loader from "../components/Loader";
import Hero from "../components/Hero";
import HighTable from "../components/HighTable";
import { API_BASE } from "../lib/api";


function App() {
  // State untuk mengontrol pop-up gambar di galeri
  const [selectedImg, setSelectedImg] = useState(null);
  const [remoteGallery, setRemoteGallery] = useState([]);
  const closeButtonRef = useRef(null);
  const appRef = useRef(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${API_BASE}/gallery`, { signal: controller.signal })
      .then((response) => response.ok ? response.json() : null)
      .then((body) => {
        if (Array.isArray(body?.data) && body.data.length) setRemoteGallery(body.data);
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);

  useEffect(() => {
    // Matikan pemulihan scroll bawaan browser agar tidak mengingat posisi terakhir sebelum refresh
    const previousScrollRestoration = window.history.scrollRestoration;
    if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual';
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let lenis = null;
    let frameId = null;
    let revealObserver = null;
    if (prefersReducedMotion) {
      const loader = document.getElementById('loader');
      if (loader) loader.style.display = 'none';
      return () => { window.history.scrollRestoration = previousScrollRestoration; };
    }

    const ctx = gsap.context(() => {
      
      // 1. TIMELINE SMOOTH SCROLL (LENIS)
      lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      });

      function raf(time) {
        lenis.raf(time);
        frameId = requestAnimationFrame(raf);
      }
      frameId = requestAnimationFrame(raf);

      // 2. TIMELINE LOADER & ENTERING ANIMATION
      const tl = gsap.timeline();
      tl.to("#loader h1", {
        scale: 1.05,
        letterSpacing: "20px",
        opacity: 0,
        duration: 1,
        ease: "power3.inOut",
      })
      .to(".loader-line", {
        width: 0,
        opacity: 0,
        duration: 0.6,
        ease: "power2.inOut",
      }, "-=0.8")
      .to("#loader", {
        opacity: 0,
        duration: 0.8,
        ease: "power2.out",
        onComplete: () => {
          const loaderEl = document.getElementById("loader");
          if (loaderEl) loaderEl.style.display = "none";
          
          // SOLUSI ABSOLUT: Paksa browser dan Lenis meluncur ke paling atas setelah loader hilang
          window.scrollTo(0, 0);
          lenis.scrollTo(0, { immediate: true });
        },
      })
      .from(".hero-content", {
        y: 30,
        opacity: 0,
        duration: 1,
        ease: "power3.out"
      }, "-=0.2");

      // 3. SCROLL REVEAL. IntersectionObserver avoids ScrollTrigger's
      // temporary 100vh measuring node racing with React Strict Mode cleanup.
      const about = appRef.current?.querySelector(".about");
      if (about) {
        gsap.set(".about-header", { x: -50, opacity: 0 });
        gsap.set(".about-text p", { y: 30, opacity: 0 });
        revealObserver = new IntersectionObserver(([entry]) => {
          if (!entry.isIntersecting) return;
          gsap.to(".about-header", { x: 0, opacity: 1, duration: 1, ease: "power3.out" });
          gsap.to(".about-text p", { y: 0, opacity: 1, duration: 0.8, stagger: 0.2, ease: "power2.out" });
          revealObserver?.disconnect();
        }, { rootMargin: "0px 0px -20% 0px", threshold: 0.05 });
        revealObserver.observe(about);
      }

    }, appRef);

    // Cleanup memori saat unmount
    return () => {
      if (frameId !== null) cancelAnimationFrame(frameId);
      revealObserver?.disconnect();
      if (lenis) lenis.destroy();
      // Revert only animations created inside this page context.
      ctx.revert();
      window.history.scrollRestoration = previousScrollRestoration;
    };
  }, []);

  useEffect(() => {
    if (!selectedImg) return undefined;
    closeButtonRef.current?.focus();
    const onKeyDown = (event) => event.key === "Escape" && setSelectedImg(null);
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [selectedImg]);

  return (
    <div id="app" ref={appRef}>
      <Loader />
      <Hero />

      {/* ELEMEN DEKORATIF: Teks Berjalan Elegan (Ticker) */}
      <div className="ticker-container">
        <div className="ticker-text">
          <span>THE LEGACY NEVER DIES • HONOR OVER LIFE • SOVEREIGNTY MUTLAK • THE IRON SYNDICATE • </span>
          <span>THE LEGACY NEVER DIES • HONOR OVER LIFE • SOVEREIGNTY MUTLAK • THE IRON SYNDICATE • </span>
        </div>
      </div>

      {/* SECTION ABOUT */}
      <section id="about" className="section about">
        <div className="bg-watermark">RIVERRA</div>
        <div className="container">
          <div className="about-wrapper">
            <div className="about-header">
              <span className="section-tag">WHO WE ARE</span>
              <h2>The Iron Syndicate</h2>
              <div className="accent-line"></div>
            </div>
            <div className="about-text">
            <p>The House of Riverra is built upon the enduring foundations of honor, brotherhood, and traditions passed down through generations. More than a family, we are a legacy united by unwavering loyalty, mutual respect, and an unbreakable sense of belonging.</p>
            <p>Every member is bound by an oath of blood loyalty, carrying the legacy of greatness from the first generation until the end of time. Our name is not defined by titles alone, but by the unity we preserve, the devotion we uphold, and the values that continue to shape every generation of Riverra.</p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION HIGH TABLE */}
      <HighTable />

      {/* SECTION GALLERY ARCHIVES */}
      <section id="gallery" className="section gallery">
        <div className="container">
          <div className="section-center-header">
            <span className="section-tag">ARCHIVES</span>
            <h2>Family Activities</h2>
            <div className="accent-line-center"></div>
          </div>
          
          <div className="family-activities-grid">
            {remoteGallery.map((item) => (
              <div key={item.id || item.src} className="img-card" onClick={() => setSelectedImg({ src: item.src, title: item.name, cat: item.caption || "FAMILY ARCHIVE" })}>
                <img src={item.src} alt={item.caption || item.name || "Family archive"} width="280" height="300" loading="lazy" decoding="async" />
                <div className="img-overlay"><div className="overlay-inner"><span className="gallery-cat">{item.caption || "FAMILY ARCHIVE"}</span><h3>{item.name}</h3></div></div>
              </div>
            ))}
            
            {/* Foto 1 */}
            <div 
              className="img-card" 
              onClick={() => setSelectedImg({
                src: "https://cdn.corenexis.com/f/gDYmYc4r6NG.png",
                title: "RIVERRA ASSEMBLY",
                cat: "FAMILY VISIT"
              })}
            >
              <img src="https://cdn.corenexis.com/f/gDYmYc4r6NG.png" alt="Riverra Assembly" width="280" height="300" loading="lazy" decoding="async" />
              <div className="img-overlay">
                <div className="overlay-inner">
                  <span className="gallery-cat">FAMILY VISIT</span>
                  <h3>RIVERRA ASSEMBLY</h3>
                </div>
              </div>
            </div>

            {/* Foto 2 */}
            <div 
              className="img-card" 
              onClick={() => setSelectedImg({
                src: "https://cdn.corenexis.com/f/v3lr3dpmGfM.png",
                title: "FAMILY GATHERING",
                cat: "TOGETHER AS ONE"
              })}
            >
              <img src="https://cdn.corenexis.com/f/v3lr3dpmGfM.png" alt="Family Gathering" width="280" height="300" loading="lazy" decoding="async" />
              <div className="img-overlay">
                <div className="overlay-inner">
                  <span className="gallery-cat">TOGETHER AS ONE</span>
                  <h3>FAMILY GATHERING</h3>
                </div>
              </div>
            </div>

            {/* Foto 3 */}
            <div 
              className="img-card" 
              onClick={() => setSelectedImg({
                src: "https://cdn.corenexis.com/f/DOrhXeSVF72.png",
                title: "SPECIAL MOMENTS",
                cat: "SHARED HAPPINESS"
              })}
            >
              <img src="https://cdn.corenexis.com/f/DOrhXeSVF72.png" alt="Special Moments" width="280" height="300" loading="lazy" decoding="async" />
              <div className="img-overlay">
                <div className="overlay-inner">
                  <span className="gallery-cat">SHARED HAPPINESS</span>
                  <h3>SPECIAL MOMENTS</h3>
                </div>
              </div>
            </div>

            {/* Foto 4 */}
            <div 
              className="img-card" 
              onClick={() => setSelectedImg({
                src: "https://cdn.corenexis.com/f/bgedwEnpitG.png",
                title: "FAMILY REUNION",
                cat: "One Family, One Legacy"
              })}
            >
              <img src="https://cdn.corenexis.com/f/bgedwEnpitG.png" alt="Family Reunion" width="280" height="300" loading="lazy" decoding="async" />
              <div className="img-overlay">
                <div className="overlay-inner">
                  <span className="gallery-cat">One Family, One Legacy</span>
                  <h3>FAMILY REUNION</h3>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* MODAL POP-UP LIGHTBOX FULLSCREEN */}
        {selectedImg && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="gallery-modal-title"
            onClick={() => setSelectedImg(null)} 
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(5, 5, 5, 0.95)",
              backdropFilter: "blur(12px)",
              zIndex: 99999,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "20px",
              cursor: "zoom-out"
            }}
          >
            {/* Tombol Silang */}
            <button
              ref={closeButtonRef}
              type="button"
              aria-label="Close gallery"
              onClick={() => setSelectedImg(null)}
               style={{
                 position: "absolute",
                 top: "20px",
                 right: "20px",
                 width: "44px",
                 height: "44px",
                 display: "grid",
                 placeItems: "center",
                 background: "rgba(15, 15, 15, 0.9)",
                 border: "1px solid rgba(227, 196, 130, 0.8)",
                 color: "#fff",
                 fontSize: "28px",
                 lineHeight: 1,
                 cursor: "pointer",
                 fontFamily: "monospace",
                 opacity: 1,
                 borderRadius: "50%"
               }}
            >
              &times;
            </button>

            {/* Frame Gambar */}
            <div 
              onClick={(e) => e.stopPropagation()} 
              style={{
                maxWidth: "85%",
                maxHeight: "75vh",
                boxShadow: "0 20px 50px rgba(0,0,0,0.8)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                backgroundColor: "#111"
              }}
            >
              <img 
                src={selectedImg.src} 
                alt={selectedImg.title} 
                style={{ maxWidth: "100%", maxHeight: "75vh", objectFit: "contain", display: "block" }} 
              />
            </div>

            {/* Teks Deskripsi Pop-up */}
            <div 
              onClick={(e) => e.stopPropagation()} 
              style={{ textAlign: "center", marginTop: "20px", fontFamily: "'Cinzel', serif" }}
            >
              <span style={{ color: "#d9b66f", fontSize: "11px", letterSpacing: "3px", display: "block", marginBottom: "5px" }}>
                {selectedImg.cat}
              </span>
              <h3 id="gallery-modal-title" style={{ color: "#fff", fontSize: "22px", letterSpacing: "1px" }}>
                {selectedImg.title}
              </h3>
            </div>
          </div>
        )}
      </section>

      <footer>
        <p>&copy; 2026 RIVERRA DYNASTY. All Rights Reserved. "The Legacy Never Dies"</p>
      </footer>
    </div>
  );
}

export default App;
