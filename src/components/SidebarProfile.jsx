const fallbackPhoto = "https://i.pinimg.com/736x/1c/65/35/1c6535e7f3f22e308427055cca5ed790.jpg";

export default function SidebarProfile({ member }) {
  if (!member) {
    return (
      <aside className="profile-sidebar profile-sidebar--empty">
        <img className="profile-photo" src={fallbackPhoto} alt="Select a family member" />
        <h2>Select Member</h2>
        <dl className="profile-details">
          <div><dt>Generation</dt><dd>-</dd></div>
          <div><dt>Status</dt><dd>-</dd></div>
          <div><dt>Occupation</dt><dd>-</dd></div>
          <div><dt>Biography</dt><dd>-</dd></div>
        </dl>
        <p className="profile-bio">Select one member...</p>
      </aside>
    );
  }

  const fullName = `${member.first_name || ""} ${member.last_name || ""}`.trim();
  return (
    <aside className="profile-sidebar">
      <span className="eyebrow">Member profile</span>
      <img className="profile-photo" src={member.photo || fallbackPhoto} alt={fullName} />
      <h2>{fullName}</h2>
      <dl className="profile-details">
        <div><dt>Generation</dt><dd>{member.generation || "—"}</dd></div>
        <div><dt>Status</dt><dd>{member.status || member.life_status || "—"}</dd></div>
        {member.occupation && <div><dt>Occupation</dt><dd>{member.occupation}</dd></div>}
      </dl>
      <p className="profile-bio">{member.biography || "No biography has been recorded for this member."}</p>
    </aside>
  );
}
