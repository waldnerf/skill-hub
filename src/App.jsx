import { useState, useMemo } from 'react'
import { useMarketplace } from './hooks/useMarketplace.js'
import { CATEGORIES } from './utils/categories.js'
import Header from './components/Header.jsx'
import Hero from './components/Hero.jsx'
import SkillCard from './components/SkillCard.jsx'
import SkillDetail from './components/SkillDetail.jsx'
import styles from './App.module.css'

export default function App() {
  const { skills, tagIndex, loading, error } = useMarketplace()
  const [query, setQuery]               = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [activeTag, setActiveTag]       = useState(null)
  const [selected, setSelected]         = useState(null)

  const filtered = useMemo(() => {
    return skills.filter(s => {
      if (activeCategory !== 'All' && s.category !== activeCategory) return false
      if (activeTag && !s.tags.includes(activeTag)) return false
      if (!query.trim()) return true
      const q = query.toLowerCase()
      return (
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.tags.some(t => t.includes(q)) ||
        s.author.toLowerCase().includes(q) ||
        s.pluginName.toLowerCase().includes(q) ||
        s.skillId.toLowerCase().includes(q)
      )
    })
  }, [skills, query, activeCategory, activeTag])

  // Category counts based on skills, not plugins
  const counts = useMemo(() => {
    const c = { All: skills.length }
    skills.forEach(s => { c[s.category] = (c[s.category] || 0) + 1 })
    return c
  }, [skills])

  const popularTags = useMemo(() => {
    return Object.entries(tagIndex)
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 12)
      .map(([tag]) => tag)
  }, [tagIndex])

  function clearFilters() {
    setQuery('')
    setActiveCategory('All')
    setActiveTag(null)
  }

  const hasFilters = query || activeCategory !== 'All' || activeTag

  return (
    <div className={styles.app}>
      <Header totalSkills={skills.length} />
      <Hero query={query} onQueryChange={q => { setQuery(q); setActiveTag(null) }} />

      <main className={styles.main}>
        <div className={styles.inner}>

          {/* Filters */}
          <div className={styles.filtersRow}>
            <div className={styles.categoryFilters}>
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  className={`${styles.catBtn} ${activeCategory === cat ? styles.active : ''}`}
                  onClick={() => setActiveCategory(cat)}
                >
                  {cat}
                  <span className={styles.count}>{counts[cat] || 0}</span>
                </button>
              ))}
            </div>
            {popularTags.length > 0 && (
              <div className={styles.tagFilters}>
                {popularTags.map(tag => (
                  <button
                    key={tag}
                    className={`${styles.tagBtn} ${activeTag === tag ? styles.tagActive : ''}`}
                    onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Results line */}
          <div className={styles.resultsRow}>
            <span>
              {hasFilters
                ? `${filtered.length} skill${filtered.length !== 1 ? 's' : ''} found`
                : `${skills.length} skills`}
            </span>
            {hasFilters && (
              <button className={styles.clearBtn} onClick={clearFilters}>Clear filters</button>
            )}
          </div>

          {/* Loading */}
          {loading && (
            <div className={styles.state}>
              <div className={styles.spinner} />
              Loading marketplace…
            </div>
          )}

          {/* Error */}
          {error && (
            <div className={styles.errorState}>
              <strong>Could not load marketplace.</strong> {error}
            </div>
          )}

          {/* Empty */}
          {!loading && !error && filtered.length === 0 && (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>◇</div>
              <h3>No skills match {query ? `"${query}"` : 'these filters'}</h3>
              <p>
                Try a different search, or{' '}
                <a href="https://github.com/your-org/skill-hub/issues/new" target="_blank" rel="noreferrer">
                  submit a skill request
                </a>.
              </p>
            </div>
          )}

          {/* Grid */}
          {!loading && !error && filtered.length > 0 && (
            <div className={styles.grid}>
              {filtered.map(s => (
                <SkillCard key={`${s.pluginId}-${s.skillId}`} skill={s} onSelect={setSelected} />
              ))}
            </div>
          )}

          {/* How it works */}
          {!hasFilters && !loading && (
            <div className={styles.how}>
              <h2 className={styles.howTitle}>How it works</h2>
              <div className={styles.steps}>
                {[
                  ['Find a skill', 'Browse or search for what you need. Filter by category or tag.'],
                  ['Copy the install prompt', 'One click copies a prompt you paste directly into Claude.'],
                  ['Claude loads it', 'Claude fetches the skill from the marketplace and applies it to your session immediately.'],
                  ['Or ask Claude directly', '"Is there a skill for SQL?" — Claude checks the marketplace and loads it for you.'],
                ].map(([title, desc], i) => (
                  <div key={i} className={styles.step}>
                    <div className={styles.stepNum}>{i + 1}</div>
                    <div>
                      <div className={styles.stepTitle}>{title}</div>
                      <div className={styles.stepDesc}>{desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </main>

      <SkillDetail skill={selected} onClose={() => setSelected(null)} />
    </div>
  )
}
