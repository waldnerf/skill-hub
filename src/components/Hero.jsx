import styles from './Hero.module.css'

const SUGGESTIONS = ['sql', 'email', 'data analysis', 'presentation', 'meetings']

export default function Hero({ query, onQueryChange }) {
  return (
    <section className={styles.hero}>
      <div className={styles.inner}>
        <p className={styles.eyebrow}>Internal plugin marketplace</p>
        <h1 className={styles.title}>The right skill,<br />ready when you need it.</h1>
        <p className={styles.sub}>
          Browse company-approved Claude plugins. Install any skill into your session
          in seconds — just ask Claude or copy the install prompt.
        </p>
        <div className={styles.searchWrap}>
          <svg className={styles.icon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            className={styles.input}
            type="text"
            placeholder="Search by name, tag, or what you want to do…"
            value={query}
            onChange={e => onQueryChange(e.target.value)}
            autoFocus
          />
          {query && (
            <button className={styles.clear} onClick={() => onQueryChange('')}>✕</button>
          )}
        </div>
        <div className={styles.suggestions}>
          Try:
          {SUGGESTIONS.map(s => (
            <button key={s} className={styles.chip} onClick={() => onQueryChange(s)}>{s}</button>
          ))}
        </div>
      </div>
    </section>
  )
}
