import 'dotenv/config'
import express, { Request, Response, NextFunction } from 'express'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'

import * as searchDoctors from './tools/searchDoctors.js'
import * as checkAvailability from './tools/checkAvailability.js'
import * as getSlots from './tools/getSlots.js'
import * as bookAppointment from './tools/bookAppointment.js'
import * as getAppointments from './tools/getAppointments.js'
import * as cancelAppointment from './tools/cancelAppointment.js'
import * as getSpecialties from './tools/getSpecialties.js'
import * as getCities from './tools/getCities.js'

const PORT = parseInt(process.env.MCP_PORT ?? '3004', 10)
const MCP_AUTH_TOKEN = process.env.MCP_AUTH_TOKEN ?? ''

// ---------------------------------------------------------------------------
// Factory: create a fresh McpServer with all tools registered.
// A new instance per request ensures stateless, session-free operation
// which is required for Retell's MCP integration.
// ---------------------------------------------------------------------------
function createServer(): McpServer {
  const server = new McpServer({
    name: 'doclink-booking',
    version: '1.0.0',
  })

  searchDoctors.register(server)
  checkAvailability.register(server)
  getSlots.register(server)
  bookAppointment.register(server)
  getAppointments.register(server)
  cancelAppointment.register(server)
  getSpecialties.register(server)
  getCities.register(server)

  return server
}

// ---------------------------------------------------------------------------
// Express app
// ---------------------------------------------------------------------------
const app = express()
app.use(express.json())

// Optional Bearer token auth — skip if MCP_AUTH_TOKEN is not set
app.use('/mcp', (req: Request, res: Response, next: NextFunction) => {
  if (!MCP_AUTH_TOKEN) return next()

  const authHeader = req.headers.authorization ?? ''
  if (!authHeader.startsWith('Bearer ') || authHeader.slice(7) !== MCP_AUTH_TOKEN) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }
  next()
})

// MCP endpoint — stateless: new McpServer + transport per request
app.post('/mcp', async (req: Request, res: Response) => {
  try {
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined, // stateless mode
    })

    const mcpServer = createServer()
    await mcpServer.connect(transport)
    await transport.handleRequest(req, res, req.body)
  } catch (err) {
    console.error('MCP request error:', err)
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error' })
    }
  }
})

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'doclink-mcp', tools: 8 })
})

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------
app.listen(PORT, () => {
  const authStatus = MCP_AUTH_TOKEN ? 'enabled' : 'disabled (set MCP_AUTH_TOKEN to enable)'
  console.log(`DocLink MCP server running on http://localhost:${PORT}`)
  console.log(`  MCP endpoint : POST http://localhost:${PORT}/mcp`)
  console.log(`  Health check : GET  http://localhost:${PORT}/health`)
  console.log(`  Auth         : ${authStatus}`)
  console.log(`  Admin API    : ${process.env.ADMIN_API_URL ?? 'http://localhost:4000/api/v1'}`)
})
