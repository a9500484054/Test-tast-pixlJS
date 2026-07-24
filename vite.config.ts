import { defineConfig } from 'vite';

// Генерируем уникальный хеш на основе времени
const buildHash = Date.now().toString(36);

export default defineConfig({
    server: {
        port: 3000,
        host: true,
        hmr: {
            overlay: false
        }
    },
    build: {
        target: 'es2015',
        rollupOptions: {
            output: {
                assetFileNames: `assets/[name].${buildHash}.[ext]`,
                chunkFileNames: `assets/[name].${buildHash}.js`,
                entryFileNames: `assets/[name].${buildHash}.js`
            }
        },
        minify: 'terser',
        terserOptions: {
            compress: {
                drop_console: true,
                drop_debugger: true
            }
        }
    },
    resolve: {
        extensions: ['.ts', '.js']
    },
    esbuild: {
        target: 'es2015'
    }
});