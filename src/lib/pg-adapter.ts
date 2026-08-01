/**
 * pg-adapter.ts
 *
 * Thin PostgreSQL adapter that mirrors the Supabase JS client interface used
 * in server.ts. Allows running the app locally with Docker Compose (no Supabase
 * project required) when DATABASE_URL is set and SUPABASE_URL is not.
 *
 * Supported operations:
 *   db.from(table).select(cols).eq().is().order().limit().single()   → SELECT
 *   db.from(table).insert(data).select().single()                     → INSERT RETURNING *
 *   db.from(table).update(data).eq().is().select().single()           → UPDATE … RETURNING *
 *   db.rpc(funcName, params)                                          → SELECT * FROM func(…)
 *
 * Returns { data, error } tuples, exactly like the Supabase client.
 */

import { Pool } from 'pg'

// ── Types ─────────────────────────────────────────────────────────────────────

type SupaRow = Record<string, unknown>
type SResult<T> = { data: T; error: null } | { data: null; error: Error }

interface OrderOpts {
  ascending?: boolean
}

// ── Builder ───────────────────────────────────────────────────────────────────

type Op = 'select' | 'insert' | 'update'

class QueryBuilder<T = SupaRow> {
  private pool: Pool
  private table: string
  private op: Op = 'select'
  private cols = '*'
  private mutateData: SupaRow | null = null
  private conds: Array<{ col: string; eq: boolean; val: unknown }> = []
  private orderCol: string | null = null
  private orderAsc = true
  private limitN: number | null = null
  private isSingle = false
  private doReturn = false  // INSERT/UPDATE should RETURNING *

  constructor(pool: Pool, table: string) {
    this.pool = pool
    this.table = table
  }

  // ── Chainable methods ──────────────────────────────────────────────────────

  select(columns = '*') {
    if (this.op !== 'insert' && this.op !== 'update') this.op = 'select'
    this.cols = columns
    this.doReturn = true
    return this
  }

  insert(data: SupaRow) {
    this.op = 'insert'
    this.mutateData = data
    return this
  }

  update(data: SupaRow) {
    this.op = 'update'
    this.mutateData = data
    return this
  }

  eq(col: string, val: unknown) {
    this.conds.push({ col, eq: true, val })
    return this
  }

  is(col: string, val: null) {
    this.conds.push({ col, eq: false, val })
    return this
  }

  order(col: string, opts: OrderOpts = {}) {
    this.orderCol = col
    this.orderAsc = opts.ascending !== false
    return this
  }

  limit(n: number) {
    this.limitN = n
    return this
  }

  single() {
    this.isSingle = true
    return this
  }

  // ── Execution (thenable) ───────────────────────────────────────────────────

  private async _run(): Promise<SResult<T | T[] | null>> {
    const client = await this.pool.connect()
    try {
      if (this.op === 'select') {
        // Detect Supabase relational-select syntax: "*, rel:table(col)"
        // and translate to a proper LEFT JOIN query for work_orders
        if (this.cols.includes(':') && this.table === 'work_orders') {
          return this._runWorkOrderJoin(client) as Promise<SResult<T | T[] | null>>
        }

        let sql = `SELECT ${this.cols} FROM ${this.table}`
        const vals: unknown[] = []
        sql += this._buildWhere(vals)
        if (this.orderCol) sql += ` ORDER BY ${this.orderCol} ${this.orderAsc ? 'ASC' : 'DESC'}`
        if (this.limitN !== null) sql += ` LIMIT ${this.limitN}`

        const res = await client.query(sql, vals)
        if (this.isSingle) {
          return { data: (res.rows[0] ?? null) as T, error: null }
        }
        return { data: res.rows as T[], error: null }
      }

      if (this.op === 'insert' && this.mutateData) {
        const keys = Object.keys(this.mutateData)
        const values = Object.values(this.mutateData)
        const placeholders = keys.map((_, i) => `$${i + 1}`)
        const returning = this.doReturn ? ' RETURNING *' : ''
        const sql = `INSERT INTO ${this.table} (${keys.join(', ')}) VALUES (${placeholders.join(', ')})${returning}`
        const res = await client.query(sql, values)
        if (!this.doReturn) return { data: null, error: null }
        if (this.isSingle) return { data: (res.rows[0] ?? null) as T, error: null }
        return { data: res.rows as T[], error: null }
      }

      if (this.op === 'update' && this.mutateData) {
        const keys = Object.keys(this.mutateData)
        const setVals = Object.values(this.mutateData)
        const sets = keys.map((k, i) => `${k} = $${i + 1}`)
        const allVals: unknown[] = [...setVals]
        let sql = `UPDATE ${this.table} SET ${sets.join(', ')}`
        sql += this._buildWhere(allVals)
        if (this.doReturn) sql += ' RETURNING *'

        const res = await client.query(sql, allVals)
        if (!this.doReturn) return { data: null, error: null }
        if (this.isSingle) return { data: (res.rows[0] ?? null) as T, error: null }
        return { data: res.rows as T[], error: null }
      }

      return { data: null, error: new Error(`Unknown operation: ${this.op}`) }
    } catch (e) {
      return { data: null, error: e instanceof Error ? e : new Error(String(e)) }
    } finally {
      client.release()
    }
  }

