import { defineConfig } from 'vite';

export default defineConfig({
    server: {
        port: 3000,
        host: true
    },
    build: {
        target: ['es2015', 'ie11'],
        rollupOptions: {
            output: {
                assetFileNames: 'assets/[name].[hash].[ext]',
                chunkFileNames: 'assets/[name].[hash].js',
                entryFileNames: 'assets/[name].[hash].js'
            }
        }
    },
    resolve: {
        extensions: ['.ts', '.js']
    }
});