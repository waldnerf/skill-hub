#!/usr/bin/env node
/**
 * generate-marketplace.js
 *
 * Scans all plugin folders, validates each one, and generates marketplace.json.
 * Runs in CI before every deploy. Fails the build on any error.
 *
 * Usage: node scripts/generate-marketplace.js
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PUBLIC = join(__dirname, '../public')
const PLUGINS_DIR = join(PUBLIC, 'plugins')
const MARKETPLACE_PATH = join(PUBLIC, 'marketplace.json')
const TAXONOMY_PATH = join(PUBLIC, 'tag-taxonomy.json')

const VALID_CATEGORIES = ['Data', 'Productivity', 'Communication', 'Strategy']
const MAX_TAGS = 5
const REQUIRED_PLUGIN_FIELDS = [
  'id', 'name', 'version', 'description',
  'category', 'tags', 'author', 'approved',
  'added', 'example_prompt', 'skill'
]

let errors = []
let warnings = []

// ── Helpers ────────────────────────────────────────────────────────────────

function fail(msg) {
  errors.push(msg)
}

function warn(msg) {
  warnings.push(msg)
}

function parseJson(path, label) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch (e) {
    fail(`${label}: invalid JSON — ${e.message}`)
    return null
  }
}

// ── Load tag taxonomy ──────────────────────────────────────────────────────

const taxonomy = parseJson(TAXONOMY_PATH, 'tag-taxonomy.json')
const ALLOWED_TAGS = new Set(taxonomy?.tags || [])

// ── Scan plugin folders ────────────────────────────────────────────────────

const pluginFolders = readdirSync(PLUGINS_DIR).filter(name => {
  const fullPath = join(PLUGINS_DIR, name)
  return statSync(fullPath).isDirectory()
})

if (pluginFolders.length === 0) {
  fail('No plugin folders found in public/plugins/')
}

const approvedPlugins = []
const allPluginIds = new Set()

for (const folder of pluginFolders) {
  const pluginDir = join(PLUGINS_DIR, folder)
  const manifestPath = join(pluginDir, 'plugin.json')
  const label = `Plugin "${folder}"`

  // ── Layer 1: plugin.json exists and parses ────────────────────────────

  if (!existsSync(manifestPath)) {
    fail(`${label}: missing plugin.json`)
    continue
  }

  const manifest = parseJson(manifestPath, `${label}/plugin.json`)
  if (!manifest) continue

  // ── Layer 2: Schema validation ────────────────────────────────────────

  // Required fields
  for (const field of REQUIRED_PLUGIN_FIELDS) {
    if (manifest[field] === undefined || manifest[field] === null || manifest[field] === '') {
      fail(`${label}: missing required field "${field}"`)
    }
  }

  // ID matches folder name
  if (manifest.id && manifest.id !== folder) {
    fail(`${label}: plugin.json "id" (${manifest.id}) does not match folder name (${folder})`)
  }

  // Unique ID
  if (manifest.id) {
    if (allPluginIds.has(manifest.id)) {
      fail(`${label}: duplicate id "${manifest.id}"`)
    }
    allPluginIds.add(manifest.id)
  }

  // Valid category
  if (manifest.category && !VALID_CATEGORIES.includes(manifest.category)) {
    fail(`${label}: invalid category "${manifest.category}". Valid: ${VALID_CATEGORIES.join(', ')}`)
  }

  // approved must be boolean
  if (typeof manifest.approved !== 'boolean') {
    fail(`${label}: "approved" must be true or false`)
  }

  // tags must be array
  if (!Array.isArray(manifest.tags)) {
    fail(`${label}: "tags" must be an array`)
  } else {
    // Max tags
    if (manifest.tags.length > MAX_TAGS) {
      fail(`${label}: too many tags (${manifest.tags.length}). Maximum is ${MAX_TAGS}`)
    }

    // Lowercase check
    for (const tag of manifest.tags) {
      if (tag !== tag.toLowerCase()) {
        fail(`${label}: tag "${tag}" must be lowercase`)
      }
      if (tag.includes(' ')) {
        fail(`${label}: tag "${tag}" must use hyphens instead of spaces`)
      }
    }

    // Controlled vocabulary check
    for (const tag of manifest.tags) {
      if (!ALLOWED_TAGS.has(tag)) {
        fail(`${label}: unknown tag "${tag}". Add it to tag-taxonomy.json or use an existing tag`)
      }
    }

    // No duplicate tags within plugin
    const tagSet = new Set(manifest.tags)
    if (tagSet.size !== manifest.tags.length) {
      fail(`${label}: duplicate tags found`)
    }
  }

  // skill object
  if (manifest.skill) {
    if (!manifest.skill.path) {
      fail(`${label}: skill.path is required`)
    } else {
      const skillPath = join(pluginDir, manifest.skill.path)
      if (!existsSync(skillPath)) {
        fail(`${label}: skill.path "${manifest.skill.path}" — file not found`)
      } else {
        // ── Layer 3: SKILL.md frontmatter validation ──────────────────
        const skillContent = readFileSync(skillPath, 'utf8')
        if (!skillContent.startsWith('---')) {
          fail(`${label}/SKILL.md: missing YAML frontmatter (must start with ---)`)
        } else {
          const frontmatterEnd = skillContent.indexOf('---', 3)
          if (frontmatterEnd === -1) {
            fail(`${label}/SKILL.md: malformed frontmatter (no closing ---)`)
          } else {
            const frontmatter = skillContent.slice(3, frontmatterEnd)
            if (!frontmatter.includes('id:')) warn(`${label}/SKILL.md: frontmatter missing "id" field`)
            if (!frontmatter.includes('version:')) warn(`${label}/SKILL.md: frontmatter missing "version" field`)
          }
        }
      }
    }
  }

  // version format (semver-ish)
  if (manifest.version && !/^\d+\.\d+(\.\d+)?$/.test(manifest.version)) {
    warn(`${label}: version "${manifest.version}" should follow semver format (e.g. 1.0 or 1.0.0)`)
  }

  // added date format
  if (manifest.added && !/^\d{4}-\d{2}-\d{2}$/.test(manifest.added)) {
    fail(`${label}: "added" must be in YYYY-MM-DD format`)
  }

  // Skip unapproved plugins — they don't appear in marketplace.json
  if (!manifest.approved) {
    warn(`${label}: approved=false — excluded from marketplace`)
    continue
  }

  approvedPlugins.push(manifest)
}

// ── Build tag index ────────────────────────────────────────────────────────

const tagIndex = {}
for (const plugin of approvedPlugins) {
  for (const tag of (plugin.tags || [])) {
    if (!tagIndex[tag]) tagIndex[tag] = []
    tagIndex[tag].push(plugin.id)
  }
}

// Sort tag index keys alphabetically for deterministic output
const sortedTagIndex = Object.fromEntries(
  Object.entries(tagIndex).sort(([a], [b]) => a.localeCompare(b))
)

// ── Output warnings ────────────────────────────────────────────────────────

if (warnings.length > 0) {
  console.warn('\n⚠️  Warnings:')
  warnings.forEach(w => console.warn('   ' + w))
}

// ── Fail on errors ─────────────────────────────────────────────────────────

if (errors.length > 0) {
  console.error('\n❌ Validation failed — marketplace.json NOT generated:\n')
  errors.forEach(e => console.error('   ' + e))
  process.exit(1)
}

// ── Write marketplace.json ─────────────────────────────────────────────────

const marketplace = {
  generated: new Date().toISOString(),
  version: '1',
  total: approvedPlugins.length,
  plugins: approvedPlugins.map(p => p.id),
  tag_index: sortedTagIndex,
}

writeFileSync(MARKETPLACE_PATH, JSON.stringify(marketplace, null, 2))

console.log(`\n✅ marketplace.json generated — ${approvedPlugins.length} approved plugin(s)`)
console.log(`   Tags indexed: ${Object.keys(sortedTagIndex).length}`)
console.log(`   Plugins: ${approvedPlugins.map(p => p.id).join(', ')}\n`)
