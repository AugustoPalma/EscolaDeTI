import Icon from '../lib/icons.jsx'
import { metrics, janelaFor, fmtDate } from '../lib/helpers.js'
import { StatusBadge, EmptyState } from './StatusStates.jsx'

export default function Painel({ data }) {
  const m = metrics(data)
  const total = Math.max(m.livres + m.confirmados + m.concluidas, 1)
  const pct = n => Math.round((n / total) * 100)
  const recent = (data.agendamentos || []).slice(0, 5)

  const stats = [
    { label: 'Entregas concluídas', val: m.concluidas, foot: `${m.confirmados} ainda em andamento`, chip: 'emerald', icon: 'check' },
    { label: 'Agendamentos ativos', val: m.confirmados, foot: 'Aguardam validação por QR', chip: 'amber', icon: 'calendar' },
    { label: 'Horários livres', val: m.livres, foot: `${m.ocupadas} já reservados`, chip: 'slate', icon: 'clock' },
    { label: 'Mensagens trocadas', val: m.mensagens, foot: `${m.salas} negociação(ões)`, chip: 'emerald', icon: 'chat' }
  ]

  const stages = [
    { val: m.livres, name: 'Horários livres' },
    { val: m.confirmados, name: 'Confirmados' },
    { val: m.concluidas, name: 'Concluídos' }
  ]

  return (
    <>
      <div className="pipeline">
        <div className="pipeline-top">
          <div>
            <h2>Fluxo de entregas</h2>
            <p>Cada negociação avança até à validação segura por QR Code</p>
          </div>
          <span className="pipeline-tag"><span className="live-dot" />Em tempo real</span>
        </div>
        <div className="flow">
          {stages.map((s, i) => (
            <Stage key={s.name} stage={s} pct={pct} last={i === stages.length - 1} />
          ))}
        </div>
      </div>

      <div className="stat-grid">
        {stats.map(s => (
          <div className="card stat" key={s.label}>
            <div className="stat-top">
              <div className="stat-label">{s.label}</div>
              <div className={`stat-chip chip-${s.chip}`}><Icon name={s.icon} /></div>
            </div>
            <div className="stat-val">{s.val}</div>
            <div className="stat-foot">{s.foot}</div>
          </div>
        ))}
      </div>

      <div className="panel-grid">
        <div className="card">
          <div className="card-head">
            <div>
              <h2>Transações recentes</h2>
              <div className="sub">Últimos agendamentos registados</div>
            </div>
          </div>
          {recent.length ? (
            <div className="tbl-wrap">
              <table>
                <thead>
                  <tr><th>ID</th><th>Sala</th><th>Horário</th><th>Estado</th></tr>
                </thead>
                <tbody>
                  {recent.map(a => {
                    const j = janelaFor(a.slot_id, data.janelas)
                    return (
                      <tr key={a.id}>
                        <td><span className="id-pill">#{a.id}</span></td>
                        <td><span className="mono">sala {a.sala_id}</span></td>
                        <td>{j ? fmtDate(j.data_hora_inicio) : '—'}</td>
                        <td><StatusBadge status={a.status_agendamento} /></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState icon="inbox" title="Sem transações" text="Os agendamentos aparecem aqui assim que forem criados no app." />
          )}
        </div>

        <div className="card sec-body">
          <div className="sec-icon"><Icon name="shield" /></div>
          <h3>Privacidade nas mensagens</h3>
          <p>E‑mails e números de telefone são censurados automaticamente antes de chegarem ao destinatário, mantendo a negociação dentro da plataforma (RB‑15).</p>
          <div className="sec-stat">
            <b>{m.mensagens}</b><span>mensagens analisadas pelo filtro</span>
          </div>
        </div>
      </div>
    </>
  )
}

function Stage({ stage, pct, last }) {
  return (
    <>
      <div className="stage">
        <div className="stage-node">
          <div className="stage-val">{stage.val}</div>
          <div className="stage-name">{stage.name}</div>
          <div className="stage-meta">{pct(stage.val)}% do fluxo</div>
        </div>
        <div className="stage-bar"><i style={{ width: `${pct(stage.val)}%` }} /></div>
      </div>
      {!last && <div className="flow-arrow"><Icon name="arrow" strokeWidth={2.4} /></div>}
    </>
  )
}
