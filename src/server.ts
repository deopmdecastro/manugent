import 'dotenv/config'

import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { Hono, type Context } from 'hono'
import { Pool } from 'pg'

const port = Number(process.env.PORT ?? 3000)
const databaseUrl = process.env.DATABASE_URL

const pool = databaseUrl
  ? new Pool({
      connectionString: databaseUrl,
    })
  : undefined

const app = new Hono()

app.use('/app/*', serveStatic({ root: './public' }))
app.use('/static/*', serveStatic({ root: './public' }))

const workOrderTypes = ['preventive', 'inspection', 'round', 'checklist', 'corrective', 'breakdown', 'emergency', 'customer_request']
const scheduledTypes = ['preventive', 'inspection', 'round', 'checklist']
const requestTypes = ['corrective', 'breakdown', 'emergency', 'customer_request']
const workOrderStatuses = ['open', 'scheduled', 'in_progress', 'paused', 'waiting_material', 'waiting_customer', 'completed', 'cancelled']
const triggeringFindingTypes = ['nok', 'defect', 'measurement_out_of_limits', 'failure']

async function ensureSchema() {
  if (!pool) return

  await pool.query(`
    create extension if not exists pgcrypto;

    create table if not exists clients (
      id uuid primary key default gen_random_uuid(),
      name text not null,
      created_at timestamptz not null default now()
    );

    create table if not exists equipment (
      id uuid primary key default gen_random_uuid(),
      client_id uuid not null references clients(id),
      code text not null,
      name text not null,
      location text,
      created_at timestamptz not null default now()
    );

    create table if not exists teams (
      id uuid primary key default gen_random_uuid(),
      name text not null,
      created_at timestamptz not null default now()
    );

    create table if not exists users (
      id uuid primary key default gen_random_uuid(),
      team_id uuid references teams(id),
      name text not null,
      role text not null default 'technician',
      created_at timestamptz not null default now()
    );

    create table if not exists work_orders (
      id uuid primary key default gen_random_uuid(),
      parent_work_order_id uuid references work_orders(id),
      client_id uuid not null references clients(id),
      equipment_id uuid not null references equipment(id),
      team_id uuid references teams(id),
      supervisor_id uuid references users(id),
      type text not null check (type in ('preventive', 'inspection', 'round', 'checklist', 'corrective', 'breakdown', 'emergency', 'customer_request')),
      origin text not null check (origin in ('scheduled', 'request')),
      status text not null default 'open' check (status in ('open', 'scheduled', 'in_progress', 'paused', 'waiting_material', 'waiting_customer', 'completed', 'cancelled')),
      priority text not null default 'normal',
      title text not null,
      description text,
      scheduled_for timestamptz,
      started_at timestamptz,
      completed_at timestamptz,
      cancelled_at timestamptz,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );

    create table if not exists work_order_findings (
      id uuid primary key default gen_random_uuid(),
      work_order_id uuid not null references work_orders(id) on delete cascade,
      type text not null check (type in ('ok', 'nok', 'defect', 'measurement_out_of_limits', 'failure', 'note')),
      description text not null,
      measurement_value numeric,
      limit_min numeric,
      limit_max numeric,
      created_by uuid references users(id),
      created_at timestamptz not null default now()
    );

    create table if not exists work_order_links (
      id uuid primary key default gen_random_uuid(),
      source_work_order_id uuid not null references work_orders(id) on delete cascade,
      target_work_order_id uuid not null references work_orders(id) on delete cascade,
      reason text not null,
      created_at timestamptz not null default now(),
      unique (source_work_order_id, target_work_order_id, reason)
    );

    create table if not exists notifications (
      id uuid primary key default gen_random_uuid(),
      work_order_id uuid not null references work_orders(id) on delete cascade,
      recipient_user_id uuid references users(id),
      recipient_team_id uuid references teams(id),
      recipient_role text,
      channel text not null default 'in_app',
      title text not null,
      message text not null,
      read_at timestamptz,
      created_at timestamptz not null default now()
    );

    create table if not exists work_order_time_entries (
      id uuid primary key default gen_random_uuid(),
      work_order_id uuid not null references work_orders(id) on delete cascade,
      technician_id uuid not null references users(id),
      status text not null default 'joined' check (status in ('joined', 'running', 'paused', 'finished')),
      started_at timestamptz,
      paused_at timestamptz,
      resumed_at timestamptz,
      ended_at timestamptz,
      effective_seconds integer not null default 0,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );

    create unique index if not exists active_work_order_technician
      on work_order_time_entries (work_order_id, technician_id)
      where status in ('joined', 'running', 'paused');

    create table if not exists intervention_reports (
      id uuid primary key default gen_random_uuid(),
      work_order_id uuid not null references work_orders(id) on delete cascade,
      client_id uuid not null references clients(id),
      equipment_id uuid not null references equipment(id),
      title text not null,
      summary text not null,
      actions_performed text,
      recommendations text,
      created_by uuid references users(id),
      created_at timestamptz not null default now()
    );

    create table if not exists quotes (
      id uuid primary key default gen_random_uuid(),
      work_order_id uuid not null references work_orders(id) on delete cascade,
      client_id uuid not null references clients(id),
      reference text not null,
      description text not null,
      amount numeric(12, 2) not null,
      currency text not null default 'EUR',
      status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'expired')),
      approved_by text,
      approved_at timestamptz,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );
  `)
}

