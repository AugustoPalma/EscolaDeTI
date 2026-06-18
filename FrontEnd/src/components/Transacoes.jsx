import { useState } from 'react'
import Icon from '../lib/icons.jsx'
import { janelaFor, fmtDate } from '../lib/helpers.js'
import { StatusBadge, EmptyState } from './StatusStates.jsx'

export default function Transacoes({ data }) {
  const [filter, setFilter] = useState('todos')
  const all = data.agendamentos || []

  let rows = all
  if (filter === 'confirmados') rows = all.filter(a => a.status_agendamento === 'CONFIRMADO')
  if (filter === 'concluidos') rows = all.filter(a => a.status_agendamento === 'CONCLUIDO')

  const chips = [
    { id: 'todos', label: 'Todos', n: all.length },
    { id: 'confirmados', label: 'Confirmados', n: all.filter(a => a.status_agendamento === 'CONFIRMADO').length },
    { id: 'concluidos', label: 'Concluídos', n: all.filter(a => a.status_agendamento === 'CONCLUIDO').length }
  ]

  const copy = token => {
    if (navigator.clipboard) navigator.clipboard.writeText(token)
  }

  return (
    <div className="card">
      <div className="card-head">
        <div>
          <h2>Transações</h2>
          <div className="sub">{all.length} agendamentos</div>
        </div>
      </div>

      <div className="chips">
        {chips.map(c => (
          <button key={c.id} className={`chip ${filter === c.id ? 'is-active' : ''}`} onClick={() => setFilter(c.id)}>
            {c.label}<span className="c-count">{c.n}</span>
          </button>
        ))}
      </div>

      {rows.length ? (
        <div className="tbl-wrap">
          <table>
            <thead>
              <tr><th>ID</th><th>Sala</th><th>Horário da entrega</th><th>Estado</th><th>Token de validação</th></tr>
            </thead>
            <tbody>
              {rows.map(a => {
                const j = janelaFor(a.slot_id, data.janelas)
                return (
                  <tr key={a.id}>
                    <td><span className="id-pill">#{a.id}</span></td>
                    <td><span className="mono">sala {a.sala_id}</span></td>
                    <td>{j ? fmtDate(j.data_hora_inicio) : <span style={{ color: 'var(--slate-400)' }}>slot {a.slot_id}</span>}</td>
                    <td><StatusBadge status={a.status_agendamento} /></td>
                    <td>
                      {a.token_qr_code ? (
                        <span className="token" onClick={() => copy(a.token_qr_code)} title="Copiar token">
                          <Icon name="copy" /><span>{String(a.token_qr_code).slice(0, 10)}…</span>
                        </span>
                      ) : (
                        <span className="mono" style={{ color: 'var(--slate-400)' }}>—</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState icon="inbox" title="Nenhuma transação" text="Não há agendamentos neste filtro. Tente outro estado ou aguarde novas entregas." />
      )}
    </div>
  )
}
