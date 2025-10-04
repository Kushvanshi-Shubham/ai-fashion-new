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
          <div className="h-4 bg-muted rounded w-1/4"></div>
          <div className="h-10 bg-muted rounded"></div>
          <div className="h-10 bg-muted rounded"></div>
          <div className="h-10 bg-muted rounded"></div>
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
          <Tag className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Category Selection</h3>
        </div>
        {(selectedDepartment || searchQuery) && (
          <button
            onClick={clearSelection}
            className="text-sm text-muted-foreground hover:text-foreground underline transition-colors"
          >
            Clear Selection
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search categories by name or code..."
          className="w-full pl-10 pr-4 py-3 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring/30 focus:border-primary transition-all"
        />
      </div>

      {/* Search Results */}
      {isSearchMode && searchResults.length > 0 && (
        <div className="surface rounded-lg shadow-surface">
          <div className="px-4 py-3 bg-muted/50 border-b border-border/50 rounded-t-lg">
            <span className="text-sm font-semibold text-foreground">
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
                className="w-full px-4 py-3 text-left hover:bg-accent/50 border-b border-border/30 last:border-b-0 focus:outline-none focus:bg-accent/60 transition-all"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium text-foreground">{result.category.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {result.department} → {result.subDepartment}
                    </div>
                    <div className="text-xs text-muted-foreground/70 mt-1">
                      Code: {result.category.code}
                    </div>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    <div>{result.category.enabledAttributes} attributes</div>
                    <div className="text-success font-medium">{result.category.extractableAttributes} extractable</div>
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
            <label className="flex items-center gap-2 text-lg font-bold text-blue-900 dark:text-blue-100 mb-4">
              🔷 1. Select Department
            </label>
            <div className="relative">
              <select
                value={selectedDepartment}
                onChange={(e) => handleDepartmentChange(e.target.value)}
                className="w-full px-6 py-4 border-2 border-blue-400 dark:border-blue-500 rounded-xl focus:ring-4 focus:ring-blue-500/40 focus:border-blue-600 appearance-none bg-gradient-to-r from-blue-100 to-blue-200 dark:from-blue-900/70 dark:to-blue-800/70 text-blue-900 dark:text-blue-50 font-semibold text-lg shadow-lg hover:shadow-xl hover:from-blue-200 hover:to-blue-300 dark:hover:from-blue-800/80 dark:hover:to-blue-700/80 transition-all cursor-pointer"
              >
                <option value="" className="text-gray-600 dark:text-gray-300 font-medium">📝 Choose a department...</option>
                {hierarchy.departments.map((dept) => (
                  <option key={dept} value={dept} className="font-semibold text-blue-800 dark:text-blue-200">
                    🏢 {dept}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 h-6 w-6 text-blue-600 dark:text-blue-400 pointer-events-none" />
            </div>
          </div>

          {/* Sub-Department Selection */}
          <div className={selectedDepartment ? '' : 'opacity-40'}>
            <label className="flex items-center gap-2 text-lg font-bold text-blue-800 dark:text-blue-200 mb-4">
              🔹 2. Select Sub-Department
            </label>
            <div className="relative">
              <select
                value={selectedSubDepartment}
                onChange={(e) => handleSubDepartmentChange(e.target.value)}
                disabled={!selectedDepartment}
                className="w-full px-6 py-4 border-2 border-blue-300 dark:border-blue-600 rounded-xl focus:ring-4 focus:ring-blue-500/40 focus:border-blue-600 appearance-none bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/60 dark:to-cyan-900/60 text-blue-900 dark:text-blue-50 font-semibold text-lg shadow-lg hover:shadow-xl hover:from-blue-100 hover:to-cyan-100 dark:hover:from-blue-800/70 dark:hover:to-cyan-800/70 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed disabled:text-gray-500 disabled:border-gray-300 dark:disabled:border-gray-600 transition-all cursor-pointer"
              >
                <option value="" className="text-blue-600 dark:text-blue-300 font-medium">📝 Choose a sub-department...</option>
                {availableSubDepartments.map((subDept) => (
                  <option key={subDept} value={subDept} className="font-semibold text-blue-800 dark:text-blue-200">
                    🔹 {subDept}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 h-6 w-6 text-blue-600 dark:text-blue-400 pointer-events-none" />
            </div>
          </div>

          {/* Category Selection */}
          <div className={selectedSubDepartment ? '' : 'opacity-40'}>
            <label className="flex items-center gap-2 text-lg font-bold text-blue-700 dark:text-blue-300 mb-4">
              🔸 3. Select Major Category
            </label>
            {availableCategories.length > 0 ? (
              <div className="border-2 border-blue-300 dark:border-blue-600 rounded-xl max-h-80 overflow-y-auto bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950/60 dark:to-indigo-950/60 shadow-2xl">
                {availableCategories.map((category) => (
                  <button
                    key={category.code}
                    onClick={() => handleCategorySelect(
                      selectedDepartment, 
                      selectedSubDepartment, 
                      category
                    )}
                    className={`w-full px-6 py-4 text-left hover:bg-blue-100/80 dark:hover:bg-blue-900/40 border-b border-blue-200/60 dark:border-blue-700/60 last:border-b-0 focus:outline-none focus:bg-blue-200/80 dark:focus:bg-blue-800/50 transition-all transform hover:scale-[1.02] ${
                      selectedCategoryCode === category.code ? 'bg-gradient-to-r from-blue-200 to-indigo-200 dark:from-blue-800/60 dark:to-indigo-800/60 border-l-4 border-l-blue-500 shadow-lg' : ''
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-bold text-blue-900 dark:text-blue-100 text-lg">💼 {category.name}</div>
                        <div className="text-sm font-semibold text-blue-700 dark:text-blue-300 mt-1">📝 Code: {category.code}</div>
                        {category.description && (
                          <div className="text-sm text-blue-600 dark:text-blue-400 mt-1 italic">{category.description}</div>
                        )}
                      </div>
                      <div className="text-right ml-4">
                        <div className="text-sm font-semibold text-blue-800 dark:text-blue-200">📊 {category.enabledAttributes} attributes</div>
                        <div className="text-lg font-bold text-cyan-600 dark:text-cyan-400">🤖 {category.extractableAttributes} extractable</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="px-6 py-4 border-2 border-blue-300 dark:border-blue-600 rounded-xl bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/50 dark:to-blue-800/50 text-blue-700 dark:text-blue-300 text-lg font-semibold text-center">
                {selectedSubDepartment ? '� No categories available' : '👆 Select a sub-department first'}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Selection Summary */}
      {selectedCategory && (
        <div className="mt-6 surface-glass p-5 border-l-4 border-success">
          <h4 className="font-semibold text-success mb-3">Selected Category</h4>
          <div className="space-y-2 text-sm">
            <div><span className="font-medium text-foreground">Path:</span> <span className="text-muted-foreground">{selectedCategory.department} → {selectedCategory.subDepartment} → {selectedCategory.categoryName}</span></div>
            <div><span className="font-medium text-foreground">Code:</span> <span className="text-muted-foreground">{selectedCategory.categoryCode}</span></div>
            <div><span className="font-medium text-foreground">Extractable Attributes:</span> <span className="text-primary font-semibold">{selectedCategory.extractableAttributes}</span></div>
            <div><span className="font-medium text-foreground">Total Fields:</span> <span className="text-muted-foreground">{selectedCategory.fields.length}</span></div>
          </div>
        </div>
      )}
    </div>
  );
}
