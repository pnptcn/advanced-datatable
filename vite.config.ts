import { defineConfig } from 'vite';

export default defineConfig({
    root: './src', // Set the root directory to ./src so Vite finds index.html here
    build: {
        outDir: '../dist', // Build output goes to dist folder
    },
    server: {
        open: true, // Automatically open in the browser
    },
    resolve: {
        alias: {
            '@': '/src', // Optional: You can create aliases for easy imports
        },
    },
});
