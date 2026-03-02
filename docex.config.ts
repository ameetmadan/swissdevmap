// docex.config.ts
export default {
    include: ['frontend/**/*.ts', 'backend/**/*.ts'],  // adjust to match your project
    outDir: './docs',
    provider: { name: 'anthropic', model: 'claude-sonnet-4-6' },
    apiKey: process.env.DOCEX_API_KEY,
}