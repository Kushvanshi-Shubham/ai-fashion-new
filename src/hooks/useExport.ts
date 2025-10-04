'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { ExportProcessor, ExportOptions, ExportProgress, ExportFormat } from '@/lib/export/ExportProcessor';
import { ExtractionResult } from '@/types/fashion';
import { toast } from 'sonner';

export interface UseExportOptions {
  onExportStart?: (exportId: string) => void;
  onExportProgress?: (progress: ExportProgress) => void;
  onExportComplete?: (exportId: string, downloadUrl: string) => void;
  onExportError?: (exportId: string, error: string) => void;
  autoDownload?: boolean; // Automatically trigger download when complete
  cleanupDelay?: number; // Delay before cleaning up completed exports (ms)
}

export interface ExportHistoryItem {
  id: string;
  format: ExportFormat;
  status: 'completed' | 'failed';
  timestamp: Date;
  recordCount: number;
  downloadUrl?: string;
  error?: string;
}

export interface ExportPreview {
  format: ExportFormat;
  totalRecords: number;
  previewRecords: number;
  sampleData: ExtractionResult[];
  estimatedSize: string;
  options: Partial<ExportOptions>;
}

export interface ExportState {
  activeExports: ExportProgress[];
  exportHistory: ExportHistoryItem[];
  isExporting: boolean;
}

