'use client'

import { useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { type Member } from '@/lib/db'

/* ─── ID builder: PTR / nomor / cabang ─── */
function buildMemberId(nomor: string, cabang: string): string {
  return `PTR/${nomor}/${cabang.toUpperCase()}`
}

export default function AdminPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [filtered, setFiltered] = useState<Member[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editMember, setEditMember] = useState<Member | null>(null)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [form, setForm] = useState({
    name: '', jabatan: '', tempat_lahir: '', tgl_lahir: '', jenis_kelamin: '', agama: '', address: '', status: 'aktif', nomor: '', cabang: 'DPP-PUSAT',
  })
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)

  const fetchMembers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/members')
      const data = await res.json()
      setMembers(data)
      setFiltered(data)
    } catch (e) {
      console.error('Failed to fetch members:', e)
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchMembers() }, [fetchMembers])

  useEffect(() => {
    const q = search.toLowerCase()
    setFiltered(
      members.filter(m =>
        m.name.toLowerCase().includes(q) ||
        m.member_id.toLowerCase().includes(q) ||
        (m.address || '').toLowerCase().includes(q)
      )
    )
  }, [search, members])

  function openAdd() {
    setEditMember(null)
    const nextNum = String(members.length + 1).padStart(3, '0')
    setForm({ name: '', jabatan: '', tempat_lahir: '', tgl_lahir: '', jenis_kelamin: '', agama: '', address: '', status: 'aktif', nomor: nextNum, cabang: 'DPP-PUSAT' })
    setPhotoFile(null)
    setPhotoPreview(null)
    setError('')
    setShowModal(true)
  }

  function openEdit(m: Member) {
    setEditMember(m)
    setForm({ name: m.name, jabatan: m.jabatan || '', tempat_lahir: m.tempat_lahir || '', tgl_lahir: m.tgl_lahir ? m.tgl_lahir.slice(0, 10) : '', jenis_kelamin: m.jenis_kelamin || '', agama: m.agama || '', address: m.address || '', status: m.status || 'aktif', nomor: '', cabang: '' })
    setPhotoFile(null)
    setPhotoPreview(m.photo_url)
    setError('')
    setShowModal(true)
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  async function uploadPhoto(memberId: string): Promise<string | null> {
    if (!photoFile) return null
    const formData = new FormData()
    formData.append('file', photoFile)
    formData.append('member_id', memberId)
    const res = await fetch('/api/upload', { method: 'POST', body: formData })
    if (!res.ok) return null
    const data = await res.json()
    return data.url || null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    if (!form.name) {
      setError('Nama wajib diisi.')
      setSubmitting(false)
      return
    }

    try {
      let res
      if (editMember) {
        let photoUrl = editMember.photo_url
        if (photoFile) photoUrl = await uploadPhoto(editMember.member_id)
        res = await fetch(`/api/members/${editMember.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: form.name.toUpperCase(),
            jabatan: form.jabatan || null,
            tempat_lahir: form.tempat_lahir || null,
            tgl_lahir: form.tgl_lahir || null,
            jenis_kelamin: form.jenis_kelamin || null,
            agama: form.agama || null,
            address: form.address || null,
            photo_url: photoUrl,
            status: form.status,
          }),
        })
      } else {
        if (!form.nomor.trim()) {
          setError('Nomor wajib diisi.')
          setSubmitting(false)
          return
        }
        if (!form.cabang.trim()) {
          setError('Cabang wajib diisi.')
          setSubmitting(false)
          return
        }
        const newMemberId = buildMemberId(form.nomor.trim(), form.cabang.trim())

        res = await fetch('/api/members', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: form.name.toUpperCase(),
            jabatan: form.jabatan || null,
            tempat_lahir: form.tempat_lahir || null,
            tgl_lahir: form.tgl_lahir || null,
            jenis_kelamin: form.jenis_kelamin || null,
            agama: form.agama || null,
            address: form.address || null,
            status: form.status,
            member_id: newMemberId,
          }),
        })

        if (res.ok && photoFile) {
          const newMember = await res.json()
          const photoUrl = await uploadPhoto(newMember.member_id)
          if (photoUrl) {
            await fetch(`/api/members/${newMember.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...newMember, photo_url: photoUrl }),
            })
          }
          setShowModal(false)
          fetchMembers()
          setSubmitting(false)
          return
        }
      }

      if (!res.ok) {
        const err = await res.json()
        setError(err.error || 'Terjadi kesalahan')
      } else {
        setShowModal(false)
        fetchMembers()
      }
    } catch (e) {
      setError('Gagal menyimpan data')
      console.error(e)
    }
    setSubmitting(false)
  }

  async function handleDelete(m: Member) {
    if (!confirm(`Hapus anggota "${m.name}"?`)) return
    await fetch(`/api/members/${m.id}`, { method: 'DELETE' })
    fetchMembers()
  }

  return (
    <div className="admin-page">
      <nav className="admin-nav">
        <div className="admin-nav-brand">
          <Image src="/assets/petir_logo.png" alt="PETIR Logo" width={36} height={36} style={{ borderRadius: '50%' }} />
          <div>
            <h1>PETIR</h1>
            <div className="admin-nav-sub">PERSAUDARAAN TIMUR RAYA</div>
          </div>
        </div>
        <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.7rem', letterSpacing: '1px' }}>
          ADMIN PANEL
        </span>
      </nav>

      <div className="admin-body">

        {/* ── ID FORMAT INFO ── */}
        <div className="id-format-config">
          <div className="id-format-header">⚙ FORMAT NO. ID</div>
          <div className="id-format-row">
            <div className="id-format-field">
              <label>Format</label>
              <code className="id-format-preview">PTR / Nomor / Cabang</code>
            </div>
            <div className="id-format-field">
              <label>Contoh</label>
              <code className="id-format-preview">PTR/001/DPP-PUSAT</code>
            </div>
          </div>
          <p className="id-format-hint">
            No. ID dibuat otomatis: <code>PTR</code> + nomor urut 3-digit + nama cabang yang diisi saat tambah anggota.
          </p>
        </div>

        <div className="admin-header">
          <div>
            <h2>DATA ANGGOTA</h2>
            <span>{filtered.length} anggota terdaftar</span>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <input
              className="search-bar"
              placeholder="Cari nama, ID, alamat…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <button className="btn btn-primary" onClick={openAdd}>
              + Tambah Anggota
            </button>
          </div>
        </div>

        <div className="member-table-wrap">
          {loading ? (
            <div className="spinner" />
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              {search ? 'Tidak ada anggota yang cocok.' : 'Belum ada anggota. Klik "Tambah Anggota" untuk mulai.'}
            </div>
          ) : (
            <table className="member-table">
              <thead>
                <tr>
                  <th>Foto</th>
                  <th>Nama</th>
                  <th>No. ID</th>
                  <th>Jabatan</th>
                  <th>Tempat/Tgl. Lahir</th>
                  <th>Jenis Kelamin</th>
                  <th>Agama</th>
                  <th>Alamat</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(m => (
                  <tr key={m.id}>
                    <td>
                      {m.photo_url ? (
                        <img src={m.photo_url} alt={m.name} className="member-avatar" />
                      ) : (
                        <div className="member-avatar" style={{ background: '#2a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(212,170,80,0.3)', fontSize: 18 }}>
                          👤
                        </div>
                      )}
                    </td>
                    <td style={{ fontWeight: 500 }}>{m.name}</td>
                    <td><span className="member-id-badge">{m.member_id}</span></td>
                    <td style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.78rem' }}>{m.jabatan || '—'}</td>
                    <td style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.78rem' }}>
                      {m.tempat_lahir || m.tgl_lahir
                        ? `${m.tempat_lahir || ''}${m.tempat_lahir && m.tgl_lahir ? ', ' : ''}${m.tgl_lahir ? new Date(m.tgl_lahir).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : ''}`
                        : '—'}
                    </td>
                    <td style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.78rem' }}>{m.jenis_kelamin || '—'}</td>
                    <td style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.78rem' }}>{m.agama || '—'}</td>
                    <td style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.78rem', maxWidth: 180 }}>
                      {m.address ? (m.address.length > 40 ? m.address.slice(0, 40) + '…' : m.address) : '—'}
                    </td>
                    <td>
                      <span className={m.status === 'aktif' ? 'status-active' : 'status-expired'}>
                        {m.status ? m.status.charAt(0).toUpperCase() + m.status.slice(1) : '—'}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <Link href={`/member/${m.member_id}`} target="_blank" className="btn btn-ghost btn-sm">
                          Lihat Kartu
                        </Link>
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(m)}>Edit</button>
                        <button className="btn btn-danger" onClick={() => handleDelete(m)}>Hapus</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <h3>{editMember ? 'EDIT ANGGOTA' : 'TAMBAH ANGGOTA BARU'}</h3>

            {!editMember && (
              <div style={{ background: 'rgba(212,170,80,0.08)', border: '1px solid rgba(212,170,80,0.2)', borderRadius: 6, padding: '8px 12px', marginBottom: 16, fontSize: '0.75rem', color: 'rgba(212,170,80,0.8)' }}>
                No. ID akan dibuat: <strong style={{ fontFamily: 'monospace' }}>
                  {buildMemberId(form.nomor || '###', form.cabang || 'CABANG')}
                </strong>
              </div>
            )}

            {editMember && (
              <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '8px 12px', marginBottom: 16, fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>
                No. ID: <strong style={{ color: 'var(--gold)', fontFamily: 'monospace' }}>{editMember.member_id}</strong>
              </div>
            )}

            {error && <div className="error-msg">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Foto Anggota</label>
                {photoPreview && (
                  <img src={photoPreview} alt="Preview" style={{ width: 80, height: 96, objectFit: 'cover', borderRadius: 8, border: '2px solid rgba(212,170,80,0.3)', marginBottom: 8, display: 'block' }} />
                )}
                <input type="file" accept="image/*" onChange={handlePhotoChange} />
              </div>

              <div className="form-group">
                <label>Nama Lengkap *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Nama Anggota"
                  required
                />
              </div>

              {!editMember && (
                <div style={{ display: 'flex', gap: 10 }}>
                  <div className="form-group" style={{ flex: '0 0 110px' }}>
                    <label>Nomor *</label>
                    <input
                      type="text"
                      value={form.nomor}
                      onChange={e => setForm(f => ({ ...f, nomor: e.target.value }))}
                      placeholder="001"
                      required
                    />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Cabang *</label>
                    <input
                      type="text"
                      value={form.cabang}
                      onChange={e => setForm(f => ({ ...f, cabang: e.target.value.toUpperCase() }))}
                      placeholder="DPP-PUSAT, DPD-MAKASSAR"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="form-group">
                <label>Jabatan</label>
                <input
                  type="text"
                  value={form.jabatan}
                  onChange={e => setForm(f => ({ ...f, jabatan: e.target.value }))}
                  placeholder="contoh: Ketua, Sekretaris, Anggota"
                />
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Tempat Lahir</label>
                  <input
                    type="text"
                    value={form.tempat_lahir}
                    onChange={e => setForm(f => ({ ...f, tempat_lahir: e.target.value }))}
                    placeholder="contoh: Makassar"
                  />
                </div>
                <div className="form-group" style={{ flex: '0 0 160px' }}>
                  <label>Tgl. Lahir</label>
                  <input
                    type="date"
                    value={form.tgl_lahir}
                    onChange={e => setForm(f => ({ ...f, tgl_lahir: e.target.value }))}
                    style={{ colorScheme: 'dark' }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Jenis Kelamin</label>
                <select
                  value={form.jenis_kelamin}
                  onChange={e => setForm(f => ({ ...f, jenis_kelamin: e.target.value }))}
                  style={{ width: '100%', background: 'rgba(30,10,10,0.95)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '10px 14px', color: form.jenis_kelamin ? '#fff' : 'rgba(255,255,255,0.35)', fontSize: '0.85rem', fontFamily: 'Inter, sans-serif', outline: 'none' }}
                >
                  <option value="">— Pilih Jenis Kelamin —</option>
                  <option value="Laki-laki">Laki-laki</option>
                  <option value="Perempuan">Perempuan</option>
                </select>
              </div>

              <div className="form-group">
                <label>Agama</label>
                <select
                  value={form.agama}
                  onChange={e => setForm(f => ({ ...f, agama: e.target.value }))}
                  style={{ width: '100%', background: 'rgba(30,10,10,0.95)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '10px 14px', color: form.agama ? '#fff' : 'rgba(255,255,255,0.35)', fontSize: '0.85rem', fontFamily: 'Inter, sans-serif', outline: 'none' }}
                >
                  <option value="">— Pilih Agama —</option>
                  <option value="Islam">Islam</option>
                  <option value="Kristen">Kristen</option>
                  <option value="Katolik">Katolik</option>
                  <option value="Hindu">Hindu</option>
                  <option value="Buddha">Buddha</option>
                  <option value="Konghucu">Konghucu</option>
                </select>
              </div>

              <div className="form-group">
                <label>Alamat</label>
                <textarea
                  value={form.address}
                  onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                  placeholder="Alamat lengkap anggota"
                  rows={3}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '10px 14px', color: '#fff', fontSize: '0.85rem', fontFamily: 'Inter, sans-serif', outline: 'none', resize: 'vertical' }}
                />
              </div>

              <div className="form-group">
                <label>Status</label>
                <select
                  value={form.status}
                  onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                  style={{ width: '100%', background: 'rgba(30,10,10,0.95)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '10px 14px', color: '#fff', fontSize: '0.85rem', fontFamily: 'Inter, sans-serif', outline: 'none' }}
                >
                  <option value="aktif" style={{ background: '#1a1010' }}>Aktif</option>
                  <option value="nonaktif" style={{ background: '#1a1010' }}>Non-aktif</option>
                </select>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Batal</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Menyimpan…' : editMember ? 'Simpan Perubahan' : 'Tambah Anggota'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
