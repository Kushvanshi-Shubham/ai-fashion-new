'use client';

import { ExtractionResult, CompletedExtractionResult } from '@/types/fashion';

// Type guard to check if result is completed
const isCompletedResult = (result: ExtractionResult): result is CompletedExtractionResult => {
  return result.status === 'completed';
};
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Download, CheckCircle, AlertCircle, Clock } from 'lucide-react';

interface ExtractionResultsTableProps {
  results: ExtractionResult[];
  category?: {
    categoryName: string;
    fields: Array<{
      key: string;
      label: string;
      type: string;
      required: boolean;
    }>;
  } | null;
}

export function ExtractionResultsTable({ results, category }: ExtractionResultsTableProps) {
  if (results.length === 0) {
    return (
      <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
        <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No extraction results yet</h3>
        <p className="text-gray-500">Upload images and run extraction to see results here</p>
      </div>
    );
  }

  const completedResults = results.filter(r => r.status === 'completed');
  const allAttributes = new Set<string>();
  
  // Collect all unique attributes from all results
  completedResults.forEach(result => {
    if (isCompletedResult(result) && result.attributes) {
      Object.keys(result.attributes).forEach((key: string) => allAttributes.add(key));
    }
  });

  const attributeKeys = Array.from(allAttributes).sort();

  const exportToCSV = () => {
    const headers = ['Image Name', 'Status', 'Confidence', ...attributeKeys.map(key => 
      category?.fields.find(f => f.key === key)?.label || key.replace(/[_-]/g, ' ')
    )];
    
    const rows = results.map(result => {
      const row = [
        result.fileName,
        result.status,
        isCompletedResult(result) ? `${result.confidence || 0}%` : '-',
      ];
      
      attributeKeys.forEach(key => {
        if (isCompletedResult(result) && result.attributes?.[key]) {
          const attr = result.attributes[key];
          row.push(attr.value || 'N/A');
        } else {
          row.push('-');
        }
      });
      
      return row;
    });

    const csvContent = [headers, ...rows].map(row => 
      row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `extraction-results-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header with Export */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Extraction Results ({results.length})
          </h3>
          {category && (
            <p className="text-sm text-gray-600 mt-1">
              Category: <span className="font-medium">{category.categoryName}</span>
            </p>
          )}
        </div>
        
        {completedResults.length > 0 && (
          <Button onClick={exportToCSV} size="sm" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export All Results
          </Button>
        )}
      </div>

      {/* Results Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Extracted Attributes Table</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r bg-white sticky left-0 z-10">
                    Image
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Confidence
                  </th>
                  {attributeKeys.map(key => (
                    <th key={key} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-32">
                      {category?.fields.find(f => f.key === key)?.label || key.replace(/[_-]/g, ' ')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {results.map((result, index) => (
                  <tr key={result.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    {/* Image Name */}
                    <td className="px-4 py-4 whitespace-nowrap border-r bg-white sticky left-0 z-10">
                      <div className="flex items-center">
                        <FileText className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm font-medium text-gray-900 truncate max-w-32" title={result.fileName}>
                          {result.fileName}
                        </span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <Badge 
                        variant={
                          result.status === 'completed' ? 'default' : 
                          result.status === 'failed' ? 'destructive' : 
                          result.status === 'processing' ? 'secondary' : 'outline'
                        }
                      >
                        {result.status === 'completed' && <CheckCircle className="h-3 w-3 mr-1" />}
                        {result.status === 'processing' && <Clock className="h-3 w-3 mr-1" />}
                        {result.status === 'failed' && <AlertCircle className="h-3 w-3 mr-1" />}
                        {result.status}
                      </Badge>
                    </td>

                    {/* Confidence */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      {isCompletedResult(result) ? (
                        <span className={`font-medium ${
                          result.confidence >= 80 ? "text-green-600" :
                          result.confidence >= 60 ? "text-yellow-600" : "text-red-600"
                        }`}>
                          {result.confidence}%
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>

                    {/* Attribute Values */}
                    {attributeKeys.map(key => (
                      <td key={key} className="px-4 py-4 whitespace-nowrap">
                        {isCompletedResult(result) && result.attributes?.[key] ? (
                          <div className="space-y-1">
                            <div className="text-sm font-medium text-gray-900">
                              {result.attributes[key].value || 'N/A'}
                            </div>
                            <div className="text-xs text-gray-500">
                              {result.attributes[key].confidence}% confidence
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Summary Statistics */}
      {results.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{results.length}</div>
              <div className="text-sm text-gray-600">Total Images</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {results.filter(r => r.status === 'completed').length}
              </div>
              <div className="text-sm text-gray-600">Completed</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">
                {results.filter(r => r.status === 'failed').length}
              </div>
              <div className="text-sm text-gray-600">Failed</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">
                {completedResults.length > 0 
                  ? Math.round(completedResults.reduce((sum, r) => 
                      sum + (isCompletedResult(r) ? r.confidence : 0), 0) / completedResults.length)
                  : 0}%
              </div>
              <div className="text-sm text-gray-600">Avg Confidence</div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
