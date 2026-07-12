import React, { useEffect, useMemo, useState } from "react";
import "../css/admin.css";

const BASE = "https://riverra-backend.vercel.app/api";
const API = `${BASE}/members`;
const empty = {
  id: "",
  first_name: "",
  last_name: "",
  gender: "male",
  role: "",
  generation: 1,
  status: "Living",
  photo: "",
  biography: "",
  occupation: "",
  father_id: "",
  mother_id: "",
  spouse_id: "",
};
const stamp = (user, action) => ({
  audit_action: action,
  audit_by: user.name,
  audit_at: new Date().toISOString(),
});

export default function Admin() {
  const [users, setUsers] = useState([]);
  const [user, setUser] = useState(() =>
    JSON.parse(sessionStorage.getItem("riverra-user") || "null")
  );
  const [members, setMembers] = useState(() =>
    JSON.parse(localStorage.getItem("riverra-family") || "[]")
  );
  const [gallery, setGallery] = useState(() =>
    JSON.parse(localStorage.getItem("riverra-gallery") || "[]")
  );
  const [form, setForm] = useState(empty),
    [editing, setEditing] = useState(false),
    [tab, setTab] = useState("family"),
    [query, setQuery] = useState(""),
    [notice, setNotice] = useState(null),
    [profileOpen, setProfileOpen] = useState(false),
    [profileName, setProfileName] = useState("");
  const notify = (message, type = "success") => {
    setNotice({ message, type });
    setTimeout(() => setNotice(null), 3500);
  };
  const saveProfile = async (e) => {
    e.preventDefault();
    try {
      const r = await fetch(`${BASE}/auth/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ name: profileName }),
      });
      const out = await r.json();
      if (!r.ok) throw new Error(out.message);
      const next = { ...user, name: out.data.name };
      setUser(next);
      sessionStorage.setItem("riverra-user", JSON.stringify(next));
      setProfileOpen(false);
      notify("Profil berhasil diperbarui.");
    } catch (err) {
      notify(err.message, "error");
    }
  };
  const persistMembers = (n) => {
    setMembers(n);
    localStorage.setItem("riverra-family", JSON.stringify(n));
  };
  const canMembers =
    user && ["PJ Server", "PJ Universal", "Super Admin"].includes(user.level);
  const canGallery =
    user && ["PJ Universal", "Super Admin"].includes(user.level);
  const isSuper = user?.level === "Super Admin";
  useEffect(() => {
    fetch(API)
      .then((r) => r.json())
      .then((r) => {
        const d = Array.isArray(r) ? r : r.data;
        if (Array.isArray(d)) persistMembers(d);
      })
      .catch(() => {});
  }, []);
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get("token");
    const authError = params.get("auth_error");
    if (authError) {
      notify(decodeURIComponent(authError), "error");
      history.replaceState({}, "", location.pathname);
      return;
    }
    if (!token) return;
    fetch(`${BASE}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (r) => {
        const out = await r.json();
        if (!r.ok) throw new Error(out.message);
        const u = { ...out.data, level: out.data.role, token };
        sessionStorage.setItem("riverra-user", JSON.stringify(u));
        setUser(u);
        history.replaceState({}, "", location.pathname);
      })
      .catch((e) => notify(e.message, "error"));
  }, []);
  useEffect(() => {
    if (!isSuper) return;
    fetch(`${BASE}/admins`, {
      headers: { Authorization: `Bearer ${user.token}` },
    })
      .then(async (r) => {
        const out = await r.json();
        if (!r.ok) throw new Error(out.message);
        setUsers(
          out.data.map((x) => ({
            ...x,
            level: x.role || "Belum ditentukan",
            active: x.is_active,
          }))
        );
      })
      .catch((e) => notify(e.message, "error"));
  }, [isSuper, user?.token]);
  const filtered = useMemo(
    () =>
      members.filter((m) =>
        `${m.first_name} ${m.last_name}`
          .toLowerCase()
          .includes(query.toLowerCase())
      ),
    [members, query]
  );
  const uploadMemberPhoto = async (file) => {
    if (!file) return;
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
    if (!cloudName || !uploadPreset) return notify("Konfigurasi Cloudinary belum diatur.", "error");
    if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) return notify("Foto harus berupa gambar maksimal 5MB.", "error");
    const data = new FormData(); data.append("file", file); data.append("upload_preset", uploadPreset);
    try { notify("Mengupload foto..."); const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method:"POST", body:data }); const result=await response.json(); if(!response.ok) throw new Error(result.error?.message||"Upload Cloudinary gagal"); setForm((current)=>({...current,photo:result.secure_url})); notify("Foto berhasil diupload ke Cloudinary. Tekan Simpan untuk menyimpan URL ke anggota."); } catch(error) { notify(error.message,"error"); }
  };
  const submit = async (e) => {
    e.preventDefault();
    if (!canMembers) return notify("Anda tidak memiliki akses.", "error");
    const item = {
      ...form,
      id: Number(form.id) || Date.now(),
      generation: Number(form.generation),
      father_id: form.father_id || null,
      mother_id: form.mother_id || null,
      spouse_id: form.spouse_id || null,
      ...stamp(user, editing ? "edited" : "created"),
    };
    const payload = {
      firstName: item.first_name,
      lastName: item.last_name,
      gender: item.gender,
      generation: item.generation,
      status: item.status,
      photo: item.photo,
      biography: item.biography,
      occupation: item.occupation,
      role: item.role,
      fatherId: item.father_id,
      motherId: item.mother_id,
      spouseId: item.spouse_id,
    };
    try {
      const r = await fetch(editing ? `${API}/${item.id}` : API, {
        method: editing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify(payload),
      });
      const out = await r.json();
      if (!r.ok || out.success === false)
        throw new Error(out.message || "Backend menolak data");
      Object.assign(item, out.data || {});
    } catch (err) {
      notify(`Backend: ${err.message}`, "error");
      return;
    }
    persistMembers(
      editing
        ? members.map((x) => (x.id === item.id ? item : x))
        : [...members, item]
    );
    notify(editing ? "Data berhasil diedit." : "Data berhasil ditambahkan.");
    setForm(empty);
    setEditing(false);
  };
  const remove = async (id) => {
    if (!confirm("Hapus anggota ini secara permanen?")) return;
    try {
      const r = await fetch(`${API}/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${user.token}` },
      });
      if (!r.ok) throw new Error("Backend gagal menghapus");
      persistMembers(members.filter((x) => x.id !== id));
      notify("Data berhasil dihapus.");
    } catch (e) {
      notify(e.message, "error");
    }
  };
  const upload = (e) =>
    [...e.target.files].forEach((file) => {
      const rd = new FileReader();
      rd.onload = () => {
        const n = [
          ...gallery,
          {
            id: Date.now() + Math.random(),
            name: file.name,
            src: rd.result,
            ...stamp(user, "uploaded"),
          },
        ];
        setGallery(n);
        localStorage.setItem("riverra-gallery", JSON.stringify(n));
        notify("Foto berhasil di-upload.");
      };
      rd.readAsDataURL(file);
    });
  const updateAccess = async (id, changes) => {
    try {
      const current = users.find((x) => x.id === id);
      const r = await fetch(`${BASE}/admins/${id}/access`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          role: changes.level || current.level,
          isActive: changes.active ?? current.active,
        }),
      });
      const out = await r.json();
      if (!r.ok) throw new Error(out.message);
      setUsers(
        users.map((x) =>
          x.id === id
            ? {
                ...x,
                level: out.data.role || "Belum ditentukan",
                active: out.data.is_active,
              }
            : x
        )
      );
      notify("Akses admin berhasil diperbarui.");
    } catch (e) {
      notify(e.message, "error");
    }
  };
  const deleteAdmin = async (id) => {
    if (!confirm("Hapus akun admin ini secara permanen?")) return;
    try {
      const r = await fetch(`${BASE}/admins/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${user.token}` },
      });
      const out = await r.json();
      if (!r.ok) throw new Error(out.message);
      setUsers(users.filter((x) => x.id !== id));
      notify("Akun admin berhasil dihapus.");
    } catch (e) {
      notify(e.message, "error");
    }
  };
  const [auditLogs, setAuditLogs] = useState([]);
  const [backupFile, setBackupFile] = useState(null);
  const loadAudit = async () => { try { const r=await fetch(`${BASE}/audit-logs`,{headers:{Authorization:`Bearer ${user.token}`}}); const out=await r.json(); if(!r.ok) throw new Error(out.message); setAuditLogs(out.data); } catch(e){notify(e.message,"error")} };
  const downloadBackup = async () => { try { const r=await fetch(`${BASE}/backups/members`,{headers:{Authorization:`Bearer ${user.token}`}}); const out=await r.json(); if(!r.ok) throw new Error(out.message); const a=document.createElement("a"); a.href=URL.createObjectURL(new Blob([JSON.stringify(out.backup,null,2)],{type:"application/json"})); a.download=`riverra-backup-${new Date().toISOString().slice(0,10)}.json`; a.click(); notify("Backup berhasil diunduh."); } catch(e){notify(e.message,"error")} };
  const restoreBackup = async () => { if(!backupFile||!confirm("Restore akan mengganti seluruh data anggota. Lanjutkan?")) return; try { const data=JSON.parse(await backupFile.text()); const r=await fetch(`${BASE}/backups/members/restore`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${user.token}`},body:JSON.stringify(data)}); const out=await r.json(); if(!r.ok) throw new Error(out.message); persistMembers(out.data); notify(out.message); } catch(e){notify(`Restore gagal: ${e.message}`,"error")} };
  if (!user)
    return (
      <main className="admin-page login">
        {notice && (
          <div className={`admin-notice ${notice.type}`}>{notice.message}</div>
        )}
        <div className="admin-card">
          <p className="eyebrow">RIVERRA / SECURE ACCESS</p>
          <h1>Admin portal</h1>
          <p>
            Gunakan akun Discord untuk masuk. Akun baru harus disetujui oleh
            Super Admin.
          </p>
          <a className="discord-login" href={`${BASE}/auth/discord`}>
            Masuk dengan Discord
          </a>
        </div>
      </main>
    );
  return (
    <main className="admin-page">
      {notice && (
        <div className={`admin-notice ${notice.type}`}>{notice.message}</div>
      )}
      <div className="admin-head">
        <div>
          <p className="eyebrow">{user.level}</p>
          <h1>Family archives</h1>
          <p>Masuk sebagai {user.name}</p>
        </div>
        <button
          className="profile-trigger"
          onClick={() => {
            setProfileName(user.name);
            setProfileOpen(true);
          }}
        >
          Profil
          <img
                className="profile-avatar"
                src={user.avatar}
                alt="Discord profile"
              />
        </button>
        <button
          className="ghost"
          onClick={() => {
            sessionStorage.removeItem("riverra-user");
            setUser(null);
          }}
        >
          Keluar
        </button>
      </div>
      {profileOpen && (
        <div className="profile-modal">
          <div className="admin-card">
            <button
              className="modal-close"
              onClick={() => setProfileOpen(false)}
            >
              ×
            </button>
            {user.avatar ? (
              <img
                className="profile-avatar"
                src={user.avatar}
                alt="Discord profile"
              />
            ) : (
              <div className="profile-avatar placeholder">◉</div>
            )}
            <h2>Profil admin</h2>
            <p className="profile-meta">
              {user.email}
              <br />
              Role: {user.level}
            </p>
            <form onSubmit={saveProfile}>
              <label>
                Nama tampilan
                <input
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  required
                />
              </label>
              <button>Simpan profil</button>
            </form>
          </div>
        </div>
      )}
      <div className="admin-tabs">
        <button
          className={tab === "family" ? "selected" : ""}
          onClick={() => setTab("family")}
        >
          Family tree <span>{members.length}</span>
        </button>
        {canGallery && (
          <button
            className={tab === "gallery" ? "selected" : ""}
            onClick={() => setTab("gallery")}
          >
            Gallery <span>{gallery.length}</span>
          </button>
        )}
        {isSuper && (
          <button
            className={tab === "access" ? "selected" : ""}
            onClick={() => setTab("access")}
          >
            Akses admin <span>{users.length}</span>
          </button>
        )}
        {isSuper && <><button className={tab === "audit" ? "selected" : ""} onClick={() => { setTab("audit"); loadAudit(); }}>Audit log</button><button className={tab === "backup" ? "selected" : ""} onClick={() => setTab("backup")}>Backup / Restore</button></>}
      </div>
      {tab === "family" && (
        <section className="admin-grid">
          <form className="admin-card member-form" onSubmit={submit}>
            <h2>{editing ? "Edit anggota" : "Tambah anggota"}</h2>
            <div className="form-grid">
              {[
                ["first_name", "Nama depan"],
                ["last_name", "Nama belakang"],
                ["role", "Peran / gelar"],
                ["occupation", "Pekerjaan"],
                ["generation", "Generasi"],
                ["father_id", "ID ayah"],
                ["mother_id", "ID ibu"],
                ["spouse_id", "ID pasangan"], ["birth_date", "Tanggal lahir"], ["birth_order", "Urutan kelahiran"], ["sibling_type", "Tipe saudara"],
              ].map(([k, l]) => (
                <label key={k}>
                  {l}
                  {k === "birth_date" ? <input type="date" value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} /> : k === "sibling_type" ? <select value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })}><option>full sibling</option><option>half sibling</option><option>adopted sibling</option></select> : k === "generation" ? <select value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })}>{Array.from({ length: 10 }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}</select> : ["father_id", "mother_id", "spouse_id"].includes(k) ? <select value={form[k] || ""} onChange={(e) => setForm({ ...form, [k]: e.target.value })}><option value="">Tidak dipilih</option>{members.filter((m) => m.id !== form.id && (k === "father_id" ? m.gender === "male" : k === "mother_id" ? m.gender === "female" : m.gender !== form.gender)).map((m) => <option key={m.id} value={m.id}>#{m.id} — {m.first_name} {m.last_name}</option>)}</select> : <input value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} required={k === "first_name"} />}
                </label>
              ))}
            </div>
            <label>
              Gender
              <select
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
              >
                <option>male</option>
                <option>female</option>
                <option>other</option>
              </select>
            </label>
            <label>
              Status
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option>Living</option>
                <option>Deceased</option>
              </select>
            </label>
            <label>
              Biografi
              <textarea
                value={form.biography}
                onChange={(e) =>
                  setForm({ ...form, biography: e.target.value })
                }
              />
            </label>
            <label>
              Foto anggota
              <input type="file" accept="image/*" onChange={(e) => uploadMemberPhoto(e.target.files?.[0])} />
              {form.photo && <><small className="upload-status">Foto tersimpan di Cloudinary dan siap disimpan</small><img className="member-photo-preview" src={form.photo} alt="Preview anggota" /><small className="photo-url">{form.photo}</small></>}
            </label>
            <button>{editing ? "Simpan perubahan" : "Tambah anggota"}</button>
          </form>
          <div className="admin-card">
            <div className="member-list-head">
              <h2>Anggota terdaftar</h2>
              <input
                className="search-input"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari nama..."
              />
            </div>
            {filtered.map((m) => (
              <div className="member-row" key={m.id}>
                <div>
                  <b>
                    {m.first_name} {m.last_name}
                  </b>
                  <small>
                    {m.role} · Gen {m.generation}
                  </small>
                  {(m.updated_by || m.audit_by) && (
                    <small className="audit">
                      last edited by: {m.updated_by || m.audit_by},{" "}
                      {new Date(m.updated_at || m.audit_at).toLocaleString("id-ID")}
                    </small>
                  )}
                </div>
                <button
                  onClick={() => {
                    setForm({ ...empty, ...m });
                    setEditing(true);
                  }}
                >
                  Edit
                </button>
                <button className="danger" onClick={() => remove(m.id)}>
                  Hapus
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
      {tab === "gallery" && canGallery && (
        <section className="admin-card">
          <h2>Upload foto galeri</h2>
          <label className="upload-box">
            Pilih foto
            <input type="file" accept="image/*" multiple onChange={upload} />
          </label>
          <div className="gallery-grid">
            {gallery.map((g) => (
              <figure key={g.id}>
                <img src={g.src} />
                <figcaption>
                  <span>
                    {g.name}
                    <small className="audit">
                      {g.audit_action} by: {g.audit_by},{" "}
                      {new Date(g.audit_at).toLocaleString("id-ID")}
                    </small>
                  </span>
                  <button
                    onClick={() => {
                      const n = gallery.filter((x) => x.id !== g.id);
                      setGallery(n);
                      localStorage.setItem(
                        "riverra-gallery",
                        JSON.stringify(n)
                      );
                    }}
                  >
                    Ã—
                  </button>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}
      {tab === "audit" && isSuper && <section className="admin-card audit-panel"><h2>Audit log admin</h2>{auditLogs.map(log=><div className="audit-entry" key={log.id}><div className="audit-main"><b>{log.admin_name}</b><span>{log.action} · {log.entity_type} #{log.entity_id}</span><small>{new Date(log.created_at).toLocaleString("id-ID")}</small></div>{log.details&&<div className="audit-details">{Object.entries(log.details).map(([key,value])=>key === "changes" && value && typeof value === "object" ? <div className="audit-change-list" key={key}>{Object.entries(value).map(([field,change])=><div className="audit-change" key={field}><b>{field.replaceAll("_"," ")}</b><span>{String(change.before ?? "kosong")}</span><i>→</i><span>{String(change.after ?? "kosong")}</span></div>)}</div> : <span key={key}><b>{key.replaceAll("_"," ")}:</b> {Array.isArray(value)?value.join(", "):String(value)}</span>)}</div>}</div>)}</section>}
      {tab === "access" && isSuper && (
        <section className="admin-card">
          <h2>Manajemen akses admin</h2>
          {users.map((u) => (
            <div className="access-row" key={u.id}>
              <div>
                <b>{u.name}</b>
                <small>{u.email}</small>
              </div>
              <select
                value={u.level}
                disabled={u.id === user.id}
                onChange={(e) => updateAccess(u.id, { level: e.target.value })}
              >
                <option>Belum ditentukan</option>
                <option>PJ Server</option>
                <option>PJ Universal</option>
                <option>Super Admin</option>
              </select>
              <button
                disabled={u.id === user.id}
                onClick={() => updateAccess(u.id, { active: !u.active })}
              >
                {u.active ? "Cabut akses" : "Berikan akses"}
              </button>
              {u.id !== user.id && (
                <button
                  className="danger"
                  onClick={() => {
                    if (confirm("Hapus akun ini?"))
                      persistUsers(users.filter((x) => x.id !== u.id));
                  }}
                >
                  Hapus akun
                </button>
              )}
            </div>
          ))}
        </section>
      )}
    </main>
  );
}





