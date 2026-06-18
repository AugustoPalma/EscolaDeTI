export function sellerSet(janelas) {
  return new Set((janelas || []).map(j => j.vendedor_id))
}

export function roleOf(id, janelas) {
  return sellerSet(janelas).has(id) ? 'Vendedor' : 'Comprador'
}

export function fmtDate(v) {
  if (!v) return '—'
  const d = new Date(v)
  if (isNaN(d)) return '—'
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

export function agoLabel(date) {
  if (!date) return '—'
  const s = Math.round((Date.now() - date) / 1000)
  if (s < 5) return 'agora mesmo'
  if (s < 60) return `há ${s}s`
  return `há ${Math.floor(s / 60)} min`
}

export function metrics(data) {
  const ag = data.agendamentos || []
  const jan = data.janelas || []
  const msg = data.mensagens || []
  return {
    concluidas: ag.filter(a => a.status_agendamento === 'CONCLUIDO').length,
    confirmados: ag.filter(a => a.status_agendamento === 'CONFIRMADO').length,
    livres: jan.filter(j => j.status_slot === 'LIVRE').length,
    ocupadas: jan.filter(j => j.status_slot === 'OCUPADO').length,
    mensagens: msg.length,
    salas: new Set(msg.map(m => m.sala_id)).size
  }
}

export function janelaFor(slotId, janelas) {
  return (janelas || []).find(j => j.id === slotId)
}

export function usersList(data) {
  if (Array.isArray(data.usuarios) && data.usuarios.length) {
    return data.usuarios.map(u => {
      const papel = u.tipo || u.papel || u.role || u.perfil || roleOf(u.id, data.janelas)
      const nome = u.nome || u.name || u.display_name || u.email || `Utilizador ${u.id}`
      return { id: u.id, nome, papel: String(papel), derived: false }
    })
  }
  const ids = new Set()
  ;(data.mensagens || []).forEach(m => ids.add(m.remetente_id))
  ;(data.janelas || []).forEach(j => ids.add(j.vendedor_id))
  return [...ids].filter(x => x != null).sort((a, b) => a - b).map(id => ({
    id,
    nome: `${roleOf(id, data.janelas)} ${id}`,
    papel: roleOf(id, data.janelas),
    derived: true
  }))
}
