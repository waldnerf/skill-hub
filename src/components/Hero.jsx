import styles from './Hero.module.css'

export default function Hero({ query, onQueryChange }) {
  return (
    <section className={styles.hero}>
      <div className={styles.inner}>
        <p className={styles.eyebrow}>Internal marketplace</p>
        <h1 className={styles.title}>
          The right skill,<br />ready when you need it.
        </h1>
        <p className={styles.sub}>
          Browse company-approved Claude skills. Install any skill into your session
          in seconds — just ask Claude.
        </p>

        <div className={styles.searchWrap}>
          <svg className={styles.searchIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            className={styles.searchInput}
            type="text"
            placeholder="Search skills by name, category, or what you want to do…"
            value={query}
            onChange={e => onQueryChange(e.target.value)}
            autoFocus
          />
          {query && (
            <button className={styles.clearBtn} onClick={() => onQueryChange('')} aria-label="Clear search">
              ✕
            </button>
          )}
        </div>

        <div className={styles.hint}>
          Try: <button className={styles.hintChip} onClick={() => onQueryChange('sql')}>SQL</button>
          <button className={styles.hintChip} onClick={() => onQueryChange('presentation')}>presentation</button>
          <button className={styles.hintChip} onClick={() => onQueryChange('email')}>email</button>
          <button className={styles.hintChip} onClick={() => onQueryChange('data')}>data analysis</button>
        </div>
      </div>
    </section>
  )
}