export function useExport(options: UseExportOptions = {}) {
  const {
    onExportStart,
    onExportProgress,
    onExportComplete,
    onExportError,
    autoDownload = false,
    cleanupDelay = 300000 // 5 minutes
  } = options;

  const exportProcessorRef = useRef<ExportProcessor | null>(null);
  const [state, setState] = useState<ExportState>({
    activeExports: [],
    exportHistory: [],
    isExporting: false
  });

  // Initialize export processor
  if (!exportProcessorRef.current) {
    exportProcessorRef.current = ExportProcessor.getInstance();
  }

  // Download export file
  const downloadExport = useCallback((downloadUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  // Update active exports periodically
  useEffect(() => {
    const updateExports = () => {
      if (exportProcessorRef.current) {
        // For now, just keep existing exports - we'd need to implement getExportHistory properly
        // setState(prev => ({
        //   ...prev,
        //   exportHistory: exportProcessorRef.current!.getExportHistory()
        // }));
      }
    };

    const interval = setInterval(updateExports, 1000);
    return () => clearInterval(interval);
  }, []);

  // Start export
  const startExport = useCallback(async (
    data: ExtractionResult[],
    format: ExportFormat,
    customOptions: Partial<ExportOptions> = {}
  ): Promise<string> => {
    const exportOptions: ExportOptions = {
      format,
      includeMetadata: true,
      includeRawData: false,
      includeStatistics: true,
      ...customOptions
    };

    setState(prev => ({ ...prev, isExporting: true }));

    try {
      const exportId = await exportProcessorRef.current!.startExport(
        data,
        exportOptions,
        (progress: ExportProgress) => {
          // Update state with progress
          setState(prev => ({
            ...prev,
            activeExports: prev.activeExports.find(e => e.id === progress.id)
              ? prev.activeExports.map(e => e.id === progress.id ? progress : e)
              : [...prev.activeExports, progress]
          }));

          // Call progress callback
          onExportProgress?.(progress);

          // Handle completion
          if (progress.status === 'completed' && progress.downloadUrl) {
            onExportComplete?.(progress.id, progress.downloadUrl);
            
            if (autoDownload) {
              downloadExport(progress.downloadUrl, `extraction-export.${exportOptions.format}`);
            }

            toast.success(`Export completed: ${format.toUpperCase()} format`);

            // Schedule cleanup
            setTimeout(() => {
              setState(prev => ({
                ...prev,
                activeExports: prev.activeExports.filter(e => e.id !== progress.id)
              }));
            }, cleanupDelay);

          } else if (progress.status === 'failed') {
            onExportError?.(progress.id, progress.error || 'Export failed');
            toast.error(`Export failed: ${progress.error || 'Unknown error'}`);
          }
        }
      );

      onExportStart?.(exportId);
      toast.success(`Started ${format.toUpperCase()} export`);
      
      return exportId;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to start export: ${errorMessage}`);
      throw error;
    } finally {
      setState(prev => ({ ...prev, isExporting: false }));
    }
  }, [onExportStart, onExportProgress, onExportComplete, onExportError, autoDownload, cleanupDelay, downloadExport]);

  // Cancel export
  const cancelExport = useCallback((exportId: string) => {
    const success = exportProcessorRef.current!.cancelExport(exportId);
    
    if (success) {
      setState(prev => ({
        ...prev,
        activeExports: prev.activeExports.filter(e => e.id !== exportId)
      }));
      toast.info('Export cancelled');
    }
    
    return success;
  }, []);

  // Get export progress
  const getExportProgress = useCallback((exportId: string): ExportProgress | null => {
    return exportProcessorRef.current!.getExportProgress(exportId);
  }, []);

  // Batch export with different formats
  const batchExport = useCallback(async (
    data: ExtractionResult[],
    formats: ExportFormat[],
    options: Partial<ExportOptions> = {}
  ): Promise<string[]> => {
    const exportPromises = formats.map(format => startExport(data, format, options));
    return Promise.all(exportPromises);
  }, [startExport]);

  // Export with preview (returns sample data for preview)
  const exportWithPreview = useCallback(async (
    data: ExtractionResult[],
    format: ExportFormat,
    options: Partial<ExportOptions> = {}
  ): Promise<{ preview: ExportPreview; startExport: () => Promise<string> }> => {
    // Generate preview with first 5 records
    const previewData = data.slice(0, 5);
    
    // This would generate a preview without creating the full export
    const preview: ExportPreview = {
      format,
      totalRecords: data.length,
      previewRecords: previewData.length,
      sampleData: previewData,
      estimatedSize: Math.round(data.length * 2.5) + 'KB', // Rough estimate
      options
    };

    return {
      preview,
      startExport: () => startExport(data, format, options)
    };
  }, [startExport]);

  // Cleanup completed exports
  const cleanup = useCallback(() => {
    exportProcessorRef.current!.cleanup();
    setState(prev => ({
      ...prev,
      activeExports: prev.activeExports.filter(e => e.status !== 'completed')
    }));
  }, []);

  // Quick export functions for common formats
  const exportJSON = useCallback((data: ExtractionResult[], options?: Partial<ExportOptions>) => 
    startExport(data, 'json', options), [startExport]);

  const exportCSV = useCallback((data: ExtractionResult[], options?: Partial<ExportOptions>) => 
    startExport(data, 'csv', options), [startExport]);

  const exportPDF = useCallback((data: ExtractionResult[], options?: Partial<ExportOptions>) => 
    startExport(data, 'pdf', options), [startExport]);

  const exportXLSX = useCallback((data: ExtractionResult[], options?: Partial<ExportOptions>) => 
    startExport(data, 'xlsx', options), [startExport]);

  const exportXML = useCallback((data: ExtractionResult[], options?: Partial<ExportOptions>) => 
    startExport(data, 'xml', options), [startExport]);

  return {
    // State
    activeExports: state.activeExports,
    exportHistory: state.exportHistory,
    isExporting: state.isExporting,
    
    // Core functions
    startExport,
    cancelExport,
    downloadExport,
    getExportProgress,
    batchExport,
    exportWithPreview,
    cleanup,
    
    // Quick export functions
    exportJSON,
    exportCSV,
    exportPDF,
    exportXLSX,
    exportXML,
    
    // Utilities
    hasActiveExports: state.activeExports.length > 0,
    getActiveExportById: (id: string) => state.activeExports.find(e => e.id === id),
    getCompletedExports: () => state.activeExports.filter(e => e.status === 'completed'),
    getFailedExports: () => state.activeExports.filter(e => e.status === 'failed'),
    getTotalProgress: () => {
      const activeExports = state.activeExports.filter(e => e.status === 'processing');
      if (activeExports.length === 0) return 0;
      
      const totalProgress = activeExports.reduce((sum, e) => sum + e.progress, 0);
      return Math.round(totalProgress / activeExports.length);
    }
  };
}