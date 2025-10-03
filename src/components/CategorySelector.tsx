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
            <label className="block text-sm font-semibold text-foreground mb-3">
              1. Select Department
            </label>
            <div className="relative">
              <select
                value={selectedDepartment}
                onChange={(e) => handleDepartmentChange(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-ring/30 focus:border-primary appearance-none bg-background text-foreground transition-all"
              >
                <option value="">Choose a department...</option>
                {hierarchy.departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          {/* Sub-Department Selection */}
          <div className={selectedDepartment ? '' : 'opacity-50'}>
            <label className="block text-sm font-semibold text-foreground mb-3">
              2. Select Sub-Department
            </label>
            <div className="relative">
              <select
                value={selectedSubDepartment}
                onChange={(e) => handleSubDepartmentChange(e.target.value)}
                disabled={!selectedDepartment}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-ring/30 focus:border-primary appearance-none bg-background text-foreground disabled:bg-muted disabled:cursor-not-allowed disabled:text-muted-foreground transition-all"
              >
                <option value="">Choose a sub-department...</option>
                {availableSubDepartments.map((subDept) => (
                  <option key={subDept} value={subDept}>
                    {subDept}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          {/* Category Selection */}
          <div className={selectedSubDepartment ? '' : 'opacity-50'}>
            <label className="block text-sm font-semibold text-foreground mb-3">
              3. Select Major Category
            </label>
            {availableCategories.length > 0 ? (
              <div className="border border-gray-200 rounded-lg max-h-64 overflow-y-auto bg-background shadow-soft">
                {availableCategories.map((category) => (
                  <button
                    key={category.code}
                    onClick={() => handleCategorySelect(
                      selectedDepartment, 
                      selectedSubDepartment, 
                      category
                    )}
                    className={`w-full px-4 py-3 text-left hover:bg-accent/50 border-b border-gray-200/30 last:border-b-0 focus:outline-none focus:bg-accent/60 transition-all ${
                      selectedCategoryCode === category.code ? 'bg-primary/10 border-l-4 border-l-primary shadow-soft' : ''
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium text-foreground">{category.name}</div>
                        <div className="text-sm text-muted-foreground">Code: {category.code}</div>
                        {category.description && (
                          <div className="text-xs text-muted-foreground/70 mt-1">{category.description}</div>
                        )}
                      </div>
                      <div className="text-right text-xs text-muted-foreground">
                        <div>{category.enabledAttributes} attributes</div>
                        <div className="text-success font-medium">{category.extractableAttributes} extractable</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="px-4 py-3 border border-gray-200 rounded-lg bg-muted/50 text-muted-foreground text-sm">
                {selectedSubDepartment ? 'No categories available' : 'Select a sub-department first'}
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
