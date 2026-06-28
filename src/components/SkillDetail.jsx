import { useState, useEffect } from 'react'
import { getCat } from '../utils/categories.js'
import styles from './SkillDetail.module.css'

export default function SkillDetail({ skill, onClose }) {
  const [content, setContent]         = useState(null)
  const [loadingContent, setLoading]  = useState(false)
  const [copiedInstall, setCopiedInstall] = useState(false)
  const [copiedExample, setCopiedExample] = useState(false)

  const cat = skill ? getCat(skill.category) : {}
  const isFromBundle = skill && skill.pluginId !== skill.skillId

  useEffect(() => {
    if (!skill) return
    setContent(null)
    setLoading(true)
    fetch(`/plugins/${skill.pluginId}/${skill.skillPath}`)
      .then(r => { if (!r.ok) throw new Error('Not found'); return r.text() })
      .then(text => {
        // Strip YAML frontmatter block
        setContent(text.replace(/^---[\s\S]*?---\n/, '').trim())
        setLoading(false)
      })
      .catch(() => { setContent('Could not load skill content.'); setLoading(false) })
  }, [skill])

  useEffect(() => {
    if (!skill) return
    const onKey = e => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [skill, onClose])

  if (!skill) return null

  const installPrompt = `Load the "${skill.name}" skill from the company skill marketplace.`

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
        <div className={styles.inner}>

          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>

          {/* Category + version */}
          <div className={styles.meta}>
            <span className={styles.category} style={{ color: cat.color, background: cat.bg }}>
              {skill.category}
            </span>
            <span className={styles.version}>v{skill.version}</span>
          </div>

          {/* Name + description */}
          <h2 className={styles.name}>{skill.name}</h2>
          <p className={styles.description}>{skill.description}</p>

          {/* Byline */}
          <div className={styles.byline}>
            <span>By <strong>{skill.author}</strong></span>
            <span className={styles.sep}>·</span>
            <span>{new Date(skill.added).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}</span>
            {isFromBundle && (
              <>
                <span className={styles.sep}>·</span>
                <span className={styles.bundleLabel}>◆ {skill.pluginName}</span>
              </>
            )}
          </div>

          {/* Install box */}
          <div className={styles.installBox}>
            <div className={styles.boxLabel}>
              <InstallIcon /> Install in Claude
            </div>
            <p className={styles.boxDesc}>
              Paste this into any Claude session. Claude fetches the skill and loads it immediately.
            </p>
            <div className={styles.promptRow}>
              <code className={styles.promptText}>{installPrompt}</code>
              <button
                className={`${styles.copyBtn} ${copiedInstall ? styles.done : ''}`}
                onClick={() => copy(installPrompt, setCopiedInstall)}
              >
                {copiedInstall ? '✓ Copied' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Example prompt */}
          {skill.examplePrompt && (
            <div className={styles.exampleBox}>
              <div className={styles.boxLabel}>Example prompt</div>
              <div className={styles.promptRow}>
                <code className={styles.promptText}>{skill.examplePrompt}</code>
                <button
                  className={`${styles.copyBtn} ${copiedExample ? styles.done : ''}`}
                  onClick={() => copy(skill.examplePrompt, setCopiedExample)}
                >
                  {copiedExample ? '✓' : 'Copy'}
                </button>
              </div>
            </div>
          )}

          {/* Tags */}
          <div className={styles.tags}>
            {skill.tags.map(t => (
              <span key={t} className={styles.tag}>{t}</span>
            ))}
          </div>

          {/* Skill content preview */}
          <div className={styles.contentSection}>
            <div className={styles.contentLabel}>Skill instructions</div>
            {loadingContent && <div className={styles.loading}>Loading…</div>}
            {!loadingContent && content && (
              <pre className={styles.content}>{content}</pre>
            )}
          </div>

        </div>
      </aside>
    </>
  )
}

function InstallIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/>
      <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>
    </svg>
  )
}
