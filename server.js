/**
 * Arch Wizard — Diagnostic REST Service
 * Node.js / Express 5
 *
 * Endpoints:
 *   GET  /api/diagnostic-graph      → Serve the full diagnostic graph JSON
 *   POST /api/tickets               → Accept a submitted support ticket
 *   GET  /api/tickets               → List submitted tickets (in-memory, dev only)
 */

const express = require('express')
const path = require('path')
const crypto = require('crypto')

const app = express()
const PORT = process.env.PORT ?? 3001

// ─── Middleware ───────────────────────────────────────────────────────────────

app.use(express.json({ limit: '10mb' })) // allow base64 photo payloads
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`)
  next()
})

// ─── Ticket Store (in-memory; swap for DB in production) ──────────────────────

/** @type {Map<string, object>} */
const tickets = new Map()

// ─── Routes ───────────────────────────────────────────────────────────────────

/**
 * GET /api/diagnostic-graph
 * Serves the declarative JSON graph that drives the React renderer.
 * The renderer is deliberately graph-unaware — it only renders node types.
 */
app.get('/api/diagnostic-graph', (_req, res) => {
  const graphPath = path.join(__dirname, 'diagnostic-graph.json')
  res.sendFile(graphPath, (err) => {
    if (err) {
      console.error('Failed to serve diagnostic graph:', err)
      res.status(500).json({ error: 'Could not load diagnostic graph.' })
    }
  })
})

/**
 * POST /api/tickets
 * Body shape (mirrors session state from JourneyPlayer):
 * {
 *   category:      string,           // e.g. "printer"
 *   serial_number: string | null,
 *   error_photo:   { name, captured } | null,
 *   breadcrumbs: [{ nodeId, nodeTitle, answer }]
 * }
 */
app.post('/api/tickets', (req, res) => {
  const { category, serial_number, breadcrumbs } = req.body ?? {}

  if (!category || !Array.isArray(breadcrumbs)) {
    return res.status(400).json({ error: 'category and breadcrumbs are required.' })
  }

  const ticketId = `TKT-${crypto.randomBytes(4).toString('hex').toUpperCase()}`
  const ticket = {
    id: ticketId,
    createdAt: new Date().toISOString(),
    status: 'open',
    category,
    serial_number: serial_number ?? null,
    hasPhoto: req.body.error_photo?.captured ?? false,
    breadcrumbs,
    raw: req.body,
  }

  tickets.set(ticketId, ticket)

  console.log(`Ticket created: ${ticketId} | Category: ${category} | Steps: ${breadcrumbs.length}`)

  return res.status(201).json({
    ticketId,
    message: 'Ticket submitted. Support team notified.',
    estimatedResponseHours: 4,
  })
})

/**
 * GET /api/tickets
 * Dev-only endpoint to inspect submitted tickets.
 * Remove or guard with auth before production deployment.
 */
app.get('/api/tickets', (_req, res) => {
  res.json({
    count: tickets.size,
    tickets: Array.from(tickets.values()).map((t) => ({
      id: t.id,
      createdAt: t.createdAt,
      status: t.status,
      category: t.category,
      serial_number: t.serial_number,
      hasPhoto: t.hasPhoto,
      steps: t.breadcrumbs.length,
    })),
  })
})

/**
 * GET /api/tickets/:id
 * Retrieve a single ticket by ID.
 */
app.get('/api/tickets/:id', (req, res) => {
  const ticket = tickets.get(req.params.id)
  if (!ticket) return res.status(404).json({ error: 'Ticket not found.' })
  return res.json(ticket)
})

// ─── Static client (production) ───────────────────────────────────────────────
// Uncomment after running `npm run build` inside /client
//
// const DIST = path.join(__dirname, 'client', 'dist')
// app.use(express.static(DIST))
// app.get('*', (_req, res) => res.sendFile(path.join(DIST, 'index.html')))

// ─── Start ────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`\n🔧 Arch Wizard API running on http://localhost:${PORT}`)
  console.log(`   GET  /api/diagnostic-graph`)
  console.log(`   POST /api/tickets`)
  console.log(`   GET  /api/tickets\n`)
})
