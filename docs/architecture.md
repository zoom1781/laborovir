# Architecture

## Overview

Laborovir Workman is structured as a CLI tool backed by a local gateway daemon. The CLI provides commands for setup, management, and direct messaging. The gateway handles message routing, session persistence, and AI agent orchestration.

## Components

### CLI (`src/cli/`)
Commander.js-based CLI with subcommands: onboard, gateway, doctor, skills, message, config.

### Gateway (`src/gateway/`)
Fastify HTTP + WebSocket server running as a detached daemon process. Routes messages through the agent bridge and persists sessions in SQLite.

### Channels (`src/channels/`)
Adapter pattern for multi-channel messaging. Each adapter implements connect/disconnect/send/onMessage. The stdin adapter is always available; others (Telegram, Discord, Slack, WhatsApp) are lazy-loaded based on config.

### Agents (`src/agents/`)
Provider abstraction for AI models. The bridge implements a tool-use loop: send messages to the model, if it requests tool use, execute the tool and feed results back, repeat up to 20 iterations.

### Skills (`src/skills/`)
Skills bundle related tools. Built-in skills provide exec, file operations, search, and browser automation. External skills can be installed from the filesystem.

### Tools (`src/tools/`)
Tool execution layer with Ajv input validation and sandbox checks (path allowlists, blocked commands).

## Data Flow

1. Message arrives via channel adapter or API
2. Router finds/creates session, appends user message
3. Agent bridge calls AI provider with conversation + tool definitions
4. If model requests tool use → executor validates, sandbox checks, runs tool
5. Result fed back to model (loop continues)
6. Final text response returned through router to channel
