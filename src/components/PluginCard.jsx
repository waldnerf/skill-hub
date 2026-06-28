import { useState } from 'react'
import { getCat } from '../utils/categories.js'
import styles from './PluginCard.module.css'

export default function PluginCard({ plugin, onSelect }) {
  const [copied, setCopied] = useState(false)
  const cat = getCat(plugin.category)

  function copyPrompt(e) {
    e.stopPropagation()
    navigator.clipboard.writeText(`Load the "${plugin.name}" plugin from the company skill marketplace.`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <article className={styles.card} onClick={() => onSelect(plugin)}>
      <div className={styles.top}>
        <span className={styles.category} style={{ color: cat.color, background: cat.bg }}>
          <span className={styles.dot} style={{ background: cat.dot }} />
          {plugin.category}
        </span>
        <span className={styles.version}>v{plugin.version}</span>
      </div>

      <h3 className={styles.name}>{plugin.name}</h3>
      <p className={styles.description}>{plugin.description}</p>

      <div className={styles.tags}>
        {plugin.tags.map(t => (
          <span key={t} className={styles.tag}>{t}</span>
        ))}
      </div>

      <div className={styles.footer}>
        <span className={styles.author}>by {plugin.author}</span>
        <button
          className={`${styles.copy} ${copied ? styles.done : ''}`}
          onClick={copyPrompt}
          title="Copy install prompt"
        >
          {copied ? (
            <><CheckIcon /> Copied</>
          ) : (
            <><CopyIcon /> Copy prompt</>
          )}
        </button>
      </div>
    </article>
  )
}

function CopyIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  )
}
