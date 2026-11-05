import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    strictPort: true, // si 5173 está ocupado, avisa en vez de cambiar de puerto en silencio
    host: true,       // escucha en IPv4 e IPv6: funciona con localhost y con 127.0.0.1
  },
});
