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

type Op = 'select' | 'insert' | 'update' | 'delete'

// ── Supabase-style filter-string parsing (used by .or()) ───────────────────
// Splits on top-level commas only, ignoring commas nested inside parentheses,
// so groups like "and(a.eq.1,b.eq.2)" stay intact as one segment.
function splitTopLevel(s: string): string[] {
  const parts: string[] = []
  let depth = 0
  let current = ''
  for (const ch of s) {
    if (ch === '(') depth++
    if (ch === ')') depth--
    if (ch === ',' && depth === 0) {
      parts.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  if (current) parts.push(current)
  return parts
}

const FILTER_OPS: Record<string, string> = {
  eq: '=', neq: '<>', gt: '>', gte: '>=', lt: '<', lte: '<=',
}

/** Recursively translates one Supabase filter segment ("col.op.val", "and(...)", or "or(...)") into a parameterized SQL fragment. */
function parseFilterCondition(cond: string, vals: unknown[]): string {
  const trimmed = cond.trim()
  if (trimmed.startsWith('and(') && trimmed.endsWith(')')) {
    const inner = trimmed.slice(4, -1)
    return `(${splitTopLevel(inner).map((p) => parseFilterCondition(p, vals)).join(' AND ')})`
  }
  if (trimmed.startsWith('or(') && trimmed.endsWith(')')) {
    const inner = trimmed.slice(3, -1)
    return `(${splitTopLevel(inner).map((p) => parseFilterCondition(p, vals)).join(' OR ')})`
  }
  const [col, op, ...rest] = trimmed.split('.')
  const val = rest.join('.')
  if (op === 'is' && (val === 'null' || val === '')) return `${col} IS NULL`
  const sqlOp = FILTER_OPS[op] || '='
  vals.push(val)
  return `${col} ${sqlOp} $${vals.length}`
}

// ── Relational-select registry ──────────────────────────────────────────────
// Declarative map describing the "alias:table(cols)" relations used across
// server.ts, so the generic query builder can translate them into real SQL
// (LEFT JOIN for to-one relations, correlated subquery + jsonb_agg for
// to-many relations) instead of forwarding invalid Supabase-only syntax
// straight to Postgres.
interface RelationDef {
  alias: string
  table: string
  cols: string[]
  type: 'one' | 'many'
  /** Column on the base table (for 'one') or on the related table (for 'many') that holds the FK. */
  fk: string
}

const RELATIONS: Record<string, RelationDef[]> = {
  knowledge_articles: [
    { alias: 'category', table: 'knowledge_categories', cols: ['name', 'slug'], type: 'one', fk: 'category_id' },
  ],
  purchase_orders: [
    { alias: 'supplier', table: 'suppliers', cols: ['name'], type: 'one', fk: 'supplier_id' },
    { alias: 'items', table: 'purchase_order_items', cols: ['part_id', 'quantity', 'unit_price'], type: 'many', fk: 'purchase_order_id' },
  ],
  quotes: [
    { alias: 'items', table: 'quote_items', cols: ['id', 'type', 'description', 'quantity', 'unit_price'], type: 'many', fk: 'quote_id' },
  ],
}

class QueryBuilder<T = SupaRow> {
  private pool: Pool
  private table: string
  private op: Op = 'select'
  private cols = '*'
  private mutateData: SupaRow | null = null
  private conds: Array<{ col: string; eq: boolean; val: unknown }> = []
  private orConds: string | null = null
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

  or(filter: string) {
    this.orConds = filter
    return this
  }

  maybeSingle() {
    this.isSingle = true
    return this
  }

  delete() {
    this.op = 'delete'
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
        // Generic relational-select support for other tables (e.g. purchase_orders,
        // quotes, knowledge_articles) that use "alias:relatedTable(cols)" syntax.
        if (this.cols.includes(':') && RELATIONS[this.table]) {
          return this._runRelationalSelect(client) as Promise<SResult<T | T[] | null>>
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

      if (this.op === 'delete') {
        let sql = `DELETE FROM ${this.table}`
        const vals: unknown[] = []
        sql += this._buildWhere(vals)
        if (this.doReturn) sql += ' RETURNING *'
        const res = await client.query(sql, vals)
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
    const parts: string[] = []
    if (this.conds.length > 0) {
      for (const c of this.conds) {
        if (!c.eq) { parts.push(`${c.col} IS NULL`); continue }
        vals.push(c.val)
        parts.push(`${c.col} = $${vals.length}`)
      }
    }
    if (this.orConds) {
      // Translate Supabase .or() filter syntax, including nested and(...)/or(...)
      // groups, e.g. "client_id.eq.X,and(empresa_id.eq.Y,folder_type.eq.clientes)"
      const orParts = splitTopLevel(this.orConds).map((p) => parseFilterCondition(p, vals))
      if (parts.length > 0) parts.push(`(${orParts.join(' OR ')})`)
      else parts.push(orParts.join(' OR '))
    }
    return parts.length > 0 ? ` WHERE ${parts.join(' AND ')}` : ''
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

  /**
   * Handles generic `select('*, alias:relatedTable(cols), ...')` for any table
   * registered in RELATIONS. Builds one LEFT JOIN + jsonb_build_object per
   * to-one relation, and one correlated subquery + jsonb_agg per to-many
   * relation, so results shape-match what the Supabase client would return.
   */
  private async _runRelationalSelect(client: import('pg').PoolClient): Promise<SResult<SupaRow | SupaRow[] | null>> {
    try {
      const relations = RELATIONS[this.table] ?? []
      const selectParts: string[] = ['b.*']
      const joins: string[] = []

      relations.forEach((rel, idx) => {
        const relAlias = `r${idx}`
        if (rel.type === 'one') {
          joins.push(`LEFT JOIN ${rel.table} ${relAlias} ON ${relAlias}.id = b.${rel.fk}`)
          const fields = rel.cols.map((col) => `'${col}', ${relAlias}.${col}`).join(', ')
          selectParts.push(`CASE WHEN ${relAlias}.id IS NULL THEN NULL ELSE jsonb_build_object(${fields}) END AS ${rel.alias}`)
        } else {
          const fields = rel.cols.map((col) => `'${col}', ${relAlias}.${col}`).join(', ')
          selectParts.push(
            `COALESCE((SELECT jsonb_agg(jsonb_build_object(${fields})) FROM ${rel.table} ${relAlias} WHERE ${relAlias}.${rel.fk} = b.id), '[]'::jsonb) AS ${rel.alias}`
          )
        }
      })

      const vals: unknown[] = []
      let where = ''
      if (this.conds.length > 0) {
        const parts = this.conds.map((c) => {
          if (!c.eq) return `b.${c.col} IS NULL`
          vals.push(c.val)
          return `b.${c.col} = $${vals.length}`
        })
        where = ` WHERE ${parts.join(' AND ')}`
      }
      let order = ''
      if (this.orderCol) order = ` ORDER BY b.${this.orderCol} ${this.orderAsc ? 'ASC' : 'DESC'}`
      let limit = ''
      if (this.limitN !== null) limit = ` LIMIT ${this.limitN}`

      const sql = `SELECT ${selectParts.join(', ')} FROM ${this.table} b ${joins.join(' ')} ${where}${order}${limit}`
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
