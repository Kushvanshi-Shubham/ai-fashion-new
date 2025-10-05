'use client';

import { ExtractionResult } from '@/types/fashion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, AlertCircle, Clock, FileText } from 'lucide-react';

interface SimpleResultsDisplayProps {
  results: ExtractionResult[];
}

export function SimpleResultsDisplay({ results }: SimpleResultsDisplayProps) {
  if (results.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
        <p>No extraction results yet. Upload images and click extract to see results here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <CheckCircle className="h-5 w-5 text-green-600" />
        <h3 className="text-lg font-semibold">Extraction Results ({results.length})</h3>
      </div>

      {results.map((result) => (
        <Card key={result.id} className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h4 className="font-medium">{result.fileName}</h4>
              <Badge variant={result.status === 'completed' ? 'default' : 'secondary'}>
                {result.status}
              </Badge>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-gray-600">
              {('confidence' in result && result.confidence) && (
                <span className="flex items-center gap-1">
                  <span>Confidence: {result.confidence}%</span>
                </span>
              )}
              {('processingTime' in result && result.processingTime) && (
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{Math.round(result.processingTime / 1000)}s</span>
                </span>
              )}
            </div>
          </div>

          <Separator className="my-3" />

          {/* Category Info */}
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">Category: <span className="font-medium">{'categoryName' in result ? String(result.categoryName) : 'Unknown'}</span></p>
          </div>

          {/* Attributes Table (like your old project) */}
          <div className="bg-gray-50 rounded-lg p-3">
            <h5 className="font-medium mb-3">Extracted Attributes</h5>
            
            {('attributes' in result && result.attributes && Object.keys(result.attributes).length > 0) ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {Object.entries(result.attributes).map(([key, value]) => (
                  <div key={key} className="flex justify-between items-center py-2 px-3 bg-white rounded border border-gray-200">
                    <span className="text-sm font-medium text-gray-700 capitalize">
                      {key.replace(/[_-]/g, ' ')}
                    </span>
                    <span className="text-sm text-gray-900 font-medium">
                      {typeof value === 'object' && value !== null 
                        ? JSON.stringify(value) 
                        : String(value || 'N/A')
                      }
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                <AlertCircle className="mx-auto h-8 w-8 mb-2 opacity-50" />
                <p>No attributes extracted</p>
              </div>
            )}
          </div>

          {/* Error Display */}
          {result.status === 'failed' && result.error && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">
                <span className="font-medium">Error:</span> {result.error}
              </p>
            </div>
          )}

          {/* Metadata */}
          <div className="mt-4 pt-3 border-t border-gray-200">
            <div className="flex justify-between text-xs text-gray-500">
              <span>ID: {result.id}</span>
              <span>Model: {'modelUsed' in result ? String(result.modelUsed) : 'Unknown'}</span>
              {('tokensUsed' in result && result.tokensUsed) && <span>Tokens: {result.tokensUsed}</span>}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

export default SimpleResultsDisplay;