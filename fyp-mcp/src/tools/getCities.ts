import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { getCities } from '../lib/adminClient.js'

export function register(server: McpServer) {
  server.tool(
    'get_cities',
    'Get the list of cities where DocLink doctors are available. Use this to validate or clarify the city a patient mentions before calling search_doctors.',
    {},
    async () => {
      try {
        const result = await getCities()

        if (!result.cities || result.cities.length === 0) {
          return { content: [{ type: 'text', text: 'No cities found.' }] }
        }

        return {
          content: [
            {
              type: 'text',
              text: `Available cities (${result.count}): ${result.cities.join(', ')}`,
            },
          ],
        }
      } catch (err: any) {
        return {
          content: [{ type: 'text', text: `Error fetching cities: ${err.message}` }],
          isError: true,
        }
      }
    },
  )
}
