# Skills API

## Creating a Skill

A skill is a module that exports a `Skill` object:

```typescript
import type { Skill } from 'laborovir/skills/types';

const mySkill: Skill = {
  manifest: {
    name: 'my-skill',
    version: '1.0.0',
    description: 'Does something useful',
    author: 'You',
  },
  tools: [
    {
      name: 'my_tool',
      description: 'Does the thing',
      input_schema: {
        type: 'object',
        properties: {
          input: { type: 'string', description: 'The input' },
        },
        required: ['input'],
      },
      async execute(params) {
        const { input } = params as { input: string };
        return { success: true, output: `Processed: ${input}` };
      },
    },
  ],
};

export default mySkill;
```

## Installing

```bash
laborovir skills install /path/to/my-skill
```

Or place the skill directory in `~/.laborovir/skills/` with an `index.js` entry point.

## Tool Schema

Tools use JSON Schema for input validation. The `input_schema` must be a valid JSON Schema object. Input is validated with Ajv before execution.

## Sandbox

Tools that access the filesystem are restricted to allowed paths (`~/laborovir-workspace`, `~/.laborovir`). Shell commands are checked against a blocklist of dangerous patterns.