function requirePool() {
  if (!pool) {
    throw new Error('DATABASE_URL is not configured')
  }

  return pool
}

function jsonError(c: Context, message: string, status = 400) {
  return c.json({ error: message }, status as 400)
}

function assertOption(value: unknown, options: string[], field: string) {
  if (typeof value !== 'string' || !options.includes(value)) {
    throw new Error(`${field} must be one of: ${options.join(', ')}`)
  }

  return value
}

function originForType(type: string) {
  return scheduledTypes.includes(type) ? 'scheduled' : 'request'
}

function mapWorkOrder(row: Record<string, unknown>) {
  return {
    id: row.id,
    parentWorkOrderId: row.parent_work_order_id,
    clientId: row.client_id,
    equipmentId: row.equipment_id,
    teamId: row.team_id,
    supervisorId: row.supervisor_id,
    type: row.type,
    origin: row.origin,
    status: row.status,
    priority: row.priority,
    title: row.title,
    description: row.description,
    scheduledFor: row.scheduled_for,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    cancelledAt: row.cancelled_at,
    clientName: row.client_name,
    equipmentName: row.equipment_name,
    teamName: row.team_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function escapePdfText(value: unknown) {
  return String(value ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/[\r\n]+/g, ' ')
}

function buildSimplePdf(lines: string[]) {
  const content = [
    'BT',
    '/F1 12 Tf',
    '50 790 Td',
    ...lines.flatMap((line, index) => {
      const escaped = escapePdfText(line).slice(0, 95)
      return index === 0 ? [`(${escaped}) Tj`] : ['0 -18 Td', `(${escaped}) Tj`]
    }),
    'ET',
  ].join('\n')

  const objects = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n',
    '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n',
    `5 0 obj\n<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream\nendobj\n`,
  ]

  let body = '%PDF-1.4\n'
  const offsets = [0]

  for (const object of objects) {
    offsets.push(Buffer.byteLength(body))
    body += object
  }

  const xrefOffset = Buffer.byteLength(body)
  body += `xref\n0 ${objects.length + 1}\n`
  body += '0000000000 65535 f \n'
  body += offsets
    .slice(1)
    .map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`)
    .join('')
  body += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`

  return Buffer.from(body)
}

app.get('/api/health', (c) => {
  return c.json({
    ok: true,
    service: 'manugent-api',
  })
})

app.get('/api/db/health', async (c) => {
  if (!pool) {
    return c.json({ ok: false, error: 'DATABASE_URL is not configured' }, 500)
  }

  try {
    const result = await pool.query<{ now: Date }>('select now() as now')

    return c.json({
      ok: true,
      now: result.rows[0]?.now,
    })
  } catch (error) {
    return c.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Database connection failed',
      },
      500
    )
  }
})

