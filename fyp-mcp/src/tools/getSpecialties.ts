import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { getSpecialties } from '../lib/adminClient.js'

export function register(server: McpServer) {
  server.tool(
    'get_specialties',
    'Get the full list of available medical specialties in the DocLink system. Use this when the patient mentions a vague condition (e.g. "heart problem", "skin issue") to map it to the correct specialty before calling search_doctors.',
    {},
    async () => {
      try {
        const result = await getSpecialties()

        if (!result.specialties || result.specialties.length === 0) {
          return { content: [{ type: 'text', text: 'No specialties found.' }] }
        }

        const lines = result.specialties.map((s) => {
          const aliases = s.aliases.length > 0 ? ` (also: ${s.aliases.join(', ')})` : ''
          return `- ${s.name}${aliases}`
        })

        return {
          content: [
            {
              type: 'text',
              text: `Available specialties (${result.count}):\n${lines.join('\n')}`,
            },
          ],
        }
      } catch (err: any) {
        return {
          content: [{ type: 'text', text: `Error fetching specialties: ${err.message}` }],
          isError: true,
        }
      }
    },
  )
}
