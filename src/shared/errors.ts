export class LaborovirError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'LaborovirError';
  }
}

export class ConfigError extends LaborovirError {
  constructor(message: string) {
    super(message, 'CONFIG_ERROR');
    this.name = 'ConfigError';
  }
}

export class GatewayError extends LaborovirError {
  constructor(message: string) {
    super(message, 'GATEWAY_ERROR');
    this.name = 'GatewayError';
  }
}

export class AgentError extends LaborovirError {
  constructor(message: string) {
    super(message, 'AGENT_ERROR');
    this.name = 'AgentError';
  }
}

export class ToolError extends LaborovirError {
  constructor(message: string) {
    super(message, 'TOOL_ERROR');
    this.name = 'ToolError';
  }
}

export class ChannelError extends LaborovirError {
  constructor(message: string) {
    super(message, 'CHANNEL_ERROR');
    this.name = 'ChannelError';
  }
}
