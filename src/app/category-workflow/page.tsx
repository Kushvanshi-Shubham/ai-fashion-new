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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="surface-elevated border-b border-border/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto safe-px">
          <div className="safe-py">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-foreground tracking-tight">
                  Category-Driven AI Extraction
                </h1>
                <p className="mt-3 text-lg text-muted-foreground text-pretty">
                  Select a category to define extraction attributes, then upload images for targeted AI analysis
                </p>
              </div>
              <div className="text-right">
                <div className="text-sm text-muted-foreground font-medium">Total Categories Available</div>
                <div className="text-3xl font-bold gradient-primary bg-clip-text text-transparent">{categoryStats.totalCategories.toLocaleString()}</div>
              </div>
            </div>
            
            {/* Progress Steps */}
            <div className="mt-10">
              <nav aria-label="Progress" className="surface-glass p-6 rounded-xl">
                <ol className="flex items-center space-x-6">
                  {steps.map((step, stepIdx) => (
                    <li key={step.id} className="flex items-center">
                      <div className="flex items-center">
                        <button
                          onClick={() => setCurrentStep(step.id)}
                          className={`flex h-12 w-12 items-center justify-center rounded-xl border-2 transition-all duration-300 ${
                            step.completed
                              ? 'gradient-primary border-primary text-primary-foreground shadow-soft hover:shadow-surface hover:scale-105'
                              : currentStep === step.id
                              ? 'border-primary bg-primary/10 hover:bg-primary/15 text-primary'
                              : 'border-border bg-muted/50 hover:border-primary/50 text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          {step.completed ? (
                            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <span className="text-sm font-semibold">
                              {stepIdx + 1}
                            </span>
                          )}
                        </button>
                        <div className="ml-4 min-w-0 flex-1">
                          <span className={`text-sm font-semibold ${
                            step.completed || currentStep === step.id ? 'text-foreground' : 'text-muted-foreground'
                          }`}>
                            {step.title}
                          </span>
                          <p className="text-sm text-muted-foreground text-pretty">{step.description}</p>
                        </div>
                      </div>
                      {stepIdx < steps.length - 1 && (
                        <ArrowRight className="ml-6 h-4 w-4 text-muted-foreground/60" />
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
      <div className="max-w-7xl mx-auto safe-px py-10">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left Column - Category Selection */}
          <div className="lg:col-span-2">
            <div className="sticky top-8 space-y-6">
              <CategorySelector
                onCategorySelect={handleCategorySelect}
                selectedCategory={workflow.selectedCategory}
                className="surface p-6"
              />

              {/* Quick Stats */}
              {workflow.selectedCategory && (
                <div className="surface-elevated p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-5">Category Summary</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground font-medium">Total Fields:</span>
                      <span className="text-sm font-semibold text-foreground">{workflow.selectedCategory.totalAttributes}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground font-medium">Enabled:</span>
                      <span className="text-sm font-semibold text-success">{workflow.selectedCategory.enabledAttributes}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground font-medium">AI Extractable:</span>
                      <span className="text-sm font-semibold text-primary">{workflow.selectedCategory.extractableAttributes}</span>
                    </div>
                    <div className="pt-3 border-t border-border/50">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground font-medium">Coverage:</span>
                        <span className="text-sm font-semibold text-foreground">
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
              <div className="surface-elevated p-10">
                <div className="text-center">
                  <div className="w-20 h-20 gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-glow">
                    <Upload className="h-10 w-10 text-primary-foreground" />
                  </div>
                  <h2 className="text-3xl font-bold text-foreground mb-5 text-balance">
                    Welcome to Category-Driven Extraction
                  </h2>
                  <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto text-pretty leading-relaxed">
                    This workflow ensures that AI extraction focuses only on relevant attributes for your selected category. 
                    For example, selecting &ldquo;Shirts&rdquo; will extract collar and sleeve details, while &ldquo;Belts&rdquo; won&apos;t include these irrelevant attributes.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-10">
                    <div className="surface-glass p-6 text-center hover:shadow-elevated transition-all duration-300">
                      <div className="text-3xl font-bold gradient-primary bg-clip-text text-transparent mb-3">{categoryStats.totalDepartments}</div>
                      <div className="text-sm text-foreground font-semibold">Departments</div>
                      <div className="text-xs text-muted-foreground mt-1">Available to choose from</div>
                    </div>
                    <div className="surface-glass p-6 text-center hover:shadow-elevated transition-all duration-300">
                      <div className="text-3xl font-bold text-success mb-3">{categoryStats.totalSubDepartments}</div>
                      <div className="text-sm text-foreground font-semibold">Sub-Departments</div>
                      <div className="text-xs text-muted-foreground mt-1">Organized categories</div>
                    </div>
                    <div className="surface-glass p-6 text-center hover:shadow-elevated transition-all duration-300">
                      <div className="text-3xl font-bold gradient-accent bg-clip-text text-transparent mb-3">{categoryStats.averageEnabledAttributesPerCategory}</div>
                      <div className="text-sm text-foreground font-semibold">Avg. Attributes</div>
                      <div className="text-xs text-muted-foreground mt-1">Per category</div>
                    </div>
                  </div>

                  <div className="badge-soft inline-flex items-center gap-2 px-4 py-2">
                    <span className="text-xs">👈</span>
                    <span className="text-sm font-medium">Start by selecting a category from the left panel to proceed</span>
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
                  <div className="surface-elevated p-10 text-center">
                    <div className="w-16 h-16 bg-muted rounded-xl flex items-center justify-center mx-auto mb-6">
                      <Upload className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-3">Select a Category First</h3>
                    <p className="text-muted-foreground">
                      You need to select a category before uploading images for extraction.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="surface-glass p-6 border-l-4 border-primary">
                      <div className="flex items-start">
                        <div className="w-10 h-10 gradient-primary rounded-lg flex items-center justify-center mr-4 shadow-soft">
                          <BarChart3 className="h-5 w-5 text-primary-foreground" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-base font-semibold text-foreground mb-2">
                            Targeted Extraction Enabled
                          </h3>
                          <div className="text-sm text-muted-foreground leading-relaxed">
                            <p>
                              AI will extract <span className="font-semibold text-primary">{workflow.selectedCategory.extractableAttributes} specific attributes</span> 
                              {' '}relevant to <span className="font-semibold text-foreground">{workflow.selectedCategory.categoryName}</span> category.
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
                  <div className="surface-elevated p-10 text-center">
                    <div className="w-16 h-16 bg-muted rounded-xl flex items-center justify-center mx-auto mb-6">
                      <BarChart3 className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-3">No Extractions Yet</h3>
                    <p className="text-muted-foreground">
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