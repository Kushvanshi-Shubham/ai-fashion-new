'use client';

import React, { useState, useMemo } from 'react';
import { CheckCircle, AlertTriangle, Info, ArrowUpDown } from 'lucide-react';
import { CategoryFormData } from '@/types/fashion';

interface CategoryAttributeTableProps {
  category: CategoryFormData | null;
  className?: string;
  showDescription?: boolean;
  showOnlyExtractable?: boolean;
}

type SortField = 'label' | 'type' | 'required' | 'aiWeight';
type SortDirection = 'asc' | 'desc';

export default function CategoryAttributeTable({
  category,
  className = '',
  showDescription = true,
  showOnlyExtractable = false
}: CategoryAttributeTableProps) {
  const [sortField, setSortField] = useState<SortField>('label');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredAndSortedAttributes = useMemo(() => {
    if (!category?.fields) return [];

    let filtered = category.fields;

    // Filter by extractable
    if (showOnlyExtractable) {
      filtered = filtered.filter(field => field.aiExtractable);
    }

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(field => field.type === filterType);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(field => 
        field.label.toLowerCase().includes(query) ||
        field.key.toLowerCase().includes(query) ||
        field.description?.toLowerCase().includes(query)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'label':
          comparison = a.label.localeCompare(b.label);
          break;
        case 'type':
          comparison = a.type.localeCompare(b.type);
          break;
        case 'required':
          comparison = Number(a.required) - Number(b.required);
          break;
        case 'aiWeight':
          comparison = (a.aiWeight || 0) - (b.aiWeight || 0);
          break;
      }

      return sortDirection === 'desc' ? -comparison : comparison;
    });

    return filtered;
  }, [category?.fields, showOnlyExtractable, filterType, searchQuery, sortField, sortDirection]);

  const attributeTypes = useMemo(() => {
    if (!category?.fields) return [];
    const types = [...new Set(category.fields.map(field => field.type))];
    return types.sort();
  }, [category?.fields]);

  const stats = useMemo(() => {
    if (!category?.fields) return { total: 0, extractable: 0, required: 0, byType: {} };

    const byType: Record<string, number> = {};
    let extractable = 0;
    let required = 0;

    category.fields.forEach(field => {
      byType[field.type] = (byType[field.type] || 0) + 1;
      if (field.aiExtractable) extractable++;
      if (field.required) required++;
    });

    return {
      total: category.fields.length,
      extractable,
      required,
      byType
    };
  }, [category?.fields]);

  if (!category) {
    return (
      <div className={`bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center ${className}`}>
        <Info className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Category Selected</h3>
        <p className="text-gray-500">Please select a category to view its extractable attributes.</p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Category Info */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{category.categoryName}</h3>
            <p className="text-sm text-gray-600">
              {category.department} → {category.subDepartment}
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">{category.extractableAttributes}</div>
            <div className="text-sm text-gray-500">Extractable Attributes</div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-lg font-semibold text-gray-900">{stats.total}</div>
            <div className="text-xs text-gray-500">Total Fields</div>
          </div>
          <div className="bg-green-50 rounded-lg p-3">
            <div className="text-lg font-semibold text-green-700">{stats.extractable}</div>
            <div className="text-xs text-gray-500">AI Extractable</div>
          </div>
          <div className="bg-amber-50 rounded-lg p-3">
            <div className="text-lg font-semibold text-amber-700">{stats.required}</div>
            <div className="text-xs text-gray-500">Required</div>
          </div>
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="text-lg font-semibold text-blue-700">{attributeTypes.length}</div>
            <div className="text-xs text-gray-500">Types</div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search attributes..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filter by Type */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Types</option>
            {attributeTypes.map(type => (
              <option key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </select>

          {/* Results count */}
          <div className="flex items-center text-sm text-gray-500 whitespace-nowrap">
            {filteredAndSortedAttributes.length} of {stats.total} attributes
          </div>
        </div>
      </div>

      {/* Attributes Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('label')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Attribute</span>
                    <ArrowUpDown className="h-4 w-4" />
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('type')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Type</span>
                    <ArrowUpDown className="h-4 w-4" />
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('required')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Required</span>
                    <ArrowUpDown className="h-4 w-4" />
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Extractable
                </th>
                {showDescription && (
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAndSortedAttributes.length > 0 ? (
                filteredAndSortedAttributes.map((field) => (
                  <tr key={field.key} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{field.label}</div>
                        <div className="text-sm text-gray-500">{field.key}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        field.type === 'select' ? 'bg-blue-100 text-blue-800' :
                        field.type === 'text' ? 'bg-green-100 text-green-800' :
                        field.type === 'number' ? 'bg-purple-100 text-purple-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {field.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {field.required ? (
                        <AlertTriangle className="h-5 w-5 text-amber-500" />
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {field.aiExtractable ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    {showDescription && (
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600 max-w-xs truncate">
                          {field.description || '—'}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td 
                    colSpan={showDescription ? 5 : 4}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    No attributes match your current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Options Summary */}
      {filteredAndSortedAttributes.some(field => field.type === 'select') && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-3">Available Options Preview</h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {filteredAndSortedAttributes
              .filter(field => field.type === 'select' && field.options?.length)
              .map(field => (
                <div key={field.key} className="border border-gray-200 rounded p-3">
                  <div className="font-medium text-sm text-gray-900 mb-2">{field.label}</div>
                  <div className="flex flex-wrap gap-1">
                    {field.options!.slice(0, 10).map((option) => (
                      <span
                        key={option.shortForm}
                        className="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded"
                        title={option.fullForm}
                      >
                        {option.shortForm}
                      </span>
                    ))}
                    {field.options!.length > 10 && (
                      <span className="inline-flex px-2 py-1 text-xs bg-gray-200 text-gray-500 rounded">
                        +{field.options!.length - 10} more
                      </span>
                    )}
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      )}
    </div>
  );
}
