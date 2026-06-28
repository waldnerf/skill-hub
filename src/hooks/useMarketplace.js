import { useState, useEffect } from 'react'

export function useMarketplace() {
  const [plugins, setPlugins] = useState([])
  const [tagIndex, setTagIndex] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function load() {
      try {
        // Step 1: fetch the generated marketplace index
        const marketplaceRes = await fetch('/marketplace.json')
        if (!marketplaceRes.ok) throw new Error('Could not load marketplace.json')
        const marketplace = await marketplaceRes.json()

        setTagIndex(marketplace.tag_index || {})

        // Step 2: lazy-load each plugin.json in parallel
        const pluginManifests = await Promise.all(
          marketplace.plugins.map(async id => {
            const res = await fetch(`/plugins/${id}/plugin.json`)
            if (!res.ok) throw new Error(`Could not load plugin.json for "${id}"`)
            return res.json()
          })
        )

        setPlugins(pluginManifests)
        setLoading(false)
      } catch (err) {
        setError(err.message)
        setLoading(false)
      }
    }

    load()
  }, [])

  return { plugins, tagIndex, loading, error }
}
