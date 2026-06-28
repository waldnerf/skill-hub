import { useState, useEffect } from 'react'

/**
 * Loads marketplace.json, fetches each plugin.json,
 * then flattens everything into a list of skill objects.
 *
 * Single-skill plugin  → 1 skill item
 * Multi-skill plugin   → N skill items, one per skill
 *
 * Each skill item carries its parent plugin context:
 * {
 *   // skill identity
 *   skillId:         "stakeholder-update"
 *   name:            "Stakeholder Update Writer"
 *   description:     "Writes concise..."
 *   skillPath:       "skills/stakeholder-update/SKILL.md"
 *   examplePrompt:   "..."
 *
 *   // inherited from plugin
 *   pluginId:        "communicator-toolkit"
 *   pluginName:      "Communicator Toolkit"
 *   category:        "Communication"
 *   tags:            ["communication", "writing"]
 *   author:          "Franz Waldner"
 *   version:         "0.0.1"
 *   added:           "2026-06-28"
 * }
 */
export function useMarketplace() {
  const [skills, setSkills]     = useState([])
  const [tagIndex, setTagIndex] = useState({})
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)

  useEffect(() => {
    async function load() {
      try {
        const mRes = await fetch('/marketplace.json')
        if (!mRes.ok) throw new Error('Could not load marketplace.json')
        const marketplace = await mRes.json()

        setTagIndex(marketplace.tag_index || {})

        // Fetch all plugin.json files in parallel
        const pluginManifests = await Promise.all(
          marketplace.plugins.map(async id => {
            const res = await fetch(`/plugins/${id}/plugin.json`)
            if (!res.ok) throw new Error(`Could not load plugin.json for "${id}"`)
            return res.json()
          })
        )

        // Flatten plugins → skills
        const flatSkills = []
        for (const plugin of pluginManifests) {
          const base = {
            pluginId:   plugin.id,
            pluginName: plugin.name,
            category:   plugin.category,
            tags:       plugin.tags,
            author:     plugin.author,
            version:    plugin.version,
            added:      plugin.added,
          }

          if (plugin.skill) {
            // Single-skill plugin
            flatSkills.push({
              ...base,
              skillId:       plugin.id,
              name:          plugin.name,
              description:   plugin.description,
              skillPath:     plugin.skill.path,
              examplePrompt: plugin.example_prompt,
            })
          } else if (Array.isArray(plugin.skills)) {
            // Multi-skill plugin — one card per skill
            for (const skill of plugin.skills) {
              flatSkills.push({
                ...base,
                skillId:       skill.id,
                name:          skill.name,
                description:   skill.description,
                skillPath:     skill.path,
                examplePrompt: skill.example_prompt || plugin.example_prompt,
              })
            }
          }
        }

        setSkills(flatSkills)
        setLoading(false)
      } catch (err) {
        setError(err.message)
        setLoading(false)
      }
    }

    load()
  }, [])

  return { skills, tagIndex, loading, error }
}
