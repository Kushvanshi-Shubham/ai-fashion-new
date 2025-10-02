
// Lightweight dynamic import of sheetjs to avoid unnecessary bundle size when unused
async function loadXLSX() {
  const mod = await import('xlsx')
  return mod
}

export interface XlsxExportOptions {
  includeFailed?: boolean
  filename?: string
}

interface GenericExtraction {
  status: string
  attributes?: Record<string, { value: unknown }>
  id?: string
  fileName?: string
  performance?: { tokensUsed?: number; processingTime?: number }
}

export async function exportExtractionsToXlsx(results: GenericExtraction[], opts: XlsxExportOptions = {}) {
  if (!results.length) return
  const { includeFailed = false, filename = 'extractions.xlsx' } = opts

  // Filter and collect attribute keys
  const filtered = results.filter(r => r.status === 'COMPLETED' || (includeFailed && r.status === 'FAILED'))
  const attrKeys = new Set<string>()
  filtered.forEach(r => {
    if (r.attributes) Object.keys(r.attributes).forEach(k => attrKeys.add(k))
  })
  const sortedAttr = Array.from(attrKeys).sort()

  const rows = filtered.map(r => {
    const base: Record<string, unknown> = {
      id: r.id,
      file: r.fileName,
      status: r.status,
      tokensUsed: r.performance?.tokensUsed ?? null,
      processingMs: r.performance?.processingTime ?? null
    }
    sortedAttr.forEach(k => {
      base[k] = r.attributes?.[k]?.value ?? null
    })
    return base
  })

  const XLSX = await loadXLSX()
  const worksheet = XLSX.utils.json_to_sheet(rows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Extractions')
  const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })

  // Trigger download
  const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
