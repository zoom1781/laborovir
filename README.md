# Laborovir Workman

An open-source AI assistant CLI tool with a local gateway daemon, multi-channel messaging support, AI agent bridge, and extensible skills system.

## Features

- **Multi-provider AI**: Claude, OpenAI, and Ollama support
- **Gateway daemon**: HTTP + WebSocket server for message routing
- **Multi-channel**: Terminal (stdin), Telegram, Discord, Slack, WhatsApp adapters
- **Skills system**: Built-in tools (exec, file read/write/edit, search, browser) + extensible external skills
- **Session persistence**: SQLite-backed conversation history
- **Tool-use loop**: Agentic tool calling with configurable iteration limits
- **Sandboxed execution**: Path allowlists and command blocking

## Quick Start

```bash
# Clone and install
git clone https://github.com/zoom1781/laborovir.git
cd laborovir
npm install
npm run build

# Interactive setup
node bin/laborovir.js onboard

# Or install globally
npm install -g .
laborovir onboard
```

## Usage

```bash
# Run setup wizard
laborovir onboard

# Check your setup
laborovir doctor

# Start the gateway daemon
laborovir gateway start

# Check gateway status
laborovir gateway status

# Send a message
laborovir message send --channel stdin --text "Hello"

# Manage skills
laborovir skills list
laborovir skills install ./my-skill

# View/set configuration
laborovir config get
laborovir config get agent.provider
laborovir config set agent.model claude-sonnet-4-20250514

# Stop the gateway
laborovir gateway stop
```

## Architecture

```
CLI (Commander.js)
 └─ Gateway (Fastify HTTP + WebSocket)
     ├─ Router → Agent Bridge (tool-use loop)
     │   └─ Providers: Claude / OpenAI / Ollama
     ├─ Session Store (SQLite via sql.js)
     ├─ Channel Adapters (stdin, Telegram, Discord, Slack, WhatsApp)
     └─ Skills Registry (builtin + external)
         └─ Tool Executor (Ajv validation + sandbox)
```

## Configuration

Config lives at `~/.laborovir/config.yaml`:

```yaml
version: 1
agent:
  provider: claude
  model: claude-sonnet-4-20250514
  apiKey: ${ANTHROPIC_API_KEY}
gateway:
  port: 7100
  host: 127.0.0.1
channels:
  - type: stdin
    enabled: true
skills:
  builtinEnabled: true
  external: []
workspace:
  rootDir: ~/laborovir-workspace
```

Environment variables can be interpolated with `${VAR_NAME}` syntax.

## Development

```bash
npm run dev      # Watch mode
npm run build    # Compile TypeScript
npm test         # Run tests
```

## License

MIT
