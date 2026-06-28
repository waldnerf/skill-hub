#!/usr/bin/env node
/**
 * validate-registry.js
 * Runs in CI before every deploy. Fails the build if the registry is malformed.
 */

import { readFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const registryPath = join(__dirname, '../public/skills-registry.json')

const REQUIRED_FIELDS = ['id', 'name', 'description', 'category', 'tags', 'author', 'version', 'approved', 'added', 'skill_url']
const VALID_CATEGORIES = ['Data', 'Productivity', 'Communication', 'Strategy']

let errors = []
let warnings = []

// Parse JSON
let registry
try {
  registry = JSON.parse(readFileSync(registryPath, 'utf8'))
} catch (e) {
  console.error('❌ skills-registry.json is not valid JSON:', e.message)
  process.exit(1)
}

if (!Array.isArray(registry)) {
  console.error('❌ skills-registry.json must be a JSON array')
  process.exit(1)
}

// Check each entry
const ids = new Set()

registry.forEach((skill, i) => {
  const label = `Skill[${i}] "${skill.name || skill.id || i}"`

  // Required fields
  REQUIRED_FIELDS.forEach(field => {
    if (skill[field] === undefined || skill[field] === null || skill[field] === '') {
      errors.push(`${label}: missing required field "${field}"`)
    }
  })

  // Unique IDs
  if (skill.id) {
    if (ids.has(skill.id)) {
      errors.push(`${label}: duplicate id "${skill.id}"`)
    }
    ids.add(skill.id)
  }

  // Valid category
  if (skill.category && !VALID_CATEGORIES.includes(skill.category)) {
    errors.push(`${label}: unknown category "${skill.category}". Valid: ${VALID_CATEGORIES.join(', ')}`)
  }

  // Tags must be array
  if (skill.tags && !Array.isArray(skill.tags)) {
    errors.push(`${label}: "tags" must be an array`)
  }

  // Approved must be boolean
  if (skill.approved !== undefined && typeof skill.approved !== 'boolean') {
    errors.push(`${label}: "approved" must be true or false`)
  }

  // SKILL.md file must exist
  if (skill.skill_url) {
    const skillPath = join(__dirname, '../public', skill.skill_url)
    if (!existsSync(skillPath)) {
      errors.push(`${label}: skill_url "${skill.skill_url}" — file not found at ${skillPath}`)
    }
  }

  // Warn about missing example
  if (!skill.example_prompt) {
    warnings.push(`${label}: no example_prompt — consider adding one`)
  }
})

// Output
if (warnings.length > 0) {
  console.warn('\n⚠️  Warnings:')
  warnings.forEach(w => console.warn('  ' + w))
}

if (errors.length > 0) {
  console.error('\n❌ Validation failed:')
  errors.forEach(e => console.error('  ' + e))
  process.exit(1)
}

console.log(`\n✅ Registry valid — ${registry.length} skill(s) passed all checks.\n`)
