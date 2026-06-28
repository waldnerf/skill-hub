import { useState, useEffect } from 'react'
import { getCat } from '../utils/categories.js'
import styles from './PluginDetail.module.css'

export default function PluginDetail({ plugin, onClose }) {
  const [skillContent, setSkillContent] = useState(null)
  const [loadingSkill, setLoadingSkill] = useState(false)
  const [copiedPrompt, setCopiedPrompt] = useState(false)
  const [copiedSkill, setCopiedSkill] = useState(false)

  const cat = plugin ? getCat(plugin.category) : {}

  useEffect(() => {
    if (!plugin) return
    setSkillContent(null)
    setLoadingSkill(true)
    fetch(`/plugins/${plugin.id}/${plugin.skill.path}`)
      .then(r => r.text())
      .then(text => {
        // Strip YAML frontmatter
        const stripped = text.replace(/^---[\s\S]*?---\n/, '').trim()
        setSkillContent(stripped)
        setLoadingSkill(false)
      })
      .catch(() => {
        setSkillContent('Could not load skill content.')
        setLoadingSkill(false)
      })
  }, [plugin])

  useEffect(() => {
    if (!plugin) return
    const onKey = e => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [plugin, onClose])

  if (!plugin) return null

  const installPrompt = `Load the "${plugin.name}" plugin from the company skill marketplace.`

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

          {/* Meta */}
          <div className={styles.meta}>
            <span className={styles.category} style={{ color: cat.color, background: cat.bg }}>
              {plugin.category}
            </span>
            <span className={styles.version}>v{plugin.version}</span>
          </div>

          <h2 className={styles.name}>{plugin.name}</h2>
          <p className={styles.description}>{plugin.description}</p>

          <div className={styles.byline}>
            <span>By <strong>{plugin.author}</strong></span>
            <span className={styles.sep}>·</span>
            <span>{new Date(plugin.added).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}</span>
            <span className={styles.sep}>·</span>
            <span className={styles.pluginId}>{plugin.id}</span>
          </div>

          {/* Install */}
          <div className={styles.installBox}>
            <div className={styles.boxLabel}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/>
                <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>
              </svg>
              Install in Claude
            </div>
            <p className={styles.boxDesc}>
              Paste this into any Claude session. Claude fetches the skill from the marketplace and loads it immediately.
            </p>
            <div className={styles.promptRow}>
              <code className={styles.promptText}>{installPrompt}</code>
              <button
                className={`${styles.copyBtn} ${copiedPrompt ? styles.done : ''}`}
                onClick={() => copy(installPrompt, setCopiedPrompt)}
              >
                {copiedPrompt ? '✓ Copied' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Example prompt */}
          {plugin.example_prompt && (
            <div className={styles.exampleBox}>
              <div className={styles.boxLabel}>Example prompt</div>
              <div className={styles.promptRow}>
                <code className={styles.promptText}>{plugin.example_prompt}</code>
                <button
                  className={`${styles.copyBtn} ${copiedSkill ? styles.done : ''}`}
                  onClick={() => copy(plugin.example_prompt, setCopiedSkill)}
                >
                  {copiedSkill ? '✓' : 'Copy'}
                </button>
              </div>
            </div>
          )}

          {/* Tags */}
          <div className={styles.tags}>
            {plugin.tags.map(t => (
              <span key={t} className={styles.tag}>{t}</span>
            ))}
          </div>

          {/* Skill content */}
          <div className={styles.skillSection}>
            <div className={styles.skillLabel}>Skill content</div>
            {loadingSkill && <div className={styles.loading}>Loading…</div>}
            {!loadingSkill && skillContent && (
              <pre className={styles.skillContent}>{skillContent}</pre>
            )}
          </div>

        </div>
      </aside>
    </>
  )
}
