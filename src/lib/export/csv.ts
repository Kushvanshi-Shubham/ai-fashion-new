import { ExtractionResult } from '@/types/fashion'

export interface CsvExportOptions {
  includeFailed?: boolean
  delimiter?: string
}

export function buildCsv(results: ExtractionResult[], opts: CsvExportOptions = {}): string {
  const { includeFailed = false, delimiter = ',' } = opts
  const completed = results.filter(r => r.status === 'completed')
  const failed = includeFailed ? results.filter(r => r.status === 'failed') : []

  const all = [...completed, ...failed]
  if (all.length === 0) return ''

  // Collect columns dynamically from attributes
  const attributeKeys = new Set<string>()
  completed.forEach(r => Object.keys(r.attributes || {}).forEach(k => attributeKeys.add(k)))

  const baseHeaders = ['id','fileName','status','confidence','processingTime','tokensUsed','fromCache']
  const headers = [...baseHeaders, ...Array.from(attributeKeys)]

  const escape = (v: unknown) => {
    if (v == null) return ''
    const s = String(v)
    return /["\n,]/.test(s) ? '"' + s.replace(/"/g,'""') + '"' : s
  }

  const lines: string[] = []
  lines.push(headers.join(delimiter))

  for (const r of all) {
    const isCompleted = r.status === 'completed'
    const row: unknown[] = [
      r.id,
      r.fileName,
      r.status,
      isCompleted ? r.confidence : '',
      isCompleted ? r.processingTime : '',
      isCompleted ? r.tokensUsed : '',
      isCompleted && r.fromCache ? 'true' : ''
    ]
    for (const key of attributeKeys) {
      const value = isCompleted ? r.attributes?.[key]?.value : ''
      row.push(value ?? '')
    }
    lines.push(row.map(escape).join(delimiter))
  }

  return lines.join('\n')
}
