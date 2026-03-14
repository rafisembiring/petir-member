'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import QRCode from 'react-qr-code'
import { type Member } from '@/lib/db'

// ── Canvas helpers ───────────────────────────────────────────

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.arcTo(x + w, y, x + w, y + r, r)
  ctx.lineTo(x + w, y + h - r)
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r)
  ctx.lineTo(x + r, y + h)
  ctx.arcTo(x, y + h, x, y + h - r, r)
  ctx.lineTo(x, y + r)
  ctx.arcTo(x, y, x + r, y, r)
  ctx.closePath()
}

function drawTriangles(ctx: CanvasRenderingContext2D, W: number, H: number) {
  const tris = [
    { x: -50, y: -50, base: 320, h: 580, color: 'rgba(140,10,10,0.4)', angle: -15 },
    { x: W + 30, y: 70, base: 240, h: 460, color: 'rgba(180,20,20,0.25)', angle: 25 },
    { x: 20, y: H - 60, base: 200, h: 400, color: 'rgba(120,0,0,0.3)', angle: -5 },
    { x: W - 10, y: H + 20, base: 160, h: 320, color: 'rgba(160,10,10,0.2)', angle: 15 },
  ]
  tris.forEach(({ x, y, base, h, color, angle }) => {
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate((angle * Math.PI) / 180)
    ctx.beginPath()
    ctx.moveTo(-base / 2, 0)
    ctx.lineTo(base / 2, 0)
    ctx.lineTo(0, h)
    ctx.closePath()
    ctx.fillStyle = color
    ctx.fill()
    ctx.restore()
  })
}

async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

// ── Component ────────────────────────────────────────────────

