
// Lightweight dynamic import of exceljs (secure xlsx alternative)
async function loadExcelJS() {
  const mod = await import('exceljs')
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

  const ExcelJS = await loadExcelJS()
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('Extractions')

  // Add headers
  const headers = ['id', 'file', 'status', 'tokensUsed', 'processingMs', ...sortedAttr]
  worksheet.columns = headers.map(header => ({ header, key: header, width: 20 }))

  // Add data rows
  rows.forEach(row => worksheet.addRow(row))

  // Style the header row
  worksheet.getRow(1).eachCell(cell => {
    cell.font = { bold: true }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } }
  })

  // Generate buffer and download
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
