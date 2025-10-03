import { DiscoveredAttribute, DiscoveryStats } from '@/types/discovery'

interface DiscoveryData {
  discoveries: Map<string, DiscoveredAttribute>
  categoryDiscoveries: Map<string, Set<string>>
  sessionStats: {
    totalExtractions: number
    totalDiscoveries: number
    uniqueDiscoveries: number
  }
}

class DiscoveryManager {
  private static instance: DiscoveryManager
  private data: DiscoveryData = {
    discoveries: new Map(),
    categoryDiscoveries: new Map(),
    sessionStats: {
      totalExtractions: 0,
      totalDiscoveries: 0,
      uniqueDiscoveries: 0
    }
  }

  static getInstance(): DiscoveryManager {
    if (!DiscoveryManager.instance) {
      DiscoveryManager.instance = new DiscoveryManager()
    }
    return DiscoveryManager.instance
  }

  addDiscoveries(newDiscoveries: DiscoveredAttribute[], categoryId?: string): void {
    this.data.sessionStats.totalExtractions++
    this.data.sessionStats.totalDiscoveries += newDiscoveries.length

    newDiscoveries.forEach(discovery => {
      const existing = this.data.discoveries.get(discovery.key)
      
      if (existing) {
        // Update existing discovery
        existing.frequency += 1
        existing.confidence = Math.round(
          (existing.confidence * (existing.frequency - 1) + discovery.confidence) / existing.frequency
        )
        
        // Merge possible values for select types
        if (existing.suggestedType === 'select' && discovery.normalizedValue) {
          if (!existing.possibleValues) existing.possibleValues = []
          if (!existing.possibleValues.includes(discovery.normalizedValue)) {
            existing.possibleValues.push(discovery.normalizedValue)
            existing.possibleValues.sort()
          }
        }
        
        // Update with latest reasoning and timestamps
        existing.reasoning = discovery.reasoning
        existing.updatedAt = new Date().toISOString()
        existing.isPromotable = this.isPromotable(existing)
      } else {
        // Add new discovery
        const timestamp = new Date().toISOString()
        const newDiscovery: DiscoveredAttribute = { 
          ...discovery, 
          frequency: 1,
          isPromotable: false,
          ...(categoryId && { categoryId }),
          createdAt: timestamp,
          updatedAt: timestamp
        }
        
        this.data.discoveries.set(discovery.key, newDiscovery)
        this.data.sessionStats.uniqueDiscoveries++
      }
      
      // Track by category
      if (categoryId) {
        if (!this.data.categoryDiscoveries.has(categoryId)) {
          this.data.categoryDiscoveries.set(categoryId, new Set())
        }
        this.data.categoryDiscoveries.get(categoryId)!.add(discovery.key)
      }
    })

    console.log(`[Discovery] Processed ${newDiscoveries.length} discoveries for category ${categoryId}`)
  }

  getDiscoveriesForCategory(categoryId?: string): DiscoveredAttribute[] {
    if (!categoryId) {
      return Array.from(this.data.discoveries.values())
        .sort((a, b) => this.getDiscoveryScore(b) - this.getDiscoveryScore(a))
    }
    
    const categoryKeys = this.data.categoryDiscoveries.get(categoryId)
    if (!categoryKeys) return []
    
    return Array.from(categoryKeys)
      .map(key => this.data.discoveries.get(key)!)
      .filter(Boolean)
      .sort((a, b) => this.getDiscoveryScore(b) - this.getDiscoveryScore(a))
  }

  getPromotableDiscoveries(minFrequency = 2, minConfidence = 75): DiscoveredAttribute[] {
    return Array.from(this.data.discoveries.values())
      .filter(d => d.frequency >= minFrequency && d.confidence >= minConfidence)
      .sort((a, b) => this.getDiscoveryScore(b) - this.getDiscoveryScore(a))
  }

  getDiscoveryStats(categoryId?: string): DiscoveryStats {
    const discoveries = this.getDiscoveriesForCategory(categoryId)
    
    return {
      totalFound: discoveries.length,
      highConfidence: discoveries.filter(d => d.confidence >= 80).length,
      schemaPromotable: discoveries.filter(d => d.isPromotable).length,
      uniqueKeys: new Set(discoveries.map(d => d.key)).size
    }
  }

  promoteToSchema(discoveryKey: string) {
    const discovery = this.data.discoveries.get(discoveryKey)
    if (!discovery || !discovery.isPromotable) return null
    
    const schemaItem = {
      key: discovery.key,
      label: discovery.label,
      type: discovery.suggestedType,
      required: false,
      options: discovery.suggestedType === 'select' ? discovery.possibleValues : undefined,
      description: `Auto-discovered: ${discovery.reasoning.substring(0, 100)}...`
    }

    console.log(`[Discovery] Promoted ${discovery.key} to schema`)
    return schemaItem
  }

  private getDiscoveryScore(discovery: DiscoveredAttribute): number {
    // Score = frequency * confidence * type_weight
    const typeWeight = discovery.suggestedType === 'select' ? 1.2 : 1.0
    return discovery.frequency * discovery.confidence * typeWeight
  }

  private isPromotable(discovery: DiscoveredAttribute): boolean {
    return discovery.frequency >= 2 && 
           discovery.confidence >= 75 && 
           discovery.normalizedValue.length > 0
  }

  getSessionStats() {
    return { ...this.data.sessionStats }
  }

  clear(): void {
    this.data.discoveries.clear()
    this.data.categoryDiscoveries.clear()
    this.data.sessionStats = { totalExtractions: 0, totalDiscoveries: 0, uniqueDiscoveries: 0 }
    console.log('[Discovery] Manager cleared')
  }
}

// Singleton instance
export const discoveryManager = DiscoveryManager.getInstance()
