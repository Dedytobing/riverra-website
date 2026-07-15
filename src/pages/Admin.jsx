import React, { useEffect, useMemo, useState } from "react";
import "../css/admin.css";
import { API_BASE as BASE } from "../lib/api";

let refreshInFlight = null;
const refreshSession = () => {
  if (!refreshInFlight) {
    refreshInFlight = fetch(`${BASE}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    }).finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
};
const apiFetch = async (url, options = {}, canRefresh = true) => {
  const request = {
    ...options,
    credentials: "include",
    headers: { ...(options.headers || {}) },
  };
  delete request.headers.Authorization;
  const response = await fetch(url, request);
  if (response.status !== 401 || !canRefresh || url.endsWith("/auth/refresh")) {
    return response;
  }
  const refreshed = await refreshSession().catch(() => null);
  if (!refreshed?.ok) return response;
  return apiFetch(url, options, false);
};
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
  const [user, setUser] = useState(null);
  const [members, setMembers] = useState([]);
  const [gallery, setGallery] = useState([]);
  const [form, setForm] = useState(empty),
    [editing, setEditing] = useState(false),
    [tab, setTab] = useState("dashboard"),
    [query, setQuery] = useState(""),
    [notice, setNotice] = useState(null),
    [profileOpen, setProfileOpen] = useState(false),
    [profileName, setProfileName] = useState(""),
    [generationFilter, setGenerationFilter] = useState(""),
    [roleFilter, setRoleFilter] = useState(""),
    [occupationFilter, setOccupationFilter] = useState(""),
    [statusFilter, setStatusFilter] = useState(""),
    [page, setPage] = useState(1),
    [onlineAdmins, setOnlineAdmins] = useState([]);
  const pageSize = 20;
  const notify = (message, type = "success") => {
    setNotice({ message, type });
    setTimeout(() => setNotice(null), 3500);
  };
  useEffect(()=>{if(!user)return;setOnlineAdmins([{id:user.id,name:user.name,role:user.level}]);const heartbeat=()=>apiFetch(`${BASE}/auth/heartbeat`,{method:"POST"});const load=()=>apiFetch(`${BASE}/admins/online`).then(r=>r.json()).then(o=>{if(o.success&&Array.isArray(o.data))setOnlineAdmins(o.data)}).catch(()=>{});heartbeat().then(load).catch(()=>{});const timer=setInterval(()=>heartbeat().then(load).catch(()=>{}),30000);return()=>clearInterval(timer)},[user]);
  const saveProfile = async (e) => {
    e.preventDefault();
    try {
      const r = await apiFetch(`${BASE}/auth/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: profileName }),
      });
      const out = await r.json();
      if (!r.ok) throw new Error(out.message);
      const next = { ...user, name: out.data.name };
      setUser(next);
      setProfileOpen(false);
      notify("Profil berhasil diperbarui.");
    } catch (err) {
      notify(err.message, "error");
    }
  };
  const persistMembers = (n) => {
    setMembers(n);
  };
  const canMembers =
    user && ["PJ Server", "PJ Universal", "Super Admin"].includes(user.level);
  const canGallery =
    user && ["PJ Universal", "Super Admin"].includes(user.level);
  const canDeleteMembers = user && ["PJ Universal", "Super Admin"].includes(user.level);
  const isSuper = user?.level === "Super Admin";
  useEffect(() => {
    apiFetch(API)
      .then((r) => r.json())
      .then((r) => {
        const d = Array.isArray(r) ? r : r.data;
        if (Array.isArray(d)) persistMembers(d);
      })
      .catch(() => {});
  }, []);
  useEffect(() => {
    apiFetch(`${BASE}/gallery`)
      .then(response => response.json().then(body => ({ response, body })))
      .then(({ response, body }) => {
        if (response.ok && Array.isArray(body.data)) setGallery(body.data);
      })
      .catch(() => {});
  }, []);
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const authError = params.get("auth_error");
    if (authError) {
      notify(decodeURIComponent(authError), "error");
      history.replaceState({}, "", location.pathname);
      return;
    }
    apiFetch(`${BASE}/auth/me`)
      .then(async (r) => {
        const out = await r.json();
        if (!r.ok) throw new Error(out.message);
        const u = { ...out.data, level: out.data.role };
        setUser(u);
        history.replaceState({}, "", location.pathname);
      })
      .catch(async () => {
        const refreshed = await apiFetch(`${BASE}/auth/refresh`, { method: "POST" }).catch(() => null);
        if (!refreshed?.ok) return;
        const out = await refreshed.json();
        setUser({ ...out.data, level: out.data.role });
      });
  }, []);
  useEffect(() => {
    if (!isSuper) return;
    apiFetch(`${BASE}/admins`, {
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
  }, [isSuper, user]);
  const filtered = useMemo(() => members.filter((m) => {
    const text = `${m.first_name} ${m.last_name}`.toLowerCase();
    return text.includes(query.toLowerCase()) && (!generationFilter || String(m.generation) === generationFilter) && (!roleFilter || (m.role || "") === roleFilter) && (!occupationFilter || (m.occupation || "") === occupationFilter) && (!statusFilter || (m.status || "") === statusFilter);
  }), [members, query, generationFilter, roleFilter, occupationFilter, statusFilter]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  useEffect(() => {
    setPage((current) => Math.min(current, pageCount));
  }, [pageCount]);
  const pageMembers = filtered.slice((page - 1) * pageSize, page * pageSize);
  const uploadMemberPhoto = async (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) return notify("Foto harus berupa gambar maksimal 5MB.", "error");
    try { notify("Mengupload foto..."); const signed = await apiFetch(`${BASE}/uploads/signature`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ folder: "members" }) }); const signature = await signed.json(); if (!signed.ok) throw new Error(signature.message || "Signature upload gagal"); const data = new FormData(); data.append("file", file); data.append("api_key", signature.data.apiKey); data.append("timestamp", signature.data.timestamp); data.append("folder", signature.data.folder); data.append("signature", signature.data.signature); const response = await fetch(`https://api.cloudinary.com/v1_1/${signature.data.cloudName}/image/upload`, { method: "POST", body: data }); const result=await response.json(); if(!response.ok) throw new Error(result.error?.message||"Upload Cloudinary gagal"); setForm((current)=>({...current,photo:result.secure_url})); notify("Foto berhasil diupload. Tekan Simpan untuk menyimpan URL ke anggota."); } catch(error) { notify(error.message,"error"); }
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
      const r = await apiFetch(editing ? `${API}/${item.id}` : API, {
        method: editing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
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
      const r = await apiFetch(`${API}/${id}`, {
        method: "DELETE",
      });
      if (!r.ok) throw new Error("Backend gagal menghapus");
      persistMembers(members.filter((x) => x.id !== id));
      notify("Data berhasil dihapus.");
    } catch (e) {
      notify(e.message, "error");
    }
  };
  const upload = async (e) => {
    for (const file of [...(e.target.files || [])]) {
      if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) {
        notify("Foto harus berupa gambar maksimal 5MB.", "error");
        continue;
      }
      try {
        const signed = await apiFetch(`${BASE}/uploads/signature`, { method: "POST" });
        const signature = await signed.json();
        if (!signed.ok) throw new Error(signature.message || "Signature upload gagal");
        const body = new FormData();
        body.append("file", file);
        body.append("api_key", signature.data.apiKey);
        body.append("timestamp", signature.data.timestamp);
        body.append("folder", signature.data.folder);
        body.append("signature", signature.data.signature);
        const uploaded = await fetch(`https://api.cloudinary.com/v1_1/${signature.data.cloudName}/image/upload`, { method: "POST", body });
        const result = await uploaded.json();
        if (!uploaded.ok) throw new Error(result.error?.message || "Upload Cloudinary gagal");
        const created = await apiFetch(`${BASE}/gallery`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: file.name, src: result.secure_url }) });
        const output = await created.json();
        if (!created.ok) throw new Error(output.message || "Gagal menyimpan foto");
        setGallery(current => [...current, output.data]);
        notify("Foto berhasil di-upload.");
      } catch (error) {
        notify(error.message, "error");
      }
    }
    e.target.value = "";
  };
  const updateAccess = async (id, changes) => {
    try {
      const current = users.find((x) => x.id === id);
      const r = await apiFetch(`${BASE}/admins/${id}/access`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
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
      const r = await apiFetch(`${BASE}/admins/${id}`, {
        method: "DELETE",
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
  const loadAudit = async () => { try { const r=await apiFetch(`${BASE}/audit-logs`); const out=await r.json(); if(!r.ok) throw new Error(out.message); setAuditLogs(out.data); } catch(e){notify(e.message,"error")} };
  useEffect(()=>{if(user)loadAudit()},[user]);
  const downloadBackup = async () => { try { const r=await apiFetch(`${BASE}/backups/members`); const out=await r.json(); if(!r.ok) throw new Error(out.message); const a=document.createElement("a"); const url=URL.createObjectURL(new Blob([JSON.stringify(out.backup,null,2)],{type:"application/json"})); a.href=url; a.download=`riverra-backup-${new Date().toISOString().slice(0,10)}.json`; a.click(); setTimeout(()=>URL.revokeObjectURL(url),0); notify("Backup berhasil diunduh."); } catch(e){notify(e.message,"error")} };
  const restoreBackup = async () => { if(!backupFile||!confirm("Restore akan mengganti seluruh data anggota. Lanjutkan?")) return; try { const data=JSON.parse(await backupFile.text()); const r=await apiFetch(`${BASE}/backups/members/restore`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)}); const out=await r.json(); if(!r.ok) throw new Error(out.message); persistMembers(out.data); notify(out.message); } catch(e){notify(`Restore gagal: ${e.message}`,"error")} };
  const auditMemberName = (log) => {
    const explicit = log.details?.member_name;
    if (explicit) return explicit;
    const member = members.find((item) => String(item.id) === String(log.entity_id));
    return member ? `${member.first_name || ""} ${member.last_name || ""}`.trim() : `Member #${log.entity_id}`;
  };
  const auditValue = (value) => value === null || value === undefined || value === "" ? "kosong" : String(value);
  const auditFieldNames = {
    first_name: "nama depan", last_name: "nama belakang", gender: "gender",
    generation: "generasi", status: "status", occupation: "pekerjaan",
    role: "peran", biography: "biografi", photo: "foto", father_id: "ayah",
    mother_id: "ibu", spouse_id: "pasangan", birth_date: "tanggal lahir",
    birth_order: "urutan kelahiran", sibling_type: "tipe saudara",
  };
  const auditMessage = (log) => {
    const entity = log.entity_type === "member" ? auditMemberName(log) : `${log.entity_type} #${log.entity_id}`;
    if (log.entity_type === "member" && log.action === "created") return `Menambahkan anggota: ${entity}`;
    if (log.entity_type === "member" && log.action === "deleted") return `Menghapus anggota: ${entity}`;
    if (log.entity_type === "member" && log.action === "edited") return `Memperbarui anggota: ${entity}`;
    return `${log.action.replaceAll("_", " ")} · ${entity}`;
  };
  const auditChanges = (log) => Object.entries(log.details?.changes || {})
    .filter(([, change]) => change && typeof change === "object")
    .map(([field, change]) => ({ field: auditFieldNames[field] || field.replaceAll("_", " "), before: auditValue(change.before), after: auditValue(change.after) }));
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
            apiFetch(`${BASE}/auth/logout`, { method: "POST" }).catch(() => {});
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
      <div className="admin-tabs"><button className={tab === "dashboard" ? "selected" : ""} onClick={() => setTab("dashboard")}>Dashboard</button>
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
        <button className={tab === "audit" ? "selected" : ""} onClick={() => { setTab("audit"); loadAudit(); }}>Audit log</button>{isSuper && <button className={tab === "backup" ? "selected" : ""} onClick={() => setTab("backup")}>Backup / Restore</button>}
      </div>
      {tab === "dashboard" && <section className="stats-grid"><div className="stat-card"><small>Total anggota</small><strong>{members.length}</strong></div><div className="stat-card"><small>Total foto galeri</small><strong>{gallery.length}</strong></div><div className="stat-card"><small>Admin online</small><strong>{onlineAdmins.length}</strong><div className="online-list">{onlineAdmins.map(a=><span key={a.id}>{a.discord_avatar?<img src={a.discord_avatar} alt=""/>:<i></i>}<b>{a.name}</b></span>)}</div></div><div className="stat-card"><small>Aktivitas terbaru</small><strong>{auditLogs.length}</strong></div></section>}
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
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
                placeholder="Cari nama..."
              />
            </div>
            <div className="member-filters"><select value={generationFilter} onChange={e=>{setGenerationFilter(e.target.value);setPage(1)}}><option value="">Semua generasi</option>{[...new Set(members.map(m=>m.generation).filter(Boolean))].sort((a,b)=>a-b).map(g=><option key={g}>{g}</option>)}</select><select value={roleFilter} onChange={e=>{setRoleFilter(e.target.value);setPage(1)}}><option value="">Semua role</option>{[...new Set(members.map(m=>m.role).filter(Boolean))].map(v=><option key={v}>{v}</option>)}</select><select value={occupationFilter} onChange={e=>{setOccupationFilter(e.target.value);setPage(1)}}><option value="">Semua pekerjaan</option>{[...new Set(members.map(m=>m.occupation).filter(Boolean))].map(v=><option key={v}>{v}</option>)}</select><select value={statusFilter} onChange={e=>{setStatusFilter(e.target.value);setPage(1)}}><option value="">Semua status</option><option>Living</option><option>Deceased</option></select></div>
            {pageMembers.map((m) => (
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
                {canDeleteMembers && <button className="danger" onClick={() => remove(m.id)}>Hapus</button>}
              </div>
            ))}
            <div className="pagination"><button disabled={page<=1} onClick={()=>setPage(page-1)}>‹</button><span>Halaman {page} / {pageCount} · {filtered.length} data</span><button disabled={page>=pageCount} onClick={()=>setPage(page+1)}>›</button></div>
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
                  onClick={async () => {
                    if (!confirm("Hapus foto ini?")) return;
                    const response = await apiFetch(`${BASE}/gallery/${g.id}`, { method: "DELETE" });
                    if (!response.ok) { notify("Foto gagal dihapus.", "error"); return; }
                    setGallery(current => current.filter(x => x.id !== g.id));
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
      {tab === "audit" && (
        <section className="admin-card audit-panel">
          <h2>Audit log admin</h2>
          {auditLogs.map((log) => {
            const changes = auditChanges(log);
            return (
              <div className="audit-entry" key={log.id}>
                <div className="audit-main">
                  <b>{log.admin_name}</b>
                  <span>{auditMessage(log)}</span>
                  <small>{new Date(log.created_at).toLocaleString("id-ID")}</small>
                </div>
                {changes.length > 0 && (
                  <div className="audit-details">
                    {changes.map((change) => (
                      <div className="audit-change" key={change.field}>
                        <b>{change.field}</b>
                        <span>{change.before}</span>
                        <i>→</i>
                        <span>{change.after}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </section>
      )}
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
                  onClick={() => deleteAdmin(u.id)}
                >
                  Hapus akun
                </button>
              )}
            </div>
          ))}
        </section>
      )}
      {tab === "backup" && isSuper && (
        <section className="admin-card backup-panel">
          <h2>Backup / Restore</h2>
          <p>Unduh salinan data anggota atau pulihkan backup JSON.</p>
          <div className="backup-actions">
            <button type="button" onClick={downloadBackup}>Unduh backup</button>
            <label className="upload-box">
              Pilih file backup JSON
              <input type="file" accept="application/json,.json" onChange={(e) => setBackupFile(e.target.files?.[0] || null)} />
            </label>
            <button type="button" className="danger" disabled={!backupFile} onClick={restoreBackup}>Restore backup</button>
          </div>
          {backupFile && <small className="upload-status">File dipilih: {backupFile.name}</small>}
        </section>
      )}
    </main>
  );
}