app.get('/api/work-orders', async (c) => {
  const db = requirePool()
  const tab = c.req.query('tab')
  const origin = tab === 'agendadas' || tab === 'scheduled' ? 'scheduled' : tab === 'pedidos' || tab === 'requests' ? 'request' : undefined

  const result = await db.query(
    `
      select
        wo.*,
        c.name as client_name,
        e.name as equipment_name,
        t.name as team_name
      from work_orders wo
      join clients c on c.id = wo.client_id
      join equipment e on e.id = wo.equipment_id
      left join teams t on t.id = wo.team_id
      where ($1::text is null or wo.origin = $1)
      order by wo.created_at desc
    `,
    [origin ?? null]
  )

  return c.json({ workOrders: result.rows.map(mapWorkOrder) })
})

app.get('/api/notifications', async (c) => {
  const db = requirePool()
  const workOrderId = c.req.query('workOrderId')

  const result = await db.query(
    `
      select *
      from notifications
      where ($1::uuid is null or work_order_id = $1)
      order by created_at desc
    `,
    [workOrderId ?? null]
  )

  return c.json({ notifications: result.rows })
})

app.post('/api/work-orders/demo/bootstrap', async (c) => {
  const db = requirePool()
  const tx = await db.connect()

  try {
    await tx.query('begin')

    const team = await tx.query(
      `
        insert into teams (name)
        values ('Equipa Manutencao')
        returning id
      `
    )

    const client = await tx.query(
      `
        insert into clients (name)
        values ('Cliente Demo')
        returning id, name
      `
    )

    const equipment = await tx.query(
      `
        insert into equipment (client_id, code, name, location)
        values ($1, 'EQ-001', 'Bomba Principal', 'Linha 1')
        returning id, code, name, location
      `,
      [client.rows[0].id]
    )

    const supervisor = await tx.query(
      `
        insert into users (team_id, name, role)
        values ($1, 'Supervisor Demo', 'supervisor')
        returning id, name, role
      `,
      [team.rows[0].id]
    )

    const technician = await tx.query(
      `
        insert into users (team_id, name, role)
        values ($1, 'Tecnico Demo', 'technician')
        returning id, name, role
      `,
      [team.rows[0].id]
    )

    const workOrder = await tx.query(
      `
        insert into work_orders (
          client_id, equipment_id, team_id, supervisor_id, type, origin, status,
          priority, title, description, scheduled_for
        )
        values (
          $1, $2, $3, $4, 'preventive', 'scheduled', 'scheduled',
          'high', 'Preventiva mensal - Bomba Principal',
          'Inspecao programada com medicao de vibracao no rolamento.',
          now() + interval '1 day'
        )
        returning *
      `,
      [client.rows[0].id, equipment.rows[0].id, team.rows[0].id, supervisor.rows[0].id]
    )

    await tx.query('commit')

    return c.json(
      {
        client: client.rows[0],
        equipment: equipment.rows[0],
        team: team.rows[0],
        supervisor: supervisor.rows[0],
        technician: technician.rows[0],
        workOrder: mapWorkOrder(workOrder.rows[0]),
      },
      201
    )
  } catch (error) {
    await tx.query('rollback')
    return jsonError(c, error instanceof Error ? error.message : 'Could not bootstrap demo flow')
  } finally {
    tx.release()
  }
})

app.post('/api/work-orders', async (c) => {
  try {
    const db = requirePool()
    const body = await c.req.json()
    const type = assertOption(body.type, workOrderTypes, 'type')
    const status = body.status ? assertOption(body.status, workOrderStatuses, 'status') : originForType(type) === 'scheduled' ? 'scheduled' : 'open'

    const result = await db.query(
      `
        insert into work_orders (
          client_id, equipment_id, team_id, supervisor_id, type, origin, status,
          priority, title, description, scheduled_for
        )
        values ($1, $2, $3, $4, $5, $6, $7, coalesce($8, 'normal'), $9, $10, $11)
        returning *
      `,
      [
        body.clientId,
        body.equipmentId,
        body.teamId ?? null,
        body.supervisorId ?? null,
        type,
        originForType(type),
        status,
        body.priority ?? null,
        body.title,
        body.description ?? null,
        body.scheduledFor ?? null,
      ]
    )

    return c.json({ workOrder: mapWorkOrder(result.rows[0]) }, 201)
  } catch (error) {
    return jsonError(c, error instanceof Error ? error.message : 'Could not create work order')
  }
})

