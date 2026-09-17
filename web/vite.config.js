import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    server: {
        port: 3000
    },
    css: {
        preprocessorOptions: {
            scss: {
                // Bootstrap 5.3's own Sass internals trigger these against
                // current Dart Sass — not something this project's code can
                // fix, and they don't affect the compiled output.
                quietDeps: true,
                silenceDeprecations: ['import', 'color-functions', 'global-builtin']
            }
        }
    }
});
