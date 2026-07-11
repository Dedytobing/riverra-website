import React, { useEffect, useState } from "react";
import "/src/css/style.css"; 

// Import Library Animasi
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Import Komponen Mandiri
import Loader from "../components/Loader";
import Hero from "../components/Hero";
import HighTable from "../components/HighTable";


// Registrasi Plugin GSAP
gsap.registerPlugin(ScrollTrigger);

function App() {
  // State untuk mengontrol pop-up gambar di galeri
  const [selectedImg, setSelectedImg] = useState(null);

  useEffect(() => {
    // Matikan pemulihan scroll bawaan browser agar tidak mengingat posisi terakhir sebelum refresh
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    let ctx = gsap.context(() => {
      
      // 1. TIMELINE SMOOTH SCROLL (LENIS)
      const lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      });

      function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
      }
      requestAnimationFrame(raf);

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

      // 3. SCROLLTRIGGER ANIMATION (SCROLL REVEAL)
      gsap.from(".about-header", {
        x: -50, opacity: 0, duration: 1, ease: "power3.out",
        scrollTrigger: { trigger: ".about", start: "top 80%" }
      });

      gsap.from(".about-text p", {
        y: 30, opacity: 0, duration: 0.8, stagger: 0.2, ease: "power2.out",
        scrollTrigger: { trigger: ".about", start: "top 75%" }
      });

    });

    // Cleanup memori saat unmount
    return () => ctx.revert();
  }, []);

  return (
    <div id="app">
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
          
          {/* Kontainer Flexbox 4 Kolom */}
          <div style={{ display: "flex", justifyContent: "center", gap: "25px", flexWrap: "wrap", width: "100%" }}>
            
            {/* Foto 1 */}
            <div 
              className="img-card" 
              style={{ flex: "1 1 240px", maxWidth: "280px", cursor: "pointer" }}
              onClick={() => setSelectedImg({
                src: "https://cdn.corenexis.com/f/gDYmYc4r6NG.png",
                title: "RIVERRA ASSEMBLY",
                cat: "FAMILY VISIT"
              })}
            >
              <img src="https://cdn.corenexis.com/f/gDYmYc4r6NG.png" alt="Riverra Assembly" />
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
              style={{ flex: "1 1 240px", maxWidth: "280px", cursor: "pointer" }}
              onClick={() => setSelectedImg({
                src: "https://cdn.corenexis.com/f/v3lr3dpmGfM.png",
                title: "FAMILY GATHERING",
                cat: "TOGETHER AS ONE"
              })}
            >
              <img src="https://cdn.corenexis.com/f/v3lr3dpmGfM.png" alt="Family Gathering" />
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
              style={{ flex: "1 1 240px", maxWidth: "280px", cursor: "pointer" }}
              onClick={() => setSelectedImg({
                src: "https://cdn.corenexis.com/f/DOrhXeSVF72.png",
                title: "SPECIAL MOMENTS",
                cat: "SHARED HAPPINESS"
              })}
            >
              <img src="https://cdn.corenexis.com/f/DOrhXeSVF72.png" alt="Special Moments" />
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
              style={{ flex: "1 1 240px", maxWidth: "280px", cursor: "pointer" }}
              onClick={() => setSelectedImg({
                src: "https://cdn.corenexis.com/f/bgedwEnpitG.png",
                title: "FAMILY REUNION",
                cat: "One Family, One Legacy"
              })}
            >
              <img src="https://cdn.corenexis.com/f/bgedwEnpitG.png" alt="Family Reunion" />
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
              onClick={() => setSelectedImg(null)}
              style={{
                position: "absolute",
                top: "30px",
                right: "40px",
                background: "none",
                border: "none",
                color: "#fff",
                fontSize: "35px",
                cursor: "pointer",
                fontFamily: "monospace",
                opacity: 0.7
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
              <h3 style={{ color: "#fff", fontSize: "22px", letterSpacing: "1px" }}>
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