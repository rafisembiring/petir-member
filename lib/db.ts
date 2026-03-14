import { neon } from '@neondatabase/serverless'

function getSql() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL not configured. Please fill in .env.local')
  return neon(url)
}

export const sql = new Proxy({} as ReturnType<typeof neon>, {
  get(_target, prop) {
    return (getSql() as unknown as Record<string | symbol, unknown>)[prop]
  },
  apply(_target, _this, args) {
    return (getSql() as unknown as (...a: unknown[]) => unknown)(...args)
  },
})

export type Member = {
  id: string
  member_id: string
  name: string
  jabatan: string | null
  tempat_lahir: string | null
  tgl_lahir: string | null    // ISO date string YYYY-MM-DD from DB
  jenis_kelamin: string | null
  agama: string | null
  address: string | null
  photo_url: string | null
  status: string | null
  created_at: string
}
