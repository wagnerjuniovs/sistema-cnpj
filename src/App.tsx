import { useEffect, useState } from 'react'
import { ListFilter, Search } from 'lucide-react'
import { MotionConfig } from 'motion/react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Explorer } from '@/features/explorer/Explorer'
import { Lookup } from '@/features/lookup/Lookup'
import { initialize } from '@/services/cnpj'
import { ApiError, errorMessage } from '@/services/api'
import { configureContract } from '@/features/explorer/catalog'
import { Button } from '@/components/ui/button'

type Page = 'explorar' | 'consultar'
const readPage = (): Page => window.location.hash === '#consultar' ? 'consultar' : 'explorar'

export function App() {
  const [page, setPage] = useState<Page>(readPage)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    let active = true
    let retry: ReturnType<typeof setTimeout> | undefined
    setError('')
    initialize().then(({ contract }) => {
      if (!active) return
      configureContract(contract)
      setReady(true)
    }).catch(cause => {
      if (!active) return
      setError(errorMessage(cause))
      if (cause instanceof ApiError && ['NETWORK_ERROR', 'DATABASE_UNAVAILABLE', 'DB_UNAVAILABLE', 'TIMEOUT'].includes(cause.code)) {
        retry = setTimeout(() => setAttempt(value => value + 1), 5000)
      }
    })
    return () => { active = false; clearTimeout(retry) }
  }, [attempt])
  useEffect(() => {
    const sync = () => setPage(readPage())
    window.addEventListener('hashchange', sync)
    return () => window.removeEventListener('hashchange', sync)
  }, [])
  useEffect(() => {
    document.title = `CNPJ · ${page === 'explorar' ? 'Explorar empresas' : 'Consultar CNPJ'}`
  }, [page])
  function navigate(value: string) {
    const next = value as Page
    setPage(next)
    if (readPage() !== next || !window.location.hash) window.location.hash = next
  }
  return (
    <MotionConfig reducedMotion="user">
      <a className="skip-link" href="#conteudo">Ir para o conteúdo</a>
      <Tabs value={page} onValueChange={navigate} className="app-shell">
        <header className="app-header">
          <span className="brand" aria-label="CNPJ">CNPJ<span>.</span></span>
          <TabsList aria-label="Área de trabalho">
            <TabsTrigger value="explorar"><ListFilter size={15} aria-hidden="true" />Explorar empresas</TabsTrigger>
            <TabsTrigger value="consultar"><Search size={15} aria-hidden="true" />Consultar CNPJ</TabsTrigger>
          </TabsList>
        </header>
        <main id="conteudo" tabIndex={-1} className="main-content">
          {!ready ? <div className="result-state" role={error ? 'alert' : 'status'}>{error || 'Conectando à API local…'}{error && <Button onClick={() => setAttempt(value => value + 1)}>Tentar novamente</Button>}</div> : <><TabsContent value="explorar" forceMount><Explorer /></TabsContent><TabsContent value="consultar" forceMount><Lookup /></TabsContent></>}
        </main>
      </Tabs>
    </MotionConfig>
  )
}
