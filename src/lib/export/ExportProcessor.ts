import { ExtractionResult, CompletedExtractionResult } from '@/types/fashion';

export type ExportFormat = 'json' | 'csv' | 'xlsx' | 'pdf' | 'xml';

export interface ExportOptions {
  format: ExportFormat;
  includeMetadata?: boolean;
  includeRawData?: boolean;
  includeStatistics?: boolean;
  filterByConfidence?: number; // Minimum confidence threshold
  filterByStatus?: string[]; // Filter by extraction status
  customFields?: string[]; // Only export specific fields
  dateRange?: {
    from: Date;
    to: Date;
  };
}

export interface ExportProgress {
  id: string;
  status: 'preparing' | 'processing' | 'completed' | 'failed';
  progress: number; // 0-100
  totalRecords: number;
  processedRecords: number;
  currentRecord?: string;
  startTime: Date;
  estimatedTimeRemaining?: number;
  downloadUrl?: string;
  error?: string;
}

export interface ExportStatistics {
  totalRecords: number;
  exportedRecords: number;
  skippedRecords: number;
  averageConfidence: number;
  categoryBreakdown: Record<string, number>;
  statusBreakdown: Record<string, number>;
  fileSize: number;
  processingTime: number;
}

export interface ExportMetadata {
  exportId: string;
  format: ExportFormat;
  createdAt: Date;
  createdBy?: string;
  options: ExportOptions;
  statistics: ExportStatistics;
  version: string;
}

export class ExportProcessor {
  private static instance: ExportProcessor;
  private activeExports = new Map<string, ExportProgress>();
  private exportHistory = new Map<string, ExportMetadata>();

  static getInstance(): ExportProcessor {
    if (!ExportProcessor.instance) {
      ExportProcessor.instance = new ExportProcessor();
    }
    return ExportProcessor.instance;
  }

