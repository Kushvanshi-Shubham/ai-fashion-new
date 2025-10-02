"use client"
import React from 'react'
import { buildCsv } from '@/lib/export/csv'
import { useExtractionStore } from '@/store/useExtractionStore'

interface Props { includeFailed?: boolean }

export const ExportCsvButton: React.FC<Props> = ({ includeFailed = false }) => {
  const results = useExtractionStore(state => state.results)

  const handleExport = () => {
    if (!results.length) return
    const csv = buildCsv(results, { includeFailed })
    if (!csv) return

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `extractions_${new Date().toISOString().replace(/[:T]/g,'-').substring(0,19)}.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <button
      onClick={handleExport}
      disabled={!results.length}
      className="px-3 py-2 text-sm rounded-md border bg-white hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed"
    >
      Export CSV
    </button>
  )
}
