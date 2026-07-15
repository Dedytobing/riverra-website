import React from "react";

const MEMBERS = [
  {
    role: "The Godfather",
    name: "Hernandez Riverra",
    quote: `"Written laws are but fragile pages without the iron strength to uphold them."`,
    img: "https://i.pinimg.com/736x/1c/65/35/1c6535e7f3f22e308427055cca5ed790.jpg"
  },
  {
    role: "The Silent Anchor",
    name: "Charleta Valence",
    quote: `"The quiet strength that balanced the founder's relentless ambition."`,
    img: "https://cdn.corenexis.com/f/VqzpMxeYZVu.png"
  },
  {
    role: "The Iron Guardian",
    name: "Gerrald Riverra",
    quote: `"Guarding the streets with unwavering discipline and an uncompromising sense of justice."`,
    img: "https://i.pinimg.com/736x/1c/65/35/1c6535e7f3f22e308427055cca5ed790.jpg"
  }
];

export default function HighTable() {
  return (
    <section id="high-table" className="section high-table">
      <div className="container">
        
        <div className="section-center-header">
          <span className="section-tag">THE INNER CIRCLE</span>
          <h2>Founding Members</h2>
          <div className="accent-line-center"></div>
        </div>

        <div className="founding-members-grid">
          {MEMBERS.map((member, index) => (
            <div className="profile-card" key={index}>
              <div className="profile-img-container">
                <img src={member.img} alt={`${member.name} Profile`} />
                <div className="card-glow"></div>
              </div>
              <div className="profile-info">
                <span className="role-tag">{member.role}</span>
                <h3>{member.name}</h3>
                <p className="role-quote">{member.quote}</p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
