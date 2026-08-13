import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const buildTimestamp = new Date().toLocaleString('ru-RU', { 
  day: '2-digit', 
  month: '2-digit', 
  hour: '2-digit', 
  minute: '2-digit',
  timeZone: 'Asia/Vladivostok' 
});

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify('1.4.1'),
    __BUILD_TIME__: JSON.stringify(buildTimestamp)
  }
});
