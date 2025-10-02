'use client';

import React, { useState } from 'react';
import { ArrowRight, Upload, BarChart3 } from 'lucide-react';
import CategorySelector from '@/components/CategorySelector';
import CategoryAttributeTable from '@/components/CategoryAttributeTable';
import ImageUpload from '@/components/ImageUpload';
import ExtractionResults from '@/components/ExtractionResults';
import { useCategoryWorkflow } from '@/hooks/useCategoryWorkflow';
import { CategoryFormData } from '@/types/fashion';
import { getCategoryStats } from '@/lib/category-processor';

type WorkflowStep = 'category' | 'attributes' | 'upload' | 'results';

export default function CategoryWorkflowPage() {
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('category');
  const workflow = useCategoryWorkflow({
    onCategoryChange: (category) => {
      if (category) {
        setCurrentStep('attributes');
      }
    }
  });

  const categoryStats = getCategoryStats();

  const handleCategorySelect = (category: CategoryFormData | null) => {
    workflow.setCategory(category);
    
    if (category) {
      setCurrentStep('attributes');
    }
  };

  const steps = [
    {
      id: 'category' as WorkflowStep,
      title: 'Select Category',
      description: 'Choose department → sub-department → major category',
      completed: !!workflow.selectedCategory
    },
    {
      id: 'attributes' as WorkflowStep,
      title: 'Review Attributes',
      description: 'Preview extractable attributes for selected category',
      completed: !!workflow.selectedCategory && currentStep !== 'category'
    },
    {
      id: 'upload' as WorkflowStep,
      title: 'Upload Images',
      description: 'Upload images for AI attribute extraction',
      completed: workflow.uploadedImages.length > 0
    },
    {
      id: 'results' as WorkflowStep,
      title: 'View Results',
      description: 'Review extraction results and export data',
      completed: workflow.completedImages.length > 0
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Category-Driven AI Extraction
                </h1>
                <p className="mt-2 text-lg text-gray-600">
                  Select a category to define extraction attributes, then upload images for targeted AI analysis
                </p>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">Total Categories Available</div>
                <div className="text-3xl font-bold text-blue-600">{categoryStats.totalCategories.toLocaleString()}</div>
              </div>
            </div>
            
            {/* Progress Steps */}
            <div className="mt-8">
              <nav aria-label="Progress">
                <ol className="flex items-center space-x-5">
                  {steps.map((step, stepIdx) => (
                    <li key={step.id} className="flex items-center">
                      <div className="flex items-center">
                        <button
                          onClick={() => setCurrentStep(step.id)}
                          className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                            step.completed
                              ? 'bg-blue-600 border-blue-600 hover:bg-blue-700'
                              : currentStep === step.id
                              ? 'border-blue-600 hover:border-blue-700'
                              : 'border-gray-300 hover:border-gray-400'
                          } transition-colors`}
                        >
                          {step.completed ? (
                            <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <span className={`text-sm font-medium ${
                              currentStep === step.id ? 'text-blue-600' : 'text-gray-500'
                            }`}>
                              {stepIdx + 1}
                            </span>
                          )}
                        </button>
                        <div className="ml-4 min-w-0 flex-1">
                          <span className={`text-sm font-medium ${
                            step.completed || currentStep === step.id ? 'text-gray-900' : 'text-gray-500'
                          }`}>
                            {step.title}
                          </span>
                          <p className="text-sm text-gray-500">{step.description}</p>
                        </div>
                      </div>
                      {stepIdx < steps.length - 1 && (
                        <ArrowRight className="ml-5 h-5 w-5 text-gray-400" />
                      )}
                    </li>
                  ))}
                </ol>
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Column - Category Selection */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <CategorySelector
                onCategorySelect={handleCategorySelect}
                selectedCategory={workflow.selectedCategory}
                className="bg-white rounded-lg border border-gray-200 p-6"
              />

              {/* Quick Stats */}
              {workflow.selectedCategory && (
                <div className="mt-6 bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Summary</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total Fields:</span>
                      <span className="font-medium">{workflow.selectedCategory.totalAttributes}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Enabled:</span>
                      <span className="font-medium text-green-600">{workflow.selectedCategory.enabledAttributes}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">AI Extractable:</span>
                      <span className="font-medium text-blue-600">{workflow.selectedCategory.extractableAttributes}</span>
                    </div>
                    <div className="pt-2 border-t border-gray-200">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Coverage:</span>
                        <span className="font-medium">
                          {Math.round((workflow.selectedCategory.extractableAttributes / workflow.selectedCategory.totalAttributes) * 100)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Step Content */}
          <div className="lg:col-span-3">
            {currentStep === 'category' && (
              <div className="bg-white rounded-lg border border-gray-200 p-8">
                <div className="text-center">
                  <Upload className="h-16 w-16 text-gray-400 mx-auto mb-6" />
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                    Welcome to Category-Driven Extraction
                  </h2>
                  <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                    This workflow ensures that AI extraction focuses only on relevant attributes for your selected category. 
                    For example, selecting &ldquo;Shirts&rdquo; will extract collar and sleeve details, while &ldquo;Belts&rdquo; won&apos;t include these irrelevant attributes.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                    <div className="bg-blue-50 rounded-lg p-6">
                      <div className="text-2xl font-bold text-blue-600 mb-2">{categoryStats.totalDepartments}</div>
                      <div className="text-sm text-blue-800 font-medium">Departments</div>
                      <div className="text-xs text-blue-600 mt-1">Available to choose from</div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-6">
                      <div className="text-2xl font-bold text-green-600 mb-2">{categoryStats.totalSubDepartments}</div>
                      <div className="text-sm text-green-800 font-medium">Sub-Departments</div>
                      <div className="text-xs text-green-600 mt-1">Organized categories</div>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-6">
                      <div className="text-2xl font-bold text-purple-600 mb-2">{categoryStats.averageEnabledAttributesPerCategory}</div>
                      <div className="text-sm text-purple-800 font-medium">Avg. Attributes</div>
                      <div className="text-xs text-purple-600 mt-1">Per category</div>
                    </div>
                  </div>

                  <div className="mt-8">
                    <p className="text-sm text-gray-500">
                      👈 Start by selecting a category from the left panel to proceed
                    </p>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 'attributes' && (
              <CategoryAttributeTable
                category={workflow.selectedCategory}
                showDescription={true}
                showOnlyExtractable={false}
                className="space-y-6"
              />
            )}

            {currentStep === 'upload' && (
              <div className="space-y-6">
                {!workflow.selectedCategory ? (
                  <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                    <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Category First</h3>
                    <p className="text-gray-500">
                      You need to select a category before uploading images for extraction.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex">
                        <BarChart3 className="h-5 w-5 text-blue-400 mt-0.5" />
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-blue-800">
                            Targeted Extraction Enabled
                          </h3>
                          <div className="mt-2 text-sm text-blue-700">
                            <p>
                              AI will extract <strong>{workflow.selectedCategory.extractableAttributes} specific attributes</strong> 
                              {' '}relevant to <strong>{workflow.selectedCategory.categoryName}</strong> category.
                              Irrelevant attributes will be ignored for better accuracy and efficiency.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <ImageUpload 
                      onFilesSelected={workflow.addImages}
                    />
                  </>
                )}
              </div>
            )}

            {currentStep === 'results' && (
              <div className="space-y-6">
                {workflow.results.length === 0 ? (
                  <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                    <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Extractions Yet</h3>
                    <p className="text-gray-500">
                      Upload and process some images to see extraction results here.
                    </p>
                  </div>
                ) : (
                  <ExtractionResults 
                    results={workflow.results}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}