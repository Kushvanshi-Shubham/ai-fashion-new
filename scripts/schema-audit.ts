#!/usr/bin/env tsx
import { CATEGORY_DEFINITIONS } from '@/data/categoryDefinitions'
import { MASTER_ATTRIBUTES } from '@/data/masterAttributes'
import type { CategoryConfig } from '@/types/import-types'

/**
 * Compares category field keys against master attribute keys to find:
 *  - Missing master definitions
 *  - Duplicate underscore anomalies
 *  - Unused master attributes
 */

function normalize(k: string) { return k.replace(/_+/g,'_').trim() }

const masterSet = new Set(Object.keys(MASTER_ATTRIBUTES))
const normalizedMasterMap = new Map<string,string>()
for (const key of masterSet) {
  normalizedMasterMap.set(normalize(key), key)
}

const missing: Set<string> = new Set()
const anomalies: { original: string; normalized: string; category: string }[] = []

// Derive category fields from CATEGORY_DEFINITIONS shape (attributes object true/false)
interface AuditField { key: string }
interface AuditCategory { categoryName: string; fields: AuditField[] }

const derivedCategories: AuditCategory[] = CATEGORY_DEFINITIONS.map((c: CategoryConfig) => ({
  categoryName: c.category,
  fields: Object.keys(c.attributes || {}).map(k => ({ key: k }))
}))

for (const cat of derivedCategories) {
  for (const field of cat.fields) {
    const n = normalize(field.key)
    if (n !== field.key) {
      anomalies.push({ original: field.key, normalized: n, category: cat.categoryName })
    }
    if (!normalizedMasterMap.has(n)) {
      missing.add(field.key)
    }
  }
}

const unused: string[] = []
for (const mk of masterSet) {
  const norm = normalize(mk)
  const usedSomewhere = derivedCategories.some((c: AuditCategory) => c.fields.some((f: AuditField) => normalize(f.key) === norm))
  if (!usedSomewhere) unused.push(mk)
}

console.log('=== Schema Audit Report ===')
console.log('Missing (no master definition):', [...missing])
console.log('Anomalies (normalized key differs):', anomalies.slice(0,50))
console.log('Unused master attributes (sample first 50):', unused.slice(0,50))
console.log('Totals => categories:', derivedCategories.length, 'missing:', missing.size, 'anomalies:', anomalies.length, 'unused:', unused.length)
