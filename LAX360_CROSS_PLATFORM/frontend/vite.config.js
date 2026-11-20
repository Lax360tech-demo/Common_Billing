import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './',
  plugins: [
    react({
      include: /\.(jsx|js)$/
    })
  ],
  esbuild: {
    loader: 'jsx',
    include: /src\/.*\.js$|src\/.*\.jsx$|App\.js$/,
    exclude: []
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.js': 'jsx'
      }
    }
  },
  resolve: {
    alias: {
      'react-native': 'react-native-web'
    },
    extensions: ['.web.js', '.web.jsx', '.js', '.jsx', '.json']
  },
  server: {
    port: 3000,
    open: false
  }
});
