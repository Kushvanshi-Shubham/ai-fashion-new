// Enhanced Data Management Dashboard Component
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,

} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,

  Download,
  Edit,
  Trash2,
  MoreHorizontal,
  Eye,
  RefreshCw,
  Plus,
  Upload,
  CheckCircle2,
  XCircle,
  Clock
} from 'lucide-react';
import { motion } from 'framer-motion';

import { DataManagementService, DataFilter, DataStats, SimpleExtractionResult } from '../services/DataManagementService';
import { cn } from '@/lib/utils';

interface EnhancedDataManagementProps {
  className?: string;
}

export function EnhancedDataManagement({ className }: EnhancedDataManagementProps) {
  // State Management
  const [extractions, setExtractions] = useState<SimpleExtractionResult[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DataStats>({
    totalExtractions: 0,
    completedExtractions: 0,
    failedExtractions: 0,
    avgConfidence: 0,
    avgProcessingTime: 0,
    categoriesUsed: 0,
    attributesExtracted: 0,
    topCategories: []
  });
  
  // Filters and Search
  const [filter] = useState<DataFilter>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);

  // UI State
  const [isExporting, setIsExporting] = useState(false);

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Load Data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      
      const appliedFilter: DataFilter = {
        ...filter,
        ...(searchTerm && { search: searchTerm }),
        ...(categoryFilter && { category: categoryFilter }),
        ...(statusFilter && { status: statusFilter })
      };

      const [dataResult, statsResult] = await Promise.all([
        DataManagementService.getExtractions(
          appliedFilter,
          { page: currentPage, limit: pageSize },
          { field: 'createdAt', order: 'desc' }
        ),
        DataManagementService.getDataStats(appliedFilter)
      ]);

      setExtractions(dataResult.data);
      setTotalItems(dataResult.total);
      setTotalPages(Math.ceil(dataResult.total / pageSize));
      setStats(statsResult);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }, [filter, searchTerm, categoryFilter, statusFilter, currentPage, pageSize]);

  useEffect(() => {
    loadData();
  }, [currentPage, pageSize, searchTerm, categoryFilter, statusFilter, loadData]);

  // Selection Management
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(extractions.map(item => item.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectItem = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
    }
  };

  // Bulk Operations
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;

    try {
      await DataManagementService.bulkDelete(selectedIds);
      setSelectedIds([]);
      loadData();
      setShowDeleteDialog(false);
    } catch (error) {
      console.error('Bulk delete failed:', error);
    }
  };

  const handleBulkExport = async (format: 'csv' | 'json') => {
    try {
      setIsExporting(true);
      const exportFilter = selectedIds.length > 0 ? { ...filter } : filter;
      
      const result = await DataManagementService.exportData(exportFilter, format);
      
      // Create download
      const blob = new Blob([result.data], { type: result.mimeType });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = result.filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  // Get status badge variant
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle2 className="w-3 h-3 mr-1" />Completed</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Failed</Badge>;
      case 'processing':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Processing</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Get confidence badge variant
  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 90) return 'default';
    if (confidence >= 70) return 'secondary';
    return 'outline';
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Extractions</CardTitle>
              <Badge variant="outline">{stats.totalExtractions}</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalExtractions}</div>
              <p className="text-xs text-muted-foreground">
                {stats.completedExtractions} completed, {stats.failedExtractions} failed
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Confidence</CardTitle>
              <Badge variant={getConfidenceBadge(stats.avgConfidence)}>{stats.avgConfidence}%</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgConfidence}%</div>
              <p className="text-xs text-muted-foreground">
                AI extraction accuracy
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Attributes Extracted</CardTitle>
              <Badge variant="outline">{stats.attributesExtracted}</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.attributesExtracted}</div>
              <p className="text-xs text-muted-foreground">
                Across {stats.categoriesUsed} categories
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Processing</CardTitle>
              <Badge variant="secondary">{stats.avgProcessingTime}ms</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(stats.avgProcessingTime / 1000).toFixed(1)}s</div>
              <p className="text-xs text-muted-foreground">
                Per image processed
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
            <div>
              <CardTitle>Data Management</CardTitle>
              <CardDescription>
                Manage your extraction results, perform bulk operations, and export data
              </CardDescription>
            </div>
            
            <div className="flex flex-col space-y-2 lg:flex-row lg:items-center lg:space-x-2 lg:space-y-0">
              <Button variant="outline" onClick={loadData}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>Export Format</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleBulkExport('csv')} disabled={isExporting}>
                    CSV Format
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkExport('json')} disabled={isExporting}>
                    JSON Format  
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkExport('csv')} disabled={isExporting}>
                    Excel Format (Coming Soon)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Extraction
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Search and Filters */}
          <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:space-x-4 lg:space-y-0 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by filename or category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Categories</SelectItem>
                {stats.topCategories.map((cat: { category: string; count: number; avgConfidence: number }) => (
                  <SelectItem key={cat.category} value={cat.category}>
                    {cat.category} ({cat.count})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full lg:w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={pageSize.toString()} onValueChange={(value: string) => setPageSize(Number(value))}>
              <SelectTrigger className="w-full lg:w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Bulk Actions */}
          {selectedIds.length > 0 && (
            <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-950 p-4 rounded-lg mb-4">
              <span className="text-sm font-medium">
                {selectedIds.length} item{selectedIds.length !== 1 ? 's' : ''} selected
              </span>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  <Edit className="w-4 h-4 mr-2" />
                  Bulk Edit
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Selected
                </Button>
              </div>
            </div>
          )}

          {/* Data Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedIds.length === extractions.length && extractions.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>File Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead>Processing Time</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell><div className="w-4 h-4 bg-gray-200 rounded animate-pulse" /></TableCell>
                      <TableCell><div className="w-32 h-4 bg-gray-200 rounded animate-pulse" /></TableCell>
                      <TableCell><div className="w-24 h-4 bg-gray-200 rounded animate-pulse" /></TableCell>
                      <TableCell><div className="w-16 h-4 bg-gray-200 rounded animate-pulse" /></TableCell>
                      <TableCell><div className="w-12 h-4 bg-gray-200 rounded animate-pulse" /></TableCell>
                      <TableCell><div className="w-16 h-4 bg-gray-200 rounded animate-pulse" /></TableCell>
                      <TableCell><div className="w-20 h-4 bg-gray-200 rounded animate-pulse" /></TableCell>
                      <TableCell><div className="w-8 h-4 bg-gray-200 rounded animate-pulse" /></TableCell>
                    </TableRow>
                  ))
                ) : extractions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12">
                      <div className="flex flex-col items-center space-y-2">
                        <Upload className="w-12 h-12 text-gray-400" />
                        <h3 className="text-lg font-medium">No extractions found</h3>
                        <p className="text-sm text-gray-500">
                          Start by uploading some images for AI extraction
                        </p>
                        <Button className="mt-4">
                          <Plus className="w-4 h-4 mr-2" />
                          Create First Extraction
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  extractions.map((extraction) => (
                    <TableRow key={extraction.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.includes(extraction.id)}
                          onCheckedChange={(checked) => handleSelectItem(extraction.id, !!checked)}
                        />
                      </TableCell>
                      <TableCell className="font-medium max-w-48 truncate">
                        {extraction.fileName}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{extraction.categoryId}</Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(extraction.status)}</TableCell>
                      <TableCell>
                        <Badge variant={getConfidenceBadge(extraction.confidence)}>
                          {extraction.confidence}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {extraction.processingTime}ms
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {new Date(extraction.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between space-x-2 py-4">
              <div className="text-sm text-muted-foreground">
                Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalItems)} of {totalItems} entries
              </div>
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage <= 1}
                >
                  Previous
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage >= totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Selected Items</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedIds.length} selected item{selectedIds.length !== 1 ? 's' : ''}? 
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleBulkDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}