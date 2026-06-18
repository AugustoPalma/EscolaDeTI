import Icon from '../lib/icons.jsx'

export function Loading() {
  return (
    <div className="card">
      <div className="card-head">
        <div>
          <h2>A carregar…</h2>
          <div className="sub">A obter dados do Supabase</div>
        </div>
      </div>
      {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skel-row" />)}
    </div>
  )
}

export function ErrorState({ error, onRetry }) {
  return (
    <div className="card">
      <div className="state">
        <Icon name="alert" strokeWidth={1.8} />
        <h3>Não foi possível carregar os dados</h3>
        <p>Verifique a ligação à internet e as políticas de acesso (RLS) do Supabase. Detalhe: <span className="mono">{error}</span></p>
        <button className="btn" onClick={onRetry}><Icon name="refresh" />Tentar novamente</button>
      </div>
    </div>
  )
}

export function EmptyState({ icon, title, text }) {
  return (
    <div className="state">
      <Icon name={icon} strokeWidth={1.8} />
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  )
}

export function StatusBadge({ status }) {
  if (status === 'CONCLUIDO') return <span className="badge ok"><span className="dot" />Concluído</span>
  if (status === 'CONFIRMADO') return <span className="badge pending"><span className="dot" />Confirmado</span>
  return <span className="badge busy"><span className="dot" />{status || '—'}</span>
}

export function RoleBadge({ papel }) {
  const p = String(papel).toUpperCase()
  if (p.includes('VEND') || p.includes('SELLER')) return <span className="badge role-seller">Vendedor</span>
  if (p.includes('COMPR') || p.includes('BUY')) return <span className="badge role-buyer">Comprador</span>
  return <span className="badge busy">{papel}</span>
}
