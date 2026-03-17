import { resolve, normalize } from 'node:path';
import { homedir } from 'node:os';
import { ToolError } from '../shared/errors.js';

const BLOCKED_COMMANDS = ['rm -rf /', 'mkfs', 'dd if=', ':(){'];
const ALLOWED_ROOTS = [
  resolve(homedir(), 'laborovir-workspace'),
  resolve(homedir(), '.laborovir'),
];

export function checkPathAllowed(filePath: string): void {
  const resolved = resolve(normalize(filePath));
  const allowed = ALLOWED_ROOTS.some((root) => resolved.startsWith(root));
  if (!allowed) {
    throw new ToolError(`Path not allowed: ${filePath}. Allowed roots: ${ALLOWED_ROOTS.join(', ')}`);
  }
}

export function checkCommandAllowed(command: string): void {
  const lower = command.toLowerCase();
  for (const blocked of BLOCKED_COMMANDS) {
    if (lower.includes(blocked)) {
      throw new ToolError(`Blocked command pattern: ${blocked}`);
    }
  }
}
