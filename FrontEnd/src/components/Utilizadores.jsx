import Icon from '../lib/icons.jsx'
import { usersList, sellerSet } from '../lib/helpers.js'
import { RoleBadge, EmptyState } from './StatusStates.jsx'

export default function Utilizadores({ data }) {
  const list = usersList(data)
  const derived = list.length > 0 && list[0].derived
  const sellers = sellerSet(data.janelas)

  return (
    <div className="card">
      <div className="card-head">
        <div>
          <h2>Utilizadores</h2>
          <div className="sub">{list.length} registos</div>
        </div>
      </div>

      {list.length ? (
        <>
          {derived && (
            <div className="note" style={{ margin: '16px 22px 0' }}>
              <Icon name="shield" />
              <span>Sem tabela <span className="mono">usuarios</span> exposta — esta lista é derivada das interações reais (mensagens e horários).</span>
            </div>
          )}
          <div className="tbl-wrap">
            <table>
              <thead>
                <tr><th>ID</th><th>Identificação</th><th>Papel</th><th>Atividade</th></tr>
              </thead>
              <tbody>
                {list.map(u => {
                  const msgs = (data.mensagens || []).filter(m => m.remetente_id === u.id).length
                  const jan = (data.janelas || []).filter(j => j.vendedor_id === u.id).length
                  const isSeller = String(u.papel).toUpperCase().includes('VEND') || sellers.has(u.id)
                  const act = isSeller ? `${jan} horário(s) publicado(s)` : `${msgs} mensagem(ns) enviada(s)`
                  return (
                    <tr key={u.id}>
                      <td><span className="id-pill">#{u.id}</span></td>
                      <td style={{ fontWeight: 600, color: 'var(--ink)' }}>{u.nome}</td>
                      <td><RoleBadge papel={u.papel} /></td>
                      <td style={{ color: 'var(--slate-500)' }}>{act}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <EmptyState icon="inbox" title="Sem utilizadores" text="Compradores e vendedores aparecem aqui assim que interagirem com a plataforma." />
      )}
    </div>
  )
}
