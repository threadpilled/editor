import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@threadpilled/editor': resolve(__dirname, '../editor-sdk/src/index.ts'),
    },
  },
});
