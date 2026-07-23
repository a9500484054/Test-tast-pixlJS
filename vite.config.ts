import { defineConfig } from 'vite';

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
                assetFileNames: 'assets/[name].[hash].[ext]',
                chunkFileNames: 'assets/[name].[hash].js',
                entryFileNames: 'assets/[name].[hash].js'
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