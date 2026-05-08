import { withSession } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Не авторизовано' }, { status: 401 })
    const rq = withSession(session)

    let sql, params

    if (session.user.role === 'admin') {
      sql = `SELECT d.*, p.description AS project_desc, p.specialization,
             cl.first_name || ' ' || cl.last_name AS client_name,
             co.first_name || ' ' || co.last_name AS contractor_name
             FROM Deal d
             LEFT JOIN Project p ON d.project_id = p.project_id
             LEFT JOIN Client cl ON d.client_id = cl.client_id
             LEFT JOIN Contractor co ON d.contractor_id = co.contractor_id
             ORDER BY d.created_at DESC`
      params = []
    } else if (session.user.role === 'client') {
      const { searchParams } = new URL(req.url)
      const projectId = searchParams.get('projectId')
      sql = `SELECT d.*, p.description AS project_desc, p.specialization,
             co.first_name || ' ' || co.last_name AS contractor_name,
             co.specialization AS contractor_specialization,
             ct.input_data AS task_data
             FROM Deal d
             LEFT JOIN Project p ON d.project_id = p.project_id
             LEFT JOIN Contractor co ON d.contractor_id = co.contractor_id
             LEFT JOIN ContractorTask ct ON ct.deal_id = d.deal_id AND ct.task_type = 'application'
             WHERE d.client_id = $1 ${projectId ? 'AND d.project_id = $2' : ''} ORDER BY d.created_at DESC`
      params = projectId ? [session.user.profileId, projectId] : [session.user.profileId]
    } else {
      sql = `SELECT d.*, p.description AS project_desc, p.specialization,
             cl.first_name || ' ' || cl.last_name AS client_name
             FROM Deal d
             LEFT JOIN Project p ON d.project_id = p.project_id
             LEFT JOIN Client cl ON d.client_id = cl.client_id
             WHERE d.contractor_id = $1 ORDER BY d.created_at DESC`
      params = [session.user.profileId]
    }

    const result = await rq(sql, params)
    return NextResponse.json(result.rows)
  } catch (error) {
    return NextResponse.json({ error: 'Помилка' }, { status: 500 })
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Не авторизовано' }, { status: 401 })
    const rq = withSession(session)

    const body = await req.json()

    // виконавець подає заявку на проект
    if (session.user.role === 'contractor') {
      const { projectId, comment } = body
      if (!projectId) return NextResponse.json({ error: 'projectId обовязковий' }, { status: 400 })

      // перевірка чи вже є заявка
      const existing = await rq(
        'SELECT deal_id FROM Deal WHERE project_id = $1 AND contractor_id = $2 AND status = $3',
        [projectId, session.user.profileId, 'Pending']
      )
      if (existing.rows.length > 0) {
        return NextResponse.json({ error: 'Ви вже подали заявку на цей проект' }, { status: 400 })
      }

      const project = await rq('SELECT client_id, budget FROM Project WHERE project_id = $1', [projectId])
      if (project.rows.length === 0) return NextResponse.json({ error: 'Проект не знайдено' }, { status: 404 })

      const { client_id, budget } = project.rows[0]

      const result = await rq(
        `INSERT INTO Deal (project_id, client_id, contractor_id, amount, status)
         VALUES ($1, $2, $3, $4, 'Pending') RETURNING *`,
        [projectId, client_id, session.user.profileId, budget]
      )
      const deal = result.rows[0]

      // зберігаємо коментар у ContractorTask
      if (comment) {
        await rq(
          `INSERT INTO ContractorTask (contractor_id, deal_id, task_type, input_data, output_data)
           VALUES ($1, $2, 'application', $3, '{}')
           ON CONFLICT (contractor_id, deal_id) DO UPDATE SET input_data = $3`,
          [session.user.profileId, deal.deal_id, JSON.stringify({ comment })]
        )
      }

      return NextResponse.json(deal, { status: 201 })
    }

    // клієнт створює угоду напряму (з профілю виконавця)
    const { projectId, contractorId, amount } = body
    const project = await rq('SELECT client_id FROM Project WHERE project_id = $1', [projectId])
    if (project.rows.length === 0) return NextResponse.json({ error: 'Проект не знайдено' }, { status: 404 })

    const result = await rq(
      `INSERT INTO Deal (project_id, client_id, contractor_id, amount, status)
       VALUES ($1, $2, $3, $4, 'Pending') RETURNING *`,
      [projectId, project.rows[0].client_id, contractorId, amount]
    )

    await rq(
      'INSERT INTO Safe (deal_id, amount) VALUES ($1, $2)',
      [result.rows[0].deal_id, amount]
    )

    return NextResponse.json(result.rows[0], { status: 201 })
  } catch (error) {
    console.log('Deal POST error:', error)
    return NextResponse.json({ error: 'Помилка створення угоди' }, { status: 500 })
  }
}
