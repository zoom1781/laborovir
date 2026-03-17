import type { Skill } from '../types.js';

export const browserSkill: Skill = {
  manifest: { name: 'browser', version: '0.1.0', description: 'Headless browser automation' },
  tools: [
    {
      name: 'browser_navigate',
      description: 'Navigate to a URL and return page content (requires puppeteer)',
      input_schema: {
        type: 'object',
        properties: { url: { type: 'string', description: 'URL to navigate to' } },
        required: ['url'],
      },
      async execute() {
        return { success: false, output: '', error: 'Browser skill requires puppeteer. Install with: npm install puppeteer' };
      },
    },
  ],
};