  private _buildWhere(vals: unknown[]): string {
    if (this.conds.length === 0) return ''
    const parts = this.conds.map((c) => {
      if (!c.eq) return `${c.col} IS NULL`
      vals.push(c.val)
      return `${c.col} = $${vals.length}`
    })
    return ` WHERE ${parts.join(' AND ')}`
  }

  /** Handles `select('*, client:clients(name), equipment:equipment(name), team:teams(name)')` */
  private async _runWorkOrderJoin(client: import('pg').PoolClient): Promise<SResult<SupaRow | SupaRow[] | null>> {
    try {
      const vals: unknown[] = []
      let where = ''
      if (this.conds.length > 0) {
        const parts = this.conds.map((c) => {
          if (!c.eq) return `wo.${c.col} IS NULL`
          vals.push(c.val)
          return `wo.${c.col} = $${vals.length}`
        })
        where = ` WHERE ${parts.join(' AND ')}`
      }
      let order = ''
      if (this.orderCol) {
        order = ` ORDER BY wo.${this.orderCol} ${this.orderAsc ? 'ASC' : 'DESC'}`
      }
      const sql = `
        SELECT wo.*,
          jsonb_build_object('name', c.name) AS client,
          jsonb_build_object('name', e.name) AS equipment,
          jsonb_build_object('name', t.name) AS team
        FROM work_orders wo
        JOIN clients c ON c.id = wo.client_id
        JOIN equipment e ON e.id = wo.equipment_id
        LEFT JOIN teams t ON t.id = wo.team_id
        ${where}${order}
      `
      const res = await client.query(sql, vals)
      if (this.isSingle) return { data: (res.rows[0] ?? null) as SupaRow, error: null }
      return { data: res.rows as SupaRow[], error: null }
    } catch (e) {
      return { data: null, error: e instanceof Error ? e : new Error(String(e)) }
    }
  }

  // Make the builder directly awaitable
  then<TResult1, TResult2 = never>(
    onfulfilled: (value: SResult<T | T[] | null>) => TResult1 | PromiseLike<TResult1>,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return this._run().then(onfulfilled, onrejected)
  }

  catch<TResult = never>(
    onrejected?: ((reason: unknown) => TResult | PromiseLike<TResult>) | null,
  ): Promise<SResult<T | T[] | null> | TResult> {
    return this._run().catch(onrejected)
  }
}

// ── RPC Builder ───────────────────────────────────────────────────────────────

class RpcBuilder<T = SupaRow> {
  private pool: Pool
  private func: string
  private params: Record<string, unknown>

  constructor(pool: Pool, func: string, params: Record<string, unknown>) {
    this.pool = pool
    this.func = func
    this.params = params
  }

  private async _run(): Promise<SResult<T[]>> {
    const client = await this.pool.connect()
    try {
      const keys = Object.keys(this.params)
      const vals = Object.values(this.params)
      const args = keys.map((k, i) => `${k} => $${i + 1}`).join(', ')
      const sql = `SELECT * FROM ${this.func}(${args})`
      const res = await client.query(sql, vals)
      return { data: res.rows as T[], error: null }
    } catch (e) {
      return { data: null, error: e instanceof Error ? e : new Error(String(e)) }
    } finally {
      client.release()
    }
  }

  then<TResult1, TResult2 = never>(
    onfulfilled: (value: SResult<T[]>) => TResult1 | PromiseLike<TResult1>,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return this._run().then(onfulfilled, onrejected)
  }

  catch<TResult = never>(
    onrejected?: ((reason: unknown) => TResult | PromiseLike<TResult>) | null,
  ): Promise<SResult<T[]> | TResult> {
    return this._run().catch(onrejected)
  }
}

// ── PgClient (Supabase-compatible facade) ─────────────────────────────────────

export class PgClient {
  private pool: Pool

  constructor(connectionString: string) {
    this.pool = new Pool({ connectionString, max: 10 })

    this.pool.on('error', (err) => {
      console.error('[pg-adapter] Pool error:', err.message)
    })
  }

  from(table: string) {
    return new QueryBuilder(this.pool, table)
  }

  rpc(funcName: string, params: Record<string, unknown> = {}) {
    return new RpcBuilder(this.pool, funcName, params)
  }

  async end() {
    await this.pool.end()
  }
}

/**
 * Create a Supabase-compatible PgClient from a DATABASE_URL connection string.
 * Returns undefined if DATABASE_URL is not set.
 */
export function createPgClient(databaseUrl?: string): PgClient | undefined {
  if (!databaseUrl) return undefined
  return new PgClient(databaseUrl)
}
