import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

function getSql() {
  return neon(process.env.DATABASE_URL!)
}

export async function GET(req: NextRequest) {
  try {
    const sql = getSql()
    const { searchParams } = new URL(req.url)
    const memberId = searchParams.get('member_id')

    let rows
    if (memberId) {
      rows = await sql`SELECT * FROM members WHERE member_id = ${memberId} LIMIT 1`
    } else {
      rows = await sql`SELECT * FROM members ORDER BY created_at DESC`
    }
    return NextResponse.json(rows)
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const sql = getSql()
    const body = await req.json()
    const { name, jabatan, tempat_lahir, tgl_lahir, jenis_kelamin, agama, address, photo_url, status, member_id } = body

    if (!name) {
      return NextResponse.json({ error: 'Nama wajib diisi.' }, { status: 400 })
    }

    if (!member_id) {
      return NextResponse.json({ error: 'ID Anggota wajib diisi.' }, { status: 400 })
    }

    // Check if member_id already exists
    const existing = await sql`SELECT id FROM members WHERE member_id = ${member_id} LIMIT 1`
    if (existing.length > 0) {
      return NextResponse.json({ error: `ID ${member_id} sudah digunakan.` }, { status: 409 })
    }

    const rows = await sql`
      INSERT INTO members (member_id, name, jabatan, tempat_lahir, tgl_lahir, jenis_kelamin, agama, address, photo_url, status)
      VALUES (${member_id}, ${name}, ${jabatan || null}, ${tempat_lahir || null}, ${tgl_lahir || null}, ${jenis_kelamin || null}, ${agama || null}, ${address || null}, ${photo_url || null}, ${status || 'aktif'})
      RETURNING *
    `
    return NextResponse.json(rows[0])
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
