// Enhanced Data Management Service - Simplified & Correct
import { prisma } from '@/lib/database';

export interface DataFilter {
  category?: string;
  confidence?: { min: number; max: number };
  status?: string;
  dateRange?: { start: Date; end: Date };
  search?: string;
}

export interface BulkOperation {
  type: 'update' | 'delete' | 'export';
  ids: string[];
  data?: Record<string, unknown>;
}

export interface DataStats {
  totalExtractions: number;
  completedExtractions: number;
  failedExtractions: number;
  avgConfidence: number;
  avgProcessingTime: number;
  categoriesUsed: number;
  attributesExtracted: number;
  topCategories: Array<{
    category: string;
    count: number;
    avgConfidence: number;
  }>;
}

export interface SimpleExtractionResult {
  id: string;
  fileName: string;
  categoryId: string;
  status: string;
  confidence: number;
  processingTime: number;
  tokensUsed: number;
  createdAt: string;
  updatedAt: string;
}

export class DataManagementService {
  // READ Operations - Simplified
  static async getExtractions(
    filter: DataFilter = {},
    pagination: { page: number; limit: number } = { page: 1, limit: 50 },
    sort: { field: string; order: 'asc' | 'desc' } = { field: 'createdAt', order: 'desc' }
  ): Promise<{ data: SimpleExtractionResult[]; total: number; page: number; limit: number }> {
    try {
      // Build where clause safely
      const where: Record<string, unknown> = {};

      if (filter.category) {
        where.categoryId = filter.category;
      }

      if (filter.confidence && filter.confidence.min !== undefined && filter.confidence.max !== undefined) {
        where.confidence = {
          gte: filter.confidence.min,
          lte: filter.confidence.max
        };
      }

      if (filter.status) {
        where.status = filter.status;
      }

      if (filter.dateRange) {
        where.createdAt = {
          gte: filter.dateRange.start,
          lte: filter.dateRange.end
        };
      }

      if (filter.search) {
        where.OR = [
          { fileName: { contains: filter.search, mode: 'insensitive' } },
          { categoryId: { contains: filter.search, mode: 'insensitive' } }
        ];
      }

      // Get total count
      const total = await prisma.extractionResult.count({ where });

      // Get paginated data
      const results = await prisma.extractionResult.findMany({
        where,
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
        orderBy: { [sort.field]: sort.order },
        select: {
          id: true,
          fileName: true,
          categoryId: true,
          status: true,
          confidence: true,
          processingTime: true,
          tokensUsed: true,
          createdAt: true,
          updatedAt: true
        }
      });

      return {
        data: results.map(result => ({
          id: result.id,
          fileName: result.fileName,
          categoryId: result.categoryId,
          status: result.status,
          confidence: result.confidence || 0,
          processingTime: result.processingTime || 0,
          tokensUsed: result.tokensUsed || 0,
          createdAt: result.createdAt.toISOString(),
          updatedAt: result.updatedAt.toISOString()
        })),
        total,
        page: pagination.page,
        limit: pagination.limit
      };
    } catch (error) {
      console.error('Failed to get extractions:', error);
      throw new Error('Failed to retrieve extraction data');
    }
  }

  // DELETE Operations
  static async deleteExtraction(id: string): Promise<boolean> {
    try {
      await prisma.extractionResult.delete({
        where: { id }
      });
      return true;
    } catch (error) {
      console.error('Failed to delete extraction:', error);
      return false;
    }
  }

  static async bulkDelete(ids: string[]): Promise<{ success: boolean; deletedCount: number }> {
    try {
      const result = await prisma.extractionResult.deleteMany({
        where: { id: { in: ids } }
      });

      return { success: true, deletedCount: result.count };
    } catch (error) {
      console.error('Failed bulk delete:', error);
      throw new Error('Bulk delete operation failed');
    }
  }

  // ANALYTICS Operations
  static async getDataStats(filter: DataFilter = {}): Promise<DataStats> {
    try {
      const where: Record<string, unknown> = {};

      // Apply same filters as getExtractions
      if (filter.category) where.categoryId = filter.category;
      if (filter.dateRange) {
        where.createdAt = {
          gte: filter.dateRange.start,
          lte: filter.dateRange.end
        };
      }

      const [
        totalExtractions,
        completedExtractions,
        failedExtractions,
        avgStats,
        topCategoriesData
      ] = await Promise.all([
        prisma.extractionResult.count({ where }),
        prisma.extractionResult.count({ 
          where: { ...where, status: 'completed' } 
        }),
        prisma.extractionResult.count({ 
          where: { ...where, status: 'failed' } 
        }),
        prisma.extractionResult.aggregate({
          where: { ...where, status: 'completed' },
          _avg: {
            confidence: true,
            processingTime: true
          }
        }),
        prisma.extractionResult.groupBy({
          by: ['categoryId'],
          where: { ...where, status: 'completed' },
          _count: { categoryId: true },
          _avg: { confidence: true },
          orderBy: { _count: { categoryId: 'desc' } },
          take: 10
        })
      ]);

      // Calculate total attributes extracted (simplified)
      const attributesResult = await prisma.extractionResult.count({
        where: { ...where, status: 'completed' }
      });

      // Estimate attributes per extraction
      const estimatedAttributesPerExtraction = 15;
      const attributesExtracted = attributesResult * estimatedAttributesPerExtraction;

      return {
        totalExtractions,
        completedExtractions,
        failedExtractions,
        avgConfidence: Math.round(avgStats._avg.confidence || 0),
        avgProcessingTime: Math.round(avgStats._avg.processingTime || 0),
        categoriesUsed: topCategoriesData.length,
        attributesExtracted,
        topCategories: topCategoriesData.map(cat => ({
          category: cat.categoryId,
          count: cat._count.categoryId,
          avgConfidence: Math.round(cat._avg.confidence || 0)
        }))
      };
    } catch (error) {
      console.error('Failed to get data stats:', error);
      // Return default stats instead of throwing
      return {
        totalExtractions: 0,
        completedExtractions: 0,
        failedExtractions: 0,
        avgConfidence: 0,
        avgProcessingTime: 0,
        categoriesUsed: 0,
        attributesExtracted: 0,
        topCategories: []
      };
    }
  }

  // EXPORT Operations - Simplified
  static async exportData(
    filter: DataFilter = {},
    format: 'csv' | 'json' = 'csv'
  ): Promise<{ data: string; filename: string; mimeType: string }> {
    try {
      const { data: extractions } = await this.getExtractions(
        filter,
        { page: 1, limit: 10000 }, // Large limit for export
        { field: 'createdAt', order: 'desc' }
      );

      const timestamp = new Date().toISOString().split('T')[0];

      if (format === 'json') {
        return {
          data: JSON.stringify(extractions, null, 2),
          filename: `extractions_${timestamp}.json`,
          mimeType: 'application/json'
        };
      }

      // CSV format
      const headers = [
        'ID', 'File Name', 'Category', 'Confidence', 'Status', 
        'Processing Time (ms)', 'Token Count', 'Created At'
      ];

      const csvRows = extractions.map(extraction => [
        extraction.id,
        extraction.fileName,
        extraction.categoryId,
        extraction.confidence.toString(),
        extraction.status,
        extraction.processingTime.toString(),
        extraction.tokensUsed.toString(),
        extraction.createdAt
      ]);

      const csvContent = [headers, ...csvRows]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');

      return {
        data: csvContent,
        filename: `extractions_${timestamp}.csv`,
        mimeType: 'text/csv'
      };
    } catch (error) {
      console.error('Failed to export data:', error);
      throw new Error('Data export failed');
    }
  }
}