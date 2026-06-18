import Icon from '../lib/icons.jsx'
import { usersList } from '../lib/helpers.js'
import { DB_HOST } from '../supabaseClient.js'

const VIEWS = [
  { id: 'painel', title: 'Painel', icon: 'grid' },
  { id: 'utilizadores', title: 'Utilizadores', icon: 'users' },
  { id: 'transacoes', title: 'Transações', icon: 'receipt' },
  { id: 'mensagens', title: 'Mensagens', icon: 'chat' }
]

export default function Sidebar({ view, setView, data, connected, loading }) {
  const counts = {
    painel: '',
    utilizadores: usersList(data).length,
    transacoes: (data.agendamentos || []).length,
    mensagens: (data.mensagens || []).length
  }
  const connClass = loading ? '' : connected ? 'ok' : 'err'
  const connText = loading ? 'A ligar…' : connected ? 'Ligado ao Supabase' : 'Sem ligação'

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-badge"><Icon name="shield" strokeWidth={2.2} /></div>
        <div>
          <div className="brand-name">Escola de TI</div>
          <div className="brand-sub">Painel Admin</div>
        </div>
      </div>

      <div className="nav-label">Gestão</div>
      <nav className="nav">
        {VIEWS.map(v => (
          <button
            key={v.id}
            className={`nav-item ${view === v.id ? 'is-active' : ''}`}
            onClick={() => setView(v.id)}
          >
            <Icon name={v.icon} />
            <span>{v.title}</span>
            {counts[v.id] !== '' && <span className="nav-count">{counts[v.id]}</span>}
          </button>
        ))}
      </nav>

      <div className="sidebar-foot">
        <div className={`conn ${connClass}`}>
          <span className="conn-dot" />
          <span>{connText}</span>
        </div>
        <div className="conn-sub">{DB_HOST}</div>
      </div>
    </aside>
  )
}
