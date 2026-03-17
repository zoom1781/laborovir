import { homedir } from 'node:os';
import { join } from 'node:path';

export const VERSION = '0.1.0';
export const APP_NAME = 'laborovir';
export const CONFIG_DIR = join(homedir(), '.laborovir');
export const CONFIG_FILE = join(CONFIG_DIR, 'config.yaml');
export const SESSIONS_DB = join(CONFIG_DIR, 'sessions.db');
export const PID_FILE = join(CONFIG_DIR, 'gateway.pid');
export const SKILLS_DIR = join(CONFIG_DIR, 'skills');
export const DEFAULT_PORT = 7100;
export const DEFAULT_HOST = '127.0.0.1';
export const MAX_TOOL_ITERATIONS = 20;
