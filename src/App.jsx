import { useState, useEffect, useMemo } from 'react'
import Header from './components/Header'
import Hero from './components/Hero'
import SkillCard from './components/SkillCard'
import SkillDetail from './components/SkillDetail'
import styles from './App.module.css'

const CATEGORIES = ['All', 'Data', 'Productivity', 'Communication', 'Strategy']

export default function App() {
  const [skills, setSkills] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [selectedSkill, setSelectedSkill] = useState(null)

  useEffect(() => {
    fetch('/skills-registry.json')
      .then(r => { if (!r.ok) throw new Error('Could not load registry'); return r.json() })
      .then(data => { setSkills(data.filter(s => s.approved)); setLoading(false) })
      .catch(err => { setError(err.message); setLoading(false) })
  }, [])

  const filtered = useMemo(() => {
    return skills.filter(skill => {
      const matchCat = activeCategory === 'All' || skill.category === activeCategory
      if (!query.trim()) return matchCat
      const q = query.toLowerCase()
      const matchSearch =
        skill.name.toLowerCase().includes(q) ||
        skill.description.toLowerCase().includes(q) ||
        skill.tags.some(t => t.toLowerCase().includes(q)) ||
        skill.category.toLowerCase().includes(q) ||
        skill.author.toLowerCase().includes(q)
      return matchCat && matchSearch
    })
  }, [skills, query, activeCategory])

  const categoryCounts = useMemo(() => {
    const counts = { All: skills.length }
    skills.forEach(s => { counts[s.category] = (counts[s.category] || 0) + 1 })
    return counts
  }, [skills])

  return (
    <div className={styles.app}>
      <Header totalSkills={skills.length} />
      <Hero query={query} onQueryChange={setQuery} />
      <main className={styles.main}>
        <div className={styles.inner}>
          <div className={styles.filterBar}>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                className={`${styles.filterBtn} ${activeCategory === cat ? styles.active : ''}`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
                <span className={styles.filterCount}>{categoryCounts[cat] || 0}</span>
              </button>
            ))}
          </div>
          <div className={styles.resultsLine}>
            {query || activeCategory !== 'All' ? (
              <span>{filtered.length} skill{filtered.length !== 1 ? 's' : ''} found</span>
            ) : (
              <span>All approved skills</span>
            )}
            {(query || activeCategory !== 'All') && (
              <button className={styles.clearFilters} onClick={() => { setQuery(''); setActiveCategory('All') }}>
                Clear filters
              </button>
            )}
          </div>
          {loading && <div className={styles.state}><div className={styles.spinner} /><span>Loading skills…</span></div>}
          {error && <div className={styles.errorState}><strong>Could not load registry.</strong> {error}</div>}
          {!loading && !error && filtered.length === 0 && (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>◇</div>
              <h3>No skills match "{query}"</h3>
              <p>Try a different search, or <a href="https://github.com/your-org/skill-hub/issues/new?template=skill_submission.md" target="_blank" rel="noreferrer">submit a skill request</a>.</p>
            </div>
          )}
          {!loading && !error && filtered.length > 0 && (
            <div className={styles.grid}>
              {filtered.map(skill => (
                <SkillCard key={skill.id} skill={skill} onClick={setSelectedSkill} />
              ))}
            </div>
          )}
          {!query && activeCategory === 'All' && !loading && (
            <div className={styles.howItWorks}>
              <h2 className={styles.howTitle}>How it works</h2>
              <div className={styles.steps}>
                {[
                  ['Find a skill', 'Browse or search the marketplace to find the skill you need.'],
                  ['Copy the install prompt', 'Click "Copy prompt" on any skill card or in the detail view.'],
                  ['Paste into Claude', 'Claude fetches the skill and loads it into your session immediately.'],
                  ['Or just ask Claude', 'Say "Is there a skill for writing SQL?" — Claude checks the hub and installs it for you.'],
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
      <SkillDetail skill={selectedSkill} onClose={() => setSelectedSkill(null)} />
    </div>
  )
}