app.post('/api/work-orders/:id/status', async (c) => {
  try {
    const db = requirePool()
    const body = await c.req.json()
    const status = assertOption(body.status, workOrderStatuses, 'status')

    const result = await db.query(
      `
        update work_orders
        set status = $2,
            completed_at = case when $2 = 'completed' then now() else completed_at end,
            cancelled_at = case when $2 = 'cancelled' then now() else cancelled_at end,
            updated_at = now()
        where id = $1
        returning *
      `,
      [c.req.param('id'), status]
    )

    if (result.rowCount === 0) return jsonError(c, 'Work order not found', 404)

    return c.json({ workOrder: mapWorkOrder(result.rows[0]) })
  } catch (error) {
    return jsonError(c, error instanceof Error ? error.message : 'Could not update status')
  }
})

app.post('/api/work-orders/:id/findings', async (c) => {
  const db = requirePool()
  const body = await c.req.json()
  const findings = Array.isArray(body.findings) ? body.findings : [body]

  const tx = await db.connect()

  try {
    await tx.query('begin')

    const workOrderResult = await tx.query('select * from work_orders where id = $1 for update', [c.req.param('id')])
    const workOrder = workOrderResult.rows[0]
    if (!workOrder) throw new Error('Work order not found')

    const createdFindings = []
    let shouldCreateRequest = false

    for (const finding of findings) {
      const type = assertOption(finding.type, ['ok', 'nok', 'defect', 'measurement_out_of_limits', 'failure', 'note'], 'finding.type')
      const measurementOutOfLimits =
        typeof finding.measurementValue === 'number' &&
        ((typeof finding.limitMin === 'number' && finding.measurementValue < finding.limitMin) ||
          (typeof finding.limitMax === 'number' && finding.measurementValue > finding.limitMax))

      shouldCreateRequest = shouldCreateRequest || triggeringFindingTypes.includes(type) || measurementOutOfLimits

      const result = await tx.query(
        `
          insert into work_order_findings (
            work_order_id, type, description, measurement_value, limit_min, limit_max, created_by
          )
          values ($1, $2, $3, $4, $5, $6, $7)
          returning *
        `,
        [
          workOrder.id,
          measurementOutOfLimits ? 'measurement_out_of_limits' : type,
          finding.description,
          finding.measurementValue ?? null,
          finding.limitMin ?? null,
          finding.limitMax ?? null,
          finding.createdBy ?? null,
        ]
      )

      createdFindings.push(result.rows[0])
    }

    let interventionRequest = null

    if (workOrder.origin === 'scheduled' && shouldCreateRequest) {
      const requestResult = await tx.query(
        `
          insert into work_orders (
            parent_work_order_id, client_id, equipment_id, team_id, supervisor_id,
            type, origin, status, priority, title, description
          )
          values ($1, $2, $3, $4, $5, 'corrective', 'request', 'open', 'high', $6, $7)
          returning *
        `,
        [
          workOrder.id,
          workOrder.client_id,
          workOrder.equipment_id,
          workOrder.team_id,
          workOrder.supervisor_id,
          `Pedido de intervencao - ${workOrder.title}`,
          'Criado automaticamente por resultado NOK, defeito, medicao fora dos limites ou falha identificada.',
        ]
      )

      interventionRequest = requestResult.rows[0]

      await tx.query(
        `
          insert into work_order_links (source_work_order_id, target_work_order_id, reason)
          values ($1, $2, 'scheduled_finding')
          on conflict do nothing
        `,
        [workOrder.id, interventionRequest.id]
      )

      await tx.query(
        `
          insert into notifications (work_order_id, recipient_user_id, recipient_team_id, recipient_role, title, message)
          values
            ($1, $2, null, 'supervisor', 'Pedido de intervencao criado', $3),
            ($1, null, $4, 'team', 'Pedido de intervencao criado', $3)
        `,
        [
          interventionRequest.id,
          workOrder.supervisor_id,
          `Criado automaticamente a partir da OT agendada ${workOrder.title}.`,
          workOrder.team_id,
        ]
      )
    }

    await tx.query('commit')

    return c.json(
      {
        findings: createdFindings,
        interventionRequest: interventionRequest ? mapWorkOrder(interventionRequest) : null,
      },
      interventionRequest ? 201 : 200
    )
  } catch (error) {
    await tx.query('rollback')
    return jsonError(c, error instanceof Error ? error.message : 'Could not register findings')
  } finally {
    tx.release()
  }
})

