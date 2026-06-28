import { useState, useMemo } from 'react'
import { useMarketplace } from './hooks/useMarketplace.js'
import { CATEGORIES } from './utils/categories.js'
import Header from './components/Header.jsx'
import Hero from './components/Hero.jsx'
import PluginCard from './components/PluginCard.jsx'
import PluginDetail from './components/PluginDetail.jsx'
import styles from './App.module.css'

export default function App() {
  const { plugins, tagIndex, loading, error } = useMarketplace()
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [activeTag, setActiveTag] = useState(null)
  const [selected, setSelected] = useState(null)

  const filtered = useMemo(() => {
    return plugins.filter(p => {
      if (activeCategory !== 'All' && p.category !== activeCategory) return false
      if (activeTag && !p.tags.includes(activeTag)) return false
      if (!query.trim()) return true
      const q = query.toLowerCase()
      // Search name, description, tags, author, id
      return (
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.tags.some(t => t.includes(q)) ||
        p.author.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q)
      )
    })
  }, [plugins, query, activeCategory, activeTag])

  const counts = useMemo(() => {
    const c = { All: plugins.length }
    plugins.forEach(p => { c[p.category] = (c[p.category] || 0) + 1 })
    return c
  }, [plugins])

  const popularTags = useMemo(() => {
    return Object.entries(tagIndex)
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 10)
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
      <Header total={plugins.length} />
      <Hero query={query} onQueryChange={q => { setQuery(q); setActiveTag(null) }} />

      <main className={styles.main}>
        <div className={styles.inner}>

          {/* Category + tag filters */}
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
            <span className={styles.resultsText}>
              {hasFilters ? `${filtered.length} plugin${filtered.length !== 1 ? 's' : ''} found` : 'All plugins'}
            </span>
            {hasFilters && (
              <button className={styles.clearBtn} onClick={clearFilters}>Clear filters</button>
            )}
          </div>

          {/* States */}
          {loading && (
            <div className={styles.state}>
              <div className={styles.spinner} />
              Loading marketplace…
            </div>
          )}

          {error && (
            <div className={styles.errorState}>
              <strong>Could not load marketplace.</strong> {error}
            </div>
          )}

          {!loading && !error && filtered.length === 0 && (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>◇</div>
              <h3>No plugins match {query ? `"${query}"` : 'these filters'}</h3>
              <p>
                Try a different search, or{' '}
                <a href="https://github.com/your-org/skill-hub/issues/new" target="_blank" rel="noreferrer">
                  submit a plugin request
                </a>.
              </p>
            </div>
          )}

          {!loading && !error && filtered.length > 0 && (
            <div className={styles.grid}>
              {filtered.map(p => (
                <PluginCard key={p.id} plugin={p} onSelect={setSelected} />
              ))}
            </div>
          )}

          {/* How it works */}
          {!hasFilters && !loading && (
            <div className={styles.how}>
              <h2 className={styles.howTitle}>How it works</h2>
              <div className={styles.steps}>
                {[
                  ['Find a plugin', 'Browse or search for the skill you need. Filter by category or tag.'],
                  ['Copy the install prompt', 'One click copies a prompt you paste directly into Claude.'],
                  ['Claude installs it', 'Claude fetches the plugin from the marketplace and loads it into your session immediately.'],
                  ['Or ask Claude directly', '"Is there a plugin for SQL?" — Claude checks the marketplace and installs it for you.'],
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

      <PluginDetail plugin={selected} onClose={() => setSelected(null)} />
    </div>
  )
}
