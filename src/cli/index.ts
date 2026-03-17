import { Command } from 'commander';
import { VERSION, APP_NAME } from '../shared/constants.js';
import { registerOnboard } from './commands/onboard.js';
import { registerGateway } from './commands/gateway.js';
import { registerDoctor } from './commands/doctor.js';
import { registerSkills } from './commands/skills.js';
import { registerMessage } from './commands/message.js';
import { registerConfig } from './commands/config.js';

const program = new Command()
  .name(APP_NAME)
  .version(VERSION)
  .description('Laborovir Workman — AI assistant with gateway daemon, multi-channel messaging, and extensible skills');

registerOnboard(program);
registerGateway(program);
registerDoctor(program);
registerSkills(program);
registerMessage(program);
registerConfig(program);

program.parse();