export default function MemberCardPage() {
  const { id } = useParams<{ id: string }>()
  const [member, setMember] = useState<Member | null>(null)
  const [loading, setLoading] = useState(true)
  const [cardUrl, setCardUrl] = useState('')
  const [downloading, setDownloading] = useState(false)
  const qrRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setCardUrl(`${window.location.origin}/member/${id}`)
  }, [id])

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/members?member_id=${encodeURIComponent(id)}`)
      const data = await res.json()
      setMember(Array.isArray(data) ? (data[0] || null) : null)
      setLoading(false)
    }
    load()
  }, [id])

  function downloadQR() {
    const svg = qrRef.current?.querySelector('svg')
    if (!svg) return
    const svgData = new XMLSerializer().serializeToString(svg)
    const canvas = document.createElement('canvas')
    const size = 300
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')!
    const img = new Image()
    img.onload = () => {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, size, size)
      ctx.drawImage(img, 0, 0, size, size)
      const link = document.createElement('a')
      link.download = `QR-${member?.member_id || 'anggota'}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    }
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)))
  }

  async function downloadCard() {
    if (!member) return
    setDownloading(true)
    try {
      // ── FRONT CARD canvas ──────────────────────────────
      const W = 380 * 2, H = 580 * 2   // 2x for sharpness
      const S = 2                        // scale factor
      const fc = document.createElement('canvas')
      fc.width = W
      fc.height = H
      const ctx = fc.getContext('2d')!
      ctx.scale(S, S)
      const cw = W / S   // 380
      const ch = H / S   // 580

      // Background
      ctx.fillStyle = '#1c0d0d'
      ctx.fillRect(0, 0, cw, ch)

      // Red gradient overlays (card-bg::before)
      const g1 = ctx.createLinearGradient(0, 0, cw * 0.55, ch * 0.55)
      g1.addColorStop(0, 'rgba(139,0,0,0.6)')
      g1.addColorStop(1, 'rgba(139,0,0,0)')
      ctx.fillStyle = g1
      ctx.fillRect(0, 0, cw, ch)

      const g2 = ctx.createLinearGradient(cw, ch, cw * 0.55, ch * 0.55)
      g2.addColorStop(0, 'rgba(100,0,0,0.4)')
      g2.addColorStop(1, 'rgba(100,0,0,0)')
      ctx.fillStyle = g2
      ctx.fillRect(0, 0, cw, ch)

      // Triangles
      drawTriangles(ctx, cw, ch)

      // ── RED HEADER (front-header) ──
      const hh = 110   // header height
      const headerGrad = ctx.createLinearGradient(0, 0, 0, hh)
      headerGrad.addColorStop(0, '#c0000a')
      headerGrad.addColorStop(1, '#8b0000')
      ctx.fillStyle = headerGrad
      roundRect(ctx, 0, 0, cw, hh, 0)   // top straight, bottom rounded
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.lineTo(cw, 0)
      ctx.lineTo(cw, hh - 28)
      ctx.arcTo(cw, hh, cw - 28, hh, 28)
      ctx.lineTo(28, hh)
      ctx.arcTo(0, hh, 0, hh - 28, 28)
      ctx.closePath()
      ctx.fill()

      // Header: "KARTU TANDA ANGGOTA"
      ctx.fillStyle = '#ffffff'
      ctx.font = '700 17px Cinzel, serif'
      ctx.textAlign = 'center'
      ctx.fillText('KARTU TANDA ANGGOTA', cw / 2, 30)

      // Org row: logo + name (centered as a pair)
      ctx.font = '600 9px Cinzel, serif'
      const orgText = 'PERSAUDARAAN TIMUR RAYA'
      const textW = ctx.measureText(orgText).width
      const ls = 36
      const logoTextGap = 10
      const pairW = ls + logoTextGap + textW
      const lx = (cw - pairW) / 2
      const ly = 46
      try {
        const logo = await loadImage('/assets/petir_logo.png')
        ctx.save()
        ctx.beginPath()
        ctx.arc(lx + ls / 2, ly + ls / 2, ls / 2, 0, Math.PI * 2)
        ctx.clip()
        ctx.drawImage(logo, lx, ly, ls, ls)
        ctx.restore()
        ctx.strokeStyle = 'rgba(255,255,255,0.35)'
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.arc(lx + ls / 2, ly + ls / 2, ls / 2, 0, Math.PI * 2)
        ctx.stroke()
      } catch { /* skip */ }

      ctx.fillStyle = '#d4aa50'
      ctx.font = '600 9px Cinzel, serif'
      ctx.textAlign = 'left'
      ctx.fillText(orgText, lx + ls + logoTextGap, ly + ls / 2 + 3)

      // ── PHOTO (photo-frame) ──
      const pw = 140, ph = 165
      const px = (cw - pw) / 2
      const py = hh + 20

      // Gold border
      ctx.strokeStyle = 'rgba(212,170,80,0.5)'
      ctx.lineWidth = 3
      roundRect(ctx, px - 3, py - 3, pw + 6, ph + 6, 16)
      ctx.stroke()

      // Photo or placeholder
      if (member.photo_url) {
        try {
          const photo = await loadImage(member.photo_url)
          ctx.save()
          roundRect(ctx, px, py, pw, ph, 14)
          ctx.clip()
          ctx.drawImage(photo, px, py, pw, ph)
          ctx.restore()
        } catch {
          ctx.fillStyle = '#2a1a1a'
          roundRect(ctx, px, py, pw, ph, 14)
          ctx.fill()
        }
      } else {
        ctx.fillStyle = '#2a1a1a'
        roundRect(ctx, px, py, pw, ph, 14)
        ctx.fill()
      }

      const afterPhoto = py + ph + 16

      // ── MEMBER NAME ──
      ctx.fillStyle = '#d4aa50'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'alphabetic'
      let fs = 15
      ctx.font = `600 ${fs}px Cinzel, serif`
      while (ctx.measureText(member.name).width > cw - 32 && fs > 9) {
        fs--
        ctx.font = `600 ${fs}px Cinzel, serif`
      }
      ctx.fillText(member.name, cw / 2, afterPhoto + 14)

      // ── GOLD DIVIDER ──
      const dy = afterPhoto + 26
      const dg = ctx.createLinearGradient(cw / 2 - 28, dy, cw / 2 + 28, dy)
      dg.addColorStop(0, 'transparent')
      dg.addColorStop(0.5, '#d4aa50')
      dg.addColorStop(1, 'transparent')
      ctx.strokeStyle = dg
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(cw / 2 - 28, dy)
      ctx.lineTo(cw / 2 + 28, dy)
      ctx.stroke()

      // ── INFO BLOCK — 6 rows ──
      const infoStartY = dy + 16
      const lineH = 15
      const labelX = 22

      ctx.font = '500 9px Inter, sans-serif'
      ctx.textAlign = 'left'

      // measure widest label so colon column stays consistent
      const labelNames = ['No. ID', 'Jabatan', 'Tempat/Tgl. Lahir', 'Jenis Kelamin', 'Agama', 'Alamat', 'Status']
      const maxLabelW = Math.max(...labelNames.map(l => ctx.measureText(l).width))
      const colonX = labelX + maxLabelW + 6
      const valueX = colonX + 10

      const infoRows = [
        { label: 'No. ID', value: member.member_id },
        { label: 'Jabatan', value: member.jabatan || '—' },
        {
          label: 'Tempat/Tgl. Lahir', value: [
            member.tempat_lahir,
            member.tgl_lahir ? new Date(member.tgl_lahir).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : null,
          ].filter(Boolean).join(', ') || '—'
        },
        { label: 'Jenis Kelamin', value: member.jenis_kelamin || '—' },
        { label: 'Agama', value: member.agama || '—' },
        { label: 'Alamat', value: member.address || '—' },
        { label: 'Status', value: member.status ? member.status.charAt(0).toUpperCase() + member.status.slice(1) : '—' },
      ]

      // helper: wrap text into lines that fit maxW
      function canvasLines(c: CanvasRenderingContext2D, text: string, maxW: number): string[] {
        const words = text.split(' ')
        const lines: string[] = []
        let cur = ''
        for (const w of words) {
          const test = cur ? cur + ' ' + w : w
          if (c.measureText(test).width > maxW && cur) {
            lines.push(cur)
            cur = w
          } else {
            cur = test
          }
        }
        if (cur) lines.push(cur)
        return lines
      }

      const maxValueW = cw - valueX - 16   // right padding
      let curY = infoStartY
      infoRows.forEach(({ label, value }) => {
        ctx.fillStyle = 'rgba(212,170,80,0.75)'
        ctx.fillText(label, labelX, curY)
        ctx.fillStyle = 'rgba(212,170,80,0.4)'
        ctx.fillText(':', colonX, curY)
        ctx.fillStyle = '#e0e0e0'
        const lines = canvasLines(ctx, value, maxValueW)
        lines.forEach((line, li) => {
          ctx.fillText(line, valueX, curY + li * lineH)
        })
        curY += lineH * lines.length
      })

      // Gold outer border
      ctx.strokeStyle = 'rgba(212,170,80,0.2)'
      ctx.lineWidth = 1
      ctx.strokeRect(0.5, 0.5, cw - 1, ch - 1)

      // ── BACK CARD canvas ───────────────────────────────
      const bc = document.createElement('canvas')
      bc.width = W
      bc.height = H
      const bctx = bc.getContext('2d')!
      bctx.scale(S, S)

      // Background
      bctx.fillStyle = '#1c0d0d'
      bctx.fillRect(0, 0, cw, ch)

      const bg1 = bctx.createLinearGradient(0, 0, cw * 0.55, ch * 0.55)
      bg1.addColorStop(0, 'rgba(139,0,0,0.6)')
      bg1.addColorStop(1, 'rgba(139,0,0,0)')
      bctx.fillStyle = bg1
      bctx.fillRect(0, 0, cw, ch)

      const bg2 = bctx.createLinearGradient(cw, ch, cw * 0.55, ch * 0.55)
      bg2.addColorStop(0, 'rgba(100,0,0,0.4)')
      bg2.addColorStop(1, 'rgba(100,0,0,0)')
      bctx.fillStyle = bg2
      bctx.fillRect(0, 0, cw, ch)

      drawTriangles(bctx, cw, ch)

      // Back: "P E T I R"
      bctx.fillStyle = '#d4aa50'
      bctx.font = '600 34px Cinzel, serif'
      bctx.textAlign = 'center'
        ; (bctx as unknown as Record<string, unknown>).letterSpacing = '10px'
      bctx.fillText('P E T I R', cw / 2, 80)
        ; (bctx as unknown as Record<string, unknown>).letterSpacing = '0px'

      // Back: big logo
      try {
        const logo = await loadImage('/assets/petir_logo.png')
        const ls = 145
        const lx = (cw - ls) / 2
        const ly = 100
        bctx.save()
        bctx.beginPath()
        bctx.arc(lx + ls / 2, ly + ls / 2, ls / 2, 0, Math.PI * 2)
        bctx.clip()
        bctx.drawImage(logo, lx, ly, ls, ls)
        bctx.restore()
        bctx.strokeStyle = 'rgba(212,170,80,0.3)'
        bctx.lineWidth = 2
        bctx.beginPath()
        bctx.arc(lx + ls / 2, ly + ls / 2, ls / 2, 0, Math.PI * 2)
        bctx.stroke()
      } catch { /* skip */ }

      // Back: org name
      bctx.fillStyle = '#d4aa50'
      bctx.font = '600 11px Cinzel, serif'
      bctx.textAlign = 'center'
        ; (bctx as unknown as Record<string, unknown>).letterSpacing = '2px'
      bctx.fillText('PERSAUDARAAN TIMUR RAYA', cw / 2, 272)
        ; (bctx as unknown as Record<string, unknown>).letterSpacing = '0px'

      // Back: QR Code
      const qrSvg = qrRef.current?.querySelector('svg')
      const qrBoxSize = 110
      const qrX = (cw - qrBoxSize - 20) / 2
      const qrY = 285

      if (qrSvg) {
        const svgData = new XMLSerializer().serializeToString(qrSvg)
        const qrImg = new window.Image()
        await new Promise<void>(res => {
          qrImg.onload = () => res()
          qrImg.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)))
        })
        bctx.fillStyle = '#ffffff'
        roundRect(bctx, qrX, qrY, qrBoxSize + 20, qrBoxSize + 20, 8)
        bctx.fill()
        bctx.drawImage(qrImg, qrX + 10, qrY + 10, qrBoxSize, qrBoxSize)
      }

      bctx.fillStyle = 'rgba(212,170,80,0.45)'
      bctx.font = '400 7px Inter, sans-serif'
      bctx.textAlign = 'center'
        ; (bctx as unknown as Record<string, unknown>).letterSpacing = '2px'
      bctx.fillText('SCAN TO VERIFY', cw / 2, qrY + qrBoxSize + 36)
        ; (bctx as unknown as Record<string, unknown>).letterSpacing = '0px'

      // Back: tagline banner (back-tagline)
      const tagH = 75
      const tagY = ch - tagH
      const tagGrad = bctx.createLinearGradient(0, tagY, 0, ch)
      tagGrad.addColorStop(0, '#b0000a')
      tagGrad.addColorStop(1, '#7a0008')
      bctx.fillStyle = tagGrad
      bctx.beginPath()
      bctx.moveTo(20, tagY)
      bctx.arcTo(0, tagY, 0, tagY + 20, 20)
      bctx.lineTo(0, ch)
      bctx.lineTo(cw, ch)
      bctx.lineTo(cw, tagY + 20)
      bctx.arcTo(cw, tagY, cw - 20, tagY, 20)
      bctx.closePath()
      bctx.fill()

      bctx.fillStyle = '#ffffff'
      bctx.font = '700 14px Cinzel, serif'
      bctx.textAlign = 'center'
        ; (bctx as unknown as Record<string, unknown>).letterSpacing = '2px'
      bctx.fillText('PERSAUDARAAN TANPA BATAS', cw / 2, tagY + 36)
        ; (bctx as unknown as Record<string, unknown>).letterSpacing = '0px'

      bctx.strokeStyle = 'rgba(212,170,80,0.2)'
      bctx.lineWidth = 1
      bctx.strokeRect(0.5, 0.5, cw - 1, ch - 1)

      // ── COMBINE front + back side by side ──
      const gap = 24
      const out = document.createElement('canvas')
      out.width = W * 2 + gap * S
      out.height = H
      const octx = out.getContext('2d')!
      octx.drawImage(fc, 0, 0)
      octx.drawImage(bc, W + gap * S, 0)

      // Download
      const link = document.createElement('a')
      link.download = `kartu-${member.member_id.replace(/[\/\\:*?"<>|]/g, '-')}.png`
      link.href = out.toDataURL('image/png')
      link.click()
    } finally {
      setDownloading(false)
    }
  }

  if (loading) {
    return <div className="card-page"><div className="spinner" /></div>
  }

  if (!member) {
    return (
      <div className="card-page">
        <div className="not-found">
          <h2>Anggota Tidak Ditemukan</h2>
          <p>ID <strong>{id}</strong> tidak terdaftar dalam sistem.</p>
          <Link href="/" className="back-link" style={{ marginTop: 20, display: 'inline-flex' }}>
            ← Kembali ke Admin
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="card-page">
      <p className="card-page-title">KARTU TANDA ANGGOTA · PETIR</p>

      <div className="cards-container">

        {/* ══════════ FRONT CARD ══════════ */}
        <div className="id-card">
          <div className="card-bg">
            <div className="tri tri-1" />
            <div className="tri tri-2" />
            <div className="tri tri-3" />
            <div className="tri tri-4" />
          </div>
          <div className="front-content">
            <div className="front-header">
              <h2>KARTU TANDA ANGGOTA</h2>
              <div className="org-row">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/assets/petir_logo.png" alt="PETIR" className="org-logo" />
                <span className="org-name">PERSAUDARAAN TIMUR RAYA</span>
              </div>
            </div>

            <div className="photo-frame">
              {member.photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={member.photo_url} alt={member.name} />
              ) : (
                <div className="photo-placeholder-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="rgba(212,170,80,0.35)">
                    <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                  </svg>
                  <span>FOTO ANGGOTA</span>
                </div>
              )}
            </div>

            <div className="member-name">{member.name}</div>
            <div className="gold-divider" />

            <div className="info-block">
              <div className="info-row">
                <span className="info-label">No. ID</span>
                <span className="info-colon">:</span>
                <span className="info-value">{member.member_id}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Jabatan</span>
                <span className="info-colon">:</span>
                <span className="info-value">{member.jabatan || '—'}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Tempat/Tgl. Lahir</span>
                <span className="info-colon">:</span>
                <span className="info-value">
                  {[member.tempat_lahir, member.tgl_lahir ? new Date(member.tgl_lahir).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : null].filter(Boolean).join(', ') || '—'}
                </span>
              </div>
              <div className="info-row">
                <span className="info-label">Jenis Kelamin</span>
                <span className="info-colon">:</span>
                <span className="info-value">{member.jenis_kelamin || '—'}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Agama</span>
                <span className="info-colon">:</span>
                <span className="info-value">{member.agama || '—'}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Alamat</span>
                <span className="info-colon">:</span>
                <span className="info-value">{member.address || '—'}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Status</span>
                <span className="info-colon">:</span>
                <span className="info-value">
                  {member.status ? member.status.charAt(0).toUpperCase() + member.status.slice(1) : '—'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ══════════ BACK CARD ══════════ */}
        <div className="id-card">
          <div className="card-bg">
            <div className="tri tri-1" />
            <div className="tri tri-2" />
            <div className="tri tri-3" />
            <div className="tri tri-4" />
          </div>
          <div className="back-content">
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div className="back-title">P E T I R</div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/assets/petir_logo.png" alt="PETIR Logo" className="back-logo" />
              <div className="back-org-name">PERSAUDARAAN TIMUR RAYA</div>
            </div>
            <div className="qr-section" ref={qrRef} style={{ marginTop: 12, marginBottom: 8 }}>
              <div className="qr-box">
                <QRCode
                  value={cardUrl || `http://localhost:3000/member/${id}`}
                  size={90}
                  bgColor="#ffffff"
                  fgColor="#000000"
                  level="M"
                />
              </div>
              <span className="qr-label">SCAN TO VERIFY</span>
            </div>
            <div className="back-tagline">PERSAUDARAAN TANPA BATAS</div>
          </div>
        </div>

      </div>

      {/* ── DOWNLOAD BUTTONS ── */}
      <div className="card-actions">
        <button
          onClick={downloadCard}
          disabled={downloading}
          className="btn-download-card"
        >
          {downloading ? 'Memproses…' : '⬇ Unduh Kartu (Nama & No. ID)'}
        </button>
        <button onClick={downloadQR} className="btn-download-qr">
          Unduh QR Code
        </button>
      </div>

      <Link href="/" className="back-link">← Kembali ke Admin</Link>
    </div>
  )
}