app.post('/api/work-orders/:id/time/join', async (c) => {
  return upsertTimeEntry(c, 'joined')
})

app.post('/api/work-orders/:id/time/start', async (c) => {
  return upsertTimeEntry(c, 'running')
})

app.post('/api/work-orders/:id/time/pause', async (c) => {
  return updateTimeEntry(c, 'pause')
})

app.post('/api/work-orders/:id/time/resume', async (c) => {
  return updateTimeEntry(c, 'resume')
})

app.post('/api/work-orders/:id/time/exit', async (c) => {
  return updateTimeEntry(c, 'exit')
})

app.post('/api/client-portal/requests', async (c) => {
  try {
    const db = requirePool()
    const body = await c.req.json()

    const result = await db.query(
      `
        insert into work_orders (
          client_id, equipment_id, type, origin, status, priority, title, description
        )
        values ($1, $2, 'customer_request', 'request', 'open', coalesce($3, 'normal'), $4, $5)
        returning *
      `,
      [body.clientId, body.equipmentId, body.priority ?? null, body.title, body.description ?? null]
    )

    await db.query(
      `
        insert into notifications (work_order_id, recipient_role, title, message)
        values ($1, 'supervisor', 'Novo pedido do cliente', $2)
      `,
      [result.rows[0].id, `Cliente abriu pedido: ${body.title}`]
    )

    return c.json({ request: mapWorkOrder(result.rows[0]) }, 201)
  } catch (error) {
    return jsonError(c, error instanceof Error ? error.message : 'Could not create customer request')
  }
})

app.get('/api/client-portal/clients/:clientId/work-orders', async (c) => {
  const db = requirePool()

  const result = await db.query(
    `
      select
        wo.*,
        cl.name as client_name,
        e.name as equipment_name,
        t.name as team_name
      from work_orders wo
      join clients cl on cl.id = wo.client_id
      join equipment e on e.id = wo.equipment_id
      left join teams t on t.id = wo.team_id
      where wo.client_id = $1
      order by wo.created_at desc
    `,
    [c.req.param('clientId')]
  )

  return c.json({ workOrders: result.rows.map(mapWorkOrder) })
})

app.get('/api/client-portal/clients/:clientId/equipment/:equipmentId/history', async (c) => {
  const db = requirePool()

  const result = await db.query(
    `
      select
        wo.*,
        cl.name as client_name,
        e.name as equipment_name,
        t.name as team_name
      from work_orders wo
      join clients cl on cl.id = wo.client_id
      join equipment e on e.id = wo.equipment_id
      left join teams t on t.id = wo.team_id
      where wo.client_id = $1
        and wo.equipment_id = $2
      order by wo.created_at desc
    `,
    [c.req.param('clientId'), c.req.param('equipmentId')]
  )

  return c.json({ history: result.rows.map(mapWorkOrder) })
})

app.get('/api/client-portal/clients/:clientId/reports', async (c) => {
  const db = requirePool()

  const result = await db.query(
    `
      select
        ir.*,
        wo.status as work_order_status,
        wo.title as work_order_title,
        e.name as equipment_name
      from intervention_reports ir
      join work_orders wo on wo.id = ir.work_order_id
      join equipment e on e.id = ir.equipment_id
      where ir.client_id = $1
      order by ir.created_at desc
    `,
    [c.req.param('clientId')]
  )

  return c.json({ reports: result.rows })
})

