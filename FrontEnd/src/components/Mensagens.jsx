import { useState } from 'react'
import Icon from '../lib/icons.jsx'
import { roleOf } from '../lib/helpers.js'
import { EmptyState } from './StatusStates.jsx'

export default function Mensagens({ data }) {
  const [room, setRoom] = useState('all')
  const msgs = data.mensagens || []
  const rooms = [...new Set(msgs.map(m => m.sala_id))].sort((a, b) => a - b)

  const filtered = room === 'all' ? msgs : msgs.filter(m => m.sala_id === Number(room))
  const ordered = [...filtered].sort((a, b) => a.id - b.id)

  return (
    <div className="card">
      <div className="card-head">
        <div>
          <h2>Mensagens</h2>
          <div className="sub">{msgs.length} mensagens</div>
        </div>
      </div>

      <div className="chips">
        <button className={`chip ${room === 'all' ? 'is-active' : ''}`} onClick={() => setRoom('all')}>
          Todas<span className="c-count">{msgs.length}</span>
        </button>
        {rooms.map(r => (
          <button key={r} className={`chip ${String(room) === String(r) ? 'is-active' : ''}`} onClick={() => setRoom(String(r))}>
            Sala {r}<span className="c-count">{msgs.filter(m => m.sala_id === r).length}</span>
          </button>
        ))}
      </div>

      {ordered.length ? (
        <>
          <div className="note">
            <Icon name="shield" />
            <span>Os dados sensíveis (e‑mails e telefones) já chegam censurados pelo filtro de privacidade aplicado no envio.</span>
          </div>
          <div className="msg-list">
            {ordered.map(m => {
              const role = roleOf(m.remetente_id, data.janelas)
              const buyer = role === 'Comprador'
              return (
                <div className="msg" key={m.id}>
                  <div className={`msg-av ${buyer ? 'av-buyer' : 'av-seller'}`}>{buyer ? 'C' : 'V'}</div>
                  <div className="msg-main">
                    <div className="msg-meta">
                      <span className="msg-who">{role} {m.remetente_id}</span>
                      <span className="msg-room">sala {m.sala_id} · #{m.id}</span>
                    </div>
                    <div className="msg-text">{m.texto}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      ) : (
        <EmptyState icon="chat" title="Sem mensagens" text="Selecione outra sala ou aguarde novas mensagens nesta negociação." />
      )}
    </div>
  )
}
