import { useState, useEffect } from 'react'
import Icon from '../lib/icons.jsx'
import { agoLabel } from '../lib/helpers.js'

export default function Topbar({ title, sub, lastUpdated, error, onRefresh, loading }) {
  const [, setTick] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setTick(n => n + 1), 5000)
    return () => clearInterval(t)
  }, [])

  return (
    <header className="topbar">
      <div>
        <h1>{title}</h1>
        <p>{sub}</p>
      </div>
      <div className="topbar-actions">
        <div className="live">
          <span className="live-dot" />
          <span>{error ? 'erro de ligação' : agoLabel(lastUpdated)}</span>
        </div>
        <button className={`btn ${loading ? 'is-busy' : ''}`} onClick={onRefresh}>
          <Icon name="refresh" />Atualizar
        </button>
      </div>
    </header>
  )
}
