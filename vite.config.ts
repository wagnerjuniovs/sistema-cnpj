import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig(({ mode }) => {
  const pages = mode === 'pages'
  const api = process.env.VITE_API_URL?.trim() ?? ''
  if (pages && api) {
    const url = new URL(api)
    if (api !== 'http://127.0.0.1:3333' && (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || /^(localhost|127\.|\[?::1\]?)/i.test(url.hostname))) throw new Error('Pages exige HTTPS sem credenciais ou a API local autorizada em 127.0.0.1:3333.')
  }
  return {
  base: pages ? '/sistema-cnpj/' : '/',
  // Publicação nunca carrega o .env.local do computador.
  envDir: pages ? false : undefined,
  define: pages ? { 'import.meta.env.VITE_API_URL': JSON.stringify(api) } : undefined,
  plugins: [react(), tailwindcss()],
  // Evidências e dependências de QA não fazem parte do HMR (evita EBUSY no Windows).
  server: { watch: { ignored: ['**/.local/**'] } },
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  }
})
