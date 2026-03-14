import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

function getSql() {
  return neon(process.env.DATABASE_URL!)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const sql = getSql()
    const { id } = await params
    const body = await req.json()
    const { name, jabatan, tempat_lahir, tgl_lahir, jenis_kelamin, agama, address, photo_url, status } = body

    const rows = await sql`
      UPDATE members
      SET name         = ${name},
          jabatan      = ${jabatan || null},
          tempat_lahir = ${tempat_lahir || null},
          tgl_lahir    = ${tgl_lahir || null},
          jenis_kelamin = ${jenis_kelamin || null},
          agama        = ${agama || null},
          address      = ${address || null},
          photo_url    = ${photo_url || null},
          status       = ${status || 'aktif'}
      WHERE id = ${id}
      RETURNING *
    `
    return NextResponse.json(rows[0])
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const sql = getSql()
    const { id } = await params
    await sql`DELETE FROM members WHERE id = ${id}`
    return NextResponse.json({ ok: true })
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
