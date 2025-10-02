'use client';

import React, { useState, useEffect } from 'react';
import { ChevronDown, Search, Tag } from 'lucide-react';
import { 
  getCachedHierarchy, 
  createCategoryFormData, 
  searchCategories, 
  type CategoryOption, 
  type ProcessedCategory 
} from '@/lib/category-processor';
import { CategoryFormData } from '@/types/fashion';

interface CategorySelectorProps {
  onCategorySelect: (category: CategoryFormData | null) => void;
  selectedCategory?: CategoryFormData | null;
  className?: string;
}

export default function CategorySelector({ 
  onCategorySelect, 
  selectedCategory, 
  className = '' 
}: CategorySelectorProps) {
  const [hierarchy, setHierarchy] = useState<ReturnType<typeof getCachedHierarchy> | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [selectedSubDepartment, setSelectedSubDepartment] = useState<string>('');
  const [selectedCategoryCode, setSelectedCategoryCode] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<ProcessedCategory[]>([]);
  const [isSearchMode, setIsSearchMode] = useState<boolean>(false);

  useEffect(() => {
    try {
      const hierarchyData = getCachedHierarchy();
      setHierarchy(hierarchyData);
    } catch (error) {
      console.error('Error loading category hierarchy:', error);
    }
  }, []);

  useEffect(() => {
    // Initialize from selected category if provided
    if (selectedCategory) {
      setSelectedDepartment(selectedCategory.department);
      setSelectedSubDepartment(selectedCategory.subDepartment);
      setSelectedCategoryCode(selectedCategory.categoryCode);
    }
  }, [selectedCategory]);

  useEffect(() => {
    // Handle search
    if (searchQuery.trim().length > 2) {
      const results = searchCategories(searchQuery);
      setSearchResults(results);
      setIsSearchMode(true);
    } else {
      setSearchResults([]);
      setIsSearchMode(false);
    }
  }, [searchQuery]);

  const handleDepartmentChange = (department: string) => {
    setSelectedDepartment(department);
    setSelectedSubDepartment('');
    setSelectedCategoryCode('');
    onCategorySelect(null);
  };

  const handleSubDepartmentChange = (subDepartment: string) => {
    setSelectedSubDepartment(subDepartment);
    setSelectedCategoryCode('');
    onCategorySelect(null);
  };

  const handleCategorySelect = (
    department: string,
    subDepartment: string,
    categoryOption: CategoryOption
  ) => {
    setSelectedDepartment(department);
    setSelectedSubDepartment(subDepartment);
    setSelectedCategoryCode(categoryOption.code);
    
    const categoryFormData = createCategoryFormData(department, subDepartment, categoryOption);
    onCategorySelect(categoryFormData);
    
    // Clear search when category is selected
    setSearchQuery('');
    setIsSearchMode(false);
  };

  const clearSelection = () => {
    setSelectedDepartment('');
    setSelectedSubDepartment('');
    setSelectedCategoryCode('');
    setSearchQuery('');
    setIsSearchMode(false);
    onCategorySelect(null);
  };

  if (!hierarchy) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const availableSubDepartments = selectedDepartment ? 
    hierarchy.subDepartments[selectedDepartment] || [] : [];
  
  const availableCategories = selectedDepartment && selectedSubDepartment ? 
    hierarchy.categories[selectedDepartment]?.[selectedSubDepartment] || [] : [];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Tag className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Category Selection</h3>
        </div>
        {(selectedDepartment || searchQuery) && (
          <button
            onClick={clearSelection}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Clear Selection
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search categories by name or code..."
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Search Results */}
      {isSearchMode && searchResults.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 rounded-t-lg">
            <span className="text-sm font-medium text-gray-700">
              Search Results ({searchResults.length})
            </span>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {searchResults.map((result) => (
              <button
                key={`${result.department}-${result.subDepartment}-${result.category.code}`}
                onClick={() => handleCategorySelect(
                  result.department, 
                  result.subDepartment, 
                  result.category
                )}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 focus:outline-none focus:bg-gray-50"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium text-gray-900">{result.category.name}</div>
                    <div className="text-sm text-gray-500">
                      {result.department} → {result.subDepartment}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      Code: {result.category.code}
                    </div>
                  </div>
                  <div className="text-right text-xs text-gray-500">
                    <div>{result.category.enabledAttributes} attributes</div>
                    <div className="text-green-600">{result.category.extractableAttributes} extractable</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Hierarchical Selection */}
      {!isSearchMode && (
        <div className="space-y-4">
          {/* Department Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              1. Select Department
            </label>
            <div className="relative">
              <select
                value={selectedDepartment}
                onChange={(e) => handleDepartmentChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="">Choose a department...</option>
                {hierarchy.departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Sub-Department Selection */}
          <div className={selectedDepartment ? '' : 'opacity-50'}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              2. Select Sub-Department
            </label>
            <div className="relative">
              <select
                value={selectedSubDepartment}
                onChange={(e) => handleSubDepartmentChange(e.target.value)}
                disabled={!selectedDepartment}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white disabled:bg-gray-50 disabled:cursor-not-allowed"
              >
                <option value="">Choose a sub-department...</option>
                {availableSubDepartments.map((subDept) => (
                  <option key={subDept} value={subDept}>
                    {subDept}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Category Selection */}
          <div className={selectedSubDepartment ? '' : 'opacity-50'}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              3. Select Major Category
            </label>
            {availableCategories.length > 0 ? (
              <div className="border border-gray-300 rounded-lg max-h-64 overflow-y-auto bg-white">
                {availableCategories.map((category) => (
                  <button
                    key={category.code}
                    onClick={() => handleCategorySelect(
                      selectedDepartment, 
                      selectedSubDepartment, 
                      category
                    )}
                    className={`w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 focus:outline-none focus:bg-gray-50 ${
                      selectedCategoryCode === category.code ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium text-gray-900">{category.name}</div>
                        <div className="text-sm text-gray-500">Code: {category.code}</div>
                        {category.description && (
                          <div className="text-xs text-gray-400 mt-1">{category.description}</div>
                        )}
                      </div>
                      <div className="text-right text-xs text-gray-500">
                        <div>{category.enabledAttributes} attributes</div>
                        <div className="text-green-600">{category.extractableAttributes} extractable</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 text-sm">
                {selectedSubDepartment ? 'No categories available' : 'Select a sub-department first'}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Selection Summary */}
      {selectedCategory && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h4 className="font-medium text-green-800 mb-2">Selected Category</h4>
          <div className="space-y-1 text-sm">
            <div><span className="font-medium">Path:</span> {selectedCategory.department} → {selectedCategory.subDepartment} → {selectedCategory.categoryName}</div>
            <div><span className="font-medium">Code:</span> {selectedCategory.categoryCode}</div>
            <div><span className="font-medium">Extractable Attributes:</span> {selectedCategory.extractableAttributes}</div>
            <div><span className="font-medium">Total Fields:</span> {selectedCategory.fields.length}</div>
          </div>
        </div>
      )}
    </div>
  );
}