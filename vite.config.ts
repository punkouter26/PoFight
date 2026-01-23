import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    server: {
        port: 3000,
    },
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    'react-vendor': ['react', 'react-dom'],
                    'engine': [
                        './src/engine/Fighter.ts',
                        './src/engine/FightManager.ts',
                        './src/engine/GameLoop.ts',
                        './src/engine/InputManager.ts',
                        './src/engine/AIController.ts',
                        './src/engine/Collision.ts',
                        './src/engine/Signals.ts',
                        './src/engine/Constants.ts',
                    ],
                    'store': ['zustand', 'idb-keyval', './src/store/gameState.ts'],
                },
            },
        },
        minify: 'terser',
        terserOptions: {
            compress: {
                drop_console: true,
                drop_debugger: true,
            },
        },
    },
});
