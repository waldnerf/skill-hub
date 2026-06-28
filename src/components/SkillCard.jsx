import { useState } from 'react'
import styles from './SkillCard.module.css'

const CATEGORY_CONFIG = {
  Data:           { color: '#1a3a8c', bg: '#e8edf9', dot: '#3a5fbf' },
  Productivity:   { color: '#1a6b3a', bg: '#e6f3eb', dot: '#2e9e5a' },
  Communication:  { color: '#7a2080', bg: '#f4e8f5', dot: '#a030b0' },
  Strategy:       { color: '#8a3a00', bg: '#f5ece6', dot: '#c05010' },
}

function getCat(cat) {
  return CATEGORY_CONFIG[cat] || { color: '#44445a', bg: '#eeeeee', dot: '#7a7a96' }
}

export default function SkillCard({ skill, onClick }) {
  const [copied, setCopied] = useState(false)
  const cat = getCat(skill.category)

  const installSnippet = `Load the "${skill.name}" skill from the company Skill Hub.`

  function copySnippet(e) {
    e.stopPropagation()
    navigator.clipboard.writeText(installSnippet).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <article className={styles.card} onClick={() => onClick(skill)}>
      <div className={styles.top}>
        <div className={styles.categoryBadge} style={{ color: cat.color, background: cat.bg }}>
          <span className={styles.categoryDot} style={{ background: cat.dot }} />
          {skill.category}
        </div>
        <div className={styles.version}>v{skill.version}</div>
      </div>

      <h3 className={styles.name}>{skill.name}</h3>
      <p className={styles.description}>{skill.description}</p>

      <div className={styles.tags}>
        {skill.tags.slice(0, 4).map(tag => (
          <span key={tag} className={styles.tag}>{tag}</span>
        ))}
      </div>

      <div className={styles.footer}>
        <span className={styles.author}>by {skill.author}</span>
        <button
          className={`${styles.copyBtn} ${copied ? styles.copied : ''}`}
          onClick={copySnippet}
          title="Copy install prompt"
        >
          {copied ? (
            <>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Copied
            </>
          ) : (
            <>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              Copy prompt
            </>
          )}
        </button>
      </div>
    </article>
  )
}
