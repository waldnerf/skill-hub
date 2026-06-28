import { useState, useEffect } from 'react'
import styles from './SkillDetail.module.css'

const CATEGORY_CONFIG = {
  Data:           { color: '#1a3a8c', bg: '#e8edf9' },
  Productivity:   { color: '#1a6b3a', bg: '#e6f3eb' },
  Communication:  { color: '#7a2080', bg: '#f4e8f5' },
  Strategy:       { color: '#8a3a00', bg: '#f5ece6' },
}

function getCat(cat) {
  return CATEGORY_CONFIG[cat] || { color: '#44445a', bg: '#eeeeee' }
}

export default function SkillDetail({ skill, onClose }) {
  const [content, setContent] = useState(null)
  const [copied, setCopied] = useState(false)
  const [copiedDirect, setCopiedDirect] = useState(false)
  const cat = getCat(skill?.category)

  useEffect(() => {
    if (!skill) return
    setContent(null)
    fetch(skill.skill_url)
      .then(r => r.text())
      .then(text => {
        // Strip YAML frontmatter
        const stripped = text.replace(/^---[\s\S]*?---\n/, '')
        setContent(stripped)
      })
      .catch(() => setContent('Could not load skill content.'))
  }, [skill])

  useEffect(() => {
    if (!skill) return
    const handleKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [skill, onClose])

  if (!skill) return null

  const installPrompt = `Load the "${skill.name}" skill from the company Skill Hub.`
  const directPrompt = `${skill.example_prompt}`

  function copy(text, setter) {
    navigator.clipboard.writeText(text).then(() => {
      setter(true)
      setTimeout(() => setter(false), 2000)
    })
  }

  return (
    <>
      <div className={styles.overlay} onClick={onClose} />
      <aside className={styles.panel}>
        <div className={styles.panelInner}>

          {/* Close */}
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          {/* Meta */}
          <div className={styles.meta}>
            <div className={styles.categoryBadge} style={{ color: cat.color, background: cat.bg }}>
              {skill.category}
            </div>
            <span className={styles.version}>v{skill.version}</span>
          </div>

          <h2 className={styles.name}>{skill.name}</h2>
          <p className={styles.description}>{skill.description}</p>

          <div className={styles.byline}>
            <span>By <strong>{skill.author}</strong></span>
            <span className={styles.dot}>·</span>
            <span>Added {new Date(skill.added).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}</span>
          </div>

          {/* Install section */}
          <div className={styles.installBox}>
            <div className={styles.installLabel}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
                <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
              </svg>
              How to install
            </div>
            <p className={styles.installInstructions}>
              Paste this prompt into any Claude session. Claude will fetch and load the skill automatically.
            </p>
            <div className={styles.promptBox}>
              <code className={styles.promptText}>{installPrompt}</code>
              <button
                className={`${styles.copyPromptBtn} ${copied ? styles.done : ''}`}
                onClick={() => copy(installPrompt, setCopied)}
              >
                {copied ? '✓ Copied' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Example */}
          {skill.example_prompt && (
            <div className={styles.exampleBox}>
              <div className={styles.exampleLabel}>Example prompt</div>
              <div className={styles.promptBox}>
                <code className={styles.promptText}>{directPrompt}</code>
                <button
                  className={`${styles.copyPromptBtn} ${copiedDirect ? styles.done : ''}`}
                  onClick={() => copy(directPrompt, setCopiedDirect)}
                >
                  {copiedDirect ? '✓ Copied' : 'Copy'}
                </button>
              </div>
            </div>
          )}

          {/* Tags */}
          <div className={styles.tags}>
            {skill.tags.map(tag => (
              <span key={tag} className={styles.tag}>{tag}</span>
            ))}
          </div>

          {/* Skill content preview */}
          <div className={styles.contentSection}>
            <div className={styles.contentLabel}>Skill content</div>
            {content === null ? (
              <div className={styles.loading}>Loading…</div>
            ) : (
              <pre className={styles.content}>{content}</pre>
            )}
          </div>

        </div>
      </aside>
    </>
  )
}
