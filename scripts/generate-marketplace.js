#!/usr/bin/env node
/**
 * generate-marketplace.js
 *
 * Scans all plugin folders, validates each one, and generates marketplace.json.
 * Supports both single-skill plugins (skill: { path }) and
 * multi-skill plugins (skills: [{ id, name, path, ... }]).
 *
 * Runs in CI before every deploy. Fails the build on any error.
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
const REQUIRED_FIELDS = [
  'id', 'name', 'version', 'description',
  'category', 'tags', 'author', 'approved',
  'added', 'example_prompt'
]

let errors = []
let warnings = []

function fail(msg) { errors.push(msg) }
function warn(msg) { warnings.push(msg) }

function parseJson(path, label) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch (e) {
    fail(`${label}: invalid JSON — ${e.message}`)
    return null
  }
}

// ── Validate a single SKILL.md file ───────────────────────────────────────

function validateSkillFile(skillPath, label) {
  if (!existsSync(skillPath)) {
    fail(`${label}: file not found at ${skillPath}`)
    return
  }

  const content = readFileSync(skillPath, 'utf8')

  if (!content.startsWith('---')) {
    fail(`${label}: missing YAML frontmatter (must start with ---)`)
    return
  }

  const closingIndex = content.indexOf('---', 3)
  if (closingIndex === -1) {
    fail(`${label}: malformed frontmatter (no closing ---)`)
    return
  }

  const frontmatter = content.slice(3, closingIndex)

  // Anthropic standard: name + description required
  if (!frontmatter.includes('name:')) {
    fail(`${label}: frontmatter missing required field "name"`)
  }
  if (!frontmatter.includes('description:')) {
    fail(`${label}: frontmatter missing required field "description"`)
  }

  // contributor field
  if (!frontmatter.includes('contributor:')) {
    warn(`${label}: frontmatter missing "contributor" field`)
  }

  // version field
  if (!frontmatter.includes('version:')) {
    warn(`${label}: frontmatter missing "version" field`)
  }

  // Testing status notice
  if (!frontmatter.includes('status:') && !content.includes('Testing skill') && !content.includes('TESTING')) {
    warn(`${label}: no testing status indicator found — add status: field or testing notice`)
  }
}

// ── Load tag taxonomy ──────────────────────────────────────────────────────

const taxonomy = parseJson(TAXONOMY_PATH, 'tag-taxonomy.json')
const ALLOWED_TAGS = new Set(taxonomy?.tags || [])

// ── Scan plugin folders ────────────────────────────────────────────────────

const pluginFolders = readdirSync(PLUGINS_DIR).filter(name =>
  statSync(join(PLUGINS_DIR, name)).isDirectory()
)

if (pluginFolders.length === 0) {
  fail('No plugin folders found in public/plugins/')
}

const approvedPlugins = []
const allPluginIds = new Set()

for (const folder of pluginFolders) {
  const pluginDir = join(PLUGINS_DIR, folder)
  const manifestPath = join(pluginDir, 'plugin.json')
  const label = `Plugin "${folder}"`

  // ── plugin.json exists ────────────────────────────────────────────────

  if (!existsSync(manifestPath)) {
    fail(`${label}: missing plugin.json`)
    continue
  }

  const manifest = parseJson(manifestPath, `${label}/plugin.json`)
  if (!manifest) continue

  // ── Required fields ───────────────────────────────────────────────────

  for (const field of REQUIRED_FIELDS) {
    if (manifest[field] === undefined || manifest[field] === null || manifest[field] === '') {
      fail(`${label}: missing required field "${field}"`)
    }
  }

  // Must have either skill (single) or skills (multi) — not both, not neither
  const hasSingle = !!manifest.skill
  const hasMulti = Array.isArray(manifest.skills) && manifest.skills.length > 0

  if (!hasSingle && !hasMulti) {
    fail(`${label}: must have either "skill" (single) or "skills" (multi-skill array)`)
  }
  if (hasSingle && hasMulti) {
    fail(`${label}: cannot have both "skill" and "skills" — choose one`)
  }

  // ── ID matches folder ─────────────────────────────────────────────────

  if (manifest.id && manifest.id !== folder) {
    fail(`${label}: "id" (${manifest.id}) does not match folder name (${folder})`)
  }

  // ── Unique ID ─────────────────────────────────────────────────────────

  if (manifest.id) {
    if (allPluginIds.has(manifest.id)) fail(`${label}: duplicate id "${manifest.id}"`)
    allPluginIds.add(manifest.id)
  }

  // ── Category ─────────────────────────────────────────────────────────

  if (manifest.category && !VALID_CATEGORIES.includes(manifest.category)) {
    fail(`${label}: invalid category "${manifest.category}". Valid: ${VALID_CATEGORIES.join(', ')}`)
  }

  // ── Approved ─────────────────────────────────────────────────────────

  if (typeof manifest.approved !== 'boolean') {
    fail(`${label}: "approved" must be true or false`)
  }

  // ── Version ───────────────────────────────────────────────────────────

  if (manifest.version && !/^\d+\.\d+(\.\d+)?$/.test(manifest.version)) {
    warn(`${label}: version "${manifest.version}" should follow semver (e.g. 0.0.1)`)
  }

  // ── Added date ────────────────────────────────────────────────────────

  if (manifest.added && !/^\d{4}-\d{2}-\d{2}$/.test(manifest.added)) {
    fail(`${label}: "added" must be YYYY-MM-DD format`)
  }

  // ── Tags ─────────────────────────────────────────────────────────────

  if (Array.isArray(manifest.tags)) {
    if (manifest.tags.length > MAX_TAGS) {
      fail(`${label}: too many tags (${manifest.tags.length}). Maximum is ${MAX_TAGS}`)
    }
    const tagSet = new Set()
    for (const tag of manifest.tags) {
      if (tag !== tag.toLowerCase()) fail(`${label}: tag "${tag}" must be lowercase`)
      if (tag.includes(' ')) fail(`${label}: tag "${tag}" must use hyphens not spaces`)
      if (!ALLOWED_TAGS.has(tag)) fail(`${label}: unknown tag "${tag}" — add to tag-taxonomy.json`)
      if (tagSet.has(tag)) fail(`${label}: duplicate tag "${tag}"`)
      tagSet.add(tag)
    }
  }

  // ── Skill file(s) validation ──────────────────────────────────────────

  if (hasSingle) {
    if (!manifest.skill.path) {
      fail(`${label}: skill.path is required`)
    } else {
      validateSkillFile(join(pluginDir, manifest.skill.path), `${label}/SKILL.md`)
    }
  }

  if (hasMulti) {
    const skillIds = new Set()
    manifest.skills.forEach((skill, i) => {
      const slabel = `${label}/skills[${i}]`
      if (!skill.id) fail(`${slabel}: missing "id"`)
      if (!skill.name) fail(`${slabel}: missing "name"`)
      if (!skill.description) fail(`${slabel}: missing "description"`)
      if (!skill.path) {
        fail(`${slabel}: missing "path"`)
      } else {
        validateSkillFile(join(pluginDir, skill.path), `${slabel} (${skill.id || i})`)
      }
      if (skill.id) {
        if (skillIds.has(skill.id)) fail(`${label}: duplicate skill id "${skill.id}"`)
        skillIds.add(skill.id)
      }
    })
  }

  // ── Skip unapproved ───────────────────────────────────────────────────

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

const sortedTagIndex = Object.fromEntries(
  Object.entries(tagIndex).sort(([a], [b]) => a.localeCompare(b))
)

// ── Output ─────────────────────────────────────────────────────────────────

if (warnings.length > 0) {
  console.warn('\n⚠️  Warnings:')
  warnings.forEach(w => console.warn('   ' + w))
}

if (errors.length > 0) {
  console.error('\n❌ Validation failed — marketplace.json NOT generated:\n')
  errors.forEach(e => console.error('   ' + e))
  process.exit(1)
}

const marketplace = {
  generated: new Date().toISOString(),
  version: '1',
  total: approvedPlugins.length,
  plugins: approvedPlugins.map(p => p.id),
  tag_index: sortedTagIndex,
}

writeFileSync(MARKETPLACE_PATH, JSON.stringify(marketplace, null, 2))

const totalSkills = approvedPlugins.reduce((sum, p) => {
  if (p.skill) return sum + 1
  if (p.skills) return sum + p.skills.length
  return sum
}, 0)

console.log(`\n✅ marketplace.json generated`)
console.log(`   Plugins : ${approvedPlugins.length} (${totalSkills} skills total)`)
console.log(`   Tags    : ${Object.keys(sortedTagIndex).length} indexed`)
console.log(`   List    : ${approvedPlugins.map(p => p.id).join(', ')}\n`)
