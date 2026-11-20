import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/auth': 'http://127.0.0.1:8000',
      '/business-categories': 'http://127.0.0.1:8000',
      '/dashboard': 'http://127.0.0.1:8000',
      '/products': 'http://127.0.0.1:8000',
      '/inventory': 'http://127.0.0.1:8000',
      '/invoices': 'http://127.0.0.1:8000',
      '/customers': 'http://127.0.0.1:8000',
      '/suppliers': 'http://127.0.0.1:8000',
      '/purchases': 'http://127.0.0.1:8000',
      '/expenses': 'http://127.0.0.1:8000',
      '/reports': 'http://127.0.0.1:8000',
      '/settings': 'http://127.0.0.1:8000'
    }
  }
});