  /**
   * Start a new export process
   */
  async startExport(
    data: ExtractionResult[],
    options: ExportOptions,
    onProgress?: (progress: ExportProgress) => void
  ): Promise<string> {
    const exportId = `export-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const progress: ExportProgress = {
      id: exportId,
      status: 'preparing',
      progress: 0,
      totalRecords: data.length,
      processedRecords: 0,
      startTime: new Date(),
    };

    this.activeExports.set(exportId, progress);
    onProgress?.(progress);

    // Process export asynchronously
    this.processExportAsync(exportId, data, options, onProgress);

    return exportId;
  }

  /**
   * Get export progress
   */
  getExportProgress(exportId: string): ExportProgress | null {
    return this.activeExports.get(exportId) || null;
  }

  /**
   * Get export history
   */
  getExportHistory(): ExportMetadata[] {
    return Array.from(this.exportHistory.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  /**
   * Cancel an ongoing export
   */
  cancelExport(exportId: string): boolean {
    const progress = this.activeExports.get(exportId);
    if (progress && progress.status === 'processing') {
      progress.status = 'failed';
      progress.error = 'Export cancelled by user';
      return true;
    }
    return false;
  }

  /**
   * Process export asynchronously
   */
  private async processExportAsync(
    exportId: string,
    data: ExtractionResult[],
    options: ExportOptions,
    onProgress?: (progress: ExportProgress) => void
  ): Promise<void> {
    const progress = this.activeExports.get(exportId)!;

    try {
      // Filter data based on options
      progress.status = 'processing';
      progress.currentRecord = 'Filtering data...';
      onProgress?.(progress);

      const filteredData = this.filterData(data, options);
      progress.totalRecords = filteredData.length;

      // Generate export based on format
      let exportContent: string | Buffer;
      let mimeType: string;

      switch (options.format) {
        case 'json':
          ({ content: exportContent, mimeType } = await this.generateJSON(filteredData, options, progress, onProgress));
          break;
        case 'csv':
          ({ content: exportContent, mimeType } = await this.generateCSV(filteredData, options, progress, onProgress));
          break;
        case 'xlsx':
          ({ content: exportContent, mimeType } = await this.generateXLSX(filteredData, options, progress, onProgress));
          break;
        case 'pdf':
          ({ content: exportContent, mimeType } = await this.generatePDF(filteredData, options, progress, onProgress));
          break;
        case 'xml':
          ({ content: exportContent, mimeType } = await this.generateXML(filteredData, options, progress, onProgress));
          break;
        default:
          throw new Error(`Unsupported export format: ${options.format}`);
      }

      // Create download URL (in a real app, upload to cloud storage)
      const blobData = typeof exportContent === 'string' ? exportContent : exportContent.toString();
      const blob = new Blob([blobData], { type: mimeType });
      progress.downloadUrl = URL.createObjectURL(blob);

      progress.status = 'completed';
      progress.progress = 100;
      if ('currentRecord' in progress) {
        delete (progress as { currentRecord?: string }).currentRecord;
      }

      // Create export metadata
      const statistics = this.calculateStatistics(filteredData);
      const metadata: ExportMetadata = {
        exportId,
        format: options.format,
        createdAt: new Date(),
        options,
        statistics,
        version: '1.0',
      };

      this.exportHistory.set(exportId, metadata);
      onProgress?.(progress);

    } catch (error) {
      progress.status = 'failed';
      progress.error = error instanceof Error ? error.message : 'Unknown error';
      onProgress?.(progress);
    }
  }

  /**
   * Filter data based on export options
   */
  private filterData(data: ExtractionResult[], options: ExportOptions): ExtractionResult[] {
    let filtered = data;

    // Filter by confidence
    if (options.filterByConfidence !== undefined) {
      filtered = filtered.filter(item => {
        if (item.status === 'completed' && 'confidence' in item) {
          return item.confidence >= options.filterByConfidence!;
        }
        return false;
      });
    }

    // Filter by status
    if (options.filterByStatus && options.filterByStatus.length > 0) {
      filtered = filtered.filter(item => options.filterByStatus!.includes(item.status));
    }

    // Filter by date range
    if (options.dateRange) {
      filtered = filtered.filter(item => {
        const createdAt = new Date(item.createdAt);
        return createdAt >= options.dateRange!.from && createdAt <= options.dateRange!.to;
      });
    }

    return filtered;
  }

  /**
   * Generate JSON export
   */
  private async generateJSON(
    data: ExtractionResult[],
    options: ExportOptions,
    progress: ExportProgress,
    onProgress?: (progress: ExportProgress) => void
  ): Promise<{ content: string; mimeType: string; fileExtension: string }> {
    const processedData = [];

    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      if (!item) continue;
      
      progress.processedRecords = i + 1;
      progress.progress = Math.round((i + 1) / data.length * 100);
      progress.currentRecord = item.fileName;

      // Process each record
      const processedItem = this.processRecordForExport(item, options);
      processedData.push(processedItem);

      // Update progress every 10 records or on last record
      if (i % 10 === 0 || i === data.length - 1) {
        onProgress?.(progress);
        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }

    const exportObject = {
      metadata: options.includeMetadata ? {
        exportedAt: new Date().toISOString(),
        totalRecords: data.length,
        format: 'json',
        version: '1.0'
      } : undefined,
      statistics: options.includeStatistics ? this.calculateStatistics(data) : undefined,
      data: processedData
    };

    return {
      content: JSON.stringify(exportObject, null, 2),
      mimeType: 'application/json',
      fileExtension: 'json'
    };
  }

  /**
   * Generate CSV export
   */
  private async generateCSV(
    data: ExtractionResult[],
    options: ExportOptions,
    progress: ExportProgress,
    onProgress?: (progress: ExportProgress) => void
  ): Promise<{ content: string; mimeType: string; fileExtension: string }> {
    const csvLines: string[] = [];

    // Generate headers
    const headers = this.generateCSVHeaders(data, options);
    csvLines.push(headers.map(h => `"${h}"`).join(','));

    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      if (!item) continue;
      
      progress.processedRecords = i + 1;
      progress.progress = Math.round((i + 1) / data.length * 100);
      progress.currentRecord = item.fileName;

      // Generate CSV row
      const row = this.generateCSVRow(item, headers);
      csvLines.push(row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','));

      // Update progress
      if (i % 10 === 0 || i === data.length - 1) {
        onProgress?.(progress);
        await new Promise(resolve => setTimeout(resolve, 30));
      }
    }

    return {
      content: csvLines.join('\n'),
      mimeType: 'text/csv',
      fileExtension: 'csv'
    };
  }

  /**
   * Generate XLSX export (simplified - in real app use a library like xlsx)
   */
  private async generateXLSX(
    data: ExtractionResult[],
    options: ExportOptions,
    progress: ExportProgress,
    onProgress?: (progress: ExportProgress) => void
  ): Promise<{ content: Buffer; mimeType: string; fileExtension: string }> {
    // This is a placeholder - in a real implementation, use xlsx library
    progress.progress = 100;
    progress.processedRecords = data.length;
    onProgress?.(progress);

    const csvContent = await this.generateCSV(data, options, progress, onProgress);
    
    return {
      content: Buffer.from(csvContent.content),
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      fileExtension: 'xlsx'
    };
  }

  /**
   * Generate PDF export (simplified - in real app use a library like jsPDF)
   */
  private async generatePDF(
    data: ExtractionResult[],
    options: ExportOptions,
    progress: ExportProgress,
    onProgress?: (progress: ExportProgress) => void
  ): Promise<{ content: Buffer; mimeType: string; fileExtension: string }> {
    // This is a placeholder - in a real implementation, use jsPDF or similar
    const reportContent = this.generateTextReport(data, options);
    
    progress.progress = 100;
    progress.processedRecords = data.length;
    onProgress?.(progress);

    return {
      content: Buffer.from(reportContent),
      mimeType: 'application/pdf',
      fileExtension: 'pdf'
    };
  }

  /**
   * Generate XML export
   */
  private async generateXML(
    data: ExtractionResult[],
    options: ExportOptions,
    progress: ExportProgress,
    onProgress?: (progress: ExportProgress) => void
  ): Promise<{ content: string; mimeType: string; fileExtension: string }> {
    const xmlLines: string[] = [];
    xmlLines.push('<?xml version="1.0" encoding="UTF-8"?>');
    xmlLines.push('<extractions>');

    if (options.includeMetadata) {
      xmlLines.push('  <metadata>');
      xmlLines.push(`    <exportedAt>${new Date().toISOString()}</exportedAt>`);
      xmlLines.push(`    <totalRecords>${data.length}</totalRecords>`);
      xmlLines.push('  </metadata>');
    }

    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      progress.processedRecords = i + 1;
      progress.progress = Math.round((i + 1) / data.length * 100);
      if (item) {
        progress.currentRecord = item.fileName;
        xmlLines.push(this.generateXMLRecord(item, options));
      }

      if (i % 10 === 0 || i === data.length - 1) {
        onProgress?.(progress);
        await new Promise(resolve => setTimeout(resolve, 40));
      }
    }

    xmlLines.push('</extractions>');

    return {
      content: xmlLines.join('\n'),
      mimeType: 'application/xml',
      fileExtension: 'xml'
    };
  }

  /**
   * Process a record for export based on options
   */
  private processRecordForExport(item: ExtractionResult, options: ExportOptions): Record<string, unknown> {
    const processed: Record<string, unknown> = {
      id: item.id,
      fileName: item.fileName,
      status: item.status,
      createdAt: item.createdAt,
    };

    if (item.status === 'completed') {
      const completedItem = item as CompletedExtractionResult;
      
      if (!options.customFields || options.customFields.includes('attributes')) {
        processed.attributes = completedItem.attributes;
      }
      
      if (!options.customFields || options.customFields.includes('confidence')) {
        processed.confidence = completedItem.confidence;
      }
      
      if (options.includeRawData) {
        processed.tokensUsed = completedItem.tokensUsed;
        processed.processingTime = completedItem.processingTime;
      }
    }

    if (item.status === 'failed') {
      processed.error = 'error' in item ? (item as { error: string }).error : undefined;
    }

    if (options.includeMetadata) {
      processed.fromCache = item.fromCache;
    }

    return processed;
  }

  /**
   * Generate CSV headers based on data structure
   */
  private generateCSVHeaders(data: ExtractionResult[], options: ExportOptions): string[] {
    const headers = ['id', 'fileName', 'status', 'createdAt'];

    // Add attribute headers from completed records
    const completedRecords = data.filter(item => item.status === 'completed') as CompletedExtractionResult[];
    if (completedRecords.length > 0) {
      const firstRecord = completedRecords[0];
      if (!firstRecord) return [];
      const sampleAttributes = firstRecord.attributes;
      Object.keys(sampleAttributes).forEach(key => {
        headers.push(`${key}_value`);
        headers.push(`${key}_confidence`);
      });
      headers.push('overall_confidence');
    }

    if (options.includeRawData) {
      headers.push('tokensUsed', 'processingTime');
    }

    if (options.includeMetadata) {
      headers.push('fromCache');
    }

    return headers;
  }

  /**
   * Generate CSV row for a record
   */
  private generateCSVRow(item: ExtractionResult, headers: string[]): (string | number | boolean)[] {
    const row: (string | number | boolean)[] = [];

    headers.forEach(header => {
      switch (header) {
        case 'id':
          row.push(item.id);
          break;
        case 'fileName':
          row.push(item.fileName);
          break;
        case 'status':
          row.push(item.status);
          break;
        case 'createdAt':
          row.push(item.createdAt);
          break;
        case 'overall_confidence':
          if (item.status === 'completed') {
            row.push((item as CompletedExtractionResult).confidence);
          } else {
            row.push('');
          }
          break;
        case 'tokensUsed':
          if (item.status === 'completed') {
            row.push((item as CompletedExtractionResult).tokensUsed);
          } else {
            row.push('');
          }
          break;
        case 'processingTime':
          if (item.status === 'completed') {
            row.push((item as CompletedExtractionResult).processingTime);
          } else {
            row.push('');
          }
          break;
        case 'fromCache':
          row.push(item.fromCache || false);
          break;
        default:
          // Handle attribute fields
          if (header.endsWith('_value') || header.endsWith('_confidence')) {
            const [attrKey, field] = header.split('_');
            if (item.status === 'completed' && attrKey && typeof attrKey === 'string') {
              const attr = (item as CompletedExtractionResult).attributes[attrKey];
              if (attr) {
                const value = field === 'value' ? attr.value : attr.confidence;
                row.push(value ?? '');
              } else {
                row.push('');
              }
            } else {
              row.push('');
            }
          } else {
            row.push('');
          }
          break;
      }
    });

    return row;
  }

  /**
   * Generate XML record
   */
  private generateXMLRecord(item: ExtractionResult, options: ExportOptions): string {
    const lines: string[] = [];
    lines.push('  <extraction>');
    lines.push(`    <id>${item.id}</id>`);
    lines.push(`    <fileName><![CDATA[${item.fileName}]]></fileName>`);
    lines.push(`    <status>${item.status}</status>`);
    lines.push(`    <createdAt>${item.createdAt}</createdAt>`);

    if (item.status === 'completed') {
      const completedItem = item as CompletedExtractionResult;
      lines.push(`    <confidence>${completedItem.confidence}</confidence>`);
      
      if (!options.customFields || options.customFields.includes('attributes')) {
        lines.push('    <attributes>');
        Object.entries(completedItem.attributes).forEach(([key, attr]) => {
          lines.push(`      <${key}>`);
          lines.push(`        <value><![CDATA[${attr.value}]]></value>`);
          lines.push(`        <confidence>${attr.confidence}</confidence>`);
          lines.push(`      </${key}>`);
        });
        lines.push('    </attributes>');
      }
    }

    lines.push('  </extraction>');
    return lines.join('\n');
  }

  /**
   * Generate text report for PDF export
   */
  private generateTextReport(data: ExtractionResult[], options: ExportOptions): string {
    const lines: string[] = [];
    lines.push('FASHION AI EXTRACTION REPORT');
    lines.push('============================');
    lines.push('');
    lines.push(`Generated: ${new Date().toLocaleDateString()}`);
    lines.push(`Total Records: ${data.length}`);
    lines.push(`Export Format: ${options.format.toUpperCase()}`);
    lines.push('');

    const stats = this.calculateStatistics(data);
    lines.push('STATISTICS');
    lines.push('----------');
    lines.push(`Average Confidence: ${stats.averageConfidence.toFixed(1)}%`);
    lines.push(`Processing Time: ${stats.processingTime}ms`);
    lines.push('');

    lines.push('STATUS BREAKDOWN');
    lines.push('---------------');
    Object.entries(stats.statusBreakdown).forEach(([status, count]) => {
      lines.push(`${status}: ${count}`);
    });

    return lines.join('\n');
  }

  /**
   * Calculate export statistics
   */
  private calculateStatistics(data: ExtractionResult[]): ExportStatistics {
    const completedRecords = data.filter(item => item.status === 'completed') as CompletedExtractionResult[];
    
    const statusBreakdown = data.reduce((acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const averageConfidence = completedRecords.length > 0
      ? completedRecords.reduce((sum, item) => sum + item.confidence, 0) / completedRecords.length
      : 0;

    return {
      totalRecords: data.length,
      exportedRecords: data.length,
      skippedRecords: 0,
      averageConfidence,
      categoryBreakdown: {}, // Would need category info from data
      statusBreakdown,
      fileSize: 0, // Would be calculated after generation
      processingTime: 0 // Would be measured during processing
    };
  }

  /**
   * Clean up completed exports
   */
  cleanup(maxAge: number = 3600000): void { // 1 hour default
    const cutoff = new Date(Date.now() - maxAge);
    
    for (const [exportId, progress] of this.activeExports.entries()) {
      if (progress.status === 'completed' && progress.startTime < cutoff) {
        if (progress.downloadUrl) {
          URL.revokeObjectURL(progress.downloadUrl);
        }
        this.activeExports.delete(exportId);
      }
    }
  }
}