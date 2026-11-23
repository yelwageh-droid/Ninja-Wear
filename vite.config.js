import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'


// https://vite.dev/config/
export default defineConfig({
  plugins: [tailwindcss(),react()],
  // Only VITE_ prefixed vars may reach the browser bundle / المتغيرات التي تبدأ بـ VITE_ فقط تصل للمتصفح
  envPrefix: ['VITE_'],
})
