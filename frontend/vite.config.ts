import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    const apiUrl = env.VITE_API_URL;
    const apiKey = env.VITE_API_KEY;
    console.log('API URL:', apiUrl);
    return {
        plugins: [react()],
        define: {
            'process.env.VITE_API_URL': JSON.stringify(apiUrl),
            'process.env.VITE_API_KEY': JSON.stringify(apiKey),
        },
        server: {
            port: 5173,
            proxy: {
                '/api': {
                    target: apiUrl,
                    changeOrigin: true,
                },
            },
        },
    };
});