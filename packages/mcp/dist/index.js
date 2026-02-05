#!/usr/bin/env node

// src/index.ts
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema
} from "@modelcontextprotocol/sdk/types.js";
import {
  generate,
  generatePrompt,
  generateSearchQueries,
  TAB_PRESETS,
  DIFFICULTY_PRESETS
} from "@cursorvers/guidescope";
var server = new Server(
  {
    name: "guidescope",
    version: "1.0.0"
  },
  {
    capabilities: {
      tools: {}
    }
  }
);
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "generate",
        description: "\u533B\u7642AI\u30AC\u30A4\u30C9\u30E9\u30A4\u30F3\u691C\u7D22\u7528\u306E\u30D7\u30ED\u30F3\u30D7\u30C8\u3068\u691C\u7D22\u30AF\u30A8\u30EA\u3092\u751F\u6210\u3057\u307E\u3059",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "\u63A2\u7D22\u30C6\u30FC\u30DE\uFF08\u4F8B\uFF1A\u533B\u7642AI\u306E\u81E8\u5E8A\u5C0E\u5165\u306B\u304A\u3051\u308B\u5B89\u5168\u7BA1\u7406\uFF09"
            },
            preset: {
              type: "string",
              description: "\u30D7\u30EA\u30BB\u30C3\u30C8: medical-device, clinical-operation, research-ethics, generative-ai",
              enum: TAB_PRESETS.map((p) => p.id)
            },
            difficulty: {
              type: "string",
              description: "\u96E3\u6613\u5EA6: standard\uFF08\u57FA\u672C\uFF09, professional\uFF08\u8A73\u7D30\u5206\u6790\uFF09",
              enum: DIFFICULTY_PRESETS.map((p) => p.id)
            },
            customKeywords: {
              type: "array",
              items: { type: "string" },
              description: "\u8FFD\u52A0\u306E\u691C\u7D22\u30AD\u30FC\u30EF\u30FC\u30C9"
            }
          },
          required: ["query"]
        }
      },
      {
        name: "generatePrompt",
        description: "\u533B\u7642AI\u30AC\u30A4\u30C9\u30E9\u30A4\u30F3\u691C\u7D22\u7528\u306E\u30D7\u30ED\u30F3\u30D7\u30C8\u306E\u307F\u3092\u751F\u6210\u3057\u307E\u3059",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "\u63A2\u7D22\u30C6\u30FC\u30DE"
            },
            preset: {
              type: "string",
              description: "\u30D7\u30EA\u30BB\u30C3\u30C8",
              enum: TAB_PRESETS.map((p) => p.id)
            },
            difficulty: {
              type: "string",
              description: "\u96E3\u6613\u5EA6",
              enum: DIFFICULTY_PRESETS.map((p) => p.id)
            }
          },
          required: ["query"]
        }
      },
      {
        name: "generateSearchQueries",
        description: "\u533B\u7642AI\u30AC\u30A4\u30C9\u30E9\u30A4\u30F3\u691C\u7D22\u7528\u306E\u30AF\u30A8\u30EA\u4E00\u89A7\u3092\u751F\u6210\u3057\u307E\u3059",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "\u63A2\u7D22\u30C6\u30FC\u30DE"
            },
            preset: {
              type: "string",
              description: "\u30D7\u30EA\u30BB\u30C3\u30C8",
              enum: TAB_PRESETS.map((p) => p.id)
            }
          },
          required: ["query"]
        }
      },
      {
        name: "listPresets",
        description: "\u5229\u7528\u53EF\u80FD\u306A\u30D7\u30EA\u30BB\u30C3\u30C8\u4E00\u89A7\u3092\u8868\u793A\u3057\u307E\u3059",
        inputSchema: {
          type: "object",
          properties: {}
        }
      }
    ]
  };
});
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  try {
    switch (name) {
      case "generate": {
        const options = {
          query: args?.query,
          preset: args?.preset,
          difficulty: args?.difficulty,
          customKeywords: args?.customKeywords
        };
        const result = generate(options);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                prompt: result.prompt,
                searchQueries: result.searchQueries
              }, null, 2)
            }
          ]
        };
      }
      case "generatePrompt": {
        const options = {
          query: args?.query,
          preset: args?.preset,
          difficulty: args?.difficulty
        };
        const prompt = generatePrompt(options);
        return {
          content: [
            {
              type: "text",
              text: prompt
            }
          ]
        };
      }
      case "generateSearchQueries": {
        const options = {
          query: args?.query,
          preset: args?.preset
        };
        const queries = generateSearchQueries(options);
        return {
          content: [
            {
              type: "text",
              text: queries.join("\n")
            }
          ]
        };
      }
      case "listPresets": {
        const presets = TAB_PRESETS.map((p) => ({
          id: p.id,
          name: p.name,
          categories: p.categories
        }));
        const difficulties = DIFFICULTY_PRESETS.map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          features: p.features
        }));
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ presets, difficulties }, null, 2)
            }
          ]
        };
      }
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error instanceof Error ? error.message : String(error)}`
        }
      ],
      isError: true
    };
  }
});
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("GuideScope MCP server running on stdio");
}
main().catch(console.error);
//# sourceMappingURL=index.js.map