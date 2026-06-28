import { useState } from 'react'
import { getCat } from '../utils/categories.js'
import styles from './SkillCard.module.css'

export default function SkillCard({ skill, onSelect }) {
  const [copied, setCopied] = useState(false)
  const cat = getCat(skill.category)
  const isFromBundle = skill.pluginId !== skill.skillId

  function copyPrompt(e) {
    e.stopPropagation()
    navigator.clipboard.writeText(
      `Load the "${skill.name}" skill from the company skill marketplace.`
    )
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <article className={styles.card} onClick={() => onSelect(skill)}>
      <div className={styles.top}>
        <span className={styles.category} style={{ color: cat.color, background: cat.bg }}>
          <span className={styles.dot} style={{ background: cat.dot }} />
          {skill.category}
        </span>
        <span className={styles.version}>v{skill.version}</span>
      </div>

      <h3 className={styles.name}>{skill.name}</h3>
      <p className={styles.description}>{skill.description}</p>

      <div className={styles.tags}>
        {skill.tags.map(t => (
          <span key={t} className={styles.tag}>{t}</span>
        ))}
      </div>

      <div className={styles.footer}>
        <div className={styles.meta}>
          <span className={styles.author}>by {skill.author}</span>
          {isFromBundle && (
            <span className={styles.bundle} title={`Part of ${skill.pluginName}`}>
              ◆ {skill.pluginName}
            </span>
          )}
        </div>
        <button
          className={`${styles.copy} ${copied ? styles.done : ''}`}
          onClick={copyPrompt}
          title="Copy install prompt"
        >
          {copied ? <><CheckIcon /> Copied</> : <><CopyIcon /> Copy prompt</>}
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