app.post('/api/work-orders/:id/reports', async (c) => {
  try {
    const db = requirePool()
    const body = await c.req.json()

    const workOrderResult = await db.query('select * from work_orders where id = $1', [c.req.param('id')])
    const workOrder = workOrderResult.rows[0]
    if (!workOrder) return jsonError(c, 'Work order not found', 404)

    const result = await db.query(
      `
        insert into intervention_reports (
          work_order_id, client_id, equipment_id, title, summary,
          actions_performed, recommendations, created_by
        )
        values ($1, $2, $3, $4, $5, $6, $7, $8)
        returning *
      `,
      [
        workOrder.id,
        workOrder.client_id,
        workOrder.equipment_id,
        body.title ?? `Relatorio - ${workOrder.title}`,
        body.summary,
        body.actionsPerformed ?? null,
        body.recommendations ?? null,
        body.createdBy ?? null,
      ]
    )

    return c.json({ report: result.rows[0] }, 201)
  } catch (error) {
    return jsonError(c, error instanceof Error ? error.message : 'Could not create intervention report')
  }
})

app.get('/api/client-portal/reports/:reportId/pdf', async (c) => {
  const db = requirePool()

  const result = await db.query(
    `
      select
        ir.*,
        cl.name as client_name,
        e.name as equipment_name,
        e.code as equipment_code,
        wo.title as work_order_title,
        wo.status as work_order_status
      from intervention_reports ir
      join clients cl on cl.id = ir.client_id
      join equipment e on e.id = ir.equipment_id
      join work_orders wo on wo.id = ir.work_order_id
      where ir.id = $1
    `,
    [c.req.param('reportId')]
  )

  const report = result.rows[0]
  if (!report) return jsonError(c, 'Report not found', 404)

  const pdf = buildSimplePdf([
    'ManuGent - Relatorio de Intervencao',
    `Cliente: ${report.client_name}`,
    `Equipamento: ${report.equipment_code} - ${report.equipment_name}`,
    `OT: ${report.work_order_title}`,
    `Estado: ${report.work_order_status}`,
    `Resumo: ${report.summary}`,
    `Acoes: ${report.actions_performed ?? '-'}`,
    `Recomendacoes: ${report.recommendations ?? '-'}`,
    `Data: ${report.created_at}`,
  ])

  return new Response(pdf, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="relatorio-${report.id}.pdf"`,
    },
  })
})

app.post('/api/work-orders/:id/quotes', async (c) => {
  try {
    const db = requirePool()
    const body = await c.req.json()

    const workOrderResult = await db.query('select * from work_orders where id = $1', [c.req.param('id')])
    const workOrder = workOrderResult.rows[0]
    if (!workOrder) return jsonError(c, 'Work order not found', 404)

    const result = await db.query(
      `
        insert into quotes (work_order_id, client_id, reference, description, amount, currency)
        values ($1, $2, $3, $4, $5, coalesce($6, 'EUR'))
        returning *
      `,
      [workOrder.id, workOrder.client_id, body.reference, body.description, body.amount, body.currency ?? null]
    )

    return c.json({ quote: result.rows[0] }, 201)
  } catch (error) {
    return jsonError(c, error instanceof Error ? error.message : 'Could not create quote')
  }
})

app.get('/api/client-portal/clients/:clientId/quotes', async (c) => {
  const db = requirePool()

  const result = await db.query(
    `
      select q.*, wo.title as work_order_title
      from quotes q
      join work_orders wo on wo.id = q.work_order_id
      where q.client_id = $1
      order by q.created_at desc
    `,
    [c.req.param('clientId')]
  )

  return c.json({ quotes: result.rows })
})

app.post('/api/client-portal/quotes/:quoteId/approve', async (c) => {
  try {
    const db = requirePool()
    const body = await c.req.json().catch(() => ({}))

    const result = await db.query(
      `
        update quotes
        set status = 'approved',
            approved_by = $2,
            approved_at = now(),
            updated_at = now()
        where id = $1
          and status = 'pending'
        returning *
      `,
      [c.req.param('quoteId'), body.approvedBy ?? 'client']
    )

    if (result.rowCount === 0) return jsonError(c, 'Pending quote not found', 404)

    await db.query(
      `
        insert into notifications (work_order_id, recipient_role, title, message)
        values ($1, 'supervisor', 'Orcamento aprovado', $2)
      `,
      [result.rows[0].work_order_id, `Orcamento ${result.rows[0].reference} aprovado pelo cliente.`]
    )

    return c.json({ quote: result.rows[0] })
  } catch (error) {
    return jsonError(c, error instanceof Error ? error.message : 'Could not approve quote')
  }
})

app.notFound((c) => c.json({ error: 'Not found' }, 404))

app.get('/', (c) => c.redirect('/app/index.html'))

app.onError((error, c) => c.json({ error: error.message }, 500))

async function upsertTimeEntry(c: Context, status: 'joined' | 'running') {
  try {
    const db = requirePool()
    const body = await c.req.json()
    const technicianId = body.technicianId
    if (!technicianId) return jsonError(c, 'technicianId is required')

    const result = await db.query(
      `
        insert into work_order_time_entries (work_order_id, technician_id, status, started_at)
        values ($1, $2, $3, case when $3 = 'running' then now() else null end)
        on conflict (work_order_id, technician_id) where status in ('joined', 'running', 'paused')
        do update set
          status = $3,
          started_at = coalesce(work_order_time_entries.started_at, case when $3 = 'running' then now() else null end),
          resumed_at = case when $3 = 'running' then now() else work_order_time_entries.resumed_at end,
          updated_at = now()
        returning *
      `,
      [c.req.param('id'), technicianId, status]
    )

    if (status === 'running') {
      await db.query(
        `
          update work_orders
          set status = 'in_progress',
              started_at = coalesce(started_at, now()),
              updated_at = now()
          where id = $1
        `,
        [c.req.param('id')]
      )
    }

    return c.json({ timeEntry: result.rows[0] })
  } catch (error) {
    return jsonError(c, error instanceof Error ? error.message : 'Could not update time entry')
  }
}

async function updateTimeEntry(c: Context, action: 'pause' | 'resume' | 'exit') {
  try {
    const db = requirePool()
    const body = await c.req.json()
    const technicianId = body.technicianId
    if (!technicianId) return jsonError(c, 'technicianId is required')

    const status = action === 'pause' ? 'paused' : action === 'resume' ? 'running' : 'finished'
    const result = await db.query(
      `
        update work_order_time_entries
        set
          effective_seconds = effective_seconds + case
            when status = 'running' and $3 in ('paused', 'finished')
              then greatest(0, extract(epoch from (now() - coalesce(resumed_at, started_at)))::integer)
            else 0
          end,
          status = $3,
          paused_at = case when $3 = 'paused' then now() else paused_at end,
          resumed_at = case when $3 = 'running' then now() when $3 = 'finished' then null else resumed_at end,
          ended_at = case when $3 = 'finished' then now() else ended_at end,
          updated_at = now()
        where work_order_id = $1
          and technician_id = $2
          and status in ('joined', 'running', 'paused')
        returning *
      `,
      [c.req.param('id'), technicianId, status]
    )

    if (result.rowCount === 0) return jsonError(c, 'Active time entry not found', 404)

    if (action === 'pause') {
      await db.query("update work_orders set status = 'paused', updated_at = now() where id = $1", [c.req.param('id')])
    }

    return c.json({ timeEntry: result.rows[0] })
  } catch (error) {
    return jsonError(c, error instanceof Error ? error.message : 'Could not update time entry')
  }
}

ensureSchema()
  .then(() => {
    serve(
      {
        fetch: app.fetch,
        port,
      },
      (info) => {
        console.log(`API listening on http://localhost:${info.port}`)
      }
    )
  })
  .catch((error) => {
    console.error('Failed to initialize database schema', error)
    process.exit(1)
  })
