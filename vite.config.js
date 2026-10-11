/* global process */
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const supabaseUrl = env.VITE_SUPABASE_URL?.replace(/\/$/, '')
  return {
    plugins: [
      react(),
      babel({ presets: [reactCompilerPreset()] }),
      tailwindcss(),
    ],
    server: supabaseUrl ? {
      proxy: {
        '/supabase': {
          target: supabaseUrl,
          changeOrigin: true,
          ws: true,
          rewrite: (path) => path.replace(/^\/supabase/, ''),
        },
      },
    } : undefined,
  }
})
