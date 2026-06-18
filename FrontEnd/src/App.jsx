import { useState, useEffect, useCallback } from 'react'
import { supabase, DB_HOST } from './supabaseClient.js'
import Sidebar from './components/Sidebar.jsx'
import Topbar from './components/Topbar.jsx'
import Painel from './components/Painel.jsx'
import Utilizadores from './components/Utilizadores.jsx'
import Transacoes from './components/Transacoes.jsx'
import Mensagens from './components/Mensagens.jsx'
import { Loading, ErrorState } from './components/StatusStates.jsx'

const VIEWS = {
  painel: { title: 'Painel', sub: 'Visão geral da plataforma' },
  utilizadores: { title: 'Utilizadores', sub: 'Compradores e vendedores registados' },
  transacoes: { title: 'Transações', sub: 'Agendamentos e estado das entregas' },
  mensagens: { title: 'Mensagens', sub: 'Conversas de negociação' }
}

export default function App() {
  const [view, setView] = useState('painel')
  const [data, setData] = useState({ mensagens: [], janelas: [], agendamentos: [], usuarios: null })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)

  const load = useCallback(async silent => {
    if (!silent) setLoading(true)
    try {
      const [mRes, jRes, aRes] = await Promise.all([
        supabase.from('mensagens').select('*').order('id', { ascending: false }),
        supabase.from('janelas_disponibilidade').select('*').order('data_hora_inicio', { ascending: true }),
        supabase.from('agendamentos').select('*').order('id', { ascending: false })
      ])
      const firstErr = mRes.error || jRes.error || aRes.error
      if (firstErr) throw new Error(firstErr.message)

      const uRes = await supabase.from('usuarios').select('*').order('id', { ascending: true })
      const usuarios = uRes.error ? null : uRes.data

      setData({ mensagens: mRes.data || [], janelas: jRes.data || [], agendamentos: aRes.data || [], usuarios })
      setError(null)
      setLastUpdated(new Date())
    } catch (e) {
      setError(e.message || 'Falha de ligação')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load(false) }, [load])

  useEffect(() => {
    const refresh = () => { if (document.visibilityState === 'visible') load(true) }
    const timer = setInterval(refresh, 8000)
    document.addEventListener('visibilitychange', refresh)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [load])

  const meta = VIEWS[view]

  return (
    <div className="app">
      <Sidebar view={view} setView={setView} data={data} connected={!error} loading={loading} />
      <main className="main">
        <Topbar title={meta.title} sub={meta.sub} lastUpdated={lastUpdated} error={error} onRefresh={() => load(false)} loading={loading} />
        <div className="content">
          <div className="view" key={view}>
            {loading ? <Loading /> :
              error ? <ErrorState error={error} onRetry={() => load(false)} /> :
              view === 'painel' ? <Painel data={data} /> :
              view === 'utilizadores' ? <Utilizadores data={data} /> :
              view === 'transacoes' ? <Transacoes data={data} /> :
              <Mensagens data={data} />}
          </div>
        </div>
        <footer className="footer">
          <span>Painel Administrativo · Marketplace de negociação segura</span>
          <span className="mono">{DB_HOST}</span>
        </footer>
      </main>
    </div>
  )
}
