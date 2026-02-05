/**
 * GuideScope MCP Server
 * Exposes Japanese medical guideline search prompt generation as MCP tools
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import {
  generate,
  generatePrompt,
  generateSearchQueries,
  TAB_PRESETS,
  DIFFICULTY_PRESETS,
  type GeneratePromptOptions,
} from '@cursorvers/guidescope';

// Create MCP server
const server = new Server(
  {
    name: 'guidescope',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'generate',
        description: '医療AIガイドライン検索用のプロンプトと検索クエリを生成します',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: '探索テーマ（例：医療AIの臨床導入における安全管理）',
            },
            preset: {
              type: 'string',
              description: 'プリセット: medical-device, clinical-operation, research-ethics, generative-ai',
              enum: TAB_PRESETS.map(p => p.id),
            },
            difficulty: {
              type: 'string',
              description: '難易度: standard（基本）, professional（詳細分析）',
              enum: DIFFICULTY_PRESETS.map(p => p.id),
            },
            customKeywords: {
              type: 'array',
              items: { type: 'string' },
              description: '追加の検索キーワード',
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'generatePrompt',
        description: '医療AIガイドライン検索用のプロンプトのみを生成します',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: '探索テーマ',
            },
            preset: {
              type: 'string',
              description: 'プリセット',
              enum: TAB_PRESETS.map(p => p.id),
            },
            difficulty: {
              type: 'string',
              description: '難易度',
              enum: DIFFICULTY_PRESETS.map(p => p.id),
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'generateSearchQueries',
        description: '医療AIガイドライン検索用のクエリ一覧を生成します',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: '探索テーマ',
            },
            preset: {
              type: 'string',
              description: 'プリセット',
              enum: TAB_PRESETS.map(p => p.id),
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'listPresets',
        description: '利用可能なプリセット一覧を表示します',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'generate': {
        const options: GeneratePromptOptions = {
          query: args?.query as string,
          preset: args?.preset as string,
          difficulty: args?.difficulty as 'standard' | 'professional',
          customKeywords: args?.customKeywords as string[],
        };
        const result = generate(options);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                prompt: result.prompt,
                searchQueries: result.searchQueries,
              }, null, 2),
            },
          ],
        };
      }

      case 'generatePrompt': {
        const options: GeneratePromptOptions = {
          query: args?.query as string,
          preset: args?.preset as string,
          difficulty: args?.difficulty as 'standard' | 'professional',
        };
        const prompt = generatePrompt(options);
        return {
          content: [
            {
              type: 'text',
              text: prompt,
            },
          ],
        };
      }

      case 'generateSearchQueries': {
        const options: GeneratePromptOptions = {
          query: args?.query as string,
          preset: args?.preset as string,
        };
        const queries = generateSearchQueries(options);
        return {
          content: [
            {
              type: 'text',
              text: queries.join('\n'),
            },
          ],
        };
      }

      case 'listPresets': {
        const presets = TAB_PRESETS.map(p => ({
          id: p.id,
          name: p.name,
          categories: p.categories,
        }));
        const difficulties = DIFFICULTY_PRESETS.map(p => ({
          id: p.id,
          name: p.name,
          description: p.description,
          features: p.features,
        }));
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ presets, difficulties }, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('GuideScope MCP server running on stdio');
}

main().catch(console.error);
